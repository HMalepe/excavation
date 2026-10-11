/**
 * Everything the public demo shows. A FICTIONAL learner ("Lerato", the spec's worked example): no database,
 * no AI call, nothing stored. The report text is the spec's sample report; the profile is computed by the
 * real scoring engine from fixed answers, so the charts are the real charts.
 */
import g9 from "@config/examples/lerato_g9_report.json";
import { buildScoreProfile } from "@/lib/scoring/profile";
import { questionBank } from "@/lib/config/questionBank";
import type { ReportG9 } from "@/lib/ai/schemas";
import type { LikertResponses, ScoreProfile } from "@/lib/scoring/types";

import { DEMO_NAME } from "./script";
export { DEMO_NAME };
export const DEMO_ISSUED = "12 Mar 2026";
export const DEMO_REPORT = g9 as unknown as ReportG9;

const MARKS = {
  "Home Language": 66, "First Additional Language": 63, Mathematics: 58, "Natural Sciences": 71,
  "Social Sciences": 62, "Economic and Management Sciences": 64, Technology: 55, "Creative Arts": 74,
};

/** Fixed, varied answers (no randomness: the demo must look the same every time). */
function answers(seed = 7): LikertResponses {
  let x = seed;
  const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const r: LikertResponses = {};
  for (const s of questionBank.scales) for (const it of s.items ?? []) r[it.id] = s.scale_id === "CONTEXT" ? 1 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 5);
  r.AC1 = 4; r.AC2 = 2;
  return r;
}

const check = (score: number) => ({ status: "done", n_served: 10, n_answered: 10, n_correct: score / 10, n_not_sure: 0, score, median_ms: 9000, reliable: true, reasons: [], missed_topics: [] });
const taster = (b: number, a: number, signal: string) => ({ skipped: false, before: b, after: a, bonus_taken: a >= 5, bonus_after: null, correct: 2, scored_steps: 3, surprise: a - b >= 2 ? "up" : null, signal, engagement: 80 });

let cached: ScoreProfile | null = null;
export function demoProfile(): ScoreProfile {
  if (cached) return cached;
  const p = buildScoreProfile({
    learnerId: "00000000-0000-0000-0000-00000000demo", touchpoint: "G9_FOUNDATION", likert: answers(),
    values: { top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] }, marks: { source: "school_import", subjects: MARKS },
  });
  (p as unknown as { skills: unknown }).skills = {
    version: "demo", checks: { maths: check(80), science: check(60), reading: check(40) }, lifts: [], marks_undersell: ["Mathematics"], reading_support: true, language_note: false, gate_lift: null,
    tasters: { HEALTH: taster(3, 5, "pull"), CODE: taster(4, 2, "cold"), EVIDENCE: taster(3, 4, "warm"), BUSINESS: null, FIELD: taster(2, 4, "warm"), DESIGN: taster(3, 3, "neutral") },
  };
  return (cached = p);
}

