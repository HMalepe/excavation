import type { AppRole } from "@/lib/db/types";

/**
 * Two-step verification (TOTP authenticator app) for everyone who can see learner data on the staff side.
 * "ok"     = nothing to do (a learner, MFA off, or this session already passed the second step)
 * "enrol"  = signed in with a password but has no authenticator yet: must set one up
 * "verify" = has an authenticator: must enter the current 6-digit code
 */
export type MfaState = "ok" | "enrol" | "verify";

export function mfaState(o: { required: boolean; role: AppRole; currentLevel: string | null | undefined; nextLevel: string | null | undefined }): MfaState {
  if (!o.required || o.role === "learner") return "ok";
  if (o.currentLevel === "aal2") return "ok";
  return o.nextLevel === "aal2" ? "verify" : "enrol";
}

/** Production defaults to required; set STAFF_MFA=off to switch it off (e.g. a break-glass during an incident). */
export function mfaRequired(env: { STAFF_MFA?: string; NODE_ENV?: string } = process.env): boolean {
  if (env.STAFF_MFA === "off") return false;
  if (env.STAFF_MFA === "required") return true;
  return env.NODE_ENV === "production";
}

export const MFA_PATH = "/staff/mfa";
export const TOTP_CODE = /^\d{6}$/;
/** Wrong-code limit per signed-in account: a 6-digit code must not be guessable within its 30-second window. */
export const MFA_LIMIT = { max: 5, windowMinutes: 10 } as const;

export const STAFF_HOME: Record<string, string> = {
  teacher: "/school/teacher", school_admin: "/school/admin", safeguarding_contact: "/school/safeguarding", excavation_staff: "/staff",
};
