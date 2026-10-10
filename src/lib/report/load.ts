import "server-only";
import { one } from "@/lib/db/one";
import { adminDb } from "@/lib/db/admin";
import type { ReportRow, SessionRow } from "@/lib/db/types";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";

/** Everything a report page or PDF needs, for ONE session. Callers must have authorised access. */
export async function loadReportBundle(sessionId: string) {
  const db = adminDb();
  const [{ data: session }, { data: report }, { data: sp }, { data: v }] = await Promise.all([
    db.from("sessions").select("*").eq("id", sessionId).single(),
    db.from("reports").select("*").eq("session_id", sessionId).eq("kind", "learner").maybeSingle(),
    db.from("score_profiles").select("profile").eq("session_id", sessionId).maybeSingle(),
    db.from("verdicts").select("payload").eq("session_id", sessionId).maybeSingle(),
  ]);
  let g9Profile: ScoreProfile | null = null;
  if (session?.touchpoint === "G11_CONFIRMATION") {
    const { data: g9 } = await db.from("sessions").select("score_profiles(profile)").eq("learner_id", session.learner_id).eq("touchpoint", "G9_FOUNDATION").maybeSingle();
    g9Profile = one(g9?.score_profiles as unknown as { profile: ScoreProfile } | null)?.profile ?? null;
  }
  return {
    session: session as SessionRow,
    report: (report as ReportRow) ?? null,
    profile: (sp?.profile as ScoreProfile) ?? null,
    verdict: (v?.payload as VerdictResult) ?? null,
    g9Profile,
  };
}
