/**
 * spec 04 §2–§6: personality, interests (RIASEC), values, motivation (RAI), mindset, study,
 * identity status, direction flags, context.
 */
import { itemsOf } from "@/lib/config/questionBank";
import { RIASEC, type RiasecType } from "@/lib/config/subjectMap";
import { meanKeyed, minAnswered, scoreItems, scoreScale } from "./items";
import type { Band3, LikertResponses, NormContext, ScoreProfile, ValuesSort, YNS } from "./types";

// ---------- percentiles (after norming) ----------
/** Percentile (0..100) of a score given 101 ascending cut points p0..p100. */
export function percentileOf(score: number, cuts: number[]): number {
  let p = 0;
  for (let i = 0; i < cuts.length; i++) if (score >= cuts[i]!) p = i;
  return p;
}

// ---------- §2 Personality ----------
export const PERSONALITY = { O: "P_O", C: "P_C", E: "P_E", A: "P_A", N: "P_N" } as const;
export type BigFive = keyof typeof PERSONALITY;

export function personalityBand(score: number, scaleId: string, norms?: NormContext): Band3 {
  const cuts = norms?.percentiles?.[scaleId];
  if (norms && norms.normState !== "pre_norm" && cuts) {
    const p = percentileOf(score, cuts);
    return p < 30 ? "low" : p >= 70 ? "high" : "middle"; // bottom 30 / middle 40 / top 30
  }
  return score < 35 ? "low" : score > 65 ? "high" : "middle";
}

export function scorePersonality(r: LikertResponses, norms?: NormContext): ScoreProfile["personality"] {
  const out = { O: null, C: null, E: null, A: null, N: null, bands: {} } as ScoreProfile["personality"];
  for (const k of Object.keys(PERSONALITY) as BigFive[]) {
    const s = scoreScale(PERSONALITY[k], r);
    out[k] = s;
    if (s !== null) out.bands[k] = personalityBand(s, PERSONALITY[k], norms);
  }
  return out;
}

// ---------- §3 Interests ----------
/** Hexagon positions for consistency (R–I–A–S–E–C–R). */
const HEX: Record<RiasecType, number> = { R: 0, I: 1, A: 2, S: 3, E: 4, C: 5 };

export function scoreInterests(r: LikertResponses): ScoreProfile["interests"] {
  const scores = {} as Record<RiasecType, number | null>;
  const loves = {} as Record<RiasecType, number>;
  for (const t of RIASEC) {
    const items = itemsOf(`I_${t}`);
    scores[t] = scoreItems(items, r);
    loves[t] = items.filter((it) => r[it.id] === 5).length;
  }
  const scored = RIASEC.filter((t) => scores[t] !== null);
  // Tie-break 1: more "5 = Love" responses. Tie-break 2: RIASEC order.
  const ranked = [...scored].sort(
    (a, b) => scores[b]! - scores[a]! || loves[b] - loves[a] || HEX[a] - HEX[b],
  );
  const code = ranked.slice(0, 3).join("");
  if (scored.length < RIASEC.length) {
    return { scores, code, elevation: null, differentiation: null, consistency: null, flat_profile: false, no_strong_pull: false, excluded_from_recommendations: true };
  }
  const vals = scored.map((t) => scores[t]!);
  const elevation = Math.max(...vals);
  const differentiation = elevation - Math.min(...vals);
  const d = Math.abs(HEX[ranked[0]!] - HEX[ranked[1]!]);
  const dist = Math.min(d, 6 - d);
  const consistency = dist === 1 ? "high" : dist === 2 ? "medium" : "low";
  return {
    scores, code, elevation, differentiation, consistency,
    flat_profile: differentiation < 20,
    no_strong_pull: elevation < 60,
    excluded_from_recommendations: false,
  };
}

export const RIASEC_FRIENDLY: Record<RiasecType, string> = {
  R: "Builder", I: "Thinker", A: "Creator", S: "Helper", E: "Leader", C: "Organiser",
};

// ---------- §4 Values ----------
export const HIGHER_ORDER = {
  openness_to_change: ["V_SD", "V_ST", "V_HE"],
  self_enhancement: ["V_AC", "V_PO"],
  conservation: ["V_SE", "V_CO", "V_TR"],
  self_transcendence: ["V_BE", "V_UN"],
} as const;
type Cluster = keyof typeof HIGHER_ORDER;

const VALUE_IDS = new Set(Object.values(HIGHER_ORDER).flat() as string[]);

export function validateValuesSort(v: ValuesSort): string | null {
  const all = [...v.top3, ...v.bottom2];
  if (all.some((id) => !VALUE_IDS.has(id))) return "unknown card";
  if (new Set(all).size !== 5) return "a card was used twice";
  return null;
}

export function scoreValues(v: ValuesSort | null): ScoreProfile["values"] {
  if (!v || validateValuesSort(v)) return null;
  const pts: Record<string, number> = {};
  v.top3.forEach((id, i) => (pts[id] = 3 - i)); // rank1 = 3, rank2 = 2, rank3 = 1
  for (const id of v.bottom2) pts[id] = -1;
  const higher_order = Object.fromEntries(
    (Object.keys(HIGHER_ORDER) as Cluster[]).map((c) => [c, HIGHER_ORDER[c].reduce((s, id) => s + (pts[id] ?? 0), 0)]),
  ) as Record<Cluster, number>;
  const sorted = (Object.keys(higher_order) as Cluster[]).sort((a, b) => higher_order[b] - higher_order[a]);
  const dominant = higher_order[sorted[0]!] > higher_order[sorted[1]!] ? sorted[0]! : null;
  return { top3: [...v.top3], bottom2: [...v.bottom2], higher_order, dominant_cluster: dominant };
}

// ---------- §5 Motivation (RAI) ----------
export function scoreMotivation(r: LikertResponses): ScoreProfile["motivation"] {
  const items = itemsOf("MOTIVATION");
  const answered = items.filter((it) => typeof r[it.id] === "number").length;
  if (answered < minAnswered(items.length)) return null;
  const sub = (name: string) => meanKeyed(items.filter((it) => it.subscale === name), r);
  const [intr, iden, intro, ext] = ["intrinsic", "identified", "introjected", "external"].map(sub);
  if ([intr, iden, intro, ext].some((x) => x === null)) return null;
  const rai = 2 * intr! + iden! - intro! - 2 * ext!; // range -12..+12
  const score = Math.round(((rai + 12) / 24) * 100);
  const label = score >= 65 ? "self_driven" : score >= 40 ? "mixed" : "pressure_driven";
  return { rai: Math.round(rai * 100) / 100, score, label };
}

// ---------- §6 Mindset, study ----------
export function scoreMindset(r: LikertResponses): ScoreProfile["mindset"] {
  const score = scoreScale("MINDSET", r);
  if (score === null) return null;
  return { score, band: score < 40 ? "low" : score < 65 ? "moderate" : "growth" };
}

export function scoreStudy(r: LikertResponses): ScoreProfile["study"] {
  const score = scoreScale("STUDY", r);
  if (score === null) return null;
  return { score, band: score < 40 ? "low" : score < 65 ? "moderate" : "high" };
}

// ---------- §6 Identity status ----------
export type IdentityStatus = "achievement" | "moratorium" | "foreclosure" | "diffusion";

export function identityStatus(exploration: number, commitment: number, cut: { exploration: number; commitment: number }): IdentityStatus {
  const e = exploration >= cut.exploration;
  const c = commitment >= cut.commitment;
  return e && c ? "achievement" : e ? "moratorium" : c ? "foreclosure" : "diffusion";
}

export function scoreIdentity(r: LikertResponses, norms?: NormContext): ScoreProfile["identity"] {
  const items = itemsOf("IDENTITY");
  const exploration = scoreItems(items.filter((i) => i.subscale === "exploration"), r);
  const commitment = scoreItems(items.filter((i) => i.subscale === "commitment"), r); // ID10 reverse-keyed
  const cut = norms && norms.normState !== "pre_norm" && norms.identityMedians
    ? norms.identityMedians
    : { exploration: 50, commitment: 50 };
  const status = exploration !== null && commitment !== null ? identityStatus(exploration, commitment, cut) : null;

  const direction_flags: ScoreProfile["identity"]["direction_flags"] = [];
  if ((r.DS1 ?? 0) >= 4) direction_flags.push("parent_led");
  if ((r.DS2 ?? 0) >= 4) direction_flags.push("peer_led");
  if ((r.DS3 ?? 0) >= 4) direction_flags.push("status_led");
  return { exploration, commitment, status, direction_flags };
}

export const IDENTITY_FRIENDLY: Record<IdentityStatus, { name: string; meaning: string }> = {
  achievement: { name: "Clear Path", meaning: "You've looked around and chosen" },
  moratorium: { name: "Explorer", meaning: "You're actively searching — that's healthy" },
  foreclosure: { name: "Early Commitment", meaning: "You've chosen, but haven't tested it yet" },
  diffusion: { name: "Open Field", meaning: "No direction yet — completely normal at 15" },
};

// ---------- Context (never scored into the profile) ----------
const yns = (v: number | null | undefined): YNS => (v === 3 ? "yes" : v === 2 ? "sometimes" : v === 1 ? "no" : null);
export function readContext(r: LikertResponses): ScoreProfile["context"] {
  return { quiet_place: yns(r.CX1), data_access: yns(r.CX2), home_responsibilities: yns(r.CX3) };
}
