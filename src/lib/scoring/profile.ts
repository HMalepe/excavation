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
import { liftGate, scoreSkills, tasterWatch } from "@/lib/skills/engine";
import type { SkillsResult } from "@/lib/skills/types";
import type { CombinationResult, ScoreProfile, ScoringInput } from "./types";

/** 1.1.0: readiness checks + taster tasks (raise-only lifts, ±5 taster adjustments). No change without them. */
export const ENGINE_VERSION = "1.1.0";

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
  // The combination engine and maths gate use Senior Phase marks: Grade 9 only (spec 04 §8).
  const isG9 = input.touchpoint === "G9_FOUNDATION";

  // Readiness checks + tasters (Grade 9). Raise-only: they can lift marks and the gate, never lower.
  const skillsBase = isG9 && input.skills ? scoreSkills(input.skills, marks) : null;
  // Combinations keep the marks-based gate for their maths choice ("Either" → Maths Lit when marks
  // say so): switching them to Mathematics would LOWER their readiness, and checks may only raise.
  // The lifted gate is what the learner sees: it opens the Mathematics option, it doesn't impose it.
  const marksGate = mathsGate(marks["Mathematics"], mindset, study, trapOnMaths);
  const { gate, lift: gateLift } = skillsBase
    ? liftGate(marksGate, marks["Mathematics"], skillsBase.checks.maths)
    : { gate: marksGate, lift: null as SkillsResult["gate_lift"] };
  const lifted = skillsBase?.lifts.length ? Object.fromEntries(skillsBase.lifts.map((l) => [l.subject, l.effective])) : undefined;
  const watch = contradictionWatch({ personality, interests }, marks);

  const sel = isG9 ? runCombinationEngine({
    riasec: interests.scores,
    interestsExcluded: interests.excluded_from_recommendations,
    flatProfile: interests.flat_profile,
    personality,
    marks,
    gate: marksGate,
    watch,
    conversation: input.conversation,
    school: input.school,
    liftedMarks: lifted,
    tasters: skillsBase?.tasters,
  }) : { fits: [], cautions: [], ranked: [], offersKnown: false };

  const skills: SkillsResult | null = skillsBase ? { ...skillsBase, gate_lift: gateLift } : null;
  if (skills) watch.push(...tasterWatch(skills.tasters, sel.ranked, sel.fits.map((f) => f.id)));

  const strip = (c: CombinationResult & { order?: number }): CombinationResult => { const rest = { ...c }; delete rest.order; return rest; };
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
    skills,
  };
}
