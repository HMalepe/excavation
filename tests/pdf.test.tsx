import { describe, it, expect } from "vitest";
import g9 from "@config/examples/lerato_g9_report.json";
import g11 from "@config/examples/lerato_g11_report.json";
import { G9Pdf, G11Pdf, TeacherPdf, ParentPdf, renderPdf } from "@/lib/pdf/documents";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";

describe("PDF export", () => {
  it("renders the Grade 9 and Grade 11 reports and both summaries", async () => {
    for (const doc of [
      <G9Pdf key="a" r={g9 as unknown as ReportG9} name="Lerato" />,
      <G11Pdf key="b" r={g11 as unknown as ReportG11} name="Lerato" />,
      <TeacherPdf key="c" t={{ learner_first_name: "Lerato", touchpoint: "G11", learns_best_when: "topics connect to people", strengths: ["a", "b", "c"], recommendation: "RESCUE", flags: ["Physical Sciences at risk"], one_thing_that_helps: "weekly check-in", quality_note: null }} />,
      <ParentPdf key="d" p={{ at_their_best: ["x", "y", "z"], recommendation_plain: "keep subjects", what_they_need_from_home: ["quiet 30 minutes"], questions_to_ask: ["q1", "q2"] }} name="Lerato" />,
    ]) {
      const buf = await renderPdf(doc);
      expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(buf.length).toBeGreaterThan(1500);
    }
  }, 30_000);
});
