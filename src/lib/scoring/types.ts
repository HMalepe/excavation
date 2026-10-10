/**
 * Types for the deterministic scoring engine (spec 04). Pure data — no I/O.
 * The ScoreProfile shape follows spec 04 §11 exactly, with documented additions.
 */
import type { RiasecType } from "@/lib/config/subjectMap";
import type { SkillsInput, SkillsResult } from "@/lib/skills/types";

export type Touchpoint = "G9_FOUNDATION" | "G11_CONFIRMATION";
export type NormState = "pre_norm" | "emerging_norm" | "established_norm";
export type Band3 = "low" | "middle" | "high";
export type QualityStatus = "ok" | "caution" | "invalid";

/** Raw Likert answers keyed by item id (1..5, or 1..3 for CONTEXT). null/undefined = skipped. */
export type LikertResponses = Record<string, number | null | undefined>;

/** Per-item telemetry used only for quality checks (spec 02 §3.6). Never shown to anyone. */
export interface ItemMeta {
  ms?: number | null;
  changes?: number;
}

export interface ValuesSort {
  top3: [string, string, string];
  bottom2: [string, string];
}

export interface MarksInput {
  source: "school_import" | "self_report";
  /** Senior Phase subject -> latest term %. */
  subjects: Record<string, number | null | undefined>;
  estimates?: string[];
}

/** Display order actually shown, per administration section (for straight-lining). */
export type ShownOrder = Partial<Record<SectionId, string[]>>;
export type SectionId = "interests" | "personality" | "motivation" | "mindset" | "identity" | "direction" | "study" | "context";

/** Conversation-derived adjustments (spec 04 §8.4, 10 Step 5). Each is capped at ±5 and logged. */
export interface ConversationAdjustments {
  /** Q20 subjects (FET names after normalisation). */
  unpressuredSubjects?: string[];
  /** Q12 subject the learner is good at but doesn't enjoy. */
  competenceTrapSubject?: string | null;
  /** Learner's resolution of contradiction_watch items. */
  contradictionResolutions?: { watchId: string; learnerSaysTruer: "score" | "conversation" | "both" | "unclear" }[];
}

export interface SchoolOverrides {
  /** Empty or undefined = school has not uploaded; use all and tell the learner to check. */
  offeredCombinationIds?: string[];
  /** Replaces the default rule for a subject: {"Physical Sciences": {"needs": {"Natural Sciences": 60}}} */
  readinessOverrides?: Record<string, { needs: Record<string, number> }>;
}

export interface NormContext {
  normState: NormState;
  /** Medians for identity cut-offs once normed (spec 04 §6). */
  identityMedians?: { exploration: number; commitment: number };
  /** Percentile cut points per scale id (101 values: p0..p100) once normed. */
  percentiles?: Record<string, number[]>;
}

export interface ScoringInput {
  learnerId: string;
  touchpoint: Touchpoint;
  likert: LikertResponses;
  meta?: Record<string, ItemMeta>;
  shownOrder?: ShownOrder;
  values: ValuesSort | null;
  marks: MarksInput;
  conversation?: ConversationAdjustments;
  school?: SchoolOverrides;
  norms?: NormContext;
  /** Senior Phase restarted within the session (scored-layer soft trigger). */
  restartedInSession?: boolean;
  /** Addition (2026-10): readiness checks + taster tasks. Absent = engine behaves exactly as spec 04. */
  skills?: SkillsInput;
}

export interface QualityResult {
  status: QualityStatus;
  flags: string[];
  attention_failures: number;
  straightlined_sections: SectionId[];
  contradiction_pairs: string[];
  median_item_ms: number | null;
}

export type DoorStatus = "open" | "partly_open" | "closed";

export interface CombinationResult {
  id: string;
  name: string;
  family: "STEM" | "BUSINESS" | "ARTS" | "HUMANITIES";
  subjects: { maths: "Mathematics" | "Mathematical Literacy"; electives: string[] };
  interest_fit: number;
  readiness: number;
  readiness_detail: Record<string, { readiness: number; limiting: string | null; missing: boolean; lifted?: boolean }>;
  trait_fit: number;
  score: number;
  q20_count: number;
  adjustments: string[];
  doors: Record<string, DoorStatus>;
  flags: string[];
  role?: "fit_1" | "fit_2" | "fit_3" | "caution";
  label?: "keeps_most_doors_open";
  caution_type?: "competence_trap" | "stretch";
}

export type MathsRecommendation = "mathematics" | "mathematics_with_support" | "both_options" | "maths_lit_safer";

export interface MathsGate {
  recommendation: MathsRecommendation;
  reason: string;
  /** Pathways closed (true) or partly closed ("partial") by Maths Lit, from config. */
  closed_by_maths_lit: string[];
  partly_closed_by_maths_lit: string[];
  support_plan: string[] | null;
  competence_trap_on_maths: boolean;
}

export interface ContradictionWatch {
  id: string;
  text: string;
}

export interface Deltas {
  personality: Record<"O" | "C" | "E" | "A" | "N", DeltaItem>;
  interests: Record<RiasecType, DeltaItem>;
  code: { from: string; to: string; first_letter_changed: boolean; shared_letters: number; shifted_a_lot: boolean };
  identity: { from: string; to: string; changed: boolean; framing: string | null };
  values: { from: string[]; to: string[]; shared_top3: number; moved: boolean };
  motivation: DeltaItem;
  mindset: DeltaItem;
  study: DeltaItem;
}
export interface DeltaItem {
  from: number | null;
  to: number | null;
  delta: number | null;
  moved: boolean;
  direction: "up" | "down" | "same" | null;
}

export interface ScoreProfile {
  learner_id: string;
  touchpoint: Touchpoint;
  instrument_version: string;
  engine_version: string;
  norm_state: NormState;
  quality: QualityResult;
  personality: {
    O: number | null; C: number | null; E: number | null; A: number | null; N: number | null;
    bands: Partial<Record<"O" | "C" | "E" | "A" | "N", Band3>>;
  };
  interests: {
    scores: Record<RiasecType, number | null>;
    code: string;
    elevation: number | null;
    differentiation: number | null;
    consistency: "high" | "medium" | "low" | null;
    flat_profile: boolean;
    no_strong_pull: boolean;
    excluded_from_recommendations: boolean;
  };
  values: {
    top3: string[];
    bottom2: string[];
    higher_order: Record<"openness_to_change" | "self_enhancement" | "conservation" | "self_transcendence", number>;
    dominant_cluster: string | null;
  } | null;
  motivation: { rai: number; score: number; label: "self_driven" | "mixed" | "pressure_driven" } | null;
  mindset: { score: number; band: "low" | "moderate" | "growth" } | null;
  study: { score: number; band: "low" | "moderate" | "high" } | null;
  identity: {
    exploration: number | null;
    commitment: number | null;
    status: "achievement" | "moratorium" | "foreclosure" | "diffusion" | null;
    direction_flags: ("parent_led" | "peer_led" | "status_led")[];
  };
  context: { quiet_place: YNS; data_access: YNS; home_responsibilities: YNS };
  marks: { source: "school_import" | "self_report"; incomplete: boolean; estimates: string[] } & Record<string, unknown>;
  combinations: CombinationResult[];
  /** Addition: full ranked list (staff review + audit trail). */
  ranking: Pick<CombinationResult, "id" | "score" | "interest_fit" | "readiness" | "trait_fit" | "adjustments">[];
  school_offers_known: boolean;
  /** Grade 9 only; Grade 11 uses the verdict engine instead. */
  maths_gate: MathsGate | null;
  contradiction_watch: ContradictionWatch[];
  deltas: Deltas | null;
  /** Addition (2026-10): readiness checks + taster tasks; null when not taken (or Grade 11). */
  skills: SkillsResult | null;
}
export type YNS = "yes" | "sometimes" | "no" | null;
