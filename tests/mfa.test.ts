import { describe, it, expect } from "vitest";
import { mfaRequired, mfaState, TOTP_CODE, MFA_LIMIT } from "@/lib/auth/mfa";

const base = { required: true, currentLevel: "aal1", nextLevel: "aal1" };
describe("staff two-step verification", () => {
  it("never asks a learner for a second step", () => {
    expect(mfaState({ ...base, role: "learner" })).toBe("ok");
  });
  it("lets everyone through when it is switched off", () => {
    for (const role of ["teacher", "school_admin", "safeguarding_contact", "excavation_staff"] as const) expect(mfaState({ ...base, required: false, role })).toBe("ok");
  });
  it("sends staff without an authenticator to set one up, and staff with one to enter a code", () => {
    expect(mfaState({ ...base, role: "teacher" })).toBe("enrol");
    expect(mfaState({ ...base, role: "excavation_staff", nextLevel: "aal2" })).toBe("verify");
  });
  it("lets staff through once the session has passed the second step", () => {
    expect(mfaState({ required: true, role: "school_admin", currentLevel: "aal2", nextLevel: "aal2" })).toBe("ok");
  });
  it("treats a missing assurance answer as not verified (fails closed)", () => {
    expect(mfaState({ required: true, role: "teacher", currentLevel: undefined, nextLevel: undefined })).toBe("enrol");
  });
  it("is required in production unless explicitly switched off", () => {
    expect(mfaRequired({ NODE_ENV: "production" })).toBe(true);
    expect(mfaRequired({ NODE_ENV: "production", STAFF_MFA: "off" })).toBe(false);
    expect(mfaRequired({ NODE_ENV: "development" })).toBe(false);
    expect(mfaRequired({ NODE_ENV: "development", STAFF_MFA: "required" })).toBe(true);
  });
  it("accepts exactly six digits", () => {
    expect(TOTP_CODE.test("123456")).toBe(true);
    for (const bad of ["12345", "1234567", "12345a", "", " 123456"]) expect(TOTP_CODE.test(bad)).toBe(false);
  });
  it("limits wrong codes so a 6-digit code can't be brute-forced inside its window", () => {
    expect(MFA_LIMIT.max).toBeLessThanOrEqual(5);
  });
});
