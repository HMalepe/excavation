import "server-only";
import { one } from "@/lib/db/one";
import { adminDb } from "@/lib/db/admin";
import { buildScoreProfile, ENGINE_VERSION } from "@/lib/scoring/profile";
import { computeDeltas } from "@/lib/scoring/deltas";
import { loadResponses } from "@/lib/session/service";
import type { ConversationAdjustments, MarksInput, NormContext, ScoreProfile } from "@/lib/scoring/types";
import type { MarkRow, SchoolSettingsRow, SessionRow } from "@/lib/db/types";
import { skillsInputFromRows, type SkillRow } from "@/lib/skills/fromRows";
import type { SkillsInput } from "@/lib/skills/types";
import type { SkillsProgress } from "@/lib/session/service";

/** Checks + tasters, once the learner has a skills plan (Grade 9 sessions from 2026-10). */
function skillsFor(session: SessionRow, rows: SkillRow[]): SkillsInput | undefined {
  const plan = (session.progress as { skills?: SkillsProgress } | null)?.skills?.plan;
  return plan ? skillsInputFromRows(plan, rows) : undefined;
}

/** Latest marks per subject for a grade; school import beats self-report (spec 02 §5). */
export async function marksFor(learnerId: string, grade: number, termLabel?: string): Promise<MarksInput & { rows: MarkRow[] }> {
  let q = adminDb().from("marks").select("*").eq("learner_id", learnerId).eq("grade", grade);
  if (termLabel) q = q.eq("term_label", termLabel);
  const { data } = await q.order("recorded_at", { ascending: false });
  const rows = (data ?? []) as MarkRow[];
  const best = new Map<string, MarkRow>();
  for (const r of rows) {
    const cur = best.get(r.subject);
    if (!cur || (cur.source === "self_report" && r.source === "school_import")) best.set(r.subject, r);
  }
  const chosen = [...best.values()];
  return {
    source: chosen.some((r) => r.source === "self_report") ? "self_report" : "school_import",
    subjects: Object.fromEntries(chosen.map((r) => [r.subject, Number(r.percentage)])),
    estimates: chosen.filter((r) => r.is_estimate).map((r) => r.subject),
    rows: chosen,
  };
}

export async function schoolSettings(schoolId: string): Promise<SchoolSettingsRow | null> {
  const { data } = await adminDb().from("school_settings").select("*").eq("school_id", schoolId).maybeSingle();
  return (data as SchoolSettingsRow) ?? null;
}

export async function normContext(grade: 9 | 11): Promise<NormContext> {
  const { data } = await adminDb().from("norms").select("norm_state, percentiles, identity_medians").eq("grade", grade)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (!data || data.norm_state === "pre_norm") return { normState: "pre_norm" };
  return { normState: data.norm_state, percentiles: data.percentiles, identityMedians: data.identity_medians };
}

/**
 * Score a session and store the ScoreProfile. Called when the scored layer finishes (no conversation
 * adjustments yet) and again after the conversation, with adjustments (spec 10 Step 5.2).
 */
export async function scoreSession(session: SessionRow, schoolId: string, conversation?: ConversationAdjustments): Promise<ScoreProfile> {
  const isG9 = session.touchpoint === "G9_FOUNDATION";
  const [{ likert, meta, values, skillRows }, marks, settings, norms] = await Promise.all([
    loadResponses(session.id),
    marksFor(session.learner_id, isG9 ? 9 : 11),
    schoolSettings(schoolId),
    normContext(isG9 ? 9 : 11),
  ]);
  const shownOrder = Object.fromEntries((session.item_order?.sections ?? []).map((s) => [s.id, s.items])) as never;

  const profile = buildScoreProfile({
    learnerId: session.learner_id,
    touchpoint: session.touchpoint,
    likert, meta, shownOrder, values,
    marks: { source: marks.source, subjects: marks.subjects, estimates: marks.estimates },
    conversation,
    school: settings ? { offeredCombinationIds: settings.offered_combination_ids, readinessOverrides: settings.readiness_overrides } : undefined,
    norms,
    skills: skillsFor(session, skillRows),
  });

  if (!isG9) {
    const { data: g9 } = await adminDb().from("sessions").select("id, score_profiles(profile)").eq("learner_id", session.learner_id)
      .eq("touchpoint", "G9_FOUNDATION").maybeSingle();
    const g9Profile = one(g9?.score_profiles as unknown as { profile: ScoreProfile } | null)?.profile;
    if (g9Profile) profile.deltas = computeDeltas(g9Profile, profile);
  }

  const { error } = await adminDb().from("score_profiles").upsert({
    session_id: session.id, norm_state: profile.norm_state, quality_status: profile.quality.status, profile,
    computed_at: new Date().toISOString(), engine_version: ENGINE_VERSION,
  });
  if (error) throw new Error(`save score profile: ${error.message}`);
  return profile;
}

export async function loadProfile(sessionId: string): Promise<ScoreProfile | null> {
  const { data } = await adminDb().from("score_profiles").select("profile").eq("session_id", sessionId).maybeSingle();
  return (data?.profile as ScoreProfile) ?? null;
}
