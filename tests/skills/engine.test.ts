import { describe, it, expect } from "vitest";
import { CHECK_IDS, TASTER_IDS, checkById, itemIndex, tasterById, checksConfig } from "@/lib/skills/content";
import {
  liftGate, markLifts, optionOrder, planSkills, scoreCheck, scoreSkills, scoreTaster, servedItems, tasterAdjustment, tasterWatch,
  MAX_MARK_LIFT,
} from "@/lib/skills/engine";
import { subjectReadiness } from "@/lib/scoring/combinations";
import { readinessRules } from "@/lib/config/subjectMap";
import { mathsGate } from "@/lib/scoring/mathsGate";
import { buildScoreProfile } from "@/lib/scoring/profile";
import { seededRng } from "@/lib/flow/itemPlan";
import type { CheckId, TasterId } from "@/lib/skills/content";
import type { CheckInput, SkillsInput, TasterInput, TasterResult } from "@/lib/skills/types";
import type { ScoringInput } from "@/lib/scoring/types";
import { varied } from "../fixtures/responses";
import { LERATO_MARKS_G9 } from "../fixtures/lerato";

const plan = planSkills(seededRng(42));

/** Answer the served items of a check: the first `correct` right, the rest wrong. */
function answers(check: CheckId, correct: number, ms = 20_000, opts: { notSure?: number; skipLast?: number } = {}): CheckInput {
  const served = servedItems(plan, check);
  const a: CheckInput["answers"] = {};
  served.forEach((id, i) => {
    if (opts.skipLast && i >= served.length - opts.skipLast) return;
    const key = itemIndex.get(id)!.item.answer;
    if (i < correct) a[id] = { choice: key, ms };
    else if (opts.notSure && i < correct + opts.notSure) a[id] = { choice: -1, ms };
    else a[id] = { choice: (key + 1) % itemIndex.get(id)!.item.options.length, ms };
  });
  return { served, answers: a, skipped: false };
}

const taster = (over: Partial<TasterInput> = {}): TasterInput => ({ skipped: false, before: 3, after: 3, steps: [0, 0, 0], ms: 90_000, bonus: null, ...over });

describe("content", () => {
  it("every check unit has a CAPS topic, variants of equal length, and a valid key", () => {
    for (const c of CHECK_IDS) {
      for (const u of checkById(c).units) {
        const lens = new Set(u.variants.map((v) => v.items.length));
        expect(lens.size, `${u.id} variants differ in length`).toBe(1);
      }
    }
    expect(itemIndex.size).toBeGreaterThan(40);
  });
  it("serves 10 maths, 8 science and 8 reading items", () => {
    expect(servedItems(plan, "maths")).toHaveLength(10);
    expect(servedItems(plan, "science")).toHaveLength(8);
    expect(servedItems(plan, "reading")).toHaveLength(8);
  });
  it("answer keys are not all in the same position (authoring sanity)", () => {
    const keys = [...itemIndex.values()].map((x) => x.item.answer);
    expect(new Set(keys).size).toBeGreaterThanOrEqual(3);
  });
  it("is marked as draft until teachers sign it off", () => {
    expect(checksConfig.review_status).toMatch(/DRAFT/);
  });
  it("every taster links to real combinations and has a bonus task", async () => {
    const { combinationById } = await import("@/lib/config/subjectMap");
    for (const id of TASTER_IDS) {
      const t = tasterById.get(id)!;
      for (const l of t.links) expect(combinationById.has(l), `${id} → ${l}`).toBe(true);
      expect(t.bonus.steps.length).toBeGreaterThan(0);
    }
  });
});

describe("plan + option order", () => {
  it("plans one variant per unit and all six tasters", () => {
    expect(plan.checks.maths).toHaveLength(checkById("maths").units.length);
    expect([...plan.tasters].sort()).toEqual([...TASTER_IDS].sort());
  });
  it("option order is a deterministic permutation, different across learners", () => {
    const a = optionOrder("learner-a", "M1a", 4);
    expect([...a].sort()).toEqual([0, 1, 2, 3]);
    expect(optionOrder("learner-a", "M1a", 4)).toEqual(a);
    const distinct = new Set(Array.from({ length: 30 }, (_, i) => optionOrder(`l${i}`, "M1a", 4).join("")));
    expect(distinct.size).toBeGreaterThan(5);
  });
});

describe("scoreCheck", () => {
  it("scores % correct of items served", () => {
    const r = scoreCheck("maths", answers("maths", 7))!;
    expect(r).toMatchObject({ status: "done", n_served: 10, n_correct: 7, score: 70, reliable: true });
    expect(r.missed_topics).toHaveLength(3);
  });
  it("'not sure' counts as answered but not correct", () => {
    const r = scoreCheck("maths", answers("maths", 5, 20_000, { notSure: 3 }))!;
    expect(r).toMatchObject({ n_answered: 10, n_not_sure: 3, n_correct: 5, score: 50, reliable: true });
  });
  it("rushed answers are unreliable (can't lift anything)", () => {
    const r = scoreCheck("maths", answers("maths", 9, 2_000))!;
    expect(r.reliable).toBe(false);
    expect(r.reasons).toContain("rushed");
  });
  it("fewer than 70% answered is partial and unreliable", () => {
    const r = scoreCheck("maths", answers("maths", 6, 20_000, { skipLast: 4 }))!;
    expect(r).toMatchObject({ status: "partial", reliable: false, score: 60 });
    expect(r.reasons).toContain("too_few_answered");
  });
  it("a skipped check has no score and no effect", () => {
    expect(scoreCheck("science", { served: servedItems(plan, "science"), answers: {}, skipped: true })).toMatchObject({ status: "skipped", score: null, reliable: false });
    expect(scoreCheck("science", undefined)).toBeNull();
  });
});

describe("raise-only mark lifts", () => {
  const checks = (maths: number, science = 0) => ({
    maths: scoreCheck("maths", answers("maths", maths)),
    science: scoreCheck("science", answers("science", science)),
    reading: null,
  });
  it("lifts by at most 15 points, never above the check score", () => {
    const l = markLifts({ Mathematics: 38 }, checks(9));
    expect(l).toEqual([{ check: "maths", subject: "Mathematics", mark: 38, check_score: 90, effective: 38 + MAX_MARK_LIFT }]);
    expect(markLifts({ Mathematics: 55 }, checks(6))[0]?.effective).toBe(60);
  });
  it("never lowers: a weak check leaves a strong mark alone", () => {
    expect(markLifts({ Mathematics: 80 }, checks(3))).toEqual([]);
  });
  it("needs at least 60% and a reliable check", () => {
    expect(markLifts({ Mathematics: 30 }, checks(5))).toEqual([]);
  });
  it("never invents a missing mark", () => {
    expect(markLifts({}, checks(10))).toEqual([]);
  });
  it("readiness moves at most one tier", () => {
    // Physical Sciences needs NS 50 + Maths 50. Maths 35 → tier 20; lifted to 50 → capped at 60, not 100.
    const marks = { Mathematics: 35, "Natural Sciences": 70 };
    expect(subjectReadiness("Physical Sciences", marks, readinessRules).readiness).toBe(20);
    expect(subjectReadiness("Physical Sciences", marks, readinessRules, { Mathematics: 50 })).toMatchObject({ readiness: 60, lifted: true });
    // 45 → tier 60; lifted to 60 → 100
    expect(subjectReadiness("Physical Sciences", { ...marks, Mathematics: 45 }, readinessRules, { Mathematics: 60 }).readiness).toBe(100);
  });
});

describe("maths gate lift (one step, up only)", () => {
  const strong = scoreCheck("maths", answers("maths", 8));
  const ok = scoreCheck("maths", answers("maths", 6));
  it("Maths Lit safer → show both options when the check is ≥ 70%", () => {
    const { gate, lift } = liftGate(mathsGate(35, null, null), 35, strong);
    expect(gate.recommendation).toBe("both_options");
    expect(gate.reason).toMatch(/undersells/);
    expect(lift).toEqual({ from: "maths_lit_safer", to: "both_options", check_score: 80 });
  });
  it("never jumps two steps", () => {
    const { gate } = liftGate(mathsGate(30, null, null), 30, scoreCheck("maths", answers("maths", 10)));
    expect(gate.recommendation).toBe("both_options");
  });
  it("40–49% without growth signals → Mathematics with a support plan when the check is ≥ 60%", () => {
    const { gate } = liftGate(mathsGate(44, null, null), 44, ok);
    expect(gate.recommendation).toBe("mathematics_with_support");
    expect(gate.support_plan?.length).toBeGreaterThan(0);
  });
  it("leaves 'Mathematics' and weak checks alone", () => {
    expect(liftGate(mathsGate(70, null, null), 70, strong).lift).toBeNull();
    expect(liftGate(mathsGate(35, null, null), 35, ok).lift).toBeNull();
  });
});

describe("tasters", () => {
  it("pull = enjoyed it AND finished another one", () => {
    expect(scoreTaster("HEALTH", taster({ after: 5, bonus: { steps: [0, 0], after: 5 } }))).toMatchObject({ signal: "pull", bonus_taken: true, engagement: 100 });
  });
  it("warm / neutral / cold", () => {
    expect(scoreTaster("HEALTH", taster({ after: 4 }))?.signal).toBe("warm");
    expect(scoreTaster("HEALTH", taster({ after: 3 }))?.signal).toBe("neutral");
    expect(scoreTaster("HEALTH", taster({ after: 1 }))?.signal).toBe("cold");
  });
  it("records surprise in both directions", () => {
    expect(scoreTaster("BUSINESS", taster({ before: 1, after: 4 }))?.surprise).toBe("up");
    expect(scoreTaster("BUSINESS", taster({ before: 5, after: 2 }))?.surprise).toBe("down");
  });
  it("counts correctness but ignores taste questions (answer null)", () => {
    const r = scoreTaster("DESIGN", taster({ steps: [0, 0, 2] }))!;
    expect(r.scored_steps).toBe(2);
    expect(r.correct).toBe(2);
  });
  it("skipped tasters carry no signal", () => {
    expect(scoreTaster("CODE", taster({ skipped: true }))?.signal).toBeNull();
  });
  it("combination adjustment is the mean of linked signals, capped ±5", () => {
    const res = (sig: Partial<Record<TasterId, TasterResult["signal"]>>) =>
      Object.fromEntries(TASTER_IDS.map((t) => [t, sig[t] ? { signal: sig[t] } as TasterResult : null])) as Record<TasterId, TasterResult | null>;
    expect(tasterAdjustment("HEALTH_SCI", res({ HEALTH: "pull" })).delta).toBe(5);
    expect(tasterAdjustment("HEALTH_SCI", res({ HEALTH: "cold" })).delta).toBe(-3);
    // DIGITAL_MEDIA links CODE + DESIGN: pull (+5) and cold (−3) → +1
    expect(tasterAdjustment("DIGITAL_MEDIA", res({ CODE: "pull", DESIGN: "cold" })).delta).toBe(1);
    expect(tasterAdjustment("HUMANITIES", res({ HEALTH: "pull" }))).toEqual({ delta: 0, note: null });
  });
  it("behaviour that contradicts the questionnaire becomes a contradiction_watch item", () => {
    const t = Object.fromEntries(TASTER_IDS.map((x) => [x, null])) as Record<TasterId, TasterResult | null>;
    t.BUSINESS = scoreTaster("BUSINESS", taster({ after: 5, bonus: { steps: [0, 0], after: 4 } }));
    t.HEALTH = scoreTaster("HEALTH", taster({ after: 1 }));
    const w = tasterWatch(t, [{ id: "COMMERCE", interest_fit: 25 }, { id: "HEALTH_SCI", interest_fit: 80 }], ["HEALTH_SCI"]);
    expect(w.map((x) => x.id).sort()).toEqual(["TT_COLD_HEALTH", "TT_PULL_BUSINESS"]);
  });
});

describe("reading flags", () => {
  it("reading support + language note when reading and maths are both weak", () => {
    const s = scoreSkills({ checks: { reading: answers("reading", 3), maths: answers("maths", 3) }, tasters: {} }, { Mathematics: 42 });
    expect(s.reading_support).toBe(true);
    expect(s.language_note).toBe(true);
  });
  it("strong reader: no flags", () => {
    const s = scoreSkills({ checks: { reading: answers("reading", 7) }, tasters: {} }, { Mathematics: 42 });
    expect(s).toMatchObject({ reading_support: false, language_note: false });
  });
});

describe("buildScoreProfile with skills", () => {
  const base = (over: Partial<ScoringInput> = {}): ScoringInput => ({
    learnerId: "00000000-0000-0000-0000-000000000009",
    touchpoint: "G9_FOUNDATION",
    likert: varied(),
    values: { top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] },
    marks: { source: "school_import", subjects: { ...LERATO_MARKS_G9, Mathematics: 36, "Natural Sciences": 44 } },
    ...over,
  });
  const skills: SkillsInput = {
    checks: { maths: answers("maths", 8), science: answers("science", 6) },
    tasters: { HEALTH: taster({ after: 5, bonus: { steps: [0, 0], after: 5 } }) },
  };

  it("without skills, the profile is exactly the spec engine (skills: null)", () => {
    expect(buildScoreProfile(base()).skills).toBeNull();
  });
  it("lifts the gate, readiness and HEALTH_SCI — and never lowers any combination", () => {
    const without = buildScoreProfile(base());
    const withS = buildScoreProfile(base({ skills }));
    expect(without.maths_gate?.recommendation).toBe("maths_lit_safer");
    expect(withS.maths_gate?.recommendation).toBe("both_options");
    expect(withS.skills?.gate_lift).toMatchObject({ from: "maths_lit_safer", to: "both_options" });
    expect(withS.skills?.marks_undersell).toEqual(expect.arrayContaining(["Mathematics"]));
    const score = (p: typeof without, id: string) => p.ranking.find((r) => r.id === id)!;
    // Positive-only inputs: every combination's readiness and score are ≥ what marks alone gave.
    for (const r of without.ranking) {
      expect(score(withS, r.id).readiness).toBeGreaterThanOrEqual(r.readiness);
      expect(score(withS, r.id).score).toBeGreaterThanOrEqual(r.score);
    }
    expect(score(withS, "HEALTH_SCI").adjustments.join(" ")).toMatch(/\+5 taster \(HEALTH:pull\)/);
    expect(withS.marks.Mathematics).toBe(36); // the real mark is never overwritten
  });
  it("Grade 11 ignores skills", () => {
    expect(buildScoreProfile(base({ touchpoint: "G11_CONFIRMATION", skills })).skills).toBeNull();
  });
  it("is deterministic", () => {
    expect(buildScoreProfile(base({ skills }))).toEqual(buildScoreProfile(base({ skills })));
  });
});
