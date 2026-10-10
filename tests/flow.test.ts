import { describe, it, expect } from "vitest";
import { buildItemPlan, seededRng, allPlanItems, SCORED_SECTIONS } from "@/lib/flow/itemPlan";
import { nextStage, descentFor, G9_STAGES, G11_STAGES } from "@/lib/flow/stages";
import { afterInterests, afterValues } from "@/lib/flow/microMoments";
import { questionBank } from "@/lib/config/questionBank";

describe("item plan (spec 02 §3)", () => {
  const plan = buildItemPlan(seededRng(42));
  it("keeps the fixed section order", () => {
    expect(plan.sections.map((s) => s.id)).toEqual(SCORED_SECTIONS.map((s) => s.id));
  });
  it("contains every scored item exactly once, plus AC1 and AC2", () => {
    const items = allPlanItems(plan);
    const expected = questionBank.scales.flatMap((s) => (s.items ?? []).map((i) => i.id));
    expect(items.filter((i) => !i.startsWith("AC")).sort()).toEqual([...expected].sort());
    expect(items.filter((i) => i === "AC1")).toHaveLength(1);
    expect(items.filter((i) => i === "AC2")).toHaveLength(1);
  });
  it("never randomises across sections", () => {
    for (const s of plan.sections) {
      if (s.id === "values") continue;
      const scales = SCORED_SECTIONS.find((x) => x.id === s.id)!.scales as readonly string[];
      const own = new Set(questionBank.scales.filter((q) => scales.includes(q.scale_id)).flatMap((q) => (q.items ?? []).map((i) => i.id)));
      expect(s.items.filter((i) => !i.startsWith("AC")).every((i) => own.has(i))).toBe(true);
    }
  });
  it("puts AC1 in the first half and AC2 in the second half, never in Context, across many seeds", () => {
    for (let seed = 1; seed < 300; seed++) {
      const p = buildItemPlan(seededRng(seed));
      const flat = p.sections.filter((s) => s.id !== "values" && s.id !== "context").flatMap((s) => s.items);
      const i1 = flat.indexOf("AC1"), i2 = flat.indexOf("AC2");
      expect(i1).toBeGreaterThanOrEqual(0);
      expect(i1).toBeLessThan(i2);
      const without = flat.length - 2;
      expect(i1).toBeLessThan(Math.floor(without / 2) + 1);
      expect(i2).toBeGreaterThanOrEqual(Math.floor(without / 2));
      expect(p.sections.find((s) => s.id === "context")!.items.some((i) => i.startsWith("AC"))).toBe(false);
    }
  });
  it("is reproducible from the seed and differs between seeds", () => {
    expect(buildItemPlan(seededRng(7))).toEqual(buildItemPlan(seededRng(7)));
    expect(buildItemPlan(seededRng(7))).not.toEqual(buildItemPlan(seededRng(8)));
  });
});

describe("stages", () => {
  it("walks G9 and G11 in order; G11 takes marks before failure cause", () => {
    expect(nextStage("G9_FOUNDATION", "scored")).toBe("snapshot");
    expect(G11_STAGES.indexOf("marks")).toBeLessThan(G11_STAGES.indexOf("failure_cause"));
    expect(nextStage("G11_CONFIRMATION", "report")).toBe("report");
    expect(() => nextStage("G9_FOUNDATION", "two_years")).toThrow();
    expect(G9_STAGES).not.toContain("two_years");
  });
  it("maps to the five-stage descent", () => {
    expect(descentFor("intake")).toBe("Surface");
    expect(descentFor("scored", "interests")).toBe("Wading in");
    expect(descentFor("scored", "values")).toBe("Deep water");
    expect(descentFor("snapshot")).toBe("The trench");
    expect(descentFor("conversation")).toBe("The floor");
  });
});

describe("micro-moments", () => {
  it("names the strongest pull, or says honestly that nothing stood out", () => {
    expect(afterInterests({ R: 90, I: 40, A: 30, S: 30, E: 20, C: 20 })).toMatch(/building and fixing/);
    expect(afterInterests({ R: 50, I: 45, A: 48, S: 40, E: 42, C: 44 })).toMatch(/common at your age/);
    expect(afterValues("V_BE")).toBe('You put "Looking after the people close to me" first. We\'ll come back to that.');
  });
});
