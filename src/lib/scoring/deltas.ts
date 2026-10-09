/**
 * spec 04 §9 — Grade 9 → Grade 11 deltas with fixed thresholds until test–retest reliability
 * is measured. After the pilot, replace with the Reliable Change Index (rci() below).
 */
import { RIASEC } from "@/lib/config/subjectMap";
import type { DeltaItem, Deltas, ScoreProfile } from "./types";

export const MOVE_THRESHOLD = 15;

export function deltaItem(from: number | null | undefined, to: number | null | undefined): DeltaItem {
  if (typeof from !== "number" || typeof to !== "number") return { from: from ?? null, to: to ?? null, delta: null, moved: false, direction: null };
  const delta = to - from;
  const moved = Math.abs(delta) >= MOVE_THRESHOLD;
  return { from, to, delta, moved, direction: delta > 0 ? "up" : delta < 0 ? "down" : "same" };
}

const TRANSITIONS: Record<string, string> = {
  "foreclosure>achievement": "You tested the plan and chose it for yourself.",
  "foreclosure>moratorium": "You started questioning a plan you'd accepted. That's growth, even if it feels messy.",
  "diffusion>moratorium": "You've started searching. Good.",
  "moratorium>achievement": "You searched and landed.",
  "achievement>moratorium": "You were sure, now you're reconsidering. Find out why before you change anything.",
  "foreclosure>foreclosure": "Your plan hasn't been tested yet. Grade 11 is the last cheap moment to test it.",
};
export const ANY_TO_DIFFUSION =
  "Gentle check-in: direction has gone quiet. Pair with study and wellbeing context; may signal disengagement.";

export function identityFraming(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  if (to === "diffusion" && from !== "diffusion") return ANY_TO_DIFFUSION;
  return TRANSITIONS[`${from}>${to}`] ?? null;
}

export function computeDeltas(g9: ScoreProfile, g11: ScoreProfile): Deltas {
  const p = (k: "O" | "C" | "E" | "A" | "N") => deltaItem(g9.personality[k], g11.personality[k]);
  const from = g9.interests.code, to = g11.interests.code;
  const shared = [...new Set(from)].filter((ch) => to.includes(ch)).length;
  const vFrom = g9.values?.top3 ?? [], vTo = g11.values?.top3 ?? [];
  const sharedTop3 = vFrom.filter((v) => vTo.includes(v)).length;
  const idFrom = g9.identity.status, idTo = g11.identity.status;
  return {
    personality: { O: p("O"), C: p("C"), E: p("E"), A: p("A"), N: p("N") },
    interests: Object.fromEntries(RIASEC.map((t) => [t, deltaItem(g9.interests.scores[t], g11.interests.scores[t])])) as Deltas["interests"],
    code: { from, to, first_letter_changed: from[0] !== to[0], shared_letters: shared, shifted_a_lot: shared <= 1 },
    identity: { from: idFrom ?? "unknown", to: idTo ?? "unknown", changed: idFrom !== idTo, framing: identityFraming(idFrom, idTo) },
    values: { from: vFrom, to: vTo, shared_top3: sharedTop3, moved: sharedTop3 <= 1 },
    motivation: deltaItem(g9.motivation?.score, g11.motivation?.score),
    mindset: deltaItem(g9.mindset?.score, g11.mindset?.score),
    study: deltaItem(g9.study?.score, g11.study?.score),
  };
}

/** Reliable Change Index for use after the pilot: |RCI| ≥ 1.96 = reliable change. */
export function rci(delta: number, sd: number, rRetest: number): number {
  return delta / (sd * Math.sqrt(2 * (1 - rRetest)));
}
