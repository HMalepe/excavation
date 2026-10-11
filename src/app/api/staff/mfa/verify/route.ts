import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, getCaller } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { audit } from "@/lib/audit";
import { assertNotThrottled, recordAttempt, sha256 } from "@/lib/auth/throttle";
import { MFA_LIMIT, STAFF_HOME, TOTP_CODE } from "@/lib/auth/mfa";

const Body = z.object({ code: z.string().regex(TOTP_CODE), factorId: z.string().uuid().optional() });

/** Confirms a 6-digit code. For a new factor this finishes setup; either way the session becomes assurance level 2. */
export const POST = handle(async (req: Request) => {
  const caller = await getCaller();
  if (!caller || caller.role === "learner") throw new HttpError(401, "Not signed in");
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new HttpError(400, "Enter the 6 digits from your authenticator app.");
  const key = sha256(`staff-mfa|${caller.userId}`);
  await assertNotThrottled(key, { max: MFA_LIMIT.max, windowMinutes: MFA_LIMIT.windowMinutes, message: "Too many wrong codes. Wait 10 minutes, then try again." });
  const db = await userDb();
  const { data: factors } = await db.auth.mfa.listFactors();
  const all = factors?.all ?? [];
  const factorId = parsed.data.factorId ?? factors?.totp[0]?.id;
  const factor = all.find((f) => f.id === factorId && f.factor_type === "totp");
  if (!factor) throw new HttpError(404, "No authenticator found. Refresh the page to set one up.");
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code: parsed.data.code });
  if (error) {
    await recordAttempt(key, false);
    throw new HttpError(401, "That code didn't work. Codes change every 30 seconds. Check the clock on your phone, then try the newest code.");
  }
  await recordAttempt(key, true);
  await audit(caller.userId, factor.status === "verified" ? "staff_mfa_verified" : "staff_mfa_enrolled", caller.userId);
  return ok({ next: STAFF_HOME[caller.role] ?? "/" });
});
