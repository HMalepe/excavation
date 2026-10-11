import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/db/admin";
import { HttpError } from "@/lib/auth/guards";
import { anthropic, models, strongExtras } from "@/lib/ai/client";
import { GUIDE_G9_SYSTEM, GUIDE_G11_SYSTEM, HARD_REQUIRED_NUMBERS, HARD_RESOURCES_FALLBACK } from "@/lib/ai/prompts";
import { screenMessage, ScreenUnavailable } from "@/lib/ai/safety";
import { raiseHardEvent } from "@/lib/safeguarding/notify";
import { advanceTo, updateSession } from "@/lib/session/service";
import { MarkerFilter } from "./markers";
import { assertGuideAllowance } from "./limits";
import { guideBlock, loadMessages } from "./state";
import type { LearnerRow, MessageRow, SessionRow } from "@/lib/db/types";

export const MAX_LEARNER_CHARS = 4000;
/** Record separator: the client splits visible text from the trailing control JSON on this. */
export const CONTROL = "\u001e";
export interface TurnOutcome { complete: boolean; safetyStop: boolean; risk: "none" | "soft" | "hard" }

const SESSION_START = "<session_start/>";

/**
 * Transcript rows → Messages API history. Append-only: the same rows always give the same prefix.
 * A mid-conversation system message must follow a user turn, so a system row that comes after a
 * Guide reply (e.g. "safety_review_complete") is placed right after the next learner message.
 */
export function toApiMessages(rows: MessageRow[]): Anthropic.Beta.BetaMessageParam[] {
  const out: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: SESSION_START }];
  const sys = (content: string) => ({ role: "system", content }) as unknown as Anthropic.Beta.BetaMessageParam;
  let held: string[] = [];
  for (const r of rows) {
    if (r.role === "learner") {
      out.push({ role: "user", content: r.content });
      for (const h of held) out.push(sys(h));
      held = [];
    } else if (r.role === "guide") {
      out.push({ role: "assistant", content: r.content });
    } else if (out.at(-1)?.role === "assistant") {
      held.push(r.content);
    } else {
      out.push(sys(r.content));
    }
  }
  return out;
}

/**
 * One turn of The Guide (spec 10 Step 4). `text` = a new learner message; null = retry the reply to
 * the last learner message (after a dropped connection or a screen outage).
 */
export async function guideTurn(session: SessionRow, learner: LearnerRow, text: string | null): Promise<{ stream: ReadableStream<Uint8Array>; done: Promise<TurnOutcome> }> {
  if (session.locked_at || session.status === "safety_stop") throw new HttpError(423, "This chat is paused.");
  if (session.stage !== "conversation") throw new HttpError(409, "The chat isn't open right now.");
  await assertGuideAllowance(session.id);
  const db = adminDb();
  let rows = await loadMessages(session.id);
  const lastVisible = rows.filter((r) => r.role !== "system").at(-1);

  let learnerMsg: MessageRow;
  if (text !== null) {
    const clean = text.trim().slice(0, MAX_LEARNER_CHARS);
    if (!clean) throw new HttpError(400, "Type your answer first.");
    if (lastVisible?.role !== "guide") throw new HttpError(409, "The Guide is still replying. Give it a second.");
    const { data, error } = await db.from("conversation_messages").insert({ session_id: session.id, role: "learner", content: clean }).select().single();
    if (error || !data) throw new Error(`save learner message: ${error?.message}`);
    learnerMsg = data as MessageRow;
    rows = [...rows, learnerMsg];
  } else {
    if (lastVisible?.role !== "learner") throw new HttpError(409, "Nothing to retry.");
    learnerMsg = lastVisible;
  }

  // 1. Safety screen BEFORE the conversation model sees the message (spec 10 Step 4.2).
  let risk = learnerMsg.safety_risk;
  if (!risk) {
    try {
      risk = (await screenMessage(learnerMsg.content)).risk;
    } catch (e) {
      if (e instanceof ScreenUnavailable) throw new HttpError(503, "The Guide can't reply right now. Your message is saved. Tap Try again in a minute.");
      throw e;
    }
    await db.from("conversation_messages").update({ safety_risk: risk }).eq("id", learnerMsg.id);
    if (risk !== "none") {
      const { data: flag } = await db.from("conversation_messages").insert({ session_id: session.id, role: "system", question_ref: "safety-flag", content: `safety_flag: ${risk}`, safety_risk: risk }).select().single();
      if (flag) rows = [...rows, flag as MessageRow];
    }
    if (risk === "soft") {
      await db.from("safeguarding_events").insert({ session_id: session.id, learner_id: learner.id, level: "soft", trigger_source: "conversation", trigger_message_id: learnerMsg.id });
    }
    // 2. Hard: the school is told immediately, before The Guide replies (spec 09 §5.1).
    if (risk === "hard") await raiseHardEvent({ sessionId: session.id, learnerId: learner.id, triggerMessageId: learnerMsg.id, triggerSource: "conversation" });
  }
  const isHard = risk === "hard";

  // 3. Conversation call: fixed system prompt + frozen per-learner block, both cached.
  const block = await guideBlock(session, learner);
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: session.touchpoint === "G9_FOUNDATION" ? GUIDE_G9_SYSTEM : GUIDE_G11_SYSTEM, cache_control: { type: "ephemeral" } },
    { type: "text", text: block, cache_control: { type: "ephemeral" } },
  ];
  const effort = (process.env.AI_EFFORT_CONVERSATION as "low" | "medium" | "high" | undefined) ?? "medium";
  const apiStream = anthropic().beta.messages.stream({
    model: models().strong,
    max_tokens: 16000,
    system,
    messages: toApiMessages(rows),
    cache_control: { type: "ephemeral" },
    output_config: { effort },
    ...strongExtras,
  });

  const enc = new TextEncoder();
  const filter = new MarkerFilter();
  let resolveDone!: (o: TurnOutcome) => void;
  const done = new Promise<TurnOutcome>((r) => (resolveDone = r));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (s: string) => { if (s) controller.enqueue(enc.encode(s)); };
      let refused = false;
      try {
        for await (const ev of apiStream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") push(filter.feed(ev.delta.text));
        }
        push(filter.end());
        const final = await apiStream.finalMessage();
        refused = final.stop_reason === "refusal";
      } catch (e) {
        console.error("[guide] stream error", e);
        refused = true;
      }

      let textOut = filter.text;
      if (refused && !textOut) {
        // Whole fallback chain declined or the call failed: never leave the learner with nothing.
        textOut = isHard ? HARD_RESOURCES_FALLBACK : "Sorry, I lost my train of thought there. Could you say that again, maybe in different words?";
        push(textOut);
      }
      // Safety net: a hard-path reply must carry the crisis numbers, whatever the model wrote.
      if (isHard && !HARD_REQUIRED_NUMBERS.every((n) => textOut.includes(n))) {
        const extra = `\n\n${HARD_RESOURCES_FALLBACK}`;
        push(extra);
        textOut += extra;
      }

      const complete = !isHard && filter.has("SESSION_COMPLETE");
      const safetyStop = isHard; // hard always stops the script (spec 09 §5.1), marker or not
      await adminDb().from("conversation_messages").insert({
        session_id: session.id, role: "guide", content: (filter.rawTag ? `<<${filter.rawTag}>>\n` : "") + textOut,
        question_ref: isHard ? "safety" : filter.questionRef ?? (complete ? "closing" : refused ? "error" : null),
        safety_risk: null,
      });
      if (safetyStop) await updateSession(session.id, { status: "safety_stop", locked_at: new Date().toISOString() });
      else if (complete) await advanceTo(session, "processing");

      const outcome: TurnOutcome = { complete, safetyStop, risk: risk ?? "none" };
      push(CONTROL + JSON.stringify(outcome));
      controller.close();
      resolveDone(outcome);
    },
  });
  return { stream, done };
}
