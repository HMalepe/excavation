/** spec 04 §7 — response quality checks. No learner is ever told they "failed" a check. */
import { questionBank, itemsOf } from "@/lib/config/questionBank";
import { RIASEC } from "@/lib/config/subjectMap";
import { median } from "./items";
import type { ItemMeta, LikertResponses, QualityResult, SectionId, ShownOrder } from "./types";

/** Administration sections (spec 02 §3.1). Items are randomised within these, never across. */
export const SECTIONS: Record<SectionId, string[]> = {
  interests: RIASEC.flatMap((t) => itemsOf(`I_${t}`).map((i) => i.id)),
  personality: ["P_O", "P_C", "P_E", "P_A", "P_N"].flatMap((s) => itemsOf(s).map((i) => i.id)),
  motivation: itemsOf("MOTIVATION").map((i) => i.id),
  mindset: itemsOf("MINDSET").map((i) => i.id),
  identity: itemsOf("IDENTITY").map((i) => i.id),
  direction: itemsOf("DIRECTION_SOURCE").map((i) => i.id),
  study: itemsOf("STUDY").map((i) => i.id),
  context: itemsOf("CONTEXT").map((i) => i.id),
};

export const CONTRADICTION_PAIRS: [string, string][] = [
  ["PO1", "PO5"], ["PC2", "PC5"], ["PE1", "PE6"], ["PA4", "PA6"], ["PN1", "PN5"],
];

export const SPEEDING_MEDIAN_MS = 1200;
export const STRAIGHTLINE_SHARE = 0.8;
export const STRAIGHTLINE_MIN_ITEMS = 6;

export function attentionFailures(r: LikertResponses): number {
  // A skipped attention check counts as a failure: the learner did not follow the instruction.
  return questionBank.attention_checks.filter((ac) => r[ac.id] !== ac.expected).length;
}

/** ≥ 80% identical answers in a section of ≥ 6 answered items. */
export function straightlinedSections(r: LikertResponses, shown?: ShownOrder): SectionId[] {
  const out: SectionId[] = [];
  for (const [sec, ids] of Object.entries(SECTIONS) as [SectionId, string[]][]) {
    const order = shown?.[sec] ?? ids;
    const vals = order.map((id) => r[id]).filter((v): v is number => typeof v === "number");
    if (vals.length < STRAIGHTLINE_MIN_ITEMS) continue;
    const counts = new Map<number, number>();
    for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
    if (Math.max(...counts.values()) / vals.length >= STRAIGHTLINE_SHARE) out.push(sec);
  }
  return out;
}

export function contradictionPairs(r: LikertResponses): string[] {
  return CONTRADICTION_PAIRS.filter(([a, b]) => r[a] === 5 && r[b] === 5).map(([a, b]) => `${a}&${b}`);
}

export function medianItemMs(meta?: Record<string, ItemMeta>): number | null {
  if (!meta) return null;
  const scored = new Set(Object.values(SECTIONS).flat());
  const times = Object.entries(meta)
    .filter(([id, m]) => scored.has(id) && typeof m.ms === "number" && m.ms > 0)
    .map(([, m]) => m.ms as number);
  return median(times);
}

export function assessQuality(r: LikertResponses, meta?: Record<string, ItemMeta>, shown?: ShownOrder): QualityResult {
  const flags: string[] = [];
  const af = attentionFailures(r);
  if (af > 0) flags.push(`attention_failed_${af}`);

  const sl = straightlinedSections(r, shown);
  for (const s of sl) flags.push(`straightlining_${s}`);

  const med = medianItemMs(meta);
  const speeding = med !== null && med < SPEEDING_MEDIAN_MS;
  if (speeding) flags.push("speeding");

  const pairs = contradictionPairs(r);
  const manyContradictions = pairs.length >= 3;
  if (manyContradictions) flags.push("contradiction_pairs");

  const status = af >= 2 ? "invalid" : af === 1 || speeding || manyContradictions ? "caution" : "ok";
  return { status, flags, attention_failures: af, straightlined_sections: sl, contradiction_pairs: pairs, median_item_ms: med };
}
