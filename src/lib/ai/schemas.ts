/**
 * JSON schemas for every structured AI output (spec 07 §4–§7) as Zod. Shapes match the spec.
 * Length limits ("60–90 words") are NOT encoded here — they're checked by reportLint.ts so a
 * near-miss can be fed back to the model in the one allowed retry (spec 07 §1).
 */
import { z } from "zod";

// ---- 3A safety screen ----
export const SafetySchema = z.object({ risk: z.enum(["none", "soft", "hard"]), reason: z.string() });
export type Safety = z.infer<typeof SafetySchema>;

// ---- §4 signals (Grade 9) ----
const nstr = z.string().nullable();
export const SignalsG9Schema = z.object({
  flow_states: z.array(z.object({ when: z.string(), activity: z.string(), quote: z.string(), element: z.enum(["making", "figuring_out", "people", "winning", "performing", "other"]) })),
  energy_gains: z.array(z.string()),
  energy_drains: z.array(z.string()),
  competence_trap: z.object({ subject_or_activity: nstr, quote: nstr }),
  unpressured_subject_choice: z.array(z.string()),
  career_mentions: z.array(z.object({ career: z.string(), source: z.enum(["self", "parent", "teacher", "peers", "media", "other"]), quote: z.string() })),
  contradictions: z.array(z.object({
    watch_id: z.string().nullable().describe("id from score_context.contradiction_watch, e.g. E_LOW_S_HIGH, or null"),
    score_signal: z.string(), conversation_signal: z.string(),
    learner_says_truer: z.enum(["score", "conversation", "both", "unclear"]),
  })),
  values_story: nstr,
  righteous_anger: nstr,
  raw_material: z.array(z.string()),
  q2_most_myself: nstr,
  q19_future_tuesday: nstr,
  engagement: z.enum(["high", "medium", "low"]),
  wellbeing_flag: z.boolean(),
});
export type SignalsG9 = z.infer<typeof SignalsG9Schema>;

// ---- spec 05 §5 Grade 11 additions ----
export const SignalsG11Schema = SignalsG9Schema.extend({
  self_reported_change: nstr,
  g9_most_myself_still_true: z.object({ answer: z.enum(["yes", "partly", "no", "unknown"]), new_phrasing: nstr }),
  subject_attributions: z.array(z.object({
    subject: z.string(),
    attribution: z.enum(["subject_itself", "teacher_class", "performance", "mixed"]),
    sentiment: z.enum(["positive", "negative", "mixed"]),
  })),
  failure_story: z.array(z.object({
    subject: z.string(), onset: nstr, tried_so_far: nstr, own_explanation: nstr,
    supports_cause: z.enum(["foundation_gap", "study_method", "teaching_environment", "circumstances", "fit", "wellbeing"]).nullable(),
  })),
  current_direction: nstr,
  direction_source: z.enum(["self", "family", "friends", "money", "teacher", "other", "unclear"]).nullable(),
  institution_named: nstr,
  exploration_evidence: z.array(z.string()),
  unpressured_direction: nstr,
  future_tuesday_changes: nstr,
  fear_of_change: nstr,
  fear_of_staying: nstr,
  committed_decision: nstr,
  by_when: nstr,
});
export type SignalsG11 = z.infer<typeof SignalsG11Schema>;

// ---- §5 Grade 9 report ----
const Archetype = z.enum(["scene", "reversal", "confession", "direct_address", "shared_secret", "question_back"]);
export const ReportG9Schema = z.object({
  headline: z.object({ text: z.string(), archetype: Archetype }),
  shape: z.object({ interests_plain: z.string(), personality_plain: z.string(), values_plain: z.string(), quality_note: nstr }),
  who_you_are: z.string(),
  how_you_work: z.string(),
  subject_options: z.object({
    fits: z.array(z.object({ combination_id: z.string(), name: z.string(), why: z.string(), doors_open: z.array(z.string()), doors_closed: z.array(z.string()), readiness_note: z.string() })),
    cautions: z.array(z.object({ combination_id: z.string(), type: z.enum(["competence_trap", "stretch"]), why: z.string() })),
    maths_gate: z.string(),
    school_check: z.string(),
  }),
  pattern_to_watch: z.object({ name: z.string(), how_it_shows_up: z.string(), early_warning: z.string(), counter_move: z.string() }),
  first_move: z.object({ action: z.string(), by_when: z.string() }),
  grade11_question: z.string(),
  closing_line: z.string(),
});
export type ReportG9 = z.infer<typeof ReportG9Schema>;

// ---- §6 Grade 11 report ----
export const ReportG11Schema = z.object({
  headline: z.object({ text: z.string(), archetype: z.string() }),
  two_years: z.object({ what_stayed: z.array(z.string()), what_moved: z.array(z.string()), identity_shift: z.string() }),
  subjects: z.array(z.object({ subject: z.string(), quadrant: z.enum(["CONFIRM", "RESCUE", "RETHINK", "REDIRECT"]), plain: z.string() })),
  verdict: z.object({ code: z.enum(["CONFIRM", "RESCUE", "RETHINK", "ADJUST_ONE", "REDIRECT", "REDIRECT_AFTER_MATRIC"]), headline: z.string(), explanation: z.string() }),
  pathway: z.object({ pass_type_now: z.string(), gap_to_next: z.string(), aps_note: z.string(), grade11_finals_note: z.string(), career_check: z.string() }),
  plan: z.array(z.object({ action: z.string(), by_when: z.string(), who: z.string() })),
  pattern_to_watch: z.object({ name: z.string(), how_it_shows_up: z.string(), counter_move: z.string() }),
  first_move: z.object({ action: z.string(), by_when: z.string() }),
  closing_line: z.string(),
});
export type ReportG11 = z.infer<typeof ReportG11Schema>;

// ---- §7 teacher + parent ----
export const TeacherSchema = z.object({
  learner_first_name: z.string(), touchpoint: z.enum(["G9", "G11"]), learns_best_when: z.string(),
  strengths: z.array(z.string()), recommendation: z.string(), flags: z.array(z.string()),
  one_thing_that_helps: z.string(), quality_note: nstr,
});
export type TeacherSummary = z.infer<typeof TeacherSchema>;

export const ParentSchema = z.object({
  at_their_best: z.array(z.string()), recommendation_plain: z.string(),
  what_they_need_from_home: z.array(z.string()), questions_to_ask: z.array(z.string()),
});
export type ParentSummary = z.infer<typeof ParentSchema>;
