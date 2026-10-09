import { describe, it, expect } from "vitest";
import { buildScoreProfile } from "@/lib/scoring/profile";
import { computeDeltas, deltaItem, identityFraming, rci } from "@/lib/scoring/deltas";
import { scoredLayerSoftSignals, shouldShowSoftInterstitial } from "@/lib/safeguarding/scoredLayer";
import type { ScoreProfile, ScoringInput } from "@/lib/scoring/types";
import { varied, uniform } from "../fixtures/responses";
import { LERATO_MARKS_G9 } from "../fixtures/lerato";

const input = (over: Partial<ScoringInput> = {}): ScoringInput => ({
  learnerId: "00000000-0000-0000-0000-000000000001",
  touchpoint: "G9_FOUNDATION",
  likert: varied(),
  values: { top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] },
  marks: { source: "school_import", subjects: LERATO_MARKS_G9 },
  ...over,
});

describe("buildScoreProfile (spec 04 §11)", () => {
  it("is deterministic: same answers → identical profile", () => {
    expect(buildScoreProfile(input())).toEqual(buildScoreProfile(input()));
  });
  it("produces every section of the ScoreProfile", () => {
    const p = buildScoreProfile(input());
    expect(p).toMatchObject({ touchpoint: "G9_FOUNDATION", instrument_version: "1.0.0", norm_state: "pre_norm", deltas: null });
    expect(p.quality.status).toBe("ok");
    expect(Object.keys(p.personality.bands).sort()).toEqual(["A", "C", "E", "N", "O"]);
    expect(p.interests.code).toHaveLength(3);
    expect(p.values!.top3).toEqual(["V_BE", "V_SD", "V_AC"]);
    expect(p.motivation).not.toBeNull();
    expect(p.identity.status).not.toBeNull();
    expect(p.combinations.filter((c) => c.role?.startsWith("fit"))).toHaveLength(3);
    expect(p.ranking).toHaveLength(13);
    expect(p.maths_gate.recommendation).toBe("mathematics");
    expect(p.school_offers_known).toBe(false);
    expect(JSON.parse(JSON.stringify(p))).toEqual(p); // plain JSON, storable in jsonb
  });
  it("excludes straight-lined interests from recommendations (weight moves to readiness)", () => {
    const p = buildScoreProfile(input({ likert: uniform(4) }));
    expect(p.interests.excluded_from_recommendations).toBe(true);
    expect(p.quality.flags).toContain("straightlining_interests");
  });
  it("records self-reported estimates", () => {
    const p = buildScoreProfile(input({ marks: { source: "self_report", subjects: LERATO_MARKS_G9, estimates: ["Mathematics"] } }));
    expect(p.marks).toMatchObject({ source: "self_report", estimates: ["Mathematics"], Mathematics: 58 });
  });
});

describe("§9 deltas", () => {
  it("|Δ| ≥ 15 = moved, with direction", () => {
    expect(deltaItem(70, 85)).toMatchObject({ delta: 15, moved: true, direction: "up" });
    expect(deltaItem(44, 52)).toMatchObject({ delta: 8, moved: false });
    expect(deltaItem(null, 52)).toMatchObject({ delta: null, moved: false });
  });
  it("Lerato G9 → G11 (spec 08 Part 3)", () => {
    const g9 = {
      personality: { O: 72, C: 48, E: 35, A: 66, N: 61 },
      interests: { scores: { R: 30, I: 78, A: 64, S: 70, E: 25, C: 33 }, code: "ISA" },
      identity: { status: "foreclosure" },
      values: { top3: ["V_BE", "V_SD", "V_AC"] },
      motivation: { score: 73 }, mindset: { score: 67 }, study: { score: 44 },
    } as unknown as ScoreProfile;
    const g11 = {
      personality: { O: 72, C: 63, E: 38, A: 68, N: 60 },
      interests: { scores: { R: 30, I: 76, A: 70, S: 85, E: 25, C: 33 }, code: "SIA" },
      identity: { status: "moratorium" },
      values: { top3: ["V_BE", "V_SD", "V_UN"] },
      motivation: { score: 75 }, mindset: { score: 70 }, study: { score: 52 },
    } as unknown as ScoreProfile;
    const d = computeDeltas(g9, g11);
    expect(d.interests.S).toMatchObject({ delta: 15, moved: true });
    expect(d.code).toMatchObject({ from: "ISA", to: "SIA", first_letter_changed: true, shared_letters: 3, shifted_a_lot: false });
    expect(d.personality.C).toMatchObject({ delta: 15, moved: true, direction: "up" });
    expect(d.identity.framing).toBe("You started questioning a plan you'd accepted. That's growth, even if it feels messy.");
    expect(d.study).toMatchObject({ delta: 8, moved: false });
    expect(d.values).toMatchObject({ shared_top3: 2, moved: false });
  });
  it("frames identity transitions", () => {
    expect(identityFraming("foreclosure", "foreclosure")).toMatch(/hasn't been tested/);
    expect(identityFraming("achievement", "diffusion")).toMatch(/Gentle check-in/);
    expect(identityFraming("achievement", "achievement")).toBeNull();
  });
  it("RCI helper for after the pilot", () => {
    expect(rci(15, 15, 0.8)).toBeCloseTo(1 / Math.sqrt(0.4), 5);
  });
});

describe("scored-layer soft safeguarding trigger (spec 09 §5.1)", () => {
  it("needs two signals", () => {
    const one = scoredLayerSoftSignals({ stressSensitivity: 85, likert: {}, answeredOrder: [] });
    expect(one).toEqual(["stress_sensitivity_80"]);
    expect(shouldShowSoftInterstitial(one)).toBe(false);
    const two = scoredLayerSoftSignals({ stressSensitivity: 85, likert: {}, answeredOrder: [], restartedInSession: true });
    expect(shouldShowSoftInterstitial(two)).toBe(true);
  });
  it("detects 4 consecutive maximum-distress answers in the order shown", () => {
    const likert = { PN1: 5, PN2: 5, PO1: 3, PN3: 5, PN5: 1, PN4: 2 };
    expect(scoredLayerSoftSignals({ stressSensitivity: 0, likert, answeredOrder: ["PN1", "PN2", "PO1", "PN3", "PN5"] }))
      .toContain("consecutive_max_distress"); // non-distress items don't break the run
    expect(scoredLayerSoftSignals({ stressSensitivity: 0, likert, answeredOrder: ["PN1", "PN2", "PN4", "PN3", "PN5"] }))
      .not.toContain("consecutive_max_distress");
  });
  it("detects FC6 = 5 and extreme hesitation", () => {
    const meta = { a: { ms: 2000 }, b: { ms: 2000 }, c: { ms: 2000 }, d: { ms: 2000 }, e: { ms: 9000 }, f: { ms: 9000 }, g: { ms: 9000 } };
    const s = scoredLayerSoftSignals({ stressSensitivity: 0, likert: { "FC6:Physical Sciences": 5 }, answeredOrder: [], meta });
    expect(s).toEqual(["fc6_max", "extreme_hesitation"]);
  });
});
