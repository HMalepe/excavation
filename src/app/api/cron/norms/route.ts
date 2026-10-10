import { handle, ok } from "@/lib/http";
import { requireCron } from "@/lib/cron/auth";
import { adminDb } from "@/lib/db/admin";
import { runNorming } from "@/lib/norming/job";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Nightly: recompute norms per grade; norm_state switches automatically (spec 10 Step 9). */
export const GET = handle(async (req: Request) => {
  requireCron(req);
  const out = [];
  for (const grade of [9, 11] as const) {
    const r = await runNorming(adminDb(), grade);
    out.push({ grade, version: r.version, n: r.n, norm_state: r.norm_state, alphas: r.alphas });
  }
  return ok({ norms: out });
});
