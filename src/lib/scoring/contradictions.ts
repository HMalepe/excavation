/**
 * contradiction_watch (spec 07 §2): simple rules that give The Guide two or three specific
 * things to test in conversation. Each has a stable id so the learner's resolution can flow
 * back into scoring (spec 10 Step 5: "contradiction resolutions; each capped at ±5").
 */
import type { ContradictionWatch, ScoreProfile } from "./types";

export interface WatchRule {
  id: string;
  applies: (p: Pick<ScoreProfile, "personality" | "interests">, marks: Record<string, number | null | undefined>) => boolean;
  text: string;
  /** When the learner says the conversation is truer, which trait is set aside (treated as neutral 50). */
  neutraliseTrait?: "O" | "C" | "E" | "A" | "N";
}

export const WATCH_RULES: WatchRule[] = [
  {
    id: "E_LOW_S_HIGH",
    applies: (p) => (p.personality.E ?? 50) < 40 && (p.interests.scores.S ?? 0) > 65,
    text: "Social Energy is low but Helper interest is high: check whether they help one-on-one rather than in groups",
    neutraliseTrait: "E",
  },
  {
    id: "C_LOW_ORGANISER_HIGH",
    applies: (p) => (p.personality.C ?? 50) < 40 && (p.interests.scores.C ?? 0) > 65,
    text: "Follow-through is low but Organiser interest is high: check whether they organise things they care about but not schoolwork",
    neutraliseTrait: "C",
  },
  {
    id: "CREATOR_HIGH_CA_LOW",
    applies: (p, m) => (p.interests.scores.A ?? 0) > 65 && typeof m["Creative Arts"] === "number" && m["Creative Arts"]! < 45,
    text: "Creator interest is high but the Creative Arts mark is low: check whether they create outside school, in ways the subject doesn't capture",
  },
];

export function contradictionWatch(
  p: Pick<ScoreProfile, "personality" | "interests">,
  marks: Record<string, number | null | undefined>,
): ContradictionWatch[] {
  return WATCH_RULES.filter((r) => r.applies(p, marks)).map((r) => ({ id: r.id, text: r.text }));
}
