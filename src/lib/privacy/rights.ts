import "server-only";
import { randomBytes } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { retentionAction } from "./retention";

/**
 * POPIA data-subject rights, done by Excavation staff on request (a guardian writes to privacy@, or asks the school):
 * export everything held about a learner, erase it, or (retention) anonymise it. Every call is written to the audit log.
 */

/** Everything held about one learner, as plain JSON for the guardian. Staff notes and token hashes are left out. */
export async function exportLearnerData(learnerId: string, actor: string) {
  const db = adminDb();
  const { data: learner } = await db.from("learners").select("id, first_name, last_name, current_grade, class_label, school_learner_ref, preferred_language, fet_subjects, retain_until, schools(name)").eq("id", learnerId).maybeSingle();
  if (!learner) return null;
  const { data: sessions } = await db.from("sessions").select("id, touchpoint, instrument_version, status, stage, started_at, completed_at").eq("learner_id", learnerId);
  const sids = (sessions ?? []).map((s) => s.id);
  const inSessions = <T,>(table: string, cols: string) => sids.length ? db.from(table).select(cols).in("session_id", sids) : Promise.resolve({ data: [] as T[] });
  const [consents, assents, marks, answers, messages, scores, signals, verdicts, reports, shares, events] = await Promise.all([
    db.from("guardian_consents").select("guardian_name, relationship, method, consent_service, consent_ai_crossborder, consent_wellbeing, consent_research, form_version, given_at, withdrawn_at").eq("learner_id", learnerId),
    db.from("learner_assents").select("assented, screen_version, at:created_at").eq("learner_id", learnerId),
    db.from("marks").select("grade, term_label, subject, percentage, source, is_estimate").eq("learner_id", learnerId),
    inSessions("item_responses", "item_id, value, value_json, response_ms, change_count, session_id"),
    inSessions("conversation_messages", "role, content, created_at, session_id"),
    inSessions("score_profiles", "profile, session_id"),
    inSessions("signals", "payload, extracted_at, session_id"),
    inSessions("verdicts", "payload, session_id"),
    inSessions("reports", "kind, status, content, created_at, released_at, session_id"),
    db.from("share_grants").select("audience, created_at, revoked_at").eq("learner_id", learnerId),
    db.from("safeguarding_events").select("level, trigger_source, created_at").eq("learner_id", learnerId),
  ]);
  await audit(actor, "privacy_export", learnerId);
  return {
    exported_at: new Date().toISOString(),
    note: "Everything The Excavation holds about this learner. Internal staff notes and security tokens are not included. Safeguarding entries show that an event was logged, not staff notes.",
    learner, consents: consents.data, assents: assents.data, sessions, marks: marks.data, answers: answers.data, conversation: messages.data,
    score_profiles: scores.data, signals: signals.data, verdicts: verdicts.data, reports: reports.data, sharing: shares.data, safeguarding_log: events.data,
  };
}

export interface EraseResult { ok: boolean; reason?: string; deleted?: boolean }

/**
 * Permanently deletes a learner and everything linked to them (database cascades), and their login. Refuses if a
 * safeguarding record exists unless the caller states it has been cleared: those records follow the attorney's
 * guidance (spec 09 §4), not the default.
 */
export async function eraseLearner(learnerId: string, actor: string | null, opts: { safeguardingCleared?: boolean } = {}): Promise<EraseResult> {
  const db = adminDb();
  const { data: learner } = await db.from("learners").select("id, profile_id").eq("id", learnerId).maybeSingle();
  if (!learner) return { ok: false, reason: "No such learner." };
  const { count } = await db.from("safeguarding_events").select("id", { count: "exact", head: true }).eq("learner_id", learnerId);
  if ((count ?? 0) > 0 && !opts.safeguardingCleared) {
    return { ok: false, reason: `This learner has ${count} safeguarding record(s). Those follow the attorney's retention guidance. Confirm they may be deleted, then try again.` };
  }
  const { error } = await db.from("learners").delete().eq("id", learnerId);
  if (error) return { ok: false, reason: error.message };
  if (learner.profile_id) await db.auth.admin.deleteUser(learner.profile_id);
  await audit(actor, "privacy_erase", learnerId);
  return { ok: true, deleted: true };
}

/** Keeps scores and answers for research with the identity removed; deletes the chat, signals, reports and links. */
export async function anonymiseLearner(learnerId: string, actor: string | null): Promise<void> {
  const db = adminDb();
  const { data: learner } = await db.from("learners").select("id, profile_id").eq("id", learnerId).maybeSingle();
  if (!learner) return;
  const { data: sessions } = await db.from("sessions").select("id").eq("learner_id", learnerId);
  const sids = (sessions ?? []).map((s) => s.id);
  if (sids.length) {
    await db.from("conversation_messages").delete().in("session_id", sids);
    await db.from("signals").delete().in("session_id", sids);
    await db.from("reports").delete().in("session_id", sids);
  }
  await db.from("share_grants").delete().eq("learner_id", learnerId);
  await db.from("guardian_consents").delete().eq("learner_id", learnerId);
  await db.from("learner_assents").delete().eq("learner_id", learnerId);
  await db.from("teacher_classes").delete().eq("learner_id", learnerId);
  await db.from("learners").update({ first_name: "Anonymised", last_name: "", school_learner_ref: null, class_label: null, preferred_language: null, login_code: `ANON-${randomBytes(6).toString("hex")}`, profile_id: null, retain_until: null }).eq("id", learnerId);
  if (learner.profile_id) await db.auth.admin.deleteUser(learner.profile_id);
  await audit(actor, "privacy_anonymise", learnerId);
}

/** Daily retention sweep. Dry-run unless `apply` is true, so turning it on is a deliberate act. */
export async function runRetention(apply: boolean) {
  const db = adminDb();
  const { data: due } = await db.from("learners").select("id, retain_until").not("retain_until", "is", null).lt("retain_until", new Date().toISOString().slice(0, 10)).limit(500);
  const out = { due: due?.length ?? 0, delete: 0, anonymise: 0, applied: apply, skippedSafeguarding: 0 };
  for (const l of due ?? []) {
    const { data: consent } = await db.from("guardian_consents").select("consent_research, withdrawn_at").eq("learner_id", l.id).is("withdrawn_at", null).order("given_at", { ascending: false }).limit(1);
    const action = retentionAction({ retain_until: l.retain_until, consent_research: !!consent?.[0]?.consent_research });
    if (action === "keep") continue;
    if (action === "anonymise") { out.anonymise++; if (apply) await anonymiseLearner(l.id, null); continue; }
    const { count } = await db.from("safeguarding_events").select("id", { count: "exact", head: true }).eq("learner_id", l.id);
    if ((count ?? 0) > 0) { out.skippedSafeguarding++; continue; }
    out.delete++;
    if (apply) await eraseLearner(l.id, null).catch(() => undefined);
  }
  return out;
}
