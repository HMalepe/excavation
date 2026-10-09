import { describe, it, expect } from "vitest";
import { itemValue, scaleScore, scoreScale, minAnswered } from "@/lib/scoring/items";
import {
  scoreInterests, scoreValues, scoreMotivation, scoreMindset, scoreStudy, scoreIdentity, scorePersonality,
  personalityBand, identityStatus, percentileOf, readContext,
} from "@/lib/scoring/scales";
import { uniform } from "../fixtures/responses";

describe("§1 item and scale scoring", () => {
  it("reverse-keys around 3", () => {
    expect(itemValue(5, true)).toBe(1);
    expect(itemValue(2, true)).toBe(4);
    expect(itemValue(4, false)).toBe(4);
  });
  it("maps the 1..5 mean onto 0..100", () => {
    expect(scaleScore([1, 1, 1])).toBe(0);
    expect(scaleScore([5, 5])).toBe(100);
    expect(scaleScore([3])).toBe(50);
    expect(scaleScore([4, 4, 4, 4, 3, 3])).toBe(67);
  });
  it("needs 5 of 6 items, or 80% for other lengths", () => {
    expect(minAnswered(6)).toBe(5);
    expect(minAnswered(8)).toBe(7);
    expect(minAnswered(5)).toBe(4);
    expect(minAnswered(3)).toBe(3);
    const r = { PO1: 5, PO2: 5, PO3: 5, PO4: 5, PO5: 1 };
    expect(scoreScale("P_O", r)).toBe(100); // 5 answered, mean of answered only
    expect(scoreScale("P_O", { PO1: 5, PO2: 5, PO3: 5, PO4: 5 })).toBeNull();
  });
  it("ignores out-of-range raw values", () => {
    expect(scoreScale("P_O", { PO1: 9, PO2: 0, PO3: 5, PO4: 5, PO5: 1, PO6: 1 })).toBeNull();
  });
});

describe("§2 personality", () => {
  it("scores reverse-keyed domains and applies pre-norm bands", () => {
    const p = scorePersonality(uniform(3, { PO1: 5, PO2: 5, PO3: 5, PO4: 5, PO5: 1, PO6: 1 }));
    expect(p.O).toBe(100);
    expect(p.bands.O).toBe("high");
    expect(p.C).toBe(50);
    expect(p.bands.C).toBe("middle");
    expect(personalityBand(34, "P_O")).toBe("low");
    expect(personalityBand(35, "P_O")).toBe("middle");
    expect(personalityBand(65, "P_O")).toBe("middle");
    expect(personalityBand(66, "P_O")).toBe("high");
  });
  it("uses percentile bands (bottom 30 / middle 40 / top 30) once normed", () => {
    const cuts = Array.from({ length: 101 }, (_, i) => i); // identity mapping
    const norms = { normState: "emerging_norm" as const, percentiles: { P_O: cuts } };
    expect(percentileOf(29, cuts)).toBe(29);
    expect(personalityBand(29, "P_O", norms)).toBe("low");
    expect(personalityBand(30, "P_O", norms)).toBe("middle");
    expect(personalityBand(70, "P_O", norms)).toBe("high");
  });
});

describe("§3 interests", () => {
  const withInterests = (vals: Record<string, number>) => {
    const r = uniform(3);
    for (const [t, v] of Object.entries(vals)) for (let i = 1; i <= 6; i++) r[`I${t}${i}`] = v;
    return r;
  };
  it("builds the Holland code, elevation, differentiation and consistency", () => {
    const i = scoreInterests(withInterests({ R: 1, I: 5, A: 4, S: 4, E: 2, C: 2 }));
    expect(i.scores).toEqual({ R: 0, I: 100, A: 75, S: 75, E: 25, C: 25 });
    expect(i.code).toBe("IAS"); // A/S tie on score and loves → RIASEC order
    expect(i.elevation).toBe(100);
    expect(i.differentiation).toBe(100);
    expect(i.consistency).toBe("high"); // I and A are adjacent
    expect(i.flat_profile).toBe(false);
  });
  it("breaks score ties by count of 'Love' answers", () => {
    const r = withInterests({ R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 });
    Object.assign(r, { IS1: 5, IS2: 1 }); // S keeps mean 3 but has one "Love"
    expect(scoreInterests(r).code.startsWith("S")).toBe(true);
  });
  it("labels flat profiles and no-strong-pull", () => {
    const i = scoreInterests(withInterests({ R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 }));
    expect(i.flat_profile).toBe(true);
    expect(i.no_strong_pull).toBe(true);
  });
  it("opposite types on the hexagon → low consistency", () => {
    expect(scoreInterests(withInterests({ R: 5, S: 4, I: 1, A: 1, E: 1, C: 1 })).consistency).toBe("low");
  });
});

describe("§4 values", () => {
  it("scores 3/2/1 for the top three and −1 for each bottom card (formula, not the spec example)", () => {
    const v = scoreValues({ top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] })!;
    expect(v.higher_order).toEqual({ openness_to_change: 2, self_enhancement: 0, conservation: -1, self_transcendence: 3 });
    expect(v.dominant_cluster).toBe("self_transcendence");
  });
  it("rejects a sort that reuses a card", () => {
    expect(scoreValues({ top3: ["V_BE", "V_BE", "V_AC"], bottom2: ["V_PO", "V_CO"] })).toBeNull();
  });
});

describe("§5 motivation (RAI)", () => {
  it("computes RAI and the learner-facing label", () => {
    const r = { M1: 5, M2: 5, M3: 4, M4: 4, M5: 2, M6: 2, M7: 1, M8: 1 };
    const m = scoreMotivation(r)!;
    expect(m.rai).toBe(2 * 5 + 4 - 2 - 2 * 1);
    expect(m.score).toBe(Math.round(((10 + 12) / 24) * 100));
    expect(m.label).toBe("self_driven");
    expect(scoreMotivation({ M1: 1, M2: 1, M3: 1, M4: 1, M5: 5, M6: 5, M7: 5, M8: 5 })!.label).toBe("pressure_driven");
    expect(scoreMotivation({ M1: 3, M2: 3, M3: 3, M4: 3, M5: 3, M6: 3, M7: 3, M8: 3 })!.label).toBe("mixed");
  });
  it("needs 7 of 8 answers", () => {
    expect(scoreMotivation({ M1: 3, M2: 3, M3: 3, M4: 3, M5: 3, M6: 3 })).toBeNull();
  });
});

describe("§6 mindset, study, identity", () => {
  it("bands mindset and study", () => {
    expect(scoreMindset(uniform(3))!.band).toBe("moderate");
    expect(scoreMindset(uniform(3, { G1: 5, G2: 5, G3: 5, G4: 1, G5: 1, G6: 1 }))!.band).toBe("growth");
    expect(scoreStudy(uniform(3, { SR1: 1, SR2: 1, SR3: 1, SR4: 1, SR5: 1, SR6: 5, SR7: 5, SR8: 5 }))!.band).toBe("low");
  });
  it("classifies identity status at the pre-norm cut of 50", () => {
    expect(identityStatus(50, 50, { exploration: 50, commitment: 50 })).toBe("achievement");
    expect(identityStatus(60, 40, { exploration: 50, commitment: 50 })).toBe("moratorium");
    expect(identityStatus(38, 70, { exploration: 50, commitment: 50 })).toBe("foreclosure");
    expect(identityStatus(10, 10, { exploration: 50, commitment: 50 })).toBe("diffusion");
  });
  it("reverse-keys ID10 and sets direction flags at ≥ 4", () => {
    const r = uniform(3, { ID1: 2, ID2: 2, ID3: 2, ID4: 2, ID5: 2, ID6: 5, ID7: 5, ID8: 5, ID9: 5, ID10: 1, DS1: 4, DS2: 3, DS3: 5 });
    const id = scoreIdentity(r);
    expect(id.commitment).toBe(100);
    expect(id.status).toBe("foreclosure");
    expect(id.direction_flags).toEqual(["parent_led", "status_led"]);
  });
  it("uses norm medians as cut-offs once normed", () => {
    const r = uniform(3); // exploration 50, commitment 50
    expect(scoreIdentity(r, { normState: "emerging_norm", identityMedians: { exploration: 55, commitment: 45 } }).status).toBe("foreclosure");
  });
  it("reads the optional context items without scoring them", () => {
    expect(readContext({ CX1: 2, CX2: 3 })).toEqual({ quiet_place: "sometimes", data_access: "yes", home_responsibilities: null });
  });
});
