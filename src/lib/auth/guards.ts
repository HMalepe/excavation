import "server-only";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/db/admin";
import { userDb } from "@/lib/db/server";
import type { AppRole, LearnerRow } from "@/lib/db/types";
import { MFA_PATH, mfaRequired, mfaState, type MfaState } from "./mfa";

export interface Caller {
  userId: string;
  role: AppRole;
  schoolId: string | null;
  firstName: string;
  learner: LearnerRow | null;
  /** Staff second step (see lib/auth/mfa.ts). Anything but "ok" means: not allowed past the MFA page yet. */
  mfa: MfaState;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Identity always comes from the verified Supabase session cookie — never from the request body. */
export async function getCaller(): Promise<Caller | null> {
  const db = await userDb();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const admin = adminDb();
  const { data: profile } = await admin.from("profiles").select("role, school_id, first_name").eq("id", user.id).maybeSingle();
  if (!profile) return null;
  let learner: LearnerRow | null = null;
  if (profile.role === "learner") {
    const { data } = await admin.from("learners").select("*").eq("profile_id", user.id).maybeSingle();
    learner = (data as LearnerRow) ?? null;
  }
  let mfa: MfaState = "ok";
  if (profile.role !== "learner" && mfaRequired()) {
    const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    mfa = mfaState({ required: true, role: profile.role, currentLevel: aal?.currentLevel, nextLevel: aal?.nextLevel });
  }
  return { userId: user.id, role: profile.role, schoolId: profile.school_id, firstName: profile.first_name, learner, mfa };
}

/** For route handlers: throws HttpError, which `handle()` turns into a JSON response. */
export async function requireRole(...roles: AppRole[]): Promise<Caller> {
  const c = await getCaller();
  if (!c) throw new HttpError(401, "Not signed in");
  if (!roles.includes(c.role)) throw new HttpError(403, "Not allowed");
  assertMfa(c);
  return c;
}

/** Staff who haven't completed the second step get nothing from any data route. */
export function assertMfa(c: Caller): void {
  if (c.mfa !== "ok") throw new HttpError(403, "Two-step verification is needed. Sign in again and finish the second step.");
}

export async function requireLearner(): Promise<Caller & { learner: LearnerRow }> {
  const c = await requireRole("learner");
  if (!c.learner) throw new HttpError(403, "No learner record");
  return c as Caller & { learner: LearnerRow };
}

/** For pages: redirects instead of throwing. */
export async function pageRole(roles: AppRole[], loginPath = "/staff/login"): Promise<Caller> {
  const c = await getCaller();
  if (!c) redirect(loginPath);
  if (!roles.includes(c.role)) redirect("/");
  if (c.mfa !== "ok") redirect(MFA_PATH);
  return c;
}

export async function pageLearner(): Promise<Caller & { learner: LearnerRow }> {
  const c = await pageRole(["learner"], "/login");
  if (!c.learner) redirect("/login");
  return c as Caller & { learner: LearnerRow };
}
