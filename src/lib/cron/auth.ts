import "server-only";
import { timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/auth/guards";
import { serverEnv } from "@/lib/env.server";

/** Scheduled jobs authenticate with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this). */
export function requireCron(req: Request) {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) throw new HttpError(503, "CRON_SECRET not configured");
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (got.length !== want.length || !timingSafeEqual(got, want)) throw new HttpError(401, "Unauthorised");
}
