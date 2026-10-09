/**
 * spec 09 §5.1 — soft safeguarding trigger for the SCORED layer. Pure function.
 * Fires when TWO OR MORE of these are true:
 *   1. Stress Sensitivity ≥ 80
 *   2. FC6 = 5 for any subject (Grade 11)
 *   3. 4+ consecutive maximum-distress answers (distress-keyed items, in the order shown)
 *   4. Extreme hesitation (> 4× the learner's median time) on several (≥ 3) items
 *   5. A restart within the session
 * Result: a calm interstitial + a logged flag with NO content. The teacher summary is unchanged.
 */
import { median } from "@/lib/scoring/items";
import type { ItemMeta, LikertResponses } from "@/lib/scoring/types";

/** Items where a maximum answer signals distress, and which raw value is "maximum distress". */
export const DISTRESS_ITEMS: Record<string, number> = { PN1: 5, PN2: 5, PN3: 5, PN4: 5, PN5: 1, PN6: 1 };
export const isFc6 = (id: string) => id === "FC6" || id.startsWith("FC6:");

export interface SoftCheckInput {
  stressSensitivity: number | null;
  likert: LikertResponses;
  /** Item ids in the order the learner answered them. */
  answeredOrder: string[];
  meta?: Record<string, ItemMeta>;
  restartedInSession?: boolean;
}

export function scoredLayerSoftSignals(i: SoftCheckInput): string[] {
  const signals: string[] = [];
  if ((i.stressSensitivity ?? 0) >= 80) signals.push("stress_sensitivity_80");

  if (Object.entries(i.likert).some(([id, v]) => isFc6(id) && v === 5)) signals.push("fc6_max");

  let run = 0, best = 0;
  for (const id of i.answeredOrder) {
    const key = isFc6(id) ? "FC6" : id;
    const target = key === "FC6" ? 5 : DISTRESS_ITEMS[key];
    if (target === undefined) continue; // only distress-keyed items count towards the run
    run = i.likert[id] === target ? run + 1 : 0;
    best = Math.max(best, run);
  }
  if (best >= 4) signals.push("consecutive_max_distress");

  if (i.meta) {
    const times = Object.values(i.meta).map((m) => m.ms).filter((x): x is number => typeof x === "number" && x > 0);
    const med = median(times);
    if (med && times.filter((t) => t > 4 * med).length >= 3) signals.push("extreme_hesitation");
  }
  if (i.restartedInSession) signals.push("restart_in_session");
  return signals;
}

export const shouldShowSoftInterstitial = (signals: string[]) => signals.length >= 2;

export const SOFT_INTERSTITIAL_COPY =
  "Some of these questions can land heavier on some days. You can keep going, take a break, or come back another time. If talking to someone would help, there are people available now.";
