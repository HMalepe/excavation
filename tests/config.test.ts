import { describe, it, expect } from "vitest";
import { questionBank, itemById, valueCards } from "@/lib/config/questionBank";
import { subjectMap, readinessRules, COMBINATION_FAMILY, subjectVectors } from "@/lib/config/subjectMap";

describe("question bank", () => {
  it("has 114 scored items + 2 attention checks = 116 (spec 02 §2), with 10 value cards", () => {
    const likert = questionBank.scales.flatMap((s) => s.items ?? []).length;
    // 30 personality + 36 interests + 8 motivation + 6 mindset + 10 identity + 3 DS + 8 study + 3 context = 104 items,
    // + 10 value cards = 114, + 2 ACs = 116.
    expect(likert).toBe(104);
    expect(valueCards).toHaveLength(10);
    expect(likert + valueCards.length + questionBank.attention_checks.length).toBe(116);
  });
  it("has unique item ids", () => {
    const ids = questionBank.scales.flatMap((s) => (s.items ?? []).map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(itemById.get("ID10")?.reverse).toBe(true);
  });
});

describe("subject map", () => {
  it("every combination subject has a vector and readiness rule, and a family", () => {
    for (const c of subjectMap.combinations) {
      expect(COMBINATION_FAMILY[c.id]).toBeDefined();
      for (const s of [...c.core_electives, ...c.third_elective_options]) {
        expect(subjectVectors.has(s), s).toBe(true);
        expect(readinessRules[s], s).toBeDefined();
      }
    }
  });
});
