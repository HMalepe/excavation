/**
 * spec 04 §8 — the Grade 9 subject-combination engine.
 * Interest fit (mean-centred cosine) · readiness (marks vs rules, school overrides win) ·
 * trait fit · combination score with conversation adjustments · top-3 selection
 * (near-duplicates, max 2 per family, doors-open safeguard, tie-breaks) · cautions.
 */
import {
  COMBINATION_FAMILY, RIASEC, readinessRules as defaultRules, subjectMap,
  type Combination, type RiasecType, type RiasecVector,
} from "@/lib/config/subjectMap";
import { WATCH_RULES } from "./contradictions";
import { doorsFor } from "./doors";
import { clamp, mean, round1 } from "./items";
import { mathsForCombination } from "./mathsGate";
import { expandSubjects, normaliseSubjectList } from "./subjects";
import { tasterAdjustment } from "@/lib/skills/engine";
import type { TasterId } from "@/lib/skills/content";
import type { TasterResult } from "@/lib/skills/types";
import type { CombinationResult, ContradictionWatch, ConversationAdjustments, MathsGate, SchoolOverrides } from "./types";

// ---------- §8.1 Interest fit ----------
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i]!, 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));
const centre = (a: number[]) => { const m = mean(a); return a.map((x) => x - m); };
export const vecOf = (v: RiasecVector) => RIASEC.map((t) => v[t]);

/** Plain cosine similarity — used for the near-duplicate rule (§8.5a). */
export function cosine(a: number[], b: number[]): number {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
}

/** Mean-centred cosine → 0..100. Compares SHAPE, not level. A perfectly flat vector scores 50. */
export function interestFit(riasec: Record<RiasecType, number>, comboVec: RiasecVector): number {
  const Lc = centre(RIASEC.map((t) => riasec[t] / 100));
  const Vc = centre(vecOf(comboVec));
  const d = norm(Lc) * norm(Vc);
  const cos = d === 0 ? 0 : dot(Lc, Vc) / d;
  return Math.round(((cos + 1) / 2) * 100);
}

// ---------- §8.2 Readiness ----------
export type Rules = Record<string, { needs: Record<string, number> }>;

const tier = (m: number, threshold: number) => (m >= threshold ? 100 : m >= threshold - 10 ? 60 : 20);
const NEXT_TIER: Record<number, number> = { 20: 60, 60: 100, 100: 100 };

/**
 * `lifted` (addition, 2026-10): effective marks raised by a reliable readiness check. They can move
 * a need up by at most ONE tier (20→60, 60→100), never down. Missing marks are never filled in.
 */
export function subjectReadiness(
  subject: string,
  marks: Record<string, number | null | undefined>,
  rules: Rules,
  lifted?: Record<string, number>,
): { readiness: number; limiting: string | null; missing: boolean; lifted?: boolean } {
  const needs = rules[subject]?.needs ?? {};
  let readiness = 100;
  let limiting: string | null = null;
  let missing = false;
  let wasLifted = false;
  for (const [need, threshold] of Object.entries(needs)) {
    const m = marks[need];
    let r: number;
    if (m === null || m === undefined) { r = 60; missing = true; }
    else {
      r = tier(m, threshold);
      const eff = lifted?.[need];
      if (typeof eff === "number" && eff > m) {
        const up = Math.min(tier(eff, threshold), NEXT_TIER[r]!);
        if (up > r) { r = up; wasLifted = true; }
      }
    }
    if (r < readiness) { readiness = r; limiting = need; }
  }
  return wasLifted ? { readiness, limiting, missing, lifted: true } : { readiness, limiting, missing };
}

// ---------- §8.3 Trait fit ----------
type Trait = "O" | "C" | "E" | "A" | "N";
export const COMBO_TRAITS: Record<string, Trait[]> = {
  HEALTH_SCI: ["O", "C"], SCI_IT: ["O", "C"], GEO_ENV: ["O", "C"], AGRI: ["O", "C"],
  ENG_TECH: ["C", "O"], TECHNICAL: ["C", "O"],
  COMMERCE: ["C", "E"],
  BUSINESS_PRACTICAL: ["E", "C"],
  HUMANITIES: ["O", "A"],
  VISUAL_CREATIVE: ["O"], DIGITAL_MEDIA: ["O"],
  PERFORMING: ["E", "O"],
  SERVICE: ["A", "E"],
};

export function traitFit(comboId: string, P: Partial<Record<Trait, number | null>>): number {
  const traits = COMBO_TRAITS[comboId] ?? [];
  const vals = traits.map((t) => P[t]).filter((v): v is number => typeof v === "number");
  if (!vals.length) return 50;
  return Math.round(clamp(50 + 0.5 * mean(vals.map((v) => v - 50)), 0, 100));
}

// ---------- §8.4 Combination score ----------
export const WEIGHTS = { interest: 0.45, readiness: 0.35, trait: 0.2 };
export const ADJUSTMENT_CAP = 5;
export const capAdj = (x: number) => clamp(x, -ADJUSTMENT_CAP, ADJUSTMENT_CAP);

export interface ComboContext {
  riasec: Record<RiasecType, number | null>;
  /** Interests unusable (straight-lined or too many skipped) → weight moves to readiness. */
  interestsExcluded: boolean;
  /** Differentiation < 20 → interest weight × 0.5, difference to readiness. */
  flatProfile: boolean;
  personality: Partial<Record<Trait, number | null>>;
  /** Senior Phase marks. */
  marks: Record<string, number | null | undefined>;
  gate: MathsGate;
  watch: ContradictionWatch[];
  conversation?: ConversationAdjustments;
  school?: SchoolOverrides;
  /** Addition (2026-10): marks raised by readiness checks (only the subjects that were lifted). */
  liftedMarks?: Record<string, number>;
  /** Addition (2026-10): taster task results; each linked combination moves at most ±5. */
  tasters?: Record<TasterId, TasterResult | null>;
}

export function weightsFor(ctx: Pick<ComboContext, "interestsExcluded" | "flatProfile">) {
  if (ctx.interestsExcluded) return { interest: 0, readiness: WEIGHTS.readiness + WEIGHTS.interest, trait: WEIGHTS.trait };
  if (ctx.flatProfile) return { interest: WEIGHTS.interest * 0.5, readiness: WEIGHTS.readiness + WEIGHTS.interest * 0.5, trait: WEIGHTS.trait };
  return WEIGHTS;
}

/** FET subjects named by the Q12 competence trap. Maths is handled by the maths gate, not here. */
export function trapSubjects(conv?: ConversationAdjustments): Set<string> {
  if (!conv?.competenceTrapSubject) return new Set();
  return new Set(expandSubjects(conv.competenceTrapSubject).filter((s) => s !== "Mathematics" && s !== "Mathematical Literacy"));
}

/**
 * The third elective: a Q20 subject if the combination allows it, otherwise the first option
 * that isn't the learner's competence trap, otherwise the first option.
 */
export function chooseThirdElective(c: Combination, q20: Set<string>, trap: Set<string>): string {
  const opts = c.third_elective_options;
  return opts.find((o) => q20.has(o) && !trap.has(o)) ?? opts.find((o) => !trap.has(o)) ?? opts[0]!;
}

export function scoreCombination(c: Combination, ctx: ComboContext, order: number): CombinationResult & { order: number } {
  const q20 = new Set(normaliseSubjectList(ctx.conversation?.unpressuredSubjects ?? []));
  const trap = trapSubjects(ctx.conversation);
  const third = chooseThirdElective(c, q20, trap);
  const electives = [...c.core_electives, third];
  const maths = mathsForCombination(c.maths, ctx.gate);
  const rules: Rules = { ...defaultRules, ...(ctx.school?.readinessOverrides ?? {}) };
  const flags: string[] = [];

  // Interest fit
  const riasecComplete = RIASEC.every((t) => typeof ctx.riasec[t] === "number");
  const iFit = riasecComplete ? interestFit(ctx.riasec as Record<RiasecType, number>, c.riasec_vector) : 50;

  // Readiness: maths weighted 1.5
  const readiness_detail: CombinationResult["readiness_detail"] = {};
  let wSum = 0, rSum = 0;
  for (const s of [maths, ...electives]) {
    const d = subjectReadiness(s, ctx.marks, rules, ctx.liftedMarks);
    readiness_detail[s] = d;
    if (d.missing) flags.push("marks_incomplete");
    const w = s === "Mathematics" ? 1.5 : 1;
    wSum += w; rSum += w * d.readiness;
  }
  const readiness = Math.round(rSum / wSum);
  const liftedNeeds = Object.values(readiness_detail).some((d) => d.lifted);

  // Trait fit
  const tFit = traitFit(c.id, ctx.personality);

  // Base score
  const W = weightsFor(ctx);
  let score = W.interest * iFit + W.readiness * readiness + W.trait * tFit;
  const adjustments: string[] = [];

  // Q20: ≥ 2 of the combination's electives (core + one third option) were the unpressured choice.
  const q20Count = c.core_electives.filter((s) => q20.has(s)).length + (c.third_elective_options.some((s) => q20.has(s)) ? 1 : 0);
  if (q20Count >= 2) { score += 5; adjustments.push("+5 unpressured_match"); }

  // Competence trap: only when the learner can't avoid the subject in this combination.
  const trapHit = electives.find((s) => trap.has(s));
  if (trapHit) {
    score -= 5;
    adjustments.push(`-5 competence_trap (Q12: ${ctx.conversation?.competenceTrapSubject ?? trapHit})`);
    flags.push("contains_competence_trap");
  }

  // Readiness lifted by a check: no score adjustment of its own, but logged for the audit trail.
  if (liftedNeeds) {
    const subjects = Object.keys(ctx.liftedMarks ?? {}).map((k) => `${k} ${ctx.marks[k]}→${ctx.liftedMarks![k]}`).join(", ");
    adjustments.push(`readiness_lifted_by_check (${subjects})`);
  }

  // Taster tasks: behaviour, not self-report. Capped ±5 like the Q20 bonus.
  if (ctx.tasters) {
    const t = tasterAdjustment(c.id, ctx.tasters);
    if (t.delta) { score += t.delta; adjustments.push(t.note!); }
  }

  // Contradiction resolutions: if the learner says the conversation is truer, the disputed trait is
  // set aside (treated as neutral 50) for trait fit. The resulting change is capped at ±5 and logged.
  for (const res of ctx.conversation?.contradictionResolutions ?? []) {
    if (res.learnerSaysTruer !== "conversation") continue;
    if (!ctx.watch.some((w) => w.id === res.watchId)) continue;
    const rule = WATCH_RULES.find((r) => r.id === res.watchId);
    if (!rule?.neutraliseTrait || !(COMBO_TRAITS[c.id] ?? []).includes(rule.neutraliseTrait)) continue;
    const alt = traitFit(c.id, { ...ctx.personality, [rule.neutraliseTrait]: 50 });
    const delta = round1(capAdj(W.trait * (alt - tFit)));
    if (delta !== 0) {
      score += delta;
      adjustments.push(`${delta > 0 ? "+" : ""}${delta} contradiction_resolved (${res.watchId})`);
    }
  }

  return {
    id: c.id, name: c.name, family: COMBINATION_FAMILY[c.id]!,
    subjects: { maths, electives },
    interest_fit: iFit, readiness, readiness_detail, trait_fit: tFit,
    score: round1(score), q20_count: q20Count, adjustments,
    doors: doorsFor([maths, ...electives]),
    flags: [...new Set(flags)],
    order,
  };
}

// ---------- §8.5 Selection ----------
type Scored = CombinationResult & { order: number };

/** Ties: more Q20 subjects → higher interest fit → higher readiness → order in subject_map.json. */
export const compareCombos = (a: Scored, b: Scored) =>
  b.score - a.score || b.q20_count - a.q20_count || b.interest_fit - a.interest_fit || b.readiness - a.readiness || a.order - b.order;

export const NEAR_DUPLICATE = 0.95;
const comboVec = (id: string) => vecOf(subjectMap.combinations.find((c) => c.id === id)!.riasec_vector);

export interface SelectionResult {
  ranked: Scored[];
  fits: Scored[];
  cautions: Scored[];
  offersKnown: boolean;
}

export function selectCombinations(all: Scored[], ctx: ComboContext): SelectionResult {
  const offered = ctx.school?.offeredCombinationIds?.length ? new Set(ctx.school.offeredCombinationIds) : null;
  const pool = all.filter((c) => !offered || offered.has(c.id)).sort(compareCombos);

  // Top 3 with (a) no near-duplicates and (b) max 2 per family.
  const fits: Scored[] = [];
  for (const c of pool) {
    if (fits.length === 3) break;
    if (fits.some((f) => cosine(comboVec(f.id), comboVec(c.id)) > NEAR_DUPLICATE)) continue;
    if (fits.filter((f) => f.family === c.family).length >= 2) continue;
    fits.push({ ...c });
  }

  // (c) Doors-open safeguard: a capable learner always sees one science option.
  // Uses check-lifted marks when present: the safeguard exists to keep doors open, so it may only widen.
  const eff = (k: string) => ctx.liftedMarks?.[k] ?? ctx.marks[k];
  const maths = eff("Mathematics"), ns = eff("Natural Sciences");
  if (fits.length === 3 && !fits.some((f) => f.family === "STEM") && (maths ?? 0) >= 50 && (ns ?? 0) >= 50) {
    const bestStem = pool.find((c) => c.family === "STEM");
    if (bestStem && bestStem.score >= fits[2]!.score - 10) {
      fits[2] = { ...bestStem, label: "keeps_most_doors_open" };
    }
  }
  fits.forEach((f, i) => (f.role = (["fit_1", "fit_2", "fit_3"] as const)[i]));

  // Cautions: never from the fits, never invented.
  const fitIds = new Set(fits.map((f) => f.id));
  const rest = pool.filter((c) => !fitIds.has(c.id));
  const cautions: Scored[] = [];

  const trapCombos = rest.filter((c) => c.flags.includes("contains_competence_trap"));
  let trapPick: Scored | undefined;
  if (trapCombos.length) {
    // The trap the learner is most likely to be pulled into: highest readiness, then highest score.
    trapPick = [...trapCombos].sort((a, b) => b.readiness - a.readiness || b.score - a.score)[0];
  } else {
    // No caution-eligible combination contains the Q12 subject (or none was named):
    // the combination they could do well in that is likely to drain them.
    trapPick = rest
      .filter((c) => c.interest_fit < 40 && c.readiness >= 60 && c.readiness > c.interest_fit)
      .sort((a, b) => b.readiness - b.interest_fit - (a.readiness - a.interest_fit) || a.order - b.order)[0];
  }
  if (trapPick) cautions.push({ ...trapPick, role: "caution", caution_type: "competence_trap" });

  const stretch = rest
    .filter((c) => c.readiness < 50 && c.id !== trapPick?.id)
    .sort((a, b) => b.interest_fit - a.interest_fit || a.order - b.order)[0];
  if (stretch) cautions.push({ ...stretch, role: "caution", caution_type: "stretch" });

  return { ranked: pool, fits, cautions, offersKnown: offered !== null };
}

export function runCombinationEngine(ctx: ComboContext): SelectionResult {
  const all = subjectMap.combinations.map((c, i) => scoreCombination(c, ctx, i));
  return selectCombinations(all, ctx);
}
