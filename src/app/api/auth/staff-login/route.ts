import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { adminDb } from "@/lib/db/admin";
import { assertNotThrottled, clientIp, recordAttempt, sha256, STAFF_LIMITS } from "@/lib/auth/throttle";

const Body = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

const HOME: Record<string, string> = {
  teacher: "/school/teacher", school_admin: "/school/admin", safeguarding_contact: "/school/safeguarding", excavation_staff: "/staff",
};

export const POST = handle(async (req: Request) => {
  const { email, password } = Body.parse(await req.json());
  const ip = clientIp(req), account = email.trim().toLowerCase();
  const keys = [sha256(`staff-ip|${ip}|${account}`), sha256(`staff-acct|${account}`)];
  const msg = "Too many tries. Wait 15 minutes and try again, or ask your school admin to reset your password.";
  await assertNotThrottled(keys[0]!, { max: STAFF_LIMITS[0].max, windowMinutes: STAFF_LIMITS[0].windowMinutes, message: msg });
  await assertNotThrottled(keys[1]!, { max: STAFF_LIMITS[1].max, windowMinutes: STAFF_LIMITS[1].windowMinutes, message: msg });
  const db = await userDb();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await Promise.all(keys.map((k) => recordAttempt(k, false)));
    throw new HttpError(401, "That email and password don't match.");
  }
  const { data: profile } = await adminDb().from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.role === "learner") {
    await db.auth.signOut();
    throw new HttpError(403, "This login is for school and Excavation staff. Learners log in with their codes.");
  }
  await Promise.all(keys.map((k) => recordAttempt(k, true)));
  return ok({ next: HOME[profile.role] ?? "/" });
});
