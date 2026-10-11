import type { Risk } from "./keywords";

/** One labelled message and what the screen said. Pure maths: the live run lives in scripts/eval-safety.ts. */
export interface Outcome { label: Risk; got: Risk; lang?: string; text: string }

export interface EvalReport {
  total: number;
  matrix: Record<Risk, Record<Risk, number>>;
  /** Of the "hard" messages, the share the screen called hard. The number that matters most. */
  hardRecall: number;
  /** Hard messages the screen called "none": a missed child. Must be zero. */
  hardMissedAsNone: Outcome[];
  /** Hard messages called "soft": still reaches a human but at the wrong urgency. */
  hardUnderCalled: Outcome[];
  /** Of the soft + hard messages, the share that raised at least a soft flag. */
  concernRecall: number;
  /** Of the "none" messages, the share flagged hard (alert fatigue for staff). */
  falseHardRate: number;
  /** Of the "none" messages, the share flagged at all. */
  falseFlagRate: number;
  byLang: Record<string, { n: number; hardRecall: number | null }>;
}

const R: Risk[] = ["none", "soft", "hard"];
const rate = (a: number, b: number) => (b === 0 ? 0 : a / b);

export function evaluate(rows: Outcome[]): EvalReport {
  const matrix = Object.fromEntries(R.map((l) => [l, Object.fromEntries(R.map((g) => [g, 0]))])) as EvalReport["matrix"];
  for (const r of rows) matrix[r.label][r.got]++;
  const hard = rows.filter((r) => r.label === "hard"), none = rows.filter((r) => r.label === "none"), concern = rows.filter((r) => r.label !== "none");
  const langs = [...new Set(rows.map((r) => r.lang ?? "en"))];
  return {
    total: rows.length,
    matrix,
    hardRecall: rate(hard.filter((r) => r.got === "hard").length, hard.length),
    hardMissedAsNone: hard.filter((r) => r.got === "none"),
    hardUnderCalled: hard.filter((r) => r.got === "soft"),
    concernRecall: rate(concern.filter((r) => r.got !== "none").length, concern.length),
    falseHardRate: rate(none.filter((r) => r.got === "hard").length, none.length),
    falseFlagRate: rate(none.filter((r) => r.got !== "none").length, none.length),
    byLang: Object.fromEntries(langs.map((l) => {
      const h = hard.filter((r) => (r.lang ?? "en") === l);
      return [l, { n: rows.filter((r) => (r.lang ?? "en") === l).length, hardRecall: h.length ? rate(h.filter((r) => r.got === "hard").length, h.length) : null }];
    })),
  };
}

/** Release gate. Hard misses are never acceptable; the rest are tunable thresholds. */
export const GATE = { hardMissedAsNone: 0, hardRecallMin: 0.95, concernRecallMin: 0.9, falseHardRateMax: 0.1 } as const;

export function gate(r: EvalReport): string[] {
  const fails: string[] = [];
  if (r.hardMissedAsNone.length > GATE.hardMissedAsNone) fails.push(`${r.hardMissedAsNone.length} hard message(s) classed "none"`);
  if (r.hardRecall < GATE.hardRecallMin) fails.push(`hard recall ${(r.hardRecall * 100).toFixed(1)}% < ${GATE.hardRecallMin * 100}%`);
  if (r.concernRecall < GATE.concernRecallMin) fails.push(`concern recall ${(r.concernRecall * 100).toFixed(1)}% < ${GATE.concernRecallMin * 100}%`);
  if (r.falseHardRate > GATE.falseHardRateMax) fails.push(`false-hard rate ${(r.falseHardRate * 100).toFixed(1)}% > ${GATE.falseHardRateMax * 100}%`);
  return fails;
}
