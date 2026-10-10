import { describe, it, expect } from "vitest";
import g9 from "@config/examples/lerato_g9_report.json";
import g11 from "@config/examples/lerato_g11_report.json";
import { ReportG9Schema, ReportG11Schema } from "@/lib/ai/schemas";
import { BANNED } from "@/lib/ai/reportLint";

/** The spec's gold-standard reports calibrate the linter: they must pass the banned-wording rules. */
describe("Lerato few-shot examples (spec 08)", () => {
  it("match the report schemas", () => {
    expect(ReportG9Schema.safeParse(g9).success).toBe(true);
    expect(ReportG11Schema.safeParse(g11).success).toBe(true);
  });
  it("contain no banned wording (the linter would not reject the gold standard)", () => {
    for (const ex of [g9, g11]) {
      const text = JSON.stringify(ex);
      const hits = BANNED.filter((b) => b.re.test(text)).map((b) => b.label);
      expect(hits).toEqual([]);
    }
  });
});
