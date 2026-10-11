import "server-only";
import { adminDb } from "@/lib/db/admin";
import { HttpError } from "@/lib/auth/guards";

/**
 * Cost and abuse limits for The Guide (each learner message is a paid model call). Generous enough that
 * an honest 20-minute conversation never notices them; tight enough that a script or a runaway client can't
 * run up the bill. Counted from the transcript table, so they work across serverless instances.
 */
export const GUIDE_LIMITS = {
  /** Most messages a learner can send in one session (G9 has 20 questions; follow-ups and "say more" roughly double that). */
  perSession: 120,
  /** Messages per rolling minute: faster than a person can type. */
  perMinute: 8,
  /** All learners together, per UTC day; the kill switch if something goes wrong at scale. Env-tunable. */
  dailyDefault: 20_000,
} as const;

export async function assertGuideAllowance(sessionId: string): Promise<void> {
  const db = adminDb();
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  const [{ count: total }, { count: lastMinute }, { count: today }] = await Promise.all([
    db.from("conversation_messages").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("role", "learner"),
    db.from("conversation_messages").select("id", { count: "exact", head: true }).eq("session_id", sessionId).eq("role", "learner").gte("created_at", minuteAgo),
    db.from("conversation_messages").select("id", { count: "exact", head: true }).eq("role", "guide").gte("created_at", dayStart.toISOString()),
  ]);
  if ((total ?? 0) >= GUIDE_LIMITS.perSession) throw new HttpError(429, "This chat has reached its length limit. Your answers are saved. Tell your teacher if you want to carry on.");
  if ((lastMinute ?? 0) >= GUIDE_LIMITS.perMinute) throw new HttpError(429, "That's a lot of messages very fast. Wait a few seconds, then try again.");
  const daily = Number(process.env.AI_DAILY_GUIDE_LIMIT ?? GUIDE_LIMITS.dailyDefault);
  if ((today ?? 0) >= daily) throw new HttpError(503, "The Guide is very busy today. Your answers are saved. Please try again tomorrow.");
}
