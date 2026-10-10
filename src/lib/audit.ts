import "server-only";
import { adminDb } from "@/lib/db/admin";

/** Every staff read of identifiable learner data writes here (spec 01 §6, schema comment). */
export async function audit(actor: string | null, action: string, target: string): Promise<void> {
  const { error } = await adminDb().from("audit_log").insert({ actor, action, target });
  if (error) console.error("[audit] failed", action, target, error.message);
}
