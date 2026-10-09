/** spec 04 §1 — item and scale scoring. */
import { itemsOf, type Item } from "@/lib/config/questionBank";
import type { LikertResponses } from "./types";

/** raw: 1..5 (agree5 / enjoy5 / true5). Reverse-keyed items flip around 3. */
export const itemValue = (raw: number, reverse: boolean): number => (reverse ? 6 - raw : raw);

/** Minimum answered items for a scale to be scored: 5 of 6, or 80% for other lengths. */
export const minAnswered = (n: number): number => (n === 6 ? 5 : Math.ceil(0.8 * n));

/** Mean of 1..5 values mapped to 0..100, rounded (spec formula). */
export const scaleScore = (values: number[]): number => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(((mean - 1) / 4) * 100);
};

const isValidRaw = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

/** Keyed values for answered items only. */
export function keyedValues(items: Item[], responses: LikertResponses): number[] {
  const out: number[] = [];
  for (const it of items) {
    const raw = responses[it.id];
    if (isValidRaw(raw)) out.push(itemValue(raw, it.reverse ?? false));
  }
  return out;
}

/**
 * Score a set of items with the missing-item rule. Returns null if too few were answered,
 * in which case the report omits that scale.
 */
export function scoreItems(items: Item[], responses: LikertResponses): number | null {
  const vals = keyedValues(items, responses);
  if (vals.length < minAnswered(items.length) || vals.length === 0) return null;
  return scaleScore(vals);
}

export function scoreScale(scaleId: string, responses: LikertResponses): number | null {
  return scoreItems(itemsOf(scaleId), responses);
}

/** Mean (1..5) of keyed answered items, or null — used for RAI subscale means. */
export function meanKeyed(items: Item[], responses: LikertResponses): number | null {
  const vals = keyedValues(items, responses);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export const round1 = (x: number): number => Math.round(x * 10) / 10;
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
