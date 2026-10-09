/** spec 04 §8.6 — the Maths gate, shown on every Grade 9 report. The learner and family decide. */
import { subjectMap } from "@/lib/config/subjectMap";
import type { MathsGate, ScoreProfile } from "./types";

/** Deterministic support plan for "Mathematics with a support plan" (40–49% with growth signals). */
export const MATHS_SUPPORT_PLAN = [
  "This week: write down the 3 Grade 9 maths topics that feel shakiest and show the list to your maths teacher.",
  "Every week: two 30-minute practice sessions on those topics, using free resources such as Siyavula or Khan Academy.",
  "Before each test: do one past paper or exercise set under test conditions and mark it against the memo.",
  "By the end of Grade 10 Term 1: check your mark with your teacher and decide together whether the plan is working.",
];

export function mathsGate(
  mathsMark: number | null | undefined,
  mindset: ScoreProfile["mindset"],
  study: ScoreProfile["study"],
  competenceTrapOnMaths = false,
): MathsGate {
  const closed = subjectMap.pathway_families.filter((p) => p.closed_by_maths_lit === true).map((p) => p.id);
  const partly = subjectMap.pathway_families.filter((p) => p.closed_by_maths_lit === "partial").map((p) => p.id);
  const base = { closed_by_maths_lit: closed, partly_closed_by_maths_lit: partly, support_plan: null, competence_trap_on_maths: competenceTrapOnMaths };

  if (mathsMark === null || mathsMark === undefined) {
    return { ...base, recommendation: "both_options", reason: "No Grade 9 Maths mark yet" };
  }
  const m = Math.round(mathsMark);
  if (m >= 50) return { ...base, recommendation: "mathematics", reason: `G9 Maths ${m}%` };
  if (m >= 40) {
    const growth = (mindset?.score ?? 0) >= 60 && (study?.score ?? 0) >= 50;
    return growth
      ? { ...base, recommendation: "mathematics_with_support", reason: `G9 Maths ${m}%, growth mindset and workable study habits`, support_plan: MATHS_SUPPORT_PLAN }
      : { ...base, recommendation: "both_options", reason: `G9 Maths ${m}%` };
  }
  return { ...base, recommendation: "maths_lit_safer", reason: `G9 Maths ${m}%` };
}

/** Which maths a combination is scored with: fixed by the combination, or the gate for "Either". */
export function mathsForCombination(comboMaths: "Mathematics" | "Either" | "Mathematical Literacy", gate: MathsGate) {
  if (comboMaths === "Mathematics") return "Mathematics" as const;
  if (comboMaths === "Mathematical Literacy") return "Mathematical Literacy" as const;
  return gate.recommendation === "maths_lit_safer" ? ("Mathematical Literacy" as const) : ("Mathematics" as const);
}
