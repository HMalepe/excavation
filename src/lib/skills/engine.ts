/**
 * Readiness checks + taster tasks — the pure engine. No I/O. Same input, same output.
 *
 * The two rules that make this safe to put in front of 14-year-olds:
 *  1. RAISE-ONLY. A check can lift a mark, a readiness tier or the maths gate. It can never lower
 *     anything: marks already pull down. That also neutralises cheating — the most a cheat gets
 *     is "consider it, with a support plan".
 *  2. SMALL, CAPPED, LOGGED. A mark rises by at most 15 points and a readiness tier by one step;
 *     the gate moves one step; taster engagement moves a combination score by at most ±5 (the
 *     same size as the Q20 bonus). Every change is written to the adjustments log, and the
 *     Grade 11 data decides whether each signal earns more weight (scripts/run-validity.ts).
 */
import { MATHS_SUPPORT_PLAN } from "@/lib/scoring/mathsGate";
import { shuffle, type Rng } from "@/lib/flow/itemPlan";
import type { MathsGate, MathsRecommendation } from "@/lib/scoring/types";
import {
  CHECK_IDS, SKILLS_VERSION, TASTER_IDS, checkById, itemIndex, tasterById, variantIndex,
  type CheckId, type TasterId,
} from "./content";
import type { CheckInput, CheckResult, MarkLift, SkillsInput, SkillsPlan, SkillsResult, TasterInput, TasterResult, TasterSignal } from "./types";

// ---------- constants (documented in docs/DECISIONS.md §E) ----------
export const MIN_ANSWERED_SHARE = 0.7;
export const LIFT_MIN_SCORE = 60;
export const MAX_MARK_LIFT = 15;
export const UNDERSELL_GAP = 20;
export const GATE_LIFT_FROM_LIT = 70;      // maths_lit_safer → both_options
export const GATE_LIFT_TO_SUPPORT = 60;    // both_options (40–49%) → mathematics_with_support
export const READING_SUPPORT_BELOW = 50;
export const TASTER_ADJ: Record<TasterSignal, number> = { pull: 5, warm: 2, neutral: 0, cold: -3 };
export const TASTER_CAP = 5;

// ---------- plan ----------
export function planSkills(rng: Rng): SkillsPlan {
  const checks = Object.fromEntries(CHECK_IDS.map((c) => [
    c,
    checkById(c).units.map((u) => u.variants[Math.floor(rng() * u.variants.length)]!.id),
  ])) as Record<CheckId, string[]>;
  return { checks, order: [...CHECK_IDS], tasters: shuffle([...TASTER_IDS], rng) };
}

export const servedItems = (plan: SkillsPlan, check: CheckId): string[] =>
  plan.checks[check].flatMap((v) => variantIndex.get(v)?.variant.items.map((i) => i.id) ?? []);

/** Deterministic option order per learner + item (FNV-1a → mulberry32). Returns original indices. */
export function optionOrder(seed: string, itemId: string, n: number): number[] {
  let h = 0x811c9dc5;
  for (const ch of `${seed}:${itemId}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193); }
  let t = h >>> 0;
  const rng = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return shuffle([...Array(n).keys()], rng);
}

// ---------- checks ----------
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
};

export function scoreCheck(check: CheckId, input: CheckInput | undefined): CheckResult | null {
  if (!input) return null;
  const cfg = checkById(check);
  const served = input.served.filter((id) => itemIndex.get(id)?.check === check);
  const base = { n_served: served.length, n_answered: 0, n_correct: 0, n_not_sure: 0, median_ms: null, missed_topics: [] as string[] };
  if (input.skipped && !Object.keys(input.answers).length) {
    return { ...base, status: "skipped", score: null, reliable: false, reasons: ["skipped"] };
  }
  const missed = new Set<string>();
  const times: number[] = [];
  let answered = 0, correct = 0, notSure = 0;
  for (const id of served) {
    const a = input.answers[id];
    const meta = itemIndex.get(id)!;
    if (!a) { missed.add(meta.topic); continue; }
    answered++;
    if (typeof a.ms === "number") times.push(a.ms);
    if (a.choice === -1) { notSure++; missed.add(meta.topic); continue; }
    if (a.choice === meta.item.answer) correct++; else missed.add(meta.topic);
  }
  const reasons: string[] = [];
  const share = served.length ? answered / served.length : 0;
  const status: CheckResult["status"] = share >= 1 ? "done" : "partial";
  if (share < MIN_ANSWERED_SHARE) reasons.push("too_few_answered");
  const med = median(times);
  if (med !== null && med < cfg.min_median_ms) reasons.push("rushed");
  if (answered > 0 && notSure === answered) reasons.push("all_not_sure");
  return {
    status,
    n_served: served.length, n_answered: answered, n_correct: correct, n_not_sure: notSure,
    score: served.length ? Math.round((correct / served.length) * 100) : null,
    median_ms: med,
    reliable: reasons.length === 0 && served.length > 0,
    reasons,
    missed_topics: [...missed],
  };
}

/**
 * Raise-only effective marks. A reliable check ≥ 60% that beats the school mark lifts it to
 * min(check, mark + 15). A missing mark is never invented from a check.
 */
export function markLifts(marks: Record<string, number | null | undefined>, checks: Record<CheckId, CheckResult | null>): MarkLift[] {
  const lifts: MarkLift[] = [];
  for (const c of CHECK_IDS) {
    const r = checks[c];
    const subject = checkById(c).informs_mark;
    const mark = marks[subject];
    if (!r?.reliable || r.score === null || typeof mark !== "number") continue;
    if (r.score < LIFT_MIN_SCORE || r.score <= mark) continue;
    const effective = Math.round(Math.min(r.score, mark + MAX_MARK_LIFT));
    if (effective > mark) lifts.push({ check: c, subject, mark, check_score: r.score, effective });
  }
  return lifts;
}

/** The maths gate moves at most ONE step, and only up. */
export function liftGate(gate: MathsGate, mathsMark: number | null | undefined, check: CheckResult | null): { gate: MathsGate; lift: SkillsResult["gate_lift"] } {
  if (!check?.reliable || check.score === null || typeof mathsMark !== "number") return { gate, lift: null };
  const s = check.score;
  const note = `; maths check ${s}% suggests the mark undersells you`;
  let to: MathsRecommendation | null = null;
  if (gate.recommendation === "maths_lit_safer" && s >= GATE_LIFT_FROM_LIT) to = "both_options";
  else if (gate.recommendation === "both_options" && mathsMark >= 40 && mathsMark < 50 && s >= GATE_LIFT_TO_SUPPORT) to = "mathematics_with_support";
  if (!to) return { gate, lift: null };
  return {
    gate: { ...gate, recommendation: to, reason: gate.reason + note, support_plan: to === "mathematics_with_support" ? MATHS_SUPPORT_PLAN : gate.support_plan },
    lift: { from: gate.recommendation, to, check_score: s },
  };
}

// ---------- tasters ----------
export function scoreTaster(id: TasterId, input: TasterInput | undefined): TasterResult | null {
  if (!input) return null;
  const t = tasterById.get(id)!;
  if (input.skipped) {
    return { skipped: true, before: input.before, after: null, bonus_taken: false, bonus_after: null, correct: 0, scored_steps: 0, surprise: null, signal: null, engagement: null };
  }
  const steps = [...t.steps.map((s, i) => [s, input.steps[i]] as const), ...(input.bonus ? t.bonus.steps.map((s, i) => [s, input.bonus!.steps[i]] as const) : [])];
  const scored = steps.filter(([s]) => s.answer !== null);
  const correct = scored.filter(([s, c]) => c === s.answer).length;
  const after = input.after;
  const bonusDone = !!input.bonus && input.bonus.steps.length >= t.bonus.steps.length && input.bonus.steps.every((c) => c !== null);
  let signal: TasterSignal | null = null;
  if (after !== null) {
    if (after >= 4 && bonusDone) signal = "pull";
    else if (after >= 4) signal = "warm";
    else if (after <= 2 && !input.bonus) signal = "cold";
    else signal = "neutral";
  }
  const surprise = after !== null && input.before !== null
    ? (after - input.before >= 2 ? "up" : input.before - after >= 2 ? "down" : null)
    : null;
  return {
    skipped: false, before: input.before, after,
    bonus_taken: !!input.bonus, bonus_after: input.bonus?.after ?? null,
    correct, scored_steps: scored.length, surprise, signal,
    engagement: after === null ? null : Math.round(((after - 1) / 4) * 85 + (bonusDone ? 15 : 0)),
  };
}

/** Score adjustment for one combination from its linked tasters: mean of signals, capped ±5. */
export function tasterAdjustment(comboId: string, tasters: Record<TasterId, TasterResult | null>): { delta: number; note: string | null } {
  const linked = TASTER_IDS.filter((id) => tasterById.get(id)!.links.includes(comboId) && tasters[id]?.signal);
  if (!linked.length) return { delta: 0, note: null };
  const mean = linked.reduce((s, id) => s + TASTER_ADJ[tasters[id]!.signal!], 0) / linked.length;
  const delta = Math.max(-TASTER_CAP, Math.min(TASTER_CAP, Math.round(mean)));
  if (delta === 0) return { delta: 0, note: null };
  return { delta, note: `${delta > 0 ? "+" : ""}${delta} taster (${linked.map((id) => `${id}:${tasters[id]!.signal}`).join(", ")})` };
}

/**
 * contradiction_watch items from behaviour vs questionnaire. Runs after the combination engine,
 * so it can compare against interest fit and the final fits. These give The Guide something
 * specific to ask; they have no scoring effect of their own.
 */
export function tasterWatch(
  tasters: Record<TasterId, TasterResult | null>,
  combos: { id: string; interest_fit: number }[],
  fitIds: string[],
): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  for (const id of TASTER_IDS) {
    const r = tasters[id];
    const t = tasterById.get(id)!;
    if (!r?.signal) continue;
    const linkedFits = combos.filter((c) => t.links.includes(c.id)).map((c) => c.interest_fit);
    const bestFit = linkedFits.length ? Math.max(...linkedFits) : 50;
    if ((r.signal === "pull" || (r.signal === "warm" && r.surprise === "up")) && bestFit < 50) {
      out.push({ id: `TT_PULL_${id}`, text: `The questionnaire shows little pull towards ${t.work}, but they enjoyed the "${t.title}" task${r.bonus_taken ? " and asked for another one" : " more than they expected"}: ask what pulled them in` });
    }
    if (r.signal === "cold" && t.links.some((l) => fitIds.includes(l))) {
      out.push({ id: `TT_COLD_${id}`, text: `One of their top fits involves ${t.work}, but the "${t.title}" task left them cold: ask whether they like the idea of that work, or the work itself` });
    }
  }
  return out;
}

// ---------- assembly ----------
export function scoreSkills(input: SkillsInput, marks: Record<string, number | null | undefined>): Omit<SkillsResult, "gate_lift"> {
  const checks = Object.fromEntries(CHECK_IDS.map((c) => [c, scoreCheck(c, input.checks[c])])) as Record<CheckId, CheckResult | null>;
  const tasters = Object.fromEntries(TASTER_IDS.map((t) => [t, scoreTaster(t, input.tasters[t])])) as Record<TasterId, TasterResult | null>;
  const lifts = markLifts(marks, checks);
  const undersell = CHECK_IDS.flatMap((c) => {
    const r = checks[c], subject = checkById(c).informs_mark, m = marks[subject];
    return r?.reliable && r.score !== null && typeof m === "number" && r.score >= LIFT_MIN_SCORE && r.score - m >= UNDERSELL_GAP ? [subject] : [];
  });
  const reading = checks.reading;
  const readingSupport = !!reading?.reliable && reading.score !== null && reading.score < READING_SUPPORT_BELOW;
  const mathsMark = marks["Mathematics"];
  const mathsCheck = checks.maths;
  const languageNote = readingSupport && (
    (typeof mathsMark === "number" && mathsMark < 50) || (!!mathsCheck?.reliable && (mathsCheck.score ?? 100) < 50)
  );
  return { version: SKILLS_VERSION, checks, lifts, marks_undersell: undersell, reading_support: readingSupport, language_note: languageNote, tasters };
}

export const effectiveMarks = (marks: Record<string, number>, lifts: MarkLift[]): Record<string, number> =>
  ({ ...marks, ...Object.fromEntries(lifts.map((l) => [l.subject, l.effective])) });
