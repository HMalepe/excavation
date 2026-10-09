/** Types for the Grade 11 verdict engine (spec 06). Pure data. */
import type { RiasecType } from "@/lib/config/subjectMap";
import type { DoorStatus } from "@/lib/scoring/types";

export type Quadrant = "CONFIRM" | "RESCUE" | "RETHINK" | "REDIRECT";
export type VerdictCode = "CONFIRM" | "RESCUE" | "RETHINK" | "ADJUST_ONE" | "REDIRECT" | "REDIRECT_AFTER_MATRIC";
export type MathsVerdict = Quadrant | "RESCUE_REQUIRED" | "REDIRECT_TO_MATHS_LIT" | "NOT_APPLICABLE";
export type PerformanceBand = "strong" | "secure" | "at_risk_falling" | "at_risk_rising" | "at_risk" | "failing";
export type FitBand = "high" | "borderline" | "low";
export type Cause = "foundation_gap" | "study_method" | "teaching_environment" | "circumstances" | "fit" | "wellbeing";
export type Attribution = "subject_itself" | "teacher_class" | "performance" | "mixed";
export type Who = "you" | "LO teacher" | "subject teacher" | "family" | "you + subject teacher" | "you + LO teacher";

export interface SubjectInput {
  subject: string;
  /** Grade 10 final (null if unknown → trend 0). */
  m10: number | null;
  /** Latest Grade 11 term mark. */
  m11: number;
  /** SUBJECT_EXPERIENCE raw answers SE1..SE6 (null for languages if not asked). */
  se?: Partial<Record<"SE1" | "SE2" | "SE3" | "SE4" | "SE5" | "SE6", number>>;
  /** FAILURE_CAUSE raw answers FC1..FC6 (only for subjects < 50%). */
  fc?: Partial<Record<"FC1" | "FC2" | "FC3" | "FC4" | "FC5" | "FC6", number>>;
}

export interface SubjectSignal {
  attribution?: Attribution;
  /** How the learner talks about the subject itself. */
  sentiment?: "positive" | "negative" | "mixed";
  /** Cause the failure story supports (tie-break for failure cause). */
  story_cause?: Cause | null;
}

export interface SchoolSwitchInfo {
  /** subject_change_deadline_g11 (ISO date) or null if not uploaded. */
  deadline: string | null;
  /** FET subjects the school offers; empty = not uploaded. */
  offeredSubjects: string[];
  /** School-confirmed timetable feasibility per subject (true/false); missing = unknown. */
  timetableAllows: Record<string, boolean>;
  /** Raised "adequate" thresholds per subject (default 50). */
  performanceOverrides?: Record<string, number>;
}

export interface InstitutionRule {
  institution: string;
  programme: string;
  aps_method: { best?: number; include_lo?: boolean; lo_points_factor?: number; multipliers?: Record<string, number> };
  min_aps?: number | null;
  subject_minimums?: Record<string, number>;
}

export interface VerdictInput {
  today: string; // ISO date — passed in so the engine stays pure
  subjects: SubjectInput[];
  /** Life Orientation mark (only used if an institution rule includes LO). */
  lifeOrientation?: number | null;
  riasec: Record<RiasecType, number>;
  riasecCode: string;
  stressSensitivity: number | null;
  directionFlags: string[];
  /** Current direction: G11 conversation Q9 + CU1 free text. */
  currentDirection: string | null;
  signals?: { subjects?: Record<string, SubjectSignal>; wellbeing_flag?: boolean };
  school: SchoolSwitchInfo;
  institutionRule?: InstitutionRule | null;
}

export interface SubjectResult {
  subject: string;
  m10: number | null;
  m11: number;
  trend: number;
  band: PerformanceBand;
  performance_adequate: boolean;
  experience_fit: number | null;
  competence: number | null;
  profile_fit: number;
  subject_fit: number;
  fit_band_raw: FitBand;
  fit_band: "high" | "low";
  quadrant: Quadrant;
  cause: Cause | null;
  secondary_cause: Cause | null;
  attribution: Attribution | null;
  is_language: boolean;
  is_maths: boolean;
}

export interface PlanAction { text: string; who: Who; by_when: string }
export interface Plan { kind: string; subject?: string; cause?: Cause | "not_measured"; actions: PlanAction[] }

export interface CareerPathwayCheck {
  pathway: string;
  name: string;
  status: DoorStatus;
  missing: string[];
  routes: string[];
}

export interface VerdictResult {
  verdict: VerdictCode;
  hold_redirect: boolean;
  wellbeing_path: boolean;
  subjects: SubjectResult[];
  maths_verdict: MathsVerdict;
  rule_trace: string[];
  switch_window: { known: boolean; open: boolean; deadline: string | null };
  career_check: {
    direction: string | null;
    not_sure: boolean;
    pathways: CareerPathwayCheck[];
    parent_led_low_fit: boolean;
    exploration_actions: string[];
  };
  pass_projection: { current: string | null; current_label: string; next: string | null; next_label: string | null; gaps: { subject: string; from: number; to: number }[] };
  aps_projection: { method: string; value: number; institution?: { name: string; programme: string; value: number; min_aps: number | null } };
  plans: Plan[];
  engine_version: string;
}
