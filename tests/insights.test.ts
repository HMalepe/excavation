import { describe, it, expect } from "vitest";
import { buildScoreProfile } from "@/lib/scoring/profile";
import { buildInsights, pullBand, RIASEC } from "@/lib/insights/build";
import { varied } from "./fixtures/responses";
import { LERATO_MARKS_G9 } from "./fixtures/lerato";
import type { ScoringInput } from "@/lib/scoring/types";

const input = (over: Partial<ScoringInput> = {}): ScoringInput => ({
  learnerId: "00000000-0000-0000-0000-000000000001", touchpoint: "G9_FOUNDATION", likert: varied(),
  values: { top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] }, marks: { source: "school_import", subjects: LERATO_MARKS_G9 }, ...over,
});

describe("report insights", () => {
  const p = buildScoreProfile(input());
  const ins = buildInsights({ profile: p });
  it("ranks interests and names the pull in words", () => {
    expect(ins.interests).toHaveLength(6);
    expect(ins.interests.map((i) => i.level)).toEqual([...ins.interests.map((i) => i.level)].sort((a, b) => b - a));
    expect(pullBand(70)).toBe("Strong pull"); expect(pullBand(50)).toBe("Some pull"); expect(pullBand(20)).toBe("Light pull");
    expect(Object.keys(ins.radar).sort()).toEqual([...RIASEC].sort());
  });
  it("gives three headline stats and five layers, none of them a percentage or a rank among others", () => {
    expect(ins.stats).toHaveLength(3);
    expect(ins.layers.map((l) => l.name)).toEqual(["Surface", "Wading in", "Deep water", "The trench", "The floor"]);
    const text = JSON.stringify([ins.stats, ins.layers, ins.traits.map((t) => t.read), ins.habits]);
    expect(text).not.toMatch(/\d+\s*%/);
    expect(text).not.toMatch(/top \d+|percentile|than most|than other/i);
  });
  it("builds fits, a doors matrix and trait spectra", () => {
    expect(ins.fits.filter((f) => f.role === "fit")).toHaveLength(3);
    expect(ins.combos.length).toBeGreaterThanOrEqual(3);
    expect(ins.doors.length).toBeGreaterThan(0);
    for (const r of ins.doors) expect(r.cells).toHaveLength(ins.combos.length);
    expect(ins.traits).toHaveLength(5);
    for (const t of ins.traits) { expect(t.pos).toBeGreaterThanOrEqual(0); expect(t.pos).toBeLessThanOrEqual(100); }
  });
  it("has no checks or deltas for a first Grade 9 profile, and deltas for Grade 11", () => {
    expect(ins.marksVsChecks).toEqual([]); expect(ins.deltas).toBeNull();
    const g11 = buildScoreProfile(input({ touchpoint: "G11_CONFIRMATION" }));
    const a = buildInsights({ profile: g11, g9Profile: p });
    expect(a.touchpoint).toBe("G11"); expect(a.radarBefore).not.toBeNull();
  });
});
