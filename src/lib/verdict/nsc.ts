/** spec 06 §6 — NSC pass-type projection, gap to the next pass type, and APS. VERIFY yearly. */
import nsc from "@config/nsc_rules.json";
import { subjectMap, isLanguage, LIFE_ORIENTATION } from "@/lib/config/subjectMap";
import type { InstitutionRule } from "./types";

interface Level { id: string; label: string; home_language_min: number; tiers: { count: number; min: number; designated_only: boolean }[]; rest_min: number; max_below_rest: number }
const LEVELS = nsc.levels as Level[];
const DESIGNATED = new Set(nsc.designated_subjects);

export interface MarkRow { subject: string; mark: number }

const isHome = (s: string) => s === "Home Language" || /home language/i.test(s);
const designated = (s: string) => DESIGNATED.has(s) || (isLanguage(s) && !isHome(s));

/**
 * Minimum increases for a learner to meet `level`. Greedy is optimal here: thresholds are nested,
 * so giving the strictest tier the highest marks minimises total deficit.
 */
export function gapsFor(level: Level, marks: MarkRow[]): { subject: string; from: number; to: number }[] | null {
  const hl = marks.find((m) => isHome(m.subject));
  if (!hl) return null;
  const gaps: { subject: string; from: number; to: number }[] = [];
  if (hl.mark < level.home_language_min) gaps.push({ subject: hl.subject, from: hl.mark, to: level.home_language_min });

  let pool = marks.filter((m) => m !== hl && m.subject !== LIFE_ORIENTATION).sort((a, b) => b.mark - a.mark);
  for (const tier of level.tiers) {
    const eligible = pool.filter((m) => !tier.designated_only || designated(m.subject));
    const chosen = eligible.slice(0, tier.count);
    if (chosen.length < tier.count) return null; // not enough subjects to ever qualify
    for (const m of chosen) if (m.mark < tier.min) gaps.push({ subject: m.subject, from: m.mark, to: tier.min });
    pool = pool.filter((m) => !chosen.includes(m));
  }
  const below = pool.filter((m) => m.mark < level.rest_min).sort((a, b) => b.mark - a.mark);
  // max_below_rest lowest marks may stay below (NSC pass: may fail one subject, with conditions)
  for (const m of below.slice(0, Math.max(0, below.length - level.max_below_rest))) gaps.push({ subject: m.subject, from: m.mark, to: level.rest_min });
  return gaps;
}

export function passProjection(marks: MarkRow[]) {
  const meets = LEVELS.map((l) => ({ l, gaps: gapsFor(l, marks) }));
  const idx = meets.findIndex((x) => x.gaps !== null && x.gaps.length === 0);
  const current = idx === -1 ? null : meets[idx]!.l;
  const nextIdx = idx === -1 ? LEVELS.length - 1 : idx - 1;
  const next = nextIdx >= 0 ? meets[nextIdx]! : null;
  return {
    current: current?.id ?? null,
    current_label: current?.label ?? "Not yet meeting a pass",
    next: next?.l.id ?? null,
    next_label: next?.l.label ?? null,
    gaps: next?.gaps ?? [],
  };
}

// ---------- APS ----------
export function apsPoints(mark: number): number {
  for (const [pts, lo, hi] of subjectMap.aps.levels) if (mark >= lo && mark <= hi + 0.999) return pts;
  return 1;
}

/** Generic: sum of the best 6 subjects excluding Life Orientation. */
export function genericAps(marks: MarkRow[]): number {
  return marks.filter((m) => m.subject !== LIFE_ORIENTATION).map((m) => apsPoints(m.mark)).sort((a, b) => b - a).slice(0, 6).reduce((a, b) => a + b, 0);
}

export function institutionAps(rule: InstitutionRule, marks: MarkRow[], lo?: number | null): number {
  const m = rule.aps_method;
  const rows = marks.filter((x) => x.subject !== LIFE_ORIENTATION).map((x) => apsPoints(x.mark) * (m.multipliers?.[x.subject] ?? 1));
  let total = rows.sort((a, b) => b - a).slice(0, m.best ?? 6).reduce((a, b) => a + b, 0);
  if (m.include_lo && typeof lo === "number") total += apsPoints(lo) * (m.lo_points_factor ?? 1);
  return Math.round(total * 10) / 10;
}
