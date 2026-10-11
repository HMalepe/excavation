import "server-only";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { HttpError, type Caller } from "@/lib/auth/guards";
import { G9_SNAPSHOT_SUBJECTS, questionBank } from "@/lib/config/questionBank";
import { buildItemPlan, seededRng } from "@/lib/flow/itemPlan";
import { afterInterests, afterValues } from "@/lib/flow/microMoments";
import { scoreInterests, scoreValues, validateValuesSort } from "@/lib/scoring/scales";
import { scoreScale } from "@/lib/scoring/items";
import { scoredLayerSoftSignals, shouldShowSoftInterstitial } from "@/lib/safeguarding/scoredLayer";
import { marksFor, scoreSession, loadProfile } from "@/lib/pipeline/scoring";
import {
  advanceTo, assertStage, hasValidGuardianConsent, loadResponses, planOf, progressOf, rangeFor, isOptionalItem,
  updateSession, upsertResponse, ASSENT_SCREEN_VERSION, type ScoredProgress,
} from "./service";
import { g11Actions } from "./g11Actions";
import { reportActions } from "./reportActions";
import { skillActions, newSkillsProgress } from "./skillActions";
import type { LearnerRow, SessionRow } from "@/lib/db/types";

export const PAGE_SIZE_MAX = 6; // spec 02 §3.3: up to 6 items per screen on computers

export interface Ctx { caller: Caller & { learner: LearnerRow }; session: SessionRow }
export interface ActionDef<S extends z.ZodType> { body: S; run: (ctx: Ctx, body: z.infer<S>) => Promise<unknown> }
const action = <S extends z.ZodType>(body: S, run: (ctx: Ctx, body: z.infer<S>) => Promise<unknown>): ActionDef<S> => ({ body, run });

const LONG_TEXT = z.string().trim().max(800);

// ---------- events after a scored section finishes ----------
export interface SectionEvents { microMoment?: string; softInterstitial?: boolean; done?: boolean }

async function finishSection(s: SessionRow, prog: ScoredProgress, sectionId: string): Promise<{ session: SessionRow; events: SectionEvents }> {
  const plan = planOf(s);
  const events: SectionEvents = {};
  const { likert, meta, values } = await loadResponses(s.id);

  // Exactly two micro-moments, always in the same places.
  if (sectionId === "interests" && !prog.moments.includes("interests")) {
    events.microMoment = afterInterests(scoreInterests(likert).scores);
    prog.moments.push("interests");
  }
  if (sectionId === "values" && !prog.moments.includes("values")) {
    events.microMoment = afterValues(values?.top3[0]);
    prog.moments.push("values");
  }

  // Scored-layer soft safeguarding check (spec 09 §5.1). Logs a flag with NO content.
  if (!prog.soft_shown) {
    const signals = scoredLayerSoftSignals({ stressSensitivity: scoreScale("P_N", likert), likert, answeredOrder: prog.answered_order ?? [], meta });
    if (shouldShowSoftInterstitial(signals)) {
      prog.soft_shown = true;
      events.softInterstitial = true;
      await adminDb().from("safeguarding_events").insert({
        session_id: s.id, learner_id: s.learner_id, level: "soft", trigger_source: "scored_layer", notes: `signals: ${signals.join(", ")}`,
      });
    }
  }

  prog.section += 1;
  prog.item = 0;
  if (prog.section >= plan.sections.length) {
    events.done = true;
    const next = s.touchpoint === "G9_FOUNDATION" ? "snapshot" : "marks";
    return { session: await advanceTo(s, next, { progress: { ...prog } as Record<string, unknown> }), events };
  }
  return { session: await updateSession(s.id, { progress: { ...prog } as Record<string, unknown> }), events };
}

// ---------- G9 + shared actions ----------
export const actions = {
  assent: action(z.object({ choice: z.enum(["agree", "not_today"]) }), async ({ session }, b) => {
    assertStage(session, "assent");
    await adminDb().from("learner_assents").insert({ learner_id: session.learner_id, session_id: session.id, assented: b.choice === "agree", screen_version: ASSENT_SCREEN_VERSION });
    if (b.choice === "not_today") return { next: "/learn/not-today" };
    await advanceTo(session, session.touchpoint === "G9_FOUNDATION" ? "intake" : "two_years");
    return {};
  }),

  intake: action(z.object({ world: LONG_TEXT.optional(), right_now: LONG_TEXT.optional(), why_here: LONG_TEXT.optional() }), async ({ session }, b) => {
    assertStage(session, "intake");
    for (const [k, v] of Object.entries(b)) if (v) await upsertResponse(session.id, `INTAKE_${k.toUpperCase()}`, { value_json: v });
    await advanceTo(session, "scored");
    return {};
  }),

  /** Save one answer immediately (spec 10 Step 3). Only items not yet locked can change. */
  answer: action(z.object({ itemId: z.string().max(40), value: z.number().int(), ms: z.number().int().min(0).max(3_600_000).nullable(), changes: z.number().int().min(0).max(100) }), async ({ session }, b) => {
    assertStage(session, "scored");
    const plan = planOf(session), prog = progressOf(session);
    const sec = plan.sections[prog.section];
    if (!sec || sec.id === "values") throw new HttpError(409, "Not a question section");
    const idx = sec.items.indexOf(b.itemId);
    if (idx < prog.item || idx >= prog.item + PAGE_SIZE_MAX) throw new HttpError(409, "That answer is already saved. Refresh the page.");
    const range = rangeFor(b.itemId);
    if (!range || b.value < range[0] || b.value > range[1]) throw new HttpError(400, "That answer didn't go through. Refresh and try again.");
    await upsertResponse(session.id, b.itemId, { value: b.value, response_ms: b.ms, change_count: b.changes });
    return {};
  }),

  /** Lock the current screen and move on. Required items must be answered; Context items may be skipped. */
  lock: action(z.object({ upTo: z.number().int().min(1) }), async ({ session }, b) => {
    assertStage(session, "scored");
    const plan = planOf(session), prog = progressOf(session);
    const sec = plan.sections[prog.section];
    if (!sec || sec.id === "values") throw new HttpError(409, "Not a question section");
    if (b.upTo <= prog.item || b.upTo > Math.min(sec.items.length, prog.item + PAGE_SIZE_MAX)) throw new HttpError(409, "This page is out of date. Refresh and try again.");
    const page = sec.items.slice(prog.item, b.upTo);
    const { likert } = await loadResponses(session.id);
    const missing = page.filter((id) => !isOptionalItem(id) && typeof likert[id] !== "number");
    if (missing.length) throw new HttpError(400, "Answer each question before moving on.");
    prog.answered_order = [...(prog.answered_order ?? []), ...page];
    prog.item = b.upTo;
    if (prog.item >= sec.items.length) {
      const { events } = await finishSection(session, prog, sec.id);
      return { events, sectionComplete: true };
    }
    await updateSession(session.id, { progress: { ...prog } as Record<string, unknown> });
    return { events: {}, sectionComplete: false };
  }),

  values: action(z.object({ top3: z.tuple([z.string(), z.string(), z.string()]), bottom2: z.tuple([z.string(), z.string()]), ms: z.number().int().min(0).nullable() }), async ({ session }, b) => {
    assertStage(session, "scored");
    const plan = planOf(session), prog = progressOf(session);
    if (plan.sections[prog.section]?.id !== "values") throw new HttpError(409, "Not the values section");
    const err = validateValuesSort({ top3: b.top3, bottom2: b.bottom2 });
    if (err) throw new HttpError(400, `Card sort: ${err}`);
    await upsertResponse(session.id, "VALUES", { value_json: { top3: b.top3, bottom2: b.bottom2 }, response_ms: b.ms });
    const { events } = await finishSection(session, prog, "values");
    return { events, sectionComplete: true, higherOrder: scoreValues({ top3: b.top3, bottom2: b.bottom2 })?.dominant_cluster };
  }),

  /** G9 academic snapshot: confirm school-imported marks, or self-report with an "estimate" tick. */
  snapshot: action(z.object({
    marks: z.record(z.string(), z.number().min(0).max(100).nullable()).optional(),
    estimates: z.array(z.string()).max(12).default([]),
  }), async ({ session, caller }, b) => {
    assertStage(session, "snapshot");
    const existing = await marksFor(session.learner_id, 9);
    const imported = existing.rows.some((r) => r.source === "school_import");
    if (!imported) {
      const marks = b.marks ?? {};
      const required = G9_SNAPSHOT_SUBJECTS.filter((s) => s !== "Life Orientation");
      if (required.filter((s) => typeof marks[s] === "number").length < required.length - 2) {
        throw new HttpError(400, "Add a mark (or your best guess) for most subjects.");
      }
      const rows = Object.entries(marks).filter(([subj, v]) => G9_SNAPSHOT_SUBJECTS.includes(subj) && typeof v === "number").map(([subject, percentage]) => ({
        learner_id: session.learner_id, grade: 9, term_label: "latest", subject, percentage, source: "self_report", is_estimate: b.estimates.includes(subject),
      }));
      const { error } = await adminDb().from("marks").upsert(rows, { onConflict: "learner_id,grade,term_label,subject" });
      if (error) throw new Error(`save marks: ${error.message}`);
    }
    // Part 1 continues with the readiness checks and taster tasks (scored at the end of the tasters).
    // After a retake, they're already done: score straight away and go to the conversation notice.
    const prog = progressOf(session);
    if (prog.skills?.done) {
      await scoreSession(session, caller.learner.school_id);
      await advanceTo(session, "guide_notice");
      return {};
    }
    await advanceTo(session, "checks", { progress: { ...prog, skills: prog.skills ?? newSkillsProgress() } as Record<string, unknown> });
    return {};
  }),

  /** Quality = invalid → offer a retake of the scored layer before the conversation (spec 04 §7). */
  retake: action(z.object({ choice: z.enum(["retake", "continue"]) }), async ({ session }, b) => {
    assertStage(session, "guide_notice");
    const prog = progressOf(session);
    const profile = await loadProfile(session.id);
    if (profile?.quality.status !== "invalid" || (prog.retakes ?? 0) >= 1) throw new HttpError(409, "No retake available.");
    if (b.choice === "continue") {
      await updateSession(session.id, { progress: { ...prog, retake_offered: true } as Record<string, unknown> });
      return {};
    }
    const scoredIds = [...questionBank.scales.flatMap((s) => (s.items ?? []).map((i) => i.id)), "AC1", "AC2", "VALUES"];
    await adminDb().from("item_responses").delete().eq("session_id", session.id).in("item_id", scoredIds);
    await advanceTo(session, "scored", {
      item_order: buildItemPlan(seededRng(randomInt(2 ** 31))),
      // Checks and tasters are kept: a retake is only about the questionnaire.
      progress: { section: 0, item: 0, moments: [], retakes: (prog.retakes ?? 0) + 1, retake_offered: true, answered_order: [], skills: prog.skills } as Record<string, unknown>,
    });
    return {};
  }),

  /** The AI disclosure notice was read (spec 03 §3). */
  guide_ok: action(z.object({}), async ({ session }) => {
    assertStage(session, "guide_notice");
    const prog = progressOf(session);
    const profile = await loadProfile(session.id);
    if (profile?.quality.status === "invalid" && (prog.retakes ?? 0) === 0 && !prog.retake_offered) throw new HttpError(409, "Choose whether to redo the questions first.");
    await advanceTo(session, "conversation");
    return {};
  }),

  /**
   * The learner used read-aloud. Only the fact is stored (never the text), as an audit row rather than
   * in sessions.progress, so a late request can never overwrite the learner's place in the flow.
   */
  read_aloud: action(z.object({ where: z.enum(["questions", "values", "checks", "tasters", "guide", "intro"]) }), async ({ session }, b) => {
    await adminDb().from("audit_log").insert({ actor: null, action: "learner_read_aloud", target: `${session.id}:${b.where}` });
    return {};
  }),

  ...skillActions,
  ...g11Actions,
  ...reportActions,
} as const;

export type ActionName = keyof typeof actions;

export async function runAction(name: string, caller: Ctx["caller"], session: SessionRow, raw: unknown) {
  const def = (actions as Record<string, ActionDef<z.ZodType>>)[name];
  if (!def) throw new HttpError(404, "Unknown action");
  // Consent can be withdrawn at any time; check on every write (spec 09 §3).
  if (!(await hasValidGuardianConsent(session.learner_id))) throw new HttpError(403, "We need your parent or guardian's consent before you continue.");
  return def.run({ caller, session }, def.body.parse(raw ?? {}));
}
