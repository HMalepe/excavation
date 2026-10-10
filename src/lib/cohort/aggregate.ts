/**
 * Cohort statistics for school leadership (spec 01 §6, spec 09 §4, spec 10 Step 7). Pure.
 * Hard rules:
 *  - the whole cohort must have ≥ 10 learners, or nothing is shown;
 *  - any cell with 1–9 learners is suppressed ("fewer than 10");
 *  - complementary suppression: if exactly one cell in a distribution is suppressed, the next
 *    smallest is suppressed too, so the hidden count can't be recovered by subtraction.
 * Never by race (spec 09 §2) — there is no race field anywhere in the data model.
 */
export const MIN_GROUP = 10;

export type Cell = { label: string; count: number | null; suppressed: boolean };
export interface Distribution { total: number | null; cells: Cell[]; suppressed: boolean }

export function distribution(counts: Record<string, number>, min = MIN_GROUP): Distribution {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < min) return { total: null, cells: [], suppressed: true };
  const cells: Cell[] = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count, suppressed: count > 0 && count < min }));
  const hidden = cells.filter((c) => c.suppressed);
  if (hidden.length === 1) {
    const next = cells.filter((c) => !c.suppressed && c.count! > 0).sort((a, b) => a.count! - b.count!)[0];
    if (next) next.suppressed = true;
  }
  for (const c of cells) if (c.suppressed) c.count = null;
  return { total, cells, suppressed: false };
}

export interface CohortLearner {
  grade: number;
  completed: boolean;
  /** Present only for completed sessions. */
  code?: string | null;
  identity?: string | null;
  fits?: string[];
  mathsGate?: string | null;
  verdict?: string | null;
}

export function cohortStats(learners: CohortLearner[], offered: string[], min = MIN_GROUP) {
  const count = <T,>(xs: T[], key: (x: T) => string | null | undefined) => {
    const out: Record<string, number> = {};
    for (const x of xs) { const k = key(x); if (k) out[k] = (out[k] ?? 0) + 1; }
    return out;
  };
  const byGrade = [9, 11].map((grade) => {
    const all = learners.filter((l) => l.grade === grade);
    const done = all.filter((l) => l.completed);
    const enough = all.length >= min;
    const fitCounts: Record<string, number> = {};
    for (const l of done) for (const f of l.fits ?? []) fitCounts[f] = (fitCounts[f] ?? 0) + 1;
    return {
      grade,
      learners: enough ? all.length : null,
      completed: enough ? done.length : null,
      completion_rate: enough ? Math.round((done.length / all.length) * 100) : null,
      suppressed: !enough,
      interest_first_letter: distribution(count(done, (l) => l.code?.[0]), min),
      identity_status: distribution(count(done, (l) => l.identity), min),
      maths_gate: grade === 9 ? distribution(count(done, (l) => l.mathsGate), min) : null,
      verdicts: grade === 11 ? distribution(count(done, (l) => l.verdict), min) : null,
      recommended_vs_offered: done.length >= min
        ? Object.entries(fitCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id, n]) => ({ id, count: n < min ? null : n, offered: offered.length ? offered.includes(id) : null }))
        : [],
    };
  });
  return { min_group: min, grades: byGrade };
}

/**
 * spec 05 §3: FC3 ("the way this subject is taught does not work for me") is NEVER shown per learner,
 * only aggregated across ≥ 10 learners per subject.
 */
export function teachingFitBySubject(rows: { subject: string; fc3: number }[], min = MIN_GROUP) {
  const by: Record<string, number[]> = {};
  for (const r of rows) (by[r.subject] ??= []).push(r.fc3);
  return Object.entries(by).map(([subject, xs]) => xs.length < min
    ? { subject, n: null, mean: null, suppressed: true }
    : { subject, n: xs.length, mean: Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10, suppressed: false });
}
