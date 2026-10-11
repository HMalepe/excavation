import "server-only";
import { randomInt } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { HttpError } from "@/lib/auth/guards";
import { INSTRUMENT_VERSION, itemById, questionBank } from "@/lib/config/questionBank";
import { buildItemPlan, seededRng } from "@/lib/flow/itemPlan";
import { touchpointForGrade, stagesFor, type Stage } from "@/lib/flow/stages";
import type { ItemPlan, ItemResponseRow, LearnerRow, SessionRow, SessionStatus } from "@/lib/db/types";
import type { ItemMeta, LikertResponses, ValuesSort } from "@/lib/scoring/types";
import type { SkillsPlan } from "@/lib/skills/types";
import { isSkillRow } from "@/lib/skills/fromRows";

/** Readiness checks + tasters pointer, kept in sessions.progress.skills. */
export interface SkillsProgress {
  plan: SkillsPlan;
  check: number;   // index into plan.order
  item: number;    // index into that check's served items
  taster: number;  // index into plan.tasters
  done?: boolean;
}

export const ASSENT_SCREEN_VERSION = "2026-10-v1";

/** Scored-layer pointer kept in sessions.progress. */
export interface ScoredProgress {
  section: number;          // index into item_order.sections
  item: number;             // first not-yet-locked item in that section
  moments: string[];        // micro-moments shown (max 2)
  soft_shown?: boolean;     // scored-layer soft interstitial shown already
  retakes?: number;
  retake_offered?: boolean;
  answered_order?: string[];
  skills?: SkillsProgress;
}

export function progressOf(s: SessionRow): ScoredProgress {
  const p = (s.progress ?? {}) as Partial<ScoredProgress>;
  return { section: p.section ?? 0, item: p.item ?? 0, moments: p.moments ?? [], soft_shown: p.soft_shown, retakes: p.retakes ?? 0, retake_offered: p.retake_offered, answered_order: p.answered_order ?? [], skills: p.skills };
}

export async function hasValidGuardianConsent(learnerId: string): Promise<boolean> {
  const { data } = await adminDb().from("guardian_consents").select("consent_service, consent_ai_crossborder, consent_wellbeing, withdrawn_at")
    .eq("learner_id", learnerId).is("withdrawn_at", null).order("given_at", { ascending: false }).limit(1);
  const c = data?.[0];
  return !!c && c.consent_service && c.consent_ai_crossborder && c.consent_wellbeing;
}

export async function getOrCreateSession(learner: LearnerRow): Promise<SessionRow | null> {
  const touchpoint = touchpointForGrade(learner.current_grade);
  if (!touchpoint) return null;
  const db = adminDb();
  const { data: existing } = await db.from("sessions").select("*").eq("learner_id", learner.id).eq("touchpoint", touchpoint).maybeSingle();
  if (existing) return existing as SessionRow;
  const plan = buildItemPlan(seededRng(randomInt(2 ** 31)));
  const { data, error } = await db.from("sessions").insert({
    learner_id: learner.id, touchpoint, instrument_version: INSTRUMENT_VERSION, status: "not_started", stage: "consent", item_order: plan, progress: {},
  }).select().single();
  if (error) {
    // Two tabs racing: the unique (learner_id, touchpoint) constraint means the other insert won.
    const { data: again } = await db.from("sessions").select("*").eq("learner_id", learner.id).eq("touchpoint", touchpoint).single();
    return again as SessionRow;
  }
  return data as SessionRow;
}

export async function updateSession(id: string, patch: Partial<SessionRow>): Promise<SessionRow> {
  const { data, error } = await adminDb().from("sessions").update(patch).eq("id", id).select().single();
  if (error) throw new Error(`update session: ${error.message}`);
  return data as SessionRow;
}

export function assertStage(s: SessionRow, ...allowed: Stage[]) {
  if (s.locked_at) throw new HttpError(423, "This session is paused while someone checks in with you.");
  if (!allowed.includes(s.stage as Stage)) throw new HttpError(409, "That step isn't available right now. Refresh the page.");
}

const STATUS_FOR: Record<Stage, SessionStatus> = {
  consent: "not_started", assent: "not_started",
  intake: "scored_layer", two_years: "scored_layer", scored: "scored_layer", snapshot: "scored_layer", marks: "scored_layer",
  checks: "scored_layer", tasters: "scored_layer", break: "scored_layer",
  subject_experience: "scored_layer", failure_cause: "scored_layer", career_update: "scored_layer", guide_notice: "scored_layer",
  conversation: "conversation", processing: "complete", report: "complete",
};

export async function advanceTo(s: SessionRow, stage: Stage, extra: Partial<SessionRow> = {}): Promise<SessionRow> {
  if (!stagesFor(s.touchpoint).includes(stage)) throw new Error(`bad stage ${stage}`);
  const status = s.status === "safety_stop" ? "safety_stop" : STATUS_FOR[stage];
  const stamps: Partial<SessionRow> = {};
  if (!s.started_at && status === "scored_layer") stamps.started_at = new Date().toISOString();
  if (!s.completed_at && status === "complete") stamps.completed_at = new Date().toISOString();
  return updateSession(s.id, { stage, status, ...stamps, ...extra });
}

// ---------- responses ----------
export async function loadResponses(sessionId: string) {
  const { data } = await adminDb().from("item_responses").select("*").eq("session_id", sessionId);
  const all = (data ?? []) as ItemResponseRow[];
  // Readiness-check and taster rows are kept apart: they are not questionnaire items.
  const skillRows = all.filter((r) => isSkillRow(r.item_id));
  const rows = all.filter((r) => !isSkillRow(r.item_id));
  const likert: LikertResponses = {};
  const meta: Record<string, ItemMeta> = {};
  const json: Record<string, unknown> = {};
  for (const r of rows) {
    if (r.value !== null) likert[r.item_id] = r.value;
    if (r.value_json !== null) json[r.item_id] = r.value_json;
    meta[r.item_id] = { ms: r.response_ms, changes: r.change_count };
  }
  return { rows, skillRows, likert, meta, json, values: (json.VALUES as ValuesSort | undefined) ?? null };
}

export async function upsertResponse(sessionId: string, itemId: string, row: { value?: number | null; value_json?: unknown; response_ms?: number | null; change_count?: number }) {
  const { error } = await adminDb().from("item_responses").upsert(
    { session_id: sessionId, item_id: itemId, value: row.value ?? null, value_json: row.value_json ?? null, response_ms: row.response_ms ?? null, change_count: row.change_count ?? 0, answered_at: new Date().toISOString() },
    { onConflict: "session_id,item_id" },
  );
  if (error) throw new Error(`save answer: ${error.message}`);
}

/** Response range for an item id (Likert, context, attention checks, G11 per-subject items). */
export function rangeFor(itemId: string): [number, number] | null {
  const base = itemId.split(":")[0]!;
  if (base === "AC1" || base === "AC2") return [1, 5];
  if (/^(SE|FC)[1-6]$/.test(base)) return [1, 5];
  const it = itemById.get(base);
  if (!it) return null;
  return it.response.id === "ynsometimes" ? [1, 3] : [1, 5];
}

export const isOptionalItem = (itemId: string) => itemById.get(itemId)?.scale_id === "CONTEXT";

export function planOf(s: SessionRow): ItemPlan {
  if (!s.item_order) throw new Error("session has no item plan");
  return s.item_order;
}

export const attentionCheck = (id: string) => questionBank.attention_checks.find((a) => a.id === id);
