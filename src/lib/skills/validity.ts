/**
 * Does each new signal earn its place? Pure statistics for `npm run validity`.
 *
 * The question for every check is not "does it correlate with later marks" (Grade 9 marks already
 * do) but "does it add anything ON TOP of Grade 9 marks". That is ΔR²: how much more of the
 * Grade 10/11 outcome is explained by marks + check than by marks alone. Item statistics flag
 * questions that are too easy, too hard, or that don't line up with the rest of their check.
 */
import { itemIndex } from "./content";

export const MIN_N = 30;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { const dx = xs[i]! - mx, dy = ys[i]! - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

/** R² for y ~ x1 + x2 from the three pairwise correlations (standardised OLS). */
export function r2Two(r1: number, r2: number, r12: number): number {
  const d = 1 - r12 * r12;
  return d <= 1e-9 ? r1 * r1 : (r1 * r1 + r2 * r2 - 2 * r1 * r2 * r12) / d;
}

export interface ValidityRow { mark9: number; check: number; outcome: number }
export interface ValidityResult {
  n: number;
  r_mark: number | null;
  r_check: number | null;
  r2_mark: number | null;
  r2_both: number | null;
  delta_r2: number | null;
  verdict: string;
}

const round3 = (x: number | null) => (x === null ? null : Math.round(x * 1000) / 1000);

export function validity(rows: ValidityRow[]): ValidityResult {
  const n = rows.length;
  if (n < MIN_N) return { n, r_mark: null, r_check: null, r2_mark: null, r2_both: null, delta_r2: null, verdict: `not enough data yet (need ${MIN_N})` };
  const m = rows.map((r) => r.mark9), c = rows.map((r) => r.check), y = rows.map((r) => r.outcome);
  const rm = pearson(m, y), rc = pearson(c, y), rmc = pearson(m, c);
  if (rm === null || rc === null || rmc === null) return { n, r_mark: round3(rm), r_check: round3(rc), r2_mark: null, r2_both: null, delta_r2: null, verdict: "no variance" };
  const r2m = rm * rm, r2b = r2Two(rm, rc, rmc), d = r2b - r2m;
  const verdict = d >= 0.05 ? "adds clearly beyond marks: consider more weight" : d >= 0.02 ? "adds a little beyond marks: keep as is" : "adds little beyond marks: keep raise-only or drop";
  return { n, r_mark: round3(rm), r_check: round3(rc), r2_mark: round3(r2m), r2_both: round3(r2b), delta_r2: round3(d), verdict };
}

/** One learner's check answers: itemId → correct (null = "not sure"). */
export type ItemAnswers = Record<string, boolean | null>;

/** Per-item difficulty (p) and discrimination (item vs rest-of-check correlation), as CSV. */
export function checkItemStatsCsv(learners: ItemAnswers[]): string {
  const ids = [...itemIndex.keys()];
  const lines = ["item_id,check,topic,n,p_correct,p_not_sure,discrimination,flag"];
  for (const id of ids) {
    const meta = itemIndex.get(id)!;
    const sameCheck = ids.filter((x) => x !== id && itemIndex.get(x)!.check === meta.check);
    const who = learners.filter((l) => id in l);
    const x: number[] = [], rest: number[] = [];
    let notSure = 0;
    for (const l of who) {
      if (l[id] === null) notSure++;
      x.push(l[id] ? 1 : 0);
      const others = sameCheck.filter((o) => o in l);
      rest.push(others.length ? others.filter((o) => l[o]).length / others.length : 0);
    }
    const n = who.length;
    const p = n ? x.reduce((a, b) => a + b, 0) / n : null;
    const disc = pearson(x, rest);
    const flag = n < MIN_N ? "low_n" : p !== null && p > 0.9 ? "too_easy" : p !== null && p < 0.2 ? "too_hard" : disc !== null && disc < 0.2 ? "weak_discrimination" : "";
    lines.push([id, meta.check, `"${meta.topic}"`, n, p === null ? "" : p.toFixed(2), n ? (notSure / n).toFixed(2) : "", disc === null ? "" : disc.toFixed(2), flag].join(","));
  }
  return lines.join("\n") + "\n";
}
