import "server-only";
import { adminDb } from "@/lib/db/admin";
import { loadProfile } from "@/lib/pipeline/scoring";
import { g11Subjects } from "@/lib/pipeline/g11";
import { loadResponses, updateSession } from "@/lib/session/service";
import { guideLearnerBlock } from "@/lib/ai/prompts";
import { stripMarkers } from "./markers";
import { buildScoreContext } from "./scoreContext";
import { G9_CLOSING, G9_OPENING, G11_CLOSING, G11_OPENING, g9Script, g11Script, type G9Callbacks } from "./script";
import type { LearnerRow, MessageRow, SessionRow } from "@/lib/db/types";
import type { VerdictResult } from "@/lib/verdict/types";

export interface ChatMessage { id: number; role: "learner" | "guide"; text: string }
export interface ChatView { messages: ChatMessage[]; awaitingReply: boolean; status: "active" | "complete" | "stopped" }

export async function loadMessages(sessionId: string): Promise<MessageRow[]> {
  const { data } = await adminDb().from("conversation_messages").select("*").eq("session_id", sessionId).order("id", { ascending: true });
  return (data ?? []) as MessageRow[];
}

/** The opening message is fixed text (spec 03 §3 / 05 §4) — written once, never by the model. */
async function ensureOpening(session: SessionRow, learner: LearnerRow, rows: MessageRow[]): Promise<MessageRow[]> {
  if (rows.length) return rows;
  const text = session.touchpoint === "G9_FOUNDATION" ? G9_OPENING(learner.first_name) : G11_OPENING(learner.first_name);
  const { data } = await adminDb().from("conversation_messages").insert({ session_id: session.id, role: "guide", question_ref: "opening", content: text }).select().single();
  return data ? [data as MessageRow] : rows;
}

export async function loadChat(session: SessionRow, learner: LearnerRow): Promise<ChatView> {
  const rows = await ensureOpening(session, learner, await loadMessages(session.id));
  const visible = rows.filter((r) => r.role !== "system");
  const last = visible.at(-1);
  return {
    messages: visible.map((r) => ({ id: r.id, role: r.role as "learner" | "guide", text: stripMarkers(r.content) })),
    awaitingReply: last?.role === "learner",
    status: session.status === "safety_stop" ? "stopped" : session.stage === "conversation" ? "active" : "complete",
  };
}

/**
 * The per-learner prompt block (score context + script + callbacks), built ONCE when the
 * conversation starts and stored, so every turn sends a byte-identical prefix: prompt-cache hits,
 * and an append-only history (no edited earlier context).
 */
export async function guideBlock(session: SessionRow, learner: LearnerRow): Promise<string> {
  const prog = session.progress as { guide_block?: string };
  if (prog.guide_block) return prog.guide_block;

  const profile = await loadProfile(session.id);
  if (!profile) throw new Error("no score profile for this session");
  const { json } = await loadResponses(session.id);
  const intake = { world: json.INTAKE_WORLD as string | undefined, right_now: json.INTAKE_RIGHT_NOW as string | undefined, why_here: json.INTAKE_WHY_HERE as string | undefined };
  const grade = session.touchpoint === "G9_FOUNDATION" ? 9 : 11;
  const ctx = buildScoreContext(profile, learner.first_name, grade, intake, learner.preferred_language ?? "English");

  let block: string;
  if (grade === 9) {
    block = guideLearnerBlock({ scoreContext: ctx, script: g9Script(profile), closing: G9_CLOSING });
  } else {
    const callbacks = await g9CallbacksFor(learner.id);
    const { data: v } = await adminDb().from("verdicts").select("payload").eq("session_id", session.id).maybeSingle();
    const verdict = v?.payload as VerdictResult | undefined;
    const subjects = await g11Subjects(learner);
    const summary = subjects.map((s) => ({
      subject: s.subject, grade10_final: s.m10, grade11_latest: s.m11,
      fit_band: verdict?.subjects.find((x) => x.subject === s.subject)?.fit_band ?? null,
    }));
    const failing = subjects.filter((s) => s.m11 !== null && s.m11 < 50).map((s) => s.subject);
    block = guideLearnerBlock({
      scoreContext: { ...ctx, two_years_reflection: json.TWO_YEARS ?? null, career_update: { cu1: json.CU1 ?? null, cu2: json.CU2 ?? null, cu3: json.CU3 ?? null } },
      script: g11Script(callbacks, failing.length > 0, failing),
      closing: G11_CLOSING,
      g9Callbacks: callbacks,
      subjectSummary: summary,
    });
  }
  await updateSession(session.id, { progress: { ...session.progress, guide_block: block } });
  return block;
}

export async function g9CallbacksFor(learnerId: string): Promise<G9Callbacks> {
  const { data } = await adminDb().from("sessions").select("id, signals(payload), reports(kind, status, content)").eq("learner_id", learnerId).eq("touchpoint", "G9_FOUNDATION").maybeSingle();
  const sig = (data?.signals as unknown as { payload: { q2_most_myself?: string; q19_future_tuesday?: string } } | null)?.payload;
  const rep = (data?.reports as { kind: string; status: string; content: { headline?: { text: string } } }[] | undefined)?.find((r) => r.kind === "learner" && r.status === "released");
  return { q2_most_myself: sig?.q2_most_myself ?? null, q19_future_tuesday: sig?.q19_future_tuesday ?? null, headline: rep?.content.headline?.text ?? null };
}
