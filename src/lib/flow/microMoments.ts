/**
 * spec 02 §3.8 — exactly two micro-moments, always in the same places (after interests, after the
 * values sort), generated from the answers so far. No random rewards.
 */
import { valueCards } from "@/lib/config/questionBank";
import type { RiasecType } from "@/lib/config/subjectMap";

const INTEREST_LINES: Record<RiasecType, string> = {
  R: "Building and fixing things pulled you in most. We'll come back to that.",
  I: "Figuring things out pulled you in most. We'll come back to that.",
  A: "Making things pulled you in most. We'll come back to that.",
  S: "Helping and teaching people pulled you in most. We'll come back to that.",
  E: "Leading and persuading people pulled you in most. We'll come back to that.",
  C: "Getting things organised and exactly right pulled you in most. We'll come back to that.",
};

export function afterInterests(scores: Partial<Record<RiasecType, number | null>>): string {
  const entries = Object.entries(scores).filter((e): e is [RiasecType, number] => typeof e[1] === "number");
  if (!entries.length) return "That's one part done. Remember whatever stood out to you.";
  entries.sort((a, b) => b[1] - a[1]);
  const [top, topScore] = entries[0]!;
  const lowest = entries.at(-1)![1];
  if (topScore < 60 || topScore - lowest < 20) {
    return "Nothing pulled you much harder than everything else. That's common at your age. We'll look at it from other angles.";
  }
  return INTEREST_LINES[top];
}

export function afterValues(top1: string | undefined): string {
  const card = valueCards.find((c) => c.id === top1);
  return card ? `You put "${card.text}" first. We'll come back to that.` : "Those choices say a lot. We'll come back to them.";
}
