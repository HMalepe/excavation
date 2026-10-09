/** Helpers to build full scored-layer response sets. */
import { questionBank } from "@/lib/config/questionBank";
import type { LikertResponses } from "@/lib/scoring/types";

export const allLikertIds = () => questionBank.scales.flatMap((s) => (s.items ?? []).map((i) => i.id));

/** Every item = v (context items capped at 3); attention checks answered correctly. */
export function uniform(v: number, extra: LikertResponses = {}): LikertResponses {
  const r: LikertResponses = {};
  for (const s of questionBank.scales) for (const it of s.items ?? []) r[it.id] = s.scale_id === "CONTEXT" ? Math.min(v, 3) : v;
  r.AC1 = 4; r.AC2 = 2;
  return { ...r, ...extra };
}

/** Deterministic, varied answers (no straight-lining) for a realistic profile. */
export function varied(seed = 7): LikertResponses {
  let x = seed;
  const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const r: LikertResponses = {};
  for (const s of questionBank.scales) for (const it of s.items ?? []) r[it.id] = s.scale_id === "CONTEXT" ? 1 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 5);
  r.AC1 = 4; r.AC2 = 2;
  return r;
}
