import { describe, it, expect } from "vitest";
import { distribution, cohortStats, teachingFitBySubject, type CohortLearner } from "@/lib/cohort/aggregate";
import { composeAlert, schoolHoursElapsed } from "@/lib/safeguarding/alert";

describe("cohort suppression (min group 10)", () => {
  it("suppresses the whole distribution under 10", () => {
    expect(distribution({ a: 5, b: 4 })).toEqual({ total: null, cells: [], suppressed: true });
  });
  it("suppresses small cells and applies complementary suppression", () => {
    const d = distribution({ I: 20, S: 15, A: 4 });
    expect(d.total).toBe(39);
    expect(d.cells.find((c) => c.label === "A")).toMatchObject({ count: null, suppressed: true });
    // with only A hidden, A = 39 − 20 − 15; so the next smallest (S) is hidden too
    expect(d.cells.find((c) => c.label === "S")).toMatchObject({ count: null, suppressed: true });
    expect(d.cells.find((c) => c.label === "I")).toMatchObject({ count: 20, suppressed: false });
  });
  it("two small cells protect each other; nothing extra hidden", () => {
    const d = distribution({ I: 30, A: 3, C: 2 });
    expect(d.cells.filter((c) => c.suppressed).map((c) => c.label).sort()).toEqual(["A", "C"]);
  });
  it("cohort stats never show a grade with fewer than 10 learners", () => {
    const g9: CohortLearner[] = Array.from({ length: 12 }, (_, i) => ({ grade: 9, completed: i < 11, code: i < 6 ? "ISA" : "RIC", identity: "moratorium", fits: ["HUMANITIES", "GEO_ENV"], mathsGate: "mathematics" }));
    const g11: CohortLearner[] = Array.from({ length: 9 }, () => ({ grade: 11, completed: true, verdict: "CONFIRM" }));
    const s = cohortStats([...g9, ...g11], ["HUMANITIES"]);
    const [a, b] = s.grades;
    expect(a).toMatchObject({ learners: 12, completed: 11, completion_rate: 92, suppressed: false });
    expect(a!.recommended_vs_offered).toEqual([{ id: "GEO_ENV", count: 11, offered: false }, { id: "HUMANITIES", count: 11, offered: true }]);
    expect(b).toMatchObject({ learners: null, completed: null, suppressed: true });
    expect(b!.verdicts!.suppressed).toBe(true);
  });
  it("FC3 is only ever aggregated across ≥ 10 learners per subject", () => {
    const rows = [...Array.from({ length: 10 }, () => ({ subject: "Physical Sciences", fc3: 3 })), { subject: "Accounting", fc3: 5 }];
    expect(teachingFitBySubject(rows)).toEqual([
      { subject: "Physical Sciences", n: 10, mean: 3, suppressed: false },
      { subject: "Accounting", n: null, mean: null, suppressed: true },
    ]);
  });
});

describe("safeguarding alert", () => {
  it("contains only name, grade, time, level and the trigger message", () => {
    const a = composeAlert({ learnerName: "Thabo N.", grade: 9, at: new Date("2027-03-02T09:15:00Z"), level: "urgent", triggerMessage: "I don't want to wake up", confirmUrl: "https://x/confirm", timezone: "Africa/Johannesburg" });
    expect(a.body).toContain("Learner: Thabo N.");
    expect(a.body).toContain("Grade: 9");
    expect(a.body).toContain("Level: urgent");
    expect(a.body).toContain('"I don\'t want to wake up"');
    expect(a.body).toContain("11:15"); // SAST
    expect(a.sms.length).toBeLessThan(300);
    expect(a.sms).not.toContain("wake up"); // the trigger message goes by email, not SMS
  });
  it("counts only school hours on weekdays for the 4-hour escalation", () => {
    const tz = "Africa/Johannesburg";
    // Fri 13:00 SAST → Mon 10:00 SAST: Fri 13:00–14:30 (1.5h) + Mon 07:30–10:00 (2.5h) = 4h
    const h = schoolHoursElapsed(new Date("2027-03-05T11:00:00Z"), new Date("2027-03-08T08:00:00Z"), "07:30", "14:30", tz);
    expect(h).toBeCloseTo(4, 5);
    // evening alert: nothing counts until the next school morning
    expect(schoolHoursElapsed(new Date("2027-03-02T17:00:00Z"), new Date("2027-03-03T05:00:00Z"), "07:30", "14:30", tz)).toBe(0);
  });
});
