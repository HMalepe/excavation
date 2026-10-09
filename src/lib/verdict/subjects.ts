/** spec 06 §1–§2 — per-subject fit, performance band, quadrant and failure cause. */
import { isLanguage, isMaths, subjectVectors, type RiasecType } from "@/lib/config/subjectMap";
import { interestFit } from "@/lib/scoring/combinations";
import { scaleScore } from "@/lib/scoring/items";
import type { Cause, FitBand, PerformanceBand, Quadrant, SubjectInput, SubjectResult, SubjectSignal } from "./types";

export const DEFAULT_ADEQUATE = 50;

/**
 * Performance band. With the default threshold T = 50 this is exactly spec 06 §1:
 * strong ≥ 60 · secure ≥ 50 (unless falling ≥ 10) · at_risk ≥ 40 (rising if trend ≥ +10) · failing.
 * A school override raises T and shifts every cut by the same amount.
 */
export function performanceBand(m11: number, m10: number | null, threshold = DEFAULT_ADEQUATE): { band: PerformanceBand; trend: number } {
  const trend = m10 === null ? 0 : m11 - m10;
  const T = Math.max(DEFAULT_ADEQUATE, threshold);
  const band: PerformanceBand =
    m11 >= T + 10 ? "strong"
    : m11 >= T ? (trend <= -10 ? "at_risk_falling" : "secure")
    : m11 >= T - 10 ? (trend >= 10 ? "at_risk_rising" : "at_risk")
    : "failing";
  return { band, trend };
}

export const isAdequate = (b: PerformanceBand) => b === "strong" || b === "secure";

export function fitBand(subjectFit: number): FitBand {
  return subjectFit >= 60 ? "high" : subjectFit >= 45 ? "borderline" : "low";
}

const SE_FIT = ["SE1", "SE2", "SE3", "SE4"] as const;
const SE_COMP = ["SE5", "SE6"] as const;
const answered = (se: SubjectInput["se"], ids: readonly string[]) =>
  ids.map((id) => se?.[id as keyof typeof se]).filter((v): v is number => typeof v === "number" && v >= 1 && v <= 5);

// ---------- §2 Failure cause ----------
const FC_CAUSE: Record<string, Cause> = {
  FC1: "foundation_gap", FC2: "study_method", FC3: "teaching_environment", FC4: "circumstances", FC5: "fit", FC6: "wellbeing",
};
/** Tie order when the failure story doesn't settle it. */
export const CAUSE_PRIORITY: Cause[] = ["wellbeing", "circumstances", "foundation_gap", "study_method", "teaching_environment", "fit"];

export function failureCause(fc: SubjectInput["fc"], storyCause?: Cause | null): { cause: Cause | null; secondary: Cause | null } {
  const scores = Object.entries(fc ?? {})
    .filter(([k, v]) => FC_CAUSE[k] && typeof v === "number")
    .map(([k, v]) => ({ cause: FC_CAUSE[k]!, v: v as number }));
  if (!scores.length) return { cause: null, secondary: null };
  const rank = (c: Cause) => (c === storyCause ? -1 : CAUSE_PRIORITY.indexOf(c));
  scores.sort((a, b) => b.v - a.v || rank(a.cause) - rank(b.cause));
  const second = scores[1];
  return { cause: scores[0]!.cause, secondary: second && second.v >= 4 ? second.cause : null };
}

// ---------- §1 Subject scores and quadrant ----------
export function scoreSubject(
  s: SubjectInput,
  riasec: Record<RiasecType, number>,
  signal: SubjectSignal | undefined,
  threshold: number | undefined,
): SubjectResult {
  const vec = subjectVectors.get(s.subject);
  const profile_fit = vec ? interestFit(riasec, vec) : 50;
  const fitVals = answered(s.se, SE_FIT);
  const compVals = answered(s.se, SE_COMP);
  const experience_fit = fitVals.length >= 3 ? scaleScore(fitVals) : null; // 80% of 4 items
  const competence = compVals.length === 2 ? scaleScore(compVals) : null;

  const attribution = signal?.attribution ?? null;
  const subject_fit = experience_fit === null
    ? profile_fit
    : Math.round(attribution === "teacher_class"
      ? 0.4 * experience_fit + 0.6 * profile_fit // don't blame the subject for the class
      : 0.65 * experience_fit + 0.35 * profile_fit);

  const { cause, secondary } = s.m11 < DEFAULT_ADEQUATE ? failureCause(s.fc, signal?.story_cause) : { cause: null, secondary: null };

  return classifySubject({
    subject: s.subject, m10: s.m10, m11: s.m11, subject_fit, cause, secondary_cause: secondary, attribution,
    sentiment: signal?.sentiment, threshold, experience_fit, competence, profile_fit,
  });
}

/**
 * Bands + borderline resolution + quadrant from a known subject fit. Used by scoreSubject and
 * directly by tests that start from the spec's worked-example fits.
 */
export function classifySubject(x: {
  subject: string; m10: number | null; m11: number; subject_fit: number;
  cause?: Cause | null; secondary_cause?: Cause | null; attribution?: SubjectResult["attribution"];
  sentiment?: SubjectSignal["sentiment"]; threshold?: number;
  experience_fit?: number | null; competence?: number | null; profile_fit?: number;
}): SubjectResult {
  const { band, trend } = performanceBand(x.m11, x.m10, x.threshold);
  const cause = x.m11 < DEFAULT_ADEQUATE ? x.cause ?? null : null;
  const raw = fitBand(x.subject_fit);
  // Borderline resolution — default to not switching: only a clear dislike of the subject itself,
  // or "fit" as the top failure cause, makes a borderline subject low.
  const dislikesSubjectItself = x.attribution === "subject_itself" && x.sentiment === "negative";
  const resolved: "high" | "low" = raw === "high" ? "high" : raw === "low" ? "low" : dislikesSubjectItself || cause === "fit" ? "low" : "high";
  const adequate = isAdequate(band);
  const quadrant: Quadrant = resolved === "high" ? (adequate ? "CONFIRM" : "RESCUE") : adequate ? "RETHINK" : "REDIRECT";
  return {
    subject: x.subject, m10: x.m10, m11: x.m11, trend, band, performance_adequate: adequate,
    experience_fit: x.experience_fit ?? null, competence: x.competence ?? null, profile_fit: x.profile_fit ?? x.subject_fit,
    subject_fit: x.subject_fit, fit_band_raw: raw, fit_band: resolved, quadrant,
    cause, secondary_cause: x.m11 < DEFAULT_ADEQUATE ? x.secondary_cause ?? null : null, attribution: x.attribution ?? null,
    is_language: isLanguage(x.subject), is_maths: isMaths(x.subject),
  };
}
