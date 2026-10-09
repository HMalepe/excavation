/** Lerato M. — the fictional learner from spec 08 Part 1 (Grade 9 inputs). */
import type { ComboContext } from "@/lib/scoring/combinations";
import { mathsGate } from "@/lib/scoring/mathsGate";
import { contradictionWatch } from "@/lib/scoring/contradictions";

export const LERATO_RIASEC = { R: 30, I: 78, A: 64, S: 70, E: 25, C: 33 };
export const LERATO_PERSONALITY = { O: 72, C: 48, E: 35, A: 66, N: 61 };
export const LERATO_MARKS_G9 = {
  "Home Language": 66, "First Additional Language": 63, Mathematics: 58, "Natural Sciences": 71,
  "Social Sciences": 62, "Economic and Management Sciences": 64, Technology: 55, "Creative Arts": 74,
};

export function leratoContext(overrides: Partial<ComboContext> = {}): ComboContext {
  const mindset = { score: 67, band: "growth" as const };
  const study = { score: 44, band: "moderate" as const };
  const interests = { scores: LERATO_RIASEC } as never;
  return {
    riasec: LERATO_RIASEC,
    interestsExcluded: false,
    flatProfile: false,
    personality: LERATO_PERSONALITY,
    marks: LERATO_MARKS_G9,
    gate: mathsGate(58, mindset, study),
    watch: contradictionWatch({ personality: LERATO_PERSONALITY as never, interests }, LERATO_MARKS_G9),
    conversation: {
      unpressuredSubjects: ["Life Sciences", "History", "Visual Arts"],
      competenceTrapSubject: "Accounting",
    },
    ...overrides,
  };
}
