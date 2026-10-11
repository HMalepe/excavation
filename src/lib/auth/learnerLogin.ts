import "server-only";
import { createHash } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { userDb } from "@/lib/db/server";
import { HttpError } from "./guards";
import type { LearnerRow } from "@/lib/db/types";

export const MAX_FAILED_PER_WINDOW = 10;
export const WINDOW_MINUTES = 15;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const normaliseCode = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
/** Learners have no email; Supabase Auth needs one. This address can never receive mail. */
export const learnerAuthEmail = (learnerId: string) => `learner-${learnerId}@learners.excavation.invalid`;

async function throttle(key: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await adminDb().from("login_attempts").select("id", { count: "exact", head: true })
    .eq("key", key).eq("succeeded", false).gte("at", since);
  if ((count ?? 0) >= MAX_FAILED_PER_WINDOW) throw new HttpError(429, "Too many tries. Wait 15 minutes and try again, or ask your teacher to check your codes.");
}

/**
 * School code + personal login code → a Supabase session cookie, without passwords:
 * the server mints a one-time magic-link token with the service role and verifies it immediately.
 */
export async function loginLearner(schoolCodeRaw: string, loginCodeRaw: string, ip: string): Promise<LearnerRow> {
  const schoolCode = normaliseCode(schoolCodeRaw), loginCode = normaliseCode(loginCodeRaw);
  const key = hash(`${ip}|${schoolCode}`);
  await throttle(key);
  const db = adminDb();
  const fail = async () => {
    await db.from("login_attempts").insert({ key, succeeded: false });
    return new HttpError(401, "Those codes don't match. Check them against what your teacher gave you.");
  };

  const { data: school } = await db.from("schools").select("id").eq("school_code", schoolCode).maybeSingle();
  if (!school) throw await fail();
  const { data: learner } = await db.from("learners").select("*").eq("login_code", loginCode).eq("school_id", school.id).maybeSingle();
  if (!learner) throw await fail();

  const email = learnerAuthEmail(learner.id);
  let profileId = learner.profile_id as string | null;
  if (!profileId) {
    const { data: created, error } = await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: { kind: "learner" } });
    if (error || !created.user) throw new Error(`createUser failed: ${error?.message}`);
    profileId = created.user.id;
    await db.from("profiles").upsert({ id: profileId, role: "learner", school_id: learner.school_id, first_name: learner.first_name, last_name: learner.last_name });
    await db.from("learners").update({ profile_id: profileId }).eq("id", learner.id);
  }

  const { data: link, error: linkErr } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (linkErr || !link.properties?.hashed_token) throw new Error(`generateLink failed: ${linkErr?.message}`);
  const session = await userDb();
  const { error: otpErr } = await session.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (otpErr) throw new Error(`verifyOtp failed: ${otpErr.message}`);

  await db.from("login_attempts").insert({ key, succeeded: true });
  return { ...(learner as LearnerRow), profile_id: profileId };
}
