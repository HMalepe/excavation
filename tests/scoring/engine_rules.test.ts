import { describe, it, expect } from "vitest";
import {
  runCombinationEngine, interestFit, subjectReadiness, traitFit, weightsFor, cosine, vecOf, chooseThirdElective, NEAR_DUPLICATE,
} from "@/lib/scoring/combinations";
import { combinationById, subjectMap, readinessRules } from "@/lib/config/subjectMap";
import { mathsGate } from "@/lib/scoring/mathsGate";
import { doorStatus, doorsFor } from "@/lib/scoring/doors";
import { assessQuality, straightlinedSections } from "@/lib/scoring/quality";
import { normaliseSubject, expandSubjects } from "@/lib/scoring/subjects";
import { leratoContext } from "../fixtures/lerato";
import { uniform, varied } from "../fixtures/responses";

describe("§8.1 interest fit", () => {
  it("compares shape, not level: scaling the learner vector does not change fit", () => {
    const v = combinationById.get("HEALTH_SCI")!.riasec_vector;
    const a = interestFit({ R: 30, I: 78, A: 64, S: 70, E: 25, C: 33 }, v);
    const b = interestFit({ R: 40, I: 88, A: 74, S: 80, E: 35, C: 43 }, v); // +10 everywhere
    expect(a).toBe(b);
  });
  it("a perfectly flat learner scores 50 (no shape to match)", () => {
    expect(interestFit({ R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 }, combinationById.get("COMMERCE")!.riasec_vector)).toBe(50);
  });
});

describe("§8.2 readiness", () => {
  it("100 at threshold, 60 within 10, 20 below; missing mark = 60 + flag", () => {
    expect(subjectReadiness("Physical Sciences", { "Natural Sciences": 50, Mathematics: 50 }, readinessRules).readiness).toBe(100);
    expect(subjectReadiness("Physical Sciences", { "Natural Sciences": 41, Mathematics: 70 }, readinessRules)).toMatchObject({ readiness: 60, limiting: "Natural Sciences" });
    expect(subjectReadiness("Physical Sciences", { "Natural Sciences": 39, Mathematics: 70 }, readinessRules).readiness).toBe(20);
    expect(subjectReadiness("Physical Sciences", { Mathematics: 70 }, readinessRules)).toMatchObject({ readiness: 60, missing: true });
  });
  it("school overrides win over the defaults", () => {
    const ctx = leratoContext({ school: { readinessOverrides: { "Physical Sciences": { needs: { "Natural Sciences": 85 } } } } });
    const hs = runCombinationEngine(ctx).ranked.find((c) => c.id === "HEALTH_SCI")!;
    expect(hs.readiness_detail["Physical Sciences"]!.readiness).toBe(20); // 71 < 85 - 10
    expect(hs.readiness).toBeLessThan(100);
  });
  it("weights Mathematics 1.5×", () => {
    const ctx = leratoContext({ marks: { ...leratoContext().marks, Mathematics: 30 } });
    const hs = runCombinationEngine(ctx).ranked.find((c) => c.id === "HEALTH_SCI")!;
    // Maths 20 (w1.5); PS needs Maths 50 → 20; LS 100; Geo 100 → (30 + 20 + 100 + 100) / 4.5
    expect(hs.readiness).toBe(Math.round((1.5 * 20 + 20 + 100 + 100) / 4.5));
  });
  it("marks a missing Senior Phase mark as incomplete", () => {
    const m = { ...leratoContext().marks } as Record<string, number | undefined>;
    delete m["Creative Arts"];
    const vc = runCombinationEngine(leratoContext({ marks: m })).ranked.find((c) => c.id === "VISUAL_CREATIVE")!;
    expect(vc.flags).toContain("marks_incomplete");
  });
});

describe("§8.3 trait fit", () => {
  it("pulls toward the learner's level on the helpful traits, clamped 0..100", () => {
    expect(traitFit("HUMANITIES", { O: 72, A: 66 })).toBe(60); // 50 + 0.5 × 19 = 59.5 → 60
    expect(traitFit("VISUAL_CREATIVE", { O: 100 })).toBe(75);
    expect(traitFit("SERVICE", { A: 0, E: 0 })).toBe(25);
  });
});

describe("§8.4 weights and adjustments", () => {
  it("flat profile halves interest weight and gives it to readiness; excluded interests move it all", () => {
    expect(weightsFor({ flatProfile: true, interestsExcluded: false })).toEqual({ interest: 0.225, readiness: 0.575, trait: 0.2 });
    expect(weightsFor({ flatProfile: false, interestsExcluded: true })).toEqual({ interest: 0, readiness: 0.8, trait: 0.2 });
  });
  it("Q20 match needs ≥ 2 electives; the third elective follows the Q20 choice", () => {
    const one = runCombinationEngine(leratoContext({ conversation: { unpressuredSubjects: ["History"] } }));
    expect(one.ranked.find((c) => c.id === "HUMANITIES")!.adjustments).toEqual([]);
    const hum = combinationById.get("HUMANITIES")!;
    expect(chooseThirdElective(hum, new Set(["Religion Studies"]), new Set())).toBe("Religion Studies");
  });
  it("normalises Q20 and Q12 wording ('Life Sci', 'Accounting in EMS')", () => {
    const s = runCombinationEngine(leratoContext({ conversation: { unpressuredSubjects: ["life sci", "history", "Art"], competenceTrapSubject: "Accounting in EMS" } }));
    expect(s.fits.map((f) => f.id)).toEqual(["HUMANITIES", "VISUAL_CREATIVE", "HEALTH_SCI"]);
    expect(s.cautions[0]!.id).toBe("COMMERCE");
  });
  it("a trap that is only one of several third options is avoided, not penalised", () => {
    const s = runCombinationEngine(leratoContext({ conversation: { competenceTrapSubject: "Tourism" } }));
    const geo = s.ranked.find((c) => c.id === "GEO_ENV")!; // third options: Tourism, Agricultural Sciences
    expect(geo.subjects.electives).toContain("Agricultural Sciences");
    expect(geo.adjustments.some((a) => a.includes("competence_trap"))).toBe(false);
    const svc = s.ranked.find((c) => c.id === "SERVICE")!; // Tourism is core
    expect(svc.adjustments).toContain("-5 competence_trap (Q12: Tourism)");
  });
  it("a Maths trap never touches combinations — the maths gate carries it", () => {
    const s = runCombinationEngine(leratoContext({ conversation: { competenceTrapSubject: "Maths" } }));
    expect(s.ranked.every((c) => !c.adjustments.some((a) => a.includes("competence_trap")))).toBe(true);
  });
  it("contradiction resolved in favour of the conversation sets the trait aside, capped and logged", () => {
    const base = runCombinationEngine(leratoContext()).ranked.find((c) => c.id === "SERVICE")!;
    const s = runCombinationEngine(leratoContext({
      conversation: { ...leratoContext().conversation, contradictionResolutions: [{ watchId: "E_LOW_S_HIGH", learnerSaysTruer: "conversation" }] },
    }));
    const svc = s.ranked.find((c) => c.id === "SERVICE")!;
    // SERVICE uses A and E. E 35 → 50: trait fit 50+0.5×mean(16,−15)=50.25→50 vs 50+0.5×mean(16,0)=54 → +0.8
    expect(svc.adjustments).toContain("+0.8 contradiction_resolved (E_LOW_S_HIGH)");
    expect(svc.score - base.score).toBeCloseTo(0.8, 5);
    // 'score' resolutions change nothing
    const t = runCombinationEngine(leratoContext({ conversation: { contradictionResolutions: [{ watchId: "E_LOW_S_HIGH", learnerSaysTruer: "score" }] } }));
    expect(t.ranked.every((c) => !c.adjustments.some((a) => a.includes("contradiction")))).toBe(true);
  });
});

describe("§8.5 selection rules", () => {
  it("treats exactly two config pairs as near-duplicates (raw cosine > 0.95)", () => {
    const pairs: string[] = [];
    const cs = subjectMap.combinations;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      if (cosine(vecOf(cs[i]!.riasec_vector), vecOf(cs[j]!.riasec_vector)) > NEAR_DUPLICATE) pairs.push(`${cs[i]!.id}~${cs[j]!.id}`);
    }
    expect(pairs).toEqual(["HEALTH_SCI~SCI_IT", "HEALTH_SCI~AGRI"]);
  });
  it("family cap skips a 3rd ARTS option, then the safeguard swaps in the best STEM option", () => {
    const s = runCombinationEngine(leratoContext({ riasec: { R: 5, I: 20, A: 95, S: 80, E: 60, C: 5 } }));
    // Raw order: VISUAL_CREATIVE 90.5, PERFORMING 88.6, DIGITAL_MEDIA 74.2 (3rd ARTS → skipped),
    // HUMANITIES 71.8 → pick #3; best STEM GEO_ENV 64.0 is within 10 → replaces it.
    expect(s.ranked.slice(0, 4).map((c) => c.id)).toEqual(["VISUAL_CREATIVE", "PERFORMING", "DIGITAL_MEDIA", "HUMANITIES"]);
    expect(s.fits.map((f) => f.id)).toEqual(["VISUAL_CREATIVE", "PERFORMING", "GEO_ENV"]);
    expect(s.fits[2]!.label).toBe("keeps_most_doors_open");
  });
  it("skips near-duplicates and allows at most 2 per family", () => {
    // A strong Thinker/Builder with excellent marks: STEM dominates the raw ranking.
    const ctx = leratoContext({
      riasec: { R: 80, I: 92, A: 10, S: 20, E: 10, C: 40 },
      personality: { O: 80, C: 80, E: 40, A: 50, N: 40 },
      conversation: {},
    });
    const s = runCombinationEngine(ctx);
    expect(s.fits.filter((f) => f.family === "STEM").length).toBeLessThanOrEqual(2);
    for (let i = 0; i < s.fits.length; i++) for (let j = i + 1; j < s.fits.length; j++) {
      const a = vecOf(combinationById.get(s.fits[i]!.id)!.riasec_vector), b = vecOf(combinationById.get(s.fits[j]!.id)!.riasec_vector);
      expect(cosine(a, b)).toBeLessThanOrEqual(NEAR_DUPLICATE);
    }
  });
  it("doors-open safeguard does NOT fire when Natural Sciences < 50", () => {
    const s = runCombinationEngine(leratoContext({ marks: { ...leratoContext().marks, "Natural Sciences": 49 } }));
    expect(s.fits.some((f) => f.label === "keeps_most_doors_open")).toBe(false);
  });
  it("doors-open safeguard does NOT fire when the best STEM option is > 10 points behind pick #3", () => {
    const s = runCombinationEngine(leratoContext({
      riasec: { R: 0, I: 0, A: 100, S: 100, E: 100, C: 0 },
      personality: { O: 90, C: 30, E: 90, A: 90, N: 50 },
      conversation: {},
    }));
    // Pick #3 SERVICE 81.0; best STEM GEO_ENV 64.5 → gap 16.5
    expect(s.fits.map((f) => f.id)).toEqual(["PERFORMING", "VISUAL_CREATIVE", "SERVICE"]);
    expect(s.fits.some((f) => f.label)).toBe(false);
  });
  it("stretch caution = highest interest fit with readiness < 50, worded never as 'can't'", () => {
    const ctx = leratoContext({
      marks: { ...leratoContext().marks, "Natural Sciences": 30, Mathematics: 30 },
      conversation: {},
    });
    const s = runCombinationEngine(ctx);
    const stretch = s.cautions.find((c) => c.caution_type === "stretch");
    expect(stretch).toBeDefined();
    expect(stretch!.readiness).toBeLessThan(50);
    const eligible = s.ranked.filter((c) => c.readiness < 50 && !s.fits.some((f) => f.id === c.id));
    expect(stretch!.interest_fit).toBe(Math.max(...eligible.map((c) => c.interest_fit)));
  });
  it("fallback competence trap: interest fit < 40 with the largest readiness gap", () => {
    const s = runCombinationEngine(leratoContext({ conversation: {} }));
    const trap = s.cautions.find((c) => c.caution_type === "competence_trap")!;
    expect(trap.interest_fit).toBeLessThan(40);
    expect(trap.id).toBe("DIGITAL_MEDIA"); // fit 18, readiness 100 → largest gap
  });
  it("never invents a caution", () => {
    const ctx = leratoContext({ riasec: { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 }, conversation: {} });
    expect(runCombinationEngine(ctx).cautions).toHaveLength(0); // all fits 50, all readiness 100
  });
});

describe("§8.6 maths gate", () => {
  const ms = (s: number) => ({ score: s, band: "growth" as const });
  const st = (s: number) => ({ score: s, band: "moderate" as const });
  it("covers every band", () => {
    expect(mathsGate(50, null, null).recommendation).toBe("mathematics");
    expect(mathsGate(45, ms(60), st(50)).recommendation).toBe("mathematics_with_support");
    expect(mathsGate(45, ms(60), st(50)).support_plan).not.toBeNull();
    expect(mathsGate(45, ms(59), st(50)).recommendation).toBe("both_options");
    expect(mathsGate(40, ms(80), st(49)).recommendation).toBe("both_options");
    expect(mathsGate(39, ms(90), st(90)).recommendation).toBe("maths_lit_safer");
    expect(mathsGate(undefined, null, null).recommendation).toBe("both_options");
  });
  it("lists the doors Maths Lit closes, from config", () => {
    const g = mathsGate(30, null, null);
    expect(g.closed_by_maths_lit).toEqual(["MED_HEALTH", "ENGINEERING", "ACTUARIAL_CA", "COMPSCI", "SCIENCES", "BUILT_ENV"]);
    expect(g.partly_closed_by_maths_lit).toEqual(["COMMERCE", "EDUCATION", "NURSING", "TVET_TRADES"]);
  });
  it("'Either' combinations follow the gate", () => {
    const ctx = leratoContext({ marks: { ...leratoContext().marks, Mathematics: 30 }, gate: mathsGate(30, null, null) });
    expect(runCombinationEngine(ctx).ranked.find((c) => c.id === "HUMANITIES")!.subjects.maths).toBe("Mathematical Literacy");
  });
});

describe("§8.7 doors", () => {
  it("evaluates every pathway with an explicit rule (no unknown requirement text)", () => {
    expect(() => doorsFor(["Mathematics"])).not.toThrow();
  });
  it("Maths Lit closes, partly closes or leaves doors per config", () => {
    const d = doorsFor(["Mathematical Literacy", "History", "Geography", "Life Sciences"]);
    expect(d).toMatchObject({ MED_HEALTH: "closed", COMMERCE: "partly_open", HUMANITIES: "open", NURSING: "partly_open", CREATIVE: "partly_open" });
  });
  it("sciences need Maths and one science", () => {
    const sci = subjectMap.pathway_families.find((p) => p.id === "SCIENCES")!;
    expect(doorStatus(sci, ["Mathematics", "Life Sciences"])).toBe("open");
    expect(doorStatus(sci, ["Mathematics", "History"])).toBe("closed");
  });
});

describe("§7 quality", () => {
  it("ok for a varied, careful response set", () => {
    expect(assessQuality(varied()).status).toBe("ok");
  });
  it("1 attention failure = caution, 2 = invalid; a skipped check counts", () => {
    expect(assessQuality({ ...varied(), AC1: 3 }).status).toBe("caution");
    expect(assessQuality({ ...varied(), AC1: 3, AC2: null }).status).toBe("invalid");
  });
  it("flags straight-lined sections without changing status on its own", () => {
    const q = assessQuality(uniform(4));
    expect(q.straightlined_sections).toContain("interests");
    expect(q.straightlined_sections).not.toContain("direction"); // < 6 items
    expect(q.status).toBe("ok");
    expect(straightlinedSections(varied())).toEqual([]);
  });
  it("speeding when the median item time is < 1.2 s", () => {
    const meta = Object.fromEntries(Object.keys(varied()).map((id) => [id, { ms: 900 }]));
    expect(assessQuality(varied(), meta).flags).toContain("speeding");
    expect(assessQuality(varied(), meta).status).toBe("caution");
  });
  it("≥ 3 contradiction pairs answered 5/5 = caution", () => {
    const q = assessQuality({ ...varied(), PO1: 5, PO5: 5, PC2: 5, PC5: 5, PE1: 5, PE6: 5 });
    expect(q.contradiction_pairs).toHaveLength(3);
    expect(q.status).toBe("caution");
  });
});

describe("subject normalisation", () => {
  it("maps common learner wording to FET names", () => {
    expect(normaliseSubject("Phys Sci")).toBe("Physical Sciences");
    expect(normaliseSubject("maths lit")).toBe("Mathematical Literacy");
    expect(normaliseSubject("I'd do Biology")).toBe("Life Sciences");
    expect(normaliseSubject("CAT")).toBe("Computer Applications Technology");
    expect(normaliseSubject("smart stuff")).toBeNull();
    expect(expandSubjects("EMS")).toEqual(["Accounting", "Economics", "Business Studies"]);
  });
});
