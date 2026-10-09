import { describe, it, expect } from "vitest";
import { decideVerdict, computeVerdict } from "@/lib/verdict/engine";
import { classifySubject, failureCause, performanceBand } from "@/lib/verdict/subjects";
import { matchPathways } from "@/lib/verdict/career";
import { genericAps, passProjection, apsPoints, institutionAps } from "@/lib/verdict/nsc";
import type { Cause, SubjectInput, VerdictInput, Attribution } from "@/lib/verdict/types";

type S = { subject: string; m11: number; fit: number; m10?: number | null; cause?: Cause; attribution?: Attribution; fc?: SubjectInput["fc"] };
const OPEN = { deadline: "2027-02-28", offeredSubjects: [], timetableAllows: {} };
const TODAY = "2027-02-10";
const LANGS: SubjectInput[] = [{ subject: "Home Language", m10: 65, m11: 65 }, { subject: "First Additional Language", m10: 60, m11: 60 }];

function run(rows: S[], over: Partial<VerdictInput> = {}) {
  const subjects = rows.map((r) => classifySubject({ subject: r.subject, m10: r.m10 ?? null, m11: r.m11, subject_fit: r.fit, cause: r.cause, attribution: r.attribution }));
  const input: VerdictInput = {
    today: TODAY,
    subjects: [...LANGS, ...rows.map((r) => ({ subject: r.subject, m10: r.m10 ?? null, m11: r.m11, fc: r.fc }))],
    riasec: { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 }, riasecCode: "ISA",
    stressSensitivity: 50, directionFlags: [], currentDirection: null,
    school: OPEN,
    ...over,
  };
  return decideVerdict(subjects, input);
}

describe("spec 06 §8 worked examples", () => {
  it("A — all high fit, all adequate → CONFIRM", () => {
    const v = run([{ subject: "Mathematics", m11: 64, fit: 72 }, { subject: "Physical Sciences", m11: 61, fit: 70 }, { subject: "Life Sciences", m11: 68, fit: 80 }]);
    expect(v.verdict).toBe("CONFIRM");
    expect(v.subjects.every((s) => s.quadrant === "CONFIRM")).toBe(true);
  });

  it("B — fits, Phys Sci at risk from study method → RESCUE with a study_method plan", () => {
    const v = run([
      { subject: "Mathematics", m11: 55, fit: 68 },
      { subject: "Physical Sciences", m11: 41, fit: 66, cause: "study_method" },
      { subject: "Life Sciences", m11: 74, fit: 82 },
    ]);
    expect(v.verdict).toBe("RESCUE");
    expect(v.subjects.find((s) => s.subject === "Physical Sciences")!.quadrant).toBe("RESCUE");
    expect(v.plans[0]).toMatchObject({ kind: "rescue", subject: "Physical Sciences", cause: "study_method" });
    expect(v.plans[0]!.actions).toHaveLength(3);
  });

  it("C — two electives low fit, marks adequate → RETHINK (competence trap)", () => {
    const v = run([
      { subject: "Mathematics", m11: 65, fit: 62 },
      { subject: "Accounting", m11: 71, fit: 32 },
      { subject: "Economics", m11: 66, fit: 40 },
      { subject: "Business Studies", m11: 69, fit: 58 },
    ]);
    expect(v.subjects.find((s) => s.subject === "Business Studies")).toMatchObject({ fit_band_raw: "borderline", fit_band: "high" });
    expect(v.verdict).toBe("RETHINK");
  });

  it("D — one subject in the REDIRECT quadrant, switch possible → ADJUST_ONE", () => {
    const v = run([
      { subject: "Mathematics", m11: 62, fit: 65 },
      { subject: "Physical Sciences", m11: 58, fit: 70 },
      { subject: "Engineering Graphics and Design", m11: 38, fit: 30, cause: "fit" },
    ]);
    expect(v.subjects.find((s) => s.subject === "Engineering Graphics and Design")!.quadrant).toBe("REDIRECT");
    expect(v.verdict).toBe("ADJUST_ONE");
    expect(v.switch_window).toEqual({ known: true, open: true, deadline: "2027-02-28" });
  });

  const E: S[] = [
    { subject: "Mathematics", m11: 34, fit: 25 },
    { subject: "Physical Sciences", m11: 31, fit: 28 },
    { subject: "Life Sciences", m11: 52, fit: 63 },
  ];
  it("E — Maths → Maths Lit plus Phys Sci: two changes → REDIRECT (wants psychology)", () => {
    const v = run(E, { currentDirection: "psychology" });
    expect(v.maths_verdict).toBe("REDIRECT_TO_MATHS_LIT");
    expect(v.verdict).toBe("REDIRECT");
    expect(v.rule_trace.some((t) => t.includes("ADJUST_ONE → REDIRECT"))).toBe(true);
    expect(v.career_check.pathways[0]).toMatchObject({ pathway: "HUMANITIES", status: "open" });
  });

  it("F — same as E, window closed → REDIRECT_AFTER_MATRIC", () => {
    const v = run(E, { currentDirection: "psychology", today: "2027-03-15" });
    expect(v.verdict).toBe("REDIRECT_AFTER_MATRIC");
    expect(v.switch_window).toMatchObject({ known: true, open: false });
  });

  it("G — same as B but FC6 = 5 and Stress Sensitivity 82 → RESCUE, wellbeing path first", () => {
    const fc = { FC1: 2, FC2: 5, FC3: 2, FC4: 1, FC5: 2, FC6: 5 };
    const cause = failureCause(fc).cause!;
    expect(cause).toBe("wellbeing"); // tie with study_method → wellbeing first
    const v = run([
      { subject: "Mathematics", m11: 55, fit: 68 },
      { subject: "Physical Sciences", m11: 41, fit: 66, cause, fc },
      { subject: "Life Sciences", m11: 74, fit: 82 },
    ], { stressSensitivity: 82 });
    expect(v.verdict).toBe("RESCUE");
    expect(v.wellbeing_path).toBe(true);
    expect(v.plans[0]).toMatchObject({ kind: "rescue", cause: "wellbeing" });
    expect(v.plans[0]!.actions[0]!.text).toMatch(/Talk to one adult you trust/);
  });

  it("Rule 5 — wellbeing flag holds a REDIRECT", () => {
    const v = run(E, { currentDirection: "psychology", signals: { wellbeing_flag: true } });
    expect(v.verdict).toBe("REDIRECT");
    expect(v.hold_redirect).toBe(true);
  });

  it("deadline not uploaded → verdict kept, window unknown, plan says 'ask'", () => {
    const v = run([
      { subject: "Mathematics", m11: 62, fit: 65 },
      { subject: "Physical Sciences", m11: 58, fit: 70 },
      { subject: "Engineering Graphics and Design", m11: 38, fit: 30, cause: "fit" },
    ], { school: { deadline: null, offeredSubjects: [], timetableAllows: {} } });
    expect(v.switch_window.known).toBe(false);
    expect(v.plans.at(-1)!.actions[0]!.text).toMatch(/Ask your LO teacher/);
  });

  it("school confirms the timetable can't absorb the change → RESCUE instead of ADJUST_ONE", () => {
    const v = run([
      { subject: "Mathematics", m11: 62, fit: 65 },
      { subject: "Physical Sciences", m11: 58, fit: 70 },
      { subject: "Engineering Graphics and Design", m11: 38, fit: 30, cause: "fit" },
    ], { school: { ...OPEN, timetableAllows: { "Engineering Graphics and Design": false } } });
    expect(v.verdict).toBe("RESCUE");
  });

  it("Maths at risk with an engineering target → RESCUE_REQUIRED (never Maths Lit)", () => {
    const v = run(E, { currentDirection: "I want to be a civil engineer" });
    expect(v.maths_verdict).toBe("RESCUE_REQUIRED");
    expect(v.career_check.pathways[0]).toMatchObject({ pathway: "ENGINEERING", status: "open" });
  });
});

describe("Lerato Grade 11 (spec 08 Part 3)", () => {
  const rows: S[] = [
    { subject: "Life Sciences", m10: 70, m11: 74, fit: 82 },
    { subject: "Mathematics", m10: 58, m11: 55, fit: 55 },
    { subject: "Geography", m10: 60, m11: 61, fit: 62 },
    { subject: "Physical Sciences", m10: 52, m11: 41, fit: 58, cause: "study_method", attribution: "performance", fc: { FC1: 2, FC2: 5, FC3: 1, FC4: 1, FC5: 2, FC6: 2 } },
  ];
  const v = run(rows, {
    subjects: [{ subject: "Home Language", m10: 68, m11: 68 }, { subject: "First Additional Language", m10: 64, m11: 64 },
      ...rows.map((r) => ({ subject: r.subject, m10: r.m10 ?? null, m11: r.m11, fc: r.fc }))],
    currentDirection: "Psychology. Or OT. I did a job-shadow day at an OT practice in the holidays.",
    stressSensitivity: 60,
  });

  it("RESCUE on Physical Sciences; Maths borderline treated high", () => {
    expect(v.verdict).toBe("RESCUE");
    const ps = v.subjects.find((s) => s.subject === "Physical Sciences")!;
    expect(ps).toMatchObject({ trend: -11, band: "at_risk", fit_band_raw: "borderline", fit_band: "high", quadrant: "RESCUE", cause: "study_method" });
    expect(v.subjects.find((s) => s.subject === "Mathematics")).toMatchObject({ band: "secure", fit_band: "high", quadrant: "CONFIRM" });
    expect(v.maths_verdict).toBe("CONFIRM");
  });
  it("Bachelor's pass projection and generic APS 28", () => {
    expect(v.pass_projection.current).toBe("bachelor");
    expect(v.aps_projection).toEqual({ method: "generic_best6_excl_LO", value: 28 });
  });
  it("career check: psychology and OT both open", () => {
    expect(v.career_check.pathways.map((p) => [p.pathway, p.status])).toEqual([["HUMANITIES", "open"], ["MED_HEALTH", "open"]]);
  });
});

describe("§1 bands", () => {
  it("performance bands at the default threshold", () => {
    expect(performanceBand(60, null).band).toBe("strong");
    expect(performanceBand(55, 66).band).toBe("at_risk_falling");
    expect(performanceBand(55, 60).band).toBe("secure");
    expect(performanceBand(45, 35).band).toBe("at_risk_rising");
    expect(performanceBand(45, 50).band).toBe("at_risk");
    expect(performanceBand(39, 39).band).toBe("failing");
  });
  it("school threshold override raises the bar", () => {
    expect(performanceBand(55, 55, 60).band).toBe("at_risk");
    expect(performanceBand(65, 65, 60).band).toBe("secure");
  });
  it("teacher/class attribution reweights fit toward the profile", async () => {
    const { scoreSubject } = await import("@/lib/verdict/subjects");
    const riasec = { R: 50, I: 90, A: 20, S: 40, E: 20, C: 40 };
    const se = { SE1: 1, SE2: 1, SE3: 1, SE4: 1, SE5: 4, SE6: 4 };
    const plain = scoreSubject({ subject: "Physical Sciences", m10: 60, m11: 60, se }, riasec, undefined, undefined);
    const tc = scoreSubject({ subject: "Physical Sciences", m10: 60, m11: 60, se }, riasec, { attribution: "teacher_class" }, undefined);
    expect(plain.experience_fit).toBe(0);
    expect(tc.subject_fit).toBeGreaterThan(plain.subject_fit);
    expect(tc.subject_fit).toBe(Math.round(0.6 * tc.profile_fit));
  });
});

describe("failure cause", () => {
  it("argmax with story tie-break, then priority order; secondary only if ≥ 4", () => {
    expect(failureCause({ FC1: 4, FC2: 4 })).toEqual({ cause: "foundation_gap", secondary: "study_method" });
    expect(failureCause({ FC1: 4, FC2: 4 }, "study_method")).toEqual({ cause: "study_method", secondary: "foundation_gap" });
    expect(failureCause({ FC5: 5, FC3: 3 })).toEqual({ cause: "fit", secondary: null });
    expect(failureCause(undefined)).toEqual({ cause: null, secondary: null });
  });
  it("fit as top cause pushes a borderline subject low", () => {
    expect(classifySubject({ subject: "History", m10: 45, m11: 45, subject_fit: 50, cause: "fit" }).fit_band).toBe("low");
  });
});

describe("§6 NSC + APS", () => {
  it("diploma → bachelor gaps (the spec's example sentence)", () => {
    const marks = [
      { subject: "Home Language", mark: 60 }, { subject: "First Additional Language", mark: 55 }, { subject: "Mathematical Literacy", mark: 58 },
      { subject: "Life Sciences", mark: 46 }, { subject: "Geography", mark: 48 }, { subject: "Tourism", mark: 70 },
    ];
    const p = passProjection(marks);
    expect(p.current).toBe("diploma");
    expect(p.next).toBe("bachelor");
    // Tourism isn't designated, so Life Sciences and Geography must reach 50.
    expect(p.gaps).toEqual([{ subject: "Geography", from: 48, to: 50 }, { subject: "Life Sciences", from: 46, to: 50 }]);
  });
  it("APS points on the 7-point scale", () => {
    expect([80, 79, 70, 69, 50, 49, 30, 29].map(apsPoints)).toEqual([7, 6, 6, 5, 4, 3, 2, 1]);
    expect(genericAps([{ subject: "Life Orientation", mark: 90 }, { subject: "History", mark: 80 }])).toBe(7);
  });
  it("institution-specific APS", () => {
    const marks = [{ subject: "Mathematics", mark: 70 }, { subject: "History", mark: 60 }];
    expect(institutionAps({ institution: "U", programme: "P", aps_method: { best: 6, multipliers: { Mathematics: 2 }, include_lo: true, lo_points_factor: 0.5 } }, marks, 80)).toBe(12 + 5 + 3.5);
  });
  it("not yet passing → next is NSC pass", () => {
    const p = passProjection([{ subject: "Home Language", mark: 35 }, { subject: "History", mark: 20 }, { subject: "Geography", mark: 25 },
      { subject: "Mathematical Literacy", mark: 30 }, { subject: "Life Sciences", mark: 30 }, { subject: "First Additional Language", mark: 45 }]);
    expect(p.current).toBeNull();
    expect(p.next).toBe("nsc");
  });
});

describe("career text matching", () => {
  it("maps directions and ignores everyday words", () => {
    expect(matchPathways("I think I want to be a software developer")).toEqual(["COMPSCI"]);
    expect(matchPathways("Psychology. Or OT.")).toEqual(["HUMANITIES", "MED_HEALTH"]);
    expect(matchPathways("chartered accountant")).toEqual(["ACTUARIAL_CA"]);
    expect(matchPathways("computer science")).toEqual(["COMPSCI"]); // nested 'science' dropped
    expect(matchPathways("not really sure, maybe something")).toEqual([]);
  });
  it("not sure → pathways from the RIASEC code + exploration actions", () => {
    const v = computeVerdict({
      today: TODAY, subjects: [...LANGS, { subject: "History", m10: 60, m11: 60 }],
      riasec: { R: 20, I: 80, A: 70, S: 75, E: 20, C: 20 }, riasecCode: "ISA", stressSensitivity: 40,
      directionFlags: [], currentDirection: "I still don't know", school: OPEN,
    });
    expect(v.career_check.not_sure).toBe(true);
    expect(v.career_check.pathways.map((p) => p.pathway)).toEqual(["SCIENCES", "HUMANITIES", "CREATIVE"]);
    expect(v.career_check.exploration_actions).toHaveLength(3);
  });
});
