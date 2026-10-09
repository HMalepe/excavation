import { describe, it, expect } from "vitest";
import { runCombinationEngine } from "@/lib/scoring/combinations";
import { leratoContext } from "../fixtures/lerato";

describe("Lerato Grade 9 fixture (spec 08 Part 1, spec 10 Step 2)", () => {
  const sel = runCombinationEngine(leratoContext());
  const fit = (i: number) => sel.fits[i]!;

  it("fits = HUMANITIES ≈91.2, VISUAL_CREATIVE ≈81.9, HEALTH_SCI ≈78.8 (keeps_most_doors_open)", () => {
    expect(sel.fits.map((f) => f.id)).toEqual(["HUMANITIES", "VISUAL_CREATIVE", "HEALTH_SCI"]);
    expect(fit(0).score).toBeCloseTo(91.2, 0);
    expect(Math.abs(fit(0).score - 91.2)).toBeLessThanOrEqual(0.1);
    expect(fit(1).score).toBe(81.9);
    // 0.45×73 + 0.35×100 + 0.20×55 = 78.85 exactly; the spec writes "≈78.8", we round half up to 78.9.
    expect(0.45 * fit(2).interest_fit + 0.35 * fit(2).readiness + 0.2 * fit(2).trait_fit).toBeCloseTo(78.85, 9);
    expect(fit(2).score).toBe(78.9);
    expect(fit(2).label).toBe("keeps_most_doors_open");
    expect(sel.fits.map((f) => f.role)).toEqual(["fit_1", "fit_2", "fit_3"]);
  });

  it("matches the component values in the spec's ScoreProfile example (spec 04 §11)", () => {
    expect(fit(0)).toMatchObject({ interest_fit: 87, readiness: 100, trait_fit: 60, adjustments: ["+5 unpressured_match"] });
    expect(fit(2)).toMatchObject({ interest_fit: 73, readiness: 100, trait_fit: 55 });
    expect(fit(0).doors).toMatchObject({ HUMANITIES: "open", LAW: "open", MED_HEALTH: "closed" });
    expect(fit(2).doors).toMatchObject({ MED_HEALTH: "open", ENGINEERING: "open", SCIENCES: "open" });
  });

  it("the safeguard replaced PERFORMING, which outscored HEALTH_SCI on raw score", () => {
    const perf = sel.ranked.find((c) => c.id === "PERFORMING")!;
    expect(perf.score).toBeGreaterThan(fit(2).score);
    expect(perf.score - fit(2).score).toBeLessThanOrEqual(10);
  });

  it("HEALTH_SCI beats SCI_IT on the tie-break chain (equal score)", () => {
    const sci = sel.ranked.find((c) => c.id === "SCI_IT")!;
    expect(sci.score).toBe(fit(2).score);
    expect(sel.ranked.findIndex((c) => c.id === "HEALTH_SCI")).toBeLessThan(sel.ranked.findIndex((c) => c.id === "SCI_IT"));
  });

  it("caution = COMMERCE competence_trap (score 50.5); no stretch caution qualifies", () => {
    expect(sel.cautions).toHaveLength(1);
    expect(sel.cautions[0]).toMatchObject({
      id: "COMMERCE", caution_type: "competence_trap", role: "caution",
      interest_fit: 25, readiness: 100, trait_fit: 46, score: 50.5,
      adjustments: ["-5 competence_trap (Q12: Accounting)"],
    });
  });

  it("maths gate = mathematics (G9 Maths 58%)", () => {
    const ctx = leratoContext();
    expect(ctx.gate).toMatchObject({ recommendation: "mathematics", reason: "G9 Maths 58%" });
  });

  it("produces the contradiction_watch from spec 07 §2", () => {
    expect(leratoContext().watch.map((w) => w.id)).toEqual(["E_LOW_S_HIGH"]);
  });

  it("the school says which combinations it offers → only those are recommended", () => {
    const s = runCombinationEngine(leratoContext({ school: { offeredCombinationIds: ["HEALTH_SCI", "COMMERCE", "GEO_ENV", "SERVICE"] } }));
    expect(s.offersKnown).toBe(true);
    expect(s.fits.every((f) => ["HEALTH_SCI", "COMMERCE", "GEO_ENV", "SERVICE"].includes(f.id))).toBe(true);
    expect(sel.offersKnown).toBe(false);
  });
});
