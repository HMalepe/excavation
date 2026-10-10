/**
 * The learner journey as an explicit state machine (spec 01 §4, 02 §3, 05 §2).
 * Pure: stage order and descent mapping only. The server decides which stage a session is at.
 *
 * G11 ordering note: spec 05 lists Failure Cause (step 4) before Marks (step 6), but failure cause
 * is only asked for subjects below 50%, which can't be known without marks. Marks come first.
 */
import type { Touchpoint } from "@/lib/scoring/types";

export const G9_STAGES = ["consent", "assent", "intake", "scored", "snapshot", "guide_notice", "conversation", "processing", "report"] as const;
export const G11_STAGES = [
  "consent", "assent", "two_years", "scored", "marks", "subject_experience", "failure_cause", "career_update",
  "guide_notice", "conversation", "processing", "report",
] as const;
export type Stage = (typeof G9_STAGES)[number] | (typeof G11_STAGES)[number];

export const stagesFor = (t: Touchpoint): readonly Stage[] => (t === "G9_FOUNDATION" ? G9_STAGES : G11_STAGES);

export function nextStage(t: Touchpoint, current: Stage): Stage {
  const s = stagesFor(t);
  const i = s.indexOf(current);
  if (i === -1) throw new Error(`Stage ${current} is not part of ${t}`);
  return s[Math.min(i + 1, s.length - 1)]!;
}

export const isAtOrAfter = (t: Touchpoint, current: Stage, target: Stage) => {
  const s = stagesFor(t);
  return s.indexOf(current) >= s.indexOf(target);
};

/** The five-stage descent (spec 02 §3.7). No percentages, ever. */
export const DESCENT = ["Surface", "Wading in", "Deep water", "The trench", "The floor"] as const;
export type Descent = (typeof DESCENT)[number];

export function descentFor(stage: Stage, scoredSection?: string): Descent {
  switch (stage) {
    case "consent": case "assent": case "intake": case "two_years": return "Surface";
    case "scored":
      if (scoredSection === "interests" || scoredSection === "personality") return "Wading in";
      if (scoredSection === "study" || scoredSection === "context") return "The trench";
      return "Deep water";
    case "snapshot": case "marks": case "subject_experience": case "failure_cause": case "career_update": return "The trench";
    default: return "The floor";
  }
}

export const touchpointForGrade = (grade: number): Touchpoint | null =>
  grade === 9 ? "G9_FOUNDATION" : grade === 11 ? "G11_CONFIRMATION" : null;
