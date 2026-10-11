import { handle, ok } from "@/lib/http";
import { requireCron } from "@/lib/cron/auth";
import { runRetention } from "@/lib/privacy/rights";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily retention sweep (spec 09 §4). It only reports what it WOULD do until RETENTION_ENABLED=true is set,
 * so switching on automatic deletion is a deliberate step taken after the attorney has confirmed the policy.
 */
export const GET = handle(async (req: Request) => {
  requireCron(req);
  return ok(await runRetention(process.env.RETENTION_ENABLED === "true"));
});
