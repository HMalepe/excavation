import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import g9 from "@config/examples/lerato_g9_report.json";
import g11 from "@config/examples/lerato_g11_report.json";
import { G9Pdf, G11Pdf, renderPdf } from "@/lib/pdf/documents";
import { buildScoreProfile } from "@/lib/scoring/profile";
import { computeDeltas } from "@/lib/scoring/deltas";
import { varied } from "./fixtures/responses";
import { LERATO_MARKS_G9 } from "./fixtures/lerato";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";
import type { ScoringInput, ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";

const input = (over: Partial<ScoringInput> = {}): ScoringInput => ({
  learnerId: "00000000-0000-0000-0000-000000000001", touchpoint: "G9_FOUNDATION", likert: varied(),
  values: { top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] }, marks: { source: "school_import", subjects: LERATO_MARKS_G9 }, ...over,
});
const task = (b: number, a: number, signal: string) => ({ skipped: false, before: b, after: a, bonus_taken: a >= 5, bonus_after: null, correct: 2, scored_steps: 3, surprise: a - b >= 2 ? "up" : null, signal, engagement: 80 });
const chk = (score: number) => ({ status: "done", n_served: 10, n_answered: 10, n_correct: score / 10, n_not_sure: 0, score, median_ms: 9000, reliable: true, reasons: [], missed_topics: [] });

describe("dashboard PDF", () => {
  const p9 = buildScoreProfile(input()) as ScoreProfile;
  (p9 as unknown as { skills: unknown }).skills = { version: "x", checks: { maths: chk(80), science: chk(60), reading: chk(40) }, lifts: [], marks_undersell: ["Mathematics"], reading_support: true, language_note: false, gate_lift: null, tasters: { HEALTH: task(3, 5, "pull"), CODE: task(4, 2, "cold"), EVIDENCE: task(3, 4, "warm"), BUSINESS: null, FIELD: task(2, 4, "warm"), DESIGN: task(3, 3, "neutral") } };
  const likert11 = varied(11);
  const p11b = buildScoreProfile(input({ touchpoint: "G11_CONFIRMATION", likert: likert11 })) as ScoreProfile;
  p11b.deltas = computeDeltas(p9, p11b);
  const verdict = { verdict: "RESCUE", hold_redirect: false, wellbeing_path: false, maths_verdict: "RESCUE", rule_trace: [], switch_window: { known: true, open: true, deadline: null }, career_check: { direction: null, not_sure: false, pathways: [], parent_led_low_fit: false, exploration_actions: [] },
    pass_projection: { current: "BACHELOR", current_label: "Bachelor pass", next: null, next_label: "Higher achievement", gaps: [] }, aps_projection: { method: "x", value: 31 }, plans: [], engine_version: "x",
    subjects: [["Mathematics", 64, 72, "CONFIRM"], ["Physical Sciences", 41, 66, "RESCUE"], ["Life Sciences", 74, 82, "CONFIRM"], ["Geography", 52, 30, "REDIRECT"], ["History", 68, 38, "RETHINK"]].map(([subject, m11, fit, q]) => ({ subject, m10: 60, m11, trend: 0, band: "secure", performance_adequate: true, experience_fit: 60, competence: 60, profile_fit: fit, subject_fit: fit, fit_band_raw: "high", fit_band: "high", quadrant: q, cause: null, secondary_cause: null, attribution: null, is_language: false, is_maths: false })) } as unknown as VerdictResult;

  it("renders the Grade 9 and Grade 11 reports with every chart", async () => {
    const a = await renderPdf(<G9Pdf r={g9 as unknown as ReportG9} name="Lerato" profile={p9} issued="12 Mar 2026" />);
    const b = await renderPdf(<G11Pdf r={g11 as unknown as ReportG11} name="Lerato" profile={p11b} g9Profile={p9} verdict={verdict} issued="12 Mar 2026" />);
    for (const buf of [a, b]) { expect(buf.subarray(0, 5).toString()).toBe("%PDF-"); expect(buf.length).toBeGreaterThan(20_000); }
    if (process.env.PDF_OUT) { writeFileSync(`${process.env.PDF_OUT}/g9.pdf`, a); writeFileSync(`${process.env.PDF_OUT}/g11.pdf`, b); }
  }, 60_000);
});
