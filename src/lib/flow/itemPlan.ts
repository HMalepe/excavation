/**
 * spec 02 §3 administration rules, as a pure function:
 *  - fixed section order; items randomised WITHIN sections only
 *  - AC1 randomly in the first half, AC2 randomly in the second half (never in optional Context)
 * The plan is generated once per session and stored in sessions.item_order.
 */
import { itemsOf, INSTRUMENT_VERSION } from "@/lib/config/questionBank";
import { RIASEC } from "@/lib/config/subjectMap";
import type { ItemPlan } from "@/lib/db/types";

export const SCORED_SECTIONS = [
  { id: "interests", scales: RIASEC.map((t) => `I_${t}`), title: "What you'd love doing" },
  { id: "personality", scales: ["P_O", "P_C", "P_E", "P_A", "P_N"], title: "How you're wired" },
  { id: "values", scales: ["VALUES"], title: "What matters most" },
  { id: "motivation", scales: ["MOTIVATION"], title: "Why you do schoolwork" },
  { id: "mindset", scales: ["MINDSET"], title: "How you see your brain" },
  { id: "identity", scales: ["IDENTITY"], title: "Where you are with your future" },
  { id: "direction", scales: ["DIRECTION_SOURCE"], title: "Whose plan is it?" },
  { id: "study", scales: ["STUDY"], title: "How you study" },
  { id: "context", scales: ["CONTEXT"], title: "Your study situation" },
] as const;
export type SectionId = (typeof SCORED_SECTIONS)[number]["id"];

export type Rng = () => number; // [0, 1)

export function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Deterministic PRNG for tests and for reproducing a stored plan (mulberry32). */
export function seededRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildItemPlan(rng: Rng): ItemPlan {
  const sections = SCORED_SECTIONS.map((s) => ({
    id: s.id as string,
    items: s.id === "values" ? ["VALUES"] : shuffle(s.scales.flatMap((sc) => itemsOf(sc).map((i) => i.id)), rng),
  }));

  // Positions across the non-optional Likert items (values card sort and context excluded).
  const eligible = sections.filter((s) => s.id !== "values" && s.id !== "context");
  const flat: { sec: number; idx: number }[] = [];
  eligible.forEach((s) => s.items.forEach((_, idx) => flat.push({ sec: sections.indexOf(s), idx })));
  const half = Math.floor(flat.length / 2);
  const p1 = flat[Math.floor(rng() * half)]!;
  const p2 = flat[half + Math.floor(rng() * (flat.length - half))]!;
  // Insert the later one first so the earlier index stays valid.
  sections[p2.sec]!.items.splice(p2.idx, 0, "AC2");
  sections[p1.sec]!.items.splice(p1.idx, 0, "AC1");
  return { version: INSTRUMENT_VERSION, sections };
}

export const sectionTitle = (id: string) => SCORED_SECTIONS.find((s) => s.id === id)?.title ?? id;
export const allPlanItems = (p: ItemPlan) => p.sections.flatMap((s) => s.items).filter((i) => i !== "VALUES");
