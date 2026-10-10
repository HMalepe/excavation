/**
 * Norming statistics (spec 04 §10, spec 10 Step 9). Pure.
 * Norms are built per GRADE only — never by race, never for individual reports by province.
 */
import { itemsOf } from "@/lib/config/questionBank";
import { RIASEC } from "@/lib/config/subjectMap";
import { itemValue, scoreItems } from "@/lib/scoring/items";
import type { LikertResponses, NormState } from "@/lib/scoring/types";

export const EMERGING_AT = 300;
export const ESTABLISHED_AT = 1000;
export const MIN_ALPHA = 0.7;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[]) => { const m = mean(xs); return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1); };

/** 101 cut points (p0..p100), nearest-rank. percentileOf() in scales.ts reads these. */
export function percentileCuts(values: number[]): number[] {
  const s = [...values].sort((a, b) => a - b);
  return Array.from({ length: 101 }, (_, p) => s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]!);
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** Cronbach's alpha over complete cases. rows = respondents, columns = keyed item values. */
export function cronbachAlpha(rows: number[][]): number | null {
  const complete = rows.filter((r) => r.every((v) => Number.isFinite(v)));
  const k = complete[0]?.length ?? 0;
  if (complete.length < 3 || k < 2) return null;
  const itemVars = Array.from({ length: k }, (_, j) => variance(complete.map((r) => r[j]!)));
  const totalVar = variance(complete.map((r) => r.reduce((a, b) => a + b, 0)));
  if (totalVar === 0) return null;
  return (k / (k - 1)) * (1 - itemVars.reduce((a, b) => a + b, 0) / totalVar);
}

function pearson(x: number[], y: number[]): number | null {
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) { sxy += (x[i]! - mx) * (y[i]! - my); sxx += (x[i]! - mx) ** 2; syy += (y[i]! - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

/** Scales used for alpha + percentiles. Identity is split into its two dimensions. */
export const NORM_SCALES: { id: string; items: { id: string; reverse: boolean }[]; gate: boolean }[] = [
  ...["P_O", "P_C", "P_E", "P_A", "P_N", ...RIASEC.map((t) => `I_${t}`), "MINDSET", "STUDY"].map((id) => ({
    id, items: itemsOf(id).map((i) => ({ id: i.id, reverse: !!i.reverse })), gate: true,
  })),
  ...(["exploration", "commitment"] as const).map((sub) => ({
    id: `IDENTITY_${sub}`, items: itemsOf("IDENTITY").filter((i) => i.subscale === sub).map((i) => ({ id: i.id, reverse: !!i.reverse })), gate: true,
  })),
  // RAI subscales have 2 items each: reported for review, not used to gate established_norm.
  ...(["intrinsic", "identified", "introjected", "external"] as const).map((sub) => ({
    id: `MOTIVATION_${sub}`, items: itemsOf("MOTIVATION").filter((i) => i.subscale === sub).map((i) => ({ id: i.id, reverse: false })), gate: false,
  })),
];

export function decideNormState(n: number, alphas: Record<string, number | null>): NormState {
  if (n < EMERGING_AT) return "pre_norm";
  if (n < ESTABLISHED_AT) return "emerging_norm";
  const gated = NORM_SCALES.filter((s) => s.gate).map((s) => alphas[s.id]);
  return gated.every((a) => a !== null && a !== undefined && a >= MIN_ALPHA) ? "established_norm" : "emerging_norm";
}

export interface NormResult {
  n: number;
  norm_state: NormState;
  percentiles: Record<string, number[]>;
  identity_medians: { exploration: number; commitment: number } | null;
  alphas: Record<string, number | null>;
  item_stats_csv: string;
}

export function computeNorms(sessions: LikertResponses[]): NormResult {
  const percentiles: Record<string, number[]> = {};
  const alphas: Record<string, number | null> = {};
  const csv = ["scale,item,n,mean,sd,corrected_item_total_r,alpha_if_deleted"];

  for (const scale of NORM_SCALES) {
    const scores = sessions.map((r) => scoreItems(scale.items.map((i) => ({ id: i.id, text: "", response: { id: "agree5", points: [] } as never, reverse: i.reverse })), r)).filter((x): x is number => x !== null);
    if (scores.length) percentiles[scale.id] = percentileCuts(scores);
    const matrix = sessions.map((r) => scale.items.map((i) => (typeof r[i.id] === "number" ? itemValue(r[i.id] as number, i.reverse) : NaN)));
    const complete = matrix.filter((row) => row.every(Number.isFinite));
    alphas[scale.id] = cronbachAlpha(complete);
    scale.items.forEach((it, j) => {
      const col = complete.map((row) => row[j]!);
      const rest = complete.map((row) => row.reduce((a, b, k) => (k === j ? a : a + b), 0));
      const r = col.length > 2 ? pearson(col, rest) : null;
      const aDel = scale.items.length > 2 ? cronbachAlpha(complete.map((row) => row.filter((_, k) => k !== j))) : null;
      const f = (x: number | null) => (x === null || !Number.isFinite(x) ? "" : x.toFixed(3));
      csv.push([scale.id, it.id, col.length, col.length ? f(mean(col)) : "", col.length > 1 ? f(Math.sqrt(variance(col))) : "", f(r), f(aDel)].join(","));
    });
  }

  const exp = sessions.map((r) => scoreItems(itemsOf("IDENTITY").filter((i) => i.subscale === "exploration"), r)).filter((x): x is number => x !== null);
  const com = sessions.map((r) => scoreItems(itemsOf("IDENTITY").filter((i) => i.subscale === "commitment"), r)).filter((x): x is number => x !== null);
  return {
    n: sessions.length,
    norm_state: decideNormState(sessions.length, alphas),
    percentiles,
    identity_medians: exp.length && com.length ? { exploration: median(exp), commitment: median(com) } : null,
    alphas: Object.fromEntries(Object.entries(alphas).map(([k, v]) => [k, v === null ? null : Math.round(v * 1000) / 1000])),
    item_stats_csv: csv.join("\n"),
  };
}
