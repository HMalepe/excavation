import "server-only";
import { createHash } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { HttpError } from "./guards";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Failed-attempt limiter on top of the login_attempts table (keys are hashed, never raw emails or codes). */
export async function assertNotThrottled(key: string, opts: { max: number; windowMinutes: number; message: string }) {
  const since = new Date(Date.now() - opts.windowMinutes * 60_000).toISOString();
  const { count } = await adminDb().from("login_attempts").select("id", { count: "exact", head: true })
    .eq("key", key).eq("succeeded", false).gte("at", since);
  if ((count ?? 0) >= opts.max) throw new HttpError(429, opts.message);
}

export async function recordAttempt(key: string, succeeded: boolean) {
  await adminDb().from("login_attempts").insert({ key, succeeded });
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

/** Staff passwords are the one thing an attacker can guess at scale: limit per address and per account. */
export const STAFF_LIMITS = [
  { name: "ip", max: 8, windowMinutes: 15 },
  { name: "account", max: 20, windowMinutes: 60 },
] as const;
