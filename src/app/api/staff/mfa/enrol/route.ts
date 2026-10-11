import { handle, ok } from "@/lib/http";
import { HttpError, getCaller } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";

/** Starts authenticator setup: returns the QR code and the typed-in key. The factor stays unverified until a code is confirmed. */
export const POST = handle(async () => {
  const caller = await getCaller();
  if (!caller || caller.role === "learner") throw new HttpError(401, "Not signed in");
  const db = await userDb();
  const { data: factors } = await db.auth.mfa.listFactors();
  if (factors?.totp.length) throw new HttpError(409, "You already have an authenticator. Enter its code instead.");
  // An abandoned earlier attempt leaves an unverified factor behind; remove it so setup can start again.
  for (const f of factors?.all ?? []) if (f.factor_type === "totp" && f.status === "unverified") await db.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await db.auth.mfa.enroll({ factorType: "totp", issuer: "The Excavation", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
  if (error || !data) throw new HttpError(500, "Couldn't start setup. Try again in a moment.");
  return ok({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
});
