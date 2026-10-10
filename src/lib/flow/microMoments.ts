/**
 * spec 02 §3.8 — exactly two micro-moments, always in the same places (after interests, after the
 * values sort), generated from the answers so far. No random rewards.
 */
import { valueCards } from "@/lib/config/questionBank";
import type { RiasecType } from "@/lib/config/subjectMap";

const INTEREST_LINES: Record<RiasecType, string> = {
  R: "You lit up most at the building and fixing activities. Hold that thought.",
  I: "You lit up most at the figuring-things-out activities. Hold that thought.",
  A: "Making things pulled you in more than anything else. Hold that thought.",
  S: "Helping and teaching people came out on top for you. Hold that thought.",
  E: "Leading and convincing people pulled you most. Hold that thought.",
  C: "Getting things organised and exactly right pulled you most. Hold that thought.",
};

export function afterInterests(scores: Partial<Record<RiasecType, number | null>>): string {
  const entries = Object.entries(scores).filter((e): e is [RiasecType, number] => typeof e[1] === "number");
  if (!entries.length) return "That's the first part done. Hold on to whatever stood out for you.";
  entries.sort((a, b) => b[1] - a[1]);
  const [top, topScore] = entries[0]!;
  const lowest = entries.at(-1)![1];
  if (topScore < 60 || topScore - lowest < 20) {
    return "Nothing pulled you much more than everything else. That's common at your age, and we'll dig into it later.";
  }
  return INTEREST_LINES[top];
}

export function afterValues(top1: string | undefined): string {
  const card = valueCards.find((c) => c.id === top1);
  return card ? `You put "${card.text}" first. We'll come back to that.` : "Those choices say a lot. We'll come back to them.";
}
