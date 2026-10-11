import { handle, ok } from "@/lib/http";
import { requireCron } from "@/lib/cron/auth";
import { adminDb } from "@/lib/db/admin";
import { serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness check for the operator (Bearer CRON_SECRET): can we reach the database, and are the integrations configured? */
export const GET = handle(async (req: Request) => {
  requireCron(req);
  const env = serverEnv();
  const t0 = Date.now();
  const { error } = await adminDb().from("schools").select("id", { head: true, count: "exact" }).limit(1);
  return ok({
    database: error ? `error: ${error.message}` : "ok", database_ms: Date.now() - t0,
    anthropic_key: !!env.ANTHROPIC_API_KEY, email_key: !!env.RESEND_API_KEY, safeguarding_lead_email: !!env.EXCAVATION_SAFEGUARDING_LEAD_EMAIL,
    consent_form_approved: process.env.CONSENT_FORM_APPROVED === "true", legal_approved: process.env.LEGAL_APPROVED === "true", retention_enabled: process.env.RETENTION_ENABLED === "true",
  });
});
