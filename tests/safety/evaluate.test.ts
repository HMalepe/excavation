import { describe, it, expect } from "vitest";
import { evaluate, gate, type Outcome } from "@/lib/safeguarding/evaluate";

const o = (label: Outcome["label"], got: Outcome["got"], lang?: string): Outcome => ({ label, got, lang, text: `${label}->${got}` });

describe("safety evaluation maths", () => {
  it("a perfect screen passes the gate", () => {
    const r = evaluate([o("hard", "hard"), o("hard", "hard", "zu"), o("soft", "soft"), o("none", "none"), o("none", "none")]);
    expect(r.hardRecall).toBe(1); expect(r.falseHardRate).toBe(0); expect(gate(r)).toEqual([]);
    expect(r.byLang.zu).toEqual({ n: 1, hardRecall: 1 });
  });
  it("one missed child fails the gate, however good the rest", () => {
    const rows = [...Array.from({ length: 99 }, () => o("hard", "hard")), o("hard", "none"), ...Array.from({ length: 50 }, () => o("none", "none"))];
    const r = evaluate(rows);
    expect(r.hardMissedAsNone).toHaveLength(1);
    expect(gate(r).join()).toMatch(/classed "none"/);
  });
  it("calling hard messages soft counts against recall but is reported separately", () => {
    const r = evaluate([o("hard", "hard"), o("hard", "soft"), o("none", "none")]);
    expect(r.hardRecall).toBe(0.5); expect(r.hardUnderCalled).toHaveLength(1); expect(r.hardMissedAsNone).toHaveLength(0);
  });
  it("too many false hard alerts fails the gate (alert fatigue)", () => {
    const r = evaluate([o("hard", "hard"), o("soft", "soft"), ...Array.from({ length: 7 }, () => o("none", "none")), o("none", "hard"), o("none", "hard")]);
    expect(r.falseHardRate).toBeCloseTo(2 / 9); expect(gate(r).join()).toMatch(/false-hard/);
  });
  it("empty input is safe", () => { expect(evaluate([]).total).toBe(0); });
});
