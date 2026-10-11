import { describe, it, expect } from "vitest";
import { GUIDE_LIMITS } from "@/lib/guide/limits";
import { STAFF_LIMITS, sha256 } from "@/lib/auth/throttle";

describe("abuse limits", () => {
  it("keeps the Guide limits above an honest conversation and below runaway use", () => {
    expect(GUIDE_LIMITS.perSession).toBeGreaterThanOrEqual(60);   // 20 questions + follow-ups + invites
    expect(GUIDE_LIMITS.perMinute).toBeLessThanOrEqual(12);       // faster than a person types
    expect(GUIDE_LIMITS.dailyDefault).toBeGreaterThan(1000);
  });
  it("limits staff password guessing per address and per account, and hashes the keys", () => {
    expect(STAFF_LIMITS[0].max).toBeLessThanOrEqual(10);
    expect(STAFF_LIMITS[1].max).toBeGreaterThan(STAFF_LIMITS[0].max);
    expect(sha256("staff-acct|a@b.co")).toMatch(/^[0-9a-f]{64}$/);
  });
});
