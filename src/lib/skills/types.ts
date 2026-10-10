import type { CheckId, TasterId } from "./content";
import type { MathsRecommendation } from "@/lib/scoring/types";

/** Which variant of each unit a learner gets, and the order of the taster tasks. Stored in sessions.progress. */
export interface SkillsPlan {
  checks: Record<CheckId, string[]>;   // variant ids, unit order (easy → hard)
  order: CheckId[];
  tasters: TasterId[];
}

/** One answer to a check item. choice = original option index, -1 = "I'm not sure". */
export interface CheckAnswer { choice: number; ms: number | null }

export interface CheckInput {
  /** Item ids that were served (all items of the planned variants). */
  served: string[];
  answers: Record<string, CheckAnswer>;
  /** The learner chose "skip this check" (no penalty — the checks can only raise). */
  skipped: boolean;
}

export interface TasterInput {
  skipped: boolean;
  before: number | null;             // 1..5 expected enjoyment
  after: number | null;              // 1..5 actual enjoyment
  steps: (number | null)[];          // chosen option index per step
  ms: number | null;                 // time on the main task
  bonus: { steps: (number | null)[]; after: number | null } | null;  // they asked for another one
}

export interface SkillsInput {
  checks: Partial<Record<CheckId, CheckInput>>;
  tasters: Partial<Record<TasterId, TasterInput>>;
}

export interface CheckResult {
  status: "done" | "partial" | "skipped";
  n_served: number;
  n_answered: number;
  n_correct: number;
  n_not_sure: number;
  /** % correct of items served (unanswered = not correct). null when skipped. */
  score: number | null;
  median_ms: number | null;
  /** Reliable enough to lift anything: answered ≥ 70%, not rushed. */
  reliable: boolean;
  reasons: string[];
  /** Topics with a wrong / not-sure answer (for the learner's plan and, if shared, the teacher). */
  missed_topics: string[];
}

export type TasterSignal = "pull" | "warm" | "neutral" | "cold";

export interface TasterResult {
  skipped: boolean;
  before: number | null;
  after: number | null;
  bonus_taken: boolean;
  bonus_after: number | null;
  correct: number;
  scored_steps: number;
  /** "up" = enjoyed it much more than expected; "down" = much less. */
  surprise: "up" | "down" | null;
  signal: TasterSignal | null;
  /** 0..100: after-enjoyment (85) + asked for another (15). Logged for validation; not used directly. */
  engagement: number | null;
}

export interface MarkLift {
  check: CheckId;
  subject: string;
  mark: number;
  check_score: number;
  effective: number;
}

export interface SkillsResult {
  version: string;
  checks: Record<CheckId, CheckResult | null>;
  /** Marks raised for readiness (raise-only, capped). */
  lifts: MarkLift[];
  /** Subjects where a reliable check beat the school mark by ≥ 20 points. */
  marks_undersell: string[];
  /** Reliable reading check below 50%. */
  reading_support: boolean;
  /** Reading support AND a weak maths mark or check: language may be part of the maths story. */
  language_note: boolean;
  tasters: Record<TasterId, TasterResult | null>;
  gate_lift: { from: MathsRecommendation; to: MathsRecommendation; check_score: number } | null;
}
