/**
 * Row types for the tables the app reads/writes (supabase/migrations). Hand-maintained because
 * this repo can't run the Supabase CLI type generator without Docker; regenerate with
 * `npm run db:types` when you have a local Supabase stack and diff against this file.
 */
import type { ScoreProfile, Touchpoint } from "@/lib/scoring/types";

export type AppRole = "learner" | "teacher" | "school_admin" | "safeguarding_contact" | "excavation_staff";
export type SessionStatus = "not_started" | "scored_layer" | "conversation" | "complete" | "safety_stop" | "abandoned";
export type ReportStatus = "generating" | "needs_review" | "released" | "withdrawn";
export type ReportKind = "learner" | "teacher" | "parent";

export interface ProfileRow { id: string; role: AppRole; school_id: string | null; first_name: string; last_name: string | null }
export interface SchoolRow { id: string; name: string; emis_number: string | null; province: string; district: string | null; school_code: string | null }
export interface SchoolSettingsRow {
  school_id: string;
  offered_combination_ids: string[];
  readiness_overrides: Record<string, { needs: Record<string, number> }>;
  subject_change_deadline_g10: string | null;
  subject_change_deadline_g11: string | null;
  safeguarding_contact_name: string;
  safeguarding_contact_phone: string;
  safeguarding_contact_email: string;
  safeguarding_backup_name: string;
  safeguarding_backup_phone: string;
  safeguarding_backup_email: string | null;
  partnership_agreement_signed: string;
  school_day_start: string;
  school_day_end: string;
  timezone: string;
  offered_subjects_fet: string[];
  timetable_allows: Record<string, boolean>;
  performance_overrides: Record<string, number>;
}
export interface LearnerRow {
  id: string; profile_id: string | null; school_id: string; school_learner_ref: string | null;
  first_name: string; last_name: string; current_grade: number; class_label: string | null;
  preferred_language: string | null; login_code: string | null; fet_subjects: string[];
}
export interface SessionRow {
  id: string; learner_id: string; touchpoint: Touchpoint; instrument_version: string; status: SessionStatus;
  item_order: ItemPlan | null; started_at: string | null; completed_at: string | null;
  stage: string; progress: Record<string, unknown>; locked_at: string | null;
}
export interface ItemResponseRow {
  session_id: string; item_id: string; value: number | null; value_json: unknown; response_ms: number | null;
  change_count: number; answered_at: string;
}
export interface MarkRow { learner_id: string; grade: number; term_label: string; subject: string; percentage: number; source: "school_import" | "self_report"; is_estimate: boolean }
export interface ScoreProfileRow { session_id: string; norm_state: string; quality_status: string; profile: ScoreProfile; computed_at: string; engine_version: string }
export interface MessageRow { id: number; session_id: string; role: "learner" | "guide" | "system"; question_ref: string | null; content: string; safety_risk: "none" | "soft" | "hard" | null; created_at: string }
export interface ReportRow {
  id: string; session_id: string; kind: ReportKind; status: ReportStatus; content: unknown; model: string;
  reviewed_by: string | null; reviewed_at: string | null; released_at: string | null; created_at: string;
  meta: Record<string, unknown>; learner_state: Record<string, unknown>;
}
export interface SafeguardingEventRow {
  id: string; session_id: string; learner_id: string; level: "soft" | "hard"; trigger_source: "scored_layer" | "conversation";
  trigger_message_id: number | null; school_notified_at: string | null; school_confirmed_at: string | null;
  escalated_at: string | null; notes: string | null; created_at: string; confirm_token_hash: string | null;
  notification_log: unknown[]; lead_notified_at: string | null; reviewed_by: string | null; reviewed_at: string | null;
}

/** sessions.item_order — the randomised order actually shown (spec 02 §3.2). */
export interface ItemPlan {
  version: string;
  sections: { id: string; items: string[] }[];
}
