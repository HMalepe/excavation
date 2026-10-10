import "server-only";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/db/admin";
import { userDb } from "@/lib/db/server";
import type { AppRole, LearnerRow } from "@/lib/db/types";

export interface Caller {
  userId: string;
  role: AppRole;
  schoolId: string | null;
  firstName: string;
  learner: LearnerRow | null;
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
  return { userId: user.id, role: profile.role, schoolId: profile.school_id, firstName: profile.first_name, learner };
}

/** For route handlers: throws HttpError, which `handle()` turns into a JSON response. */
export async function requireRole(...roles: AppRole[]): Promise<Caller> {
  const c = await getCaller();
  if (!c) throw new HttpError(401, "Not signed in");
  if (!roles.includes(c.role)) throw new HttpError(403, "Not allowed");
  return c;
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
  return c;
}

export async function pageLearner(): Promise<Caller & { learner: LearnerRow }> {
  const c = await pageRole(["learner"], "/login");
  if (!c.learner) redirect("/login");
  return c as Caller & { learner: LearnerRow };
}
