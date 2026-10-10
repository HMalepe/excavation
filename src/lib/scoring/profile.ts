/**
 * buildScoreProfile — the single entry point of the scoring engine. Pure: same input,
 * same output, every time (spec 04 §0). Output shape: spec 04 §11.
 */
import { INSTRUMENT_VERSION } from "@/lib/config/questionBank";
import { runCombinationEngine } from "./combinations";
import { contradictionWatch } from "./contradictions";
import { mathsGate } from "./mathsGate";
import { assessQuality } from "./quality";
import {
  readContext, scoreIdentity, scoreInterests, scoreMindset, scoreMotivation, scorePersonality, scoreStudy, scoreValues,
} from "./scales";
import { expandSubjects } from "./subjects";
import type { CombinationResult, ScoreProfile, ScoringInput } from "./types";

export const ENGINE_VERSION = "1.0.0";

export function buildScoreProfile(input: ScoringInput): ScoreProfile {
  const r = input.likert;
  const norms = input.norms ?? { normState: "pre_norm" as const };

  const quality = assessQuality(r, input.meta, input.shownOrder);
  const personality = scorePersonality(r, norms);
  const interests = scoreInterests(r);
  if (quality.straightlined_sections.includes("interests")) interests.excluded_from_recommendations = true;

  const values = scoreValues(input.values);
  const motivation = scoreMotivation(r);
  const mindset = scoreMindset(r);
  const study = scoreStudy(r);
  const identity = scoreIdentity(r, norms);
  const context = readContext(r);

  const marks = Object.fromEntries(
    Object.entries(input.marks.subjects).filter(([, v]) => typeof v === "number"),
  ) as Record<string, number>;

  const trapOnMaths = !!input.conversation?.competenceTrapSubject &&
    expandSubjects(input.conversation.competenceTrapSubject).includes("Mathematics");
  const gate = mathsGate(marks["Mathematics"], mindset, study, trapOnMaths);
  const watch = contradictionWatch({ personality, interests }, marks);

  // The combination engine and maths gate use Senior Phase marks: Grade 9 only (spec 04 §8).
  const isG9 = input.touchpoint === "G9_FOUNDATION";
  const sel = isG9 ? runCombinationEngine({
    riasec: interests.scores,
    interestsExcluded: interests.excluded_from_recommendations,
    flatProfile: interests.flat_profile,
    personality,
    marks,
    gate,
    watch,
    conversation: input.conversation,
    school: input.school,
  }) : { fits: [], cautions: [], ranked: [], offersKnown: false };

  const strip = ({ order: _o, ...c }: CombinationResult & { order?: number }) => c as CombinationResult;
  const combinations = [...sel.fits, ...sel.cautions].map(strip);
  const incomplete = sel.ranked.some((c) => c.flags.includes("marks_incomplete"));

  return {
    learner_id: input.learnerId,
    touchpoint: input.touchpoint,
    instrument_version: INSTRUMENT_VERSION,
    engine_version: ENGINE_VERSION,
    norm_state: norms.normState,
    quality,
    personality,
    interests,
    values,
    motivation,
    mindset,
    study,
    identity,
    context,
    marks: { source: input.marks.source, incomplete, estimates: input.marks.estimates ?? [], ...marks },
    combinations,
    ranking: sel.ranked.map((c) => ({ id: c.id, score: c.score, interest_fit: c.interest_fit, readiness: c.readiness, trait_fit: c.trait_fit, adjustments: c.adjustments })),
    school_offers_known: sel.offersKnown,
    maths_gate: isG9 ? gate : null,
    contradiction_watch: watch,
    deltas: null,
  };
}
