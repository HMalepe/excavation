/**
 * spec 07 §2 — the score context object injected into The Guide. The conversation model never
 * sees raw item responses, only this summary in plain words.
 */
import { valueCards } from "@/lib/config/questionBank";
import { RIASEC_FRIENDLY } from "@/lib/scoring/scales";
import type { RiasecType } from "@/lib/config/subjectMap";
import type { ScoreProfile } from "@/lib/scoring/types";

const INTEREST_PLAIN: Record<RiasecType, string> = {
  R: "building and fixing things", I: "figuring things out", A: "making things", S: "helping people",
  E: "leading and selling", C: "organising and admin",
};

const TRAIT_PLAIN: Record<"O" | "C" | "E" | "A" | "N", Record<"low" | "middle" | "high", string>> = {
  O: { high: "very curious", middle: "moderately curious", low: "prefers the familiar" },
  C: { high: "strong follow-through", middle: "medium follow-through", low: "follow-through comes and goes" },
  E: { high: "gets energy from people", middle: "balanced social energy", low: "recharges alone" },
  A: { high: "warm and cooperative", middle: "warm but direct", low: "direct, competitive" },
  N: { high: "feels pressure strongly", middle: "feels pressure sometimes", low: "stays calm under pressure" },
};

export interface Intake { world?: string; right_now?: string; why_here?: string }

export function interestsPlain(p: ScoreProfile): string {
  const s = p.interests.scores;
  const ranked = (Object.keys(s) as RiasecType[]).filter((t) => typeof s[t] === "number").sort((a, b) => s[b]! - s[a]!);
  if (ranked.length < 6) return "interests not clear from the questionnaire";
  const top = ranked.slice(0, 3).map((t) => INTEREST_PLAIN[t]);
  const bottom = ranked.slice(-2).map((t) => INTEREST_PLAIN[t]);
  return `loves ${top.slice(0, -1).join(", ")} and ${top.at(-1)}; not drawn to ${bottom.join(" or ")}`;
}

export function buildScoreContext(p: ScoreProfile, firstName: string, grade: 9 | 11, intake: Intake, language = "English") {
  const s = p.interests.scores;
  const marks = Object.entries(p.marks)
    .filter(([k, v]) => typeof v === "number" && !["source", "incomplete", "estimates"].includes(k))
    .map(([k, v]) => `${k} ${v}`).join(", ");
  return {
    first_name: firstName,
    grade,
    preferred_language: language,
    norm_state: p.norm_state,
    quality: p.quality.status,
    intake,
    interests: {
      code: p.interests.code,
      top_type_name: RIASEC_FRIENDLY[p.interests.code[0] as RiasecType] ?? null,
      flat_profile: p.interests.flat_profile || Math.max(...Object.values(s).map((v) => v ?? 0)) <= 60,
      plain: interestsPlain(p),
    },
    personality_plain: (["O", "A", "N", "C", "E"] as const)
      .filter((k) => p.personality.bands[k])
      .map((k) => TRAIT_PLAIN[k][p.personality.bands[k]!]),
    values_top3: (p.values?.top3 ?? []).map((id) => valueCards.find((c) => c.id === id)?.text ?? id),
    motivation: p.motivation?.label ?? null,
    mindset: p.mindset?.band ?? null,
    study_habits: p.study?.band ?? null,
    identity_status: p.identity.status,
    direction_flags: p.identity.direction_flags,
    career_mentions_from_scored_layer: [] as string[],
    marks_summary: marks,
    top_combination_ids: p.combinations.filter((c) => c.role?.startsWith("fit")).map((c) => c.id),
    contradiction_watch: p.contradiction_watch.map((w) => `[${w.id}] ${w.text}`),
  };
}
export type ScoreContext = ReturnType<typeof buildScoreContext>;
