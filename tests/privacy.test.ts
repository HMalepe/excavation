import { describe, it, expect } from "vitest";
import { retainUntil, retentionAction } from "@/lib/privacy/retention";

describe("retention rule (spec 09 §4)", () => {
  const d = (s: string) => new Date(s);
  it("keeps data until 31 December the year after the learner finishes Grade 12", () => {
    expect(retainUntil(9, d("2026-10-11"))).toBe("2030-12-31");   // Gr 9 in 2026 -> Gr 12 in 2029 -> keep to end of 2030
    expect(retainUntil(11, d("2026-10-11"))).toBe("2028-12-31");
    expect(retainUntil(12, d("2026-10-11"))).toBe("2027-12-31");
  });
  it("only acts after the date, and anonymises when research consent was given", () => {
    const row = (retain_until: string | null, consent_research: boolean) => ({ retain_until, consent_research });
    expect(retentionAction(row(null, false), d("2031-01-01"))).toBe("keep");
    expect(retentionAction(row("2030-12-31", false), d("2030-12-31"))).toBe("keep");
    expect(retentionAction(row("2030-12-31", false), d("2031-01-01"))).toBe("delete");
    expect(retentionAction(row("2030-12-31", true), d("2031-01-01"))).toBe("anonymise");
  });
});
