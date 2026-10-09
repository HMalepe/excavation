/** spec 06 §5 — career-target check (runs for every verdict). */
import keywords from "@config/career_keywords.json";
import { pathwayById } from "@/lib/config/subjectMap";
import { doorStatus } from "@/lib/scoring/doors";
import type { CareerPathwayCheck } from "./types";

const KW = Object.entries(keywords).filter(([k]) => !k.startsWith("_")) as [string, string[]][];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Pathway families named in free text, in order of first mention; nested matches are dropped. */
export function matchPathways(text: string | null): string[] {
  if (!text) return [];
  const t = text.toLowerCase();
  const hits: { id: string; start: number; end: number }[] = [];
  for (const [id, words] of KW) for (const w of words) {
    const re = new RegExp(w.length <= 3 ? `\\b${esc(w)}\\b` : `\\b${esc(w)}`, "g");
    for (const m of t.matchAll(re)) hits.push({ id, start: m.index!, end: m.index! + w.length });
  }
  const kept = hits.filter((h) => !hits.some((o) => o !== h && o.start <= h.start && o.end >= h.end && o.end - o.start > h.end - h.start));
  kept.sort((a, b) => a.start - b.start);
  return [...new Set(kept.map((h) => h.id))];
}

export const NOT_SURE = /\b(not sure|don'?t know|no idea|unsure|still deciding|i still don'?t know|undecided)\b/i;

/** Top pathways per RIASEC letter, for learners who aren't sure yet. */
const RIASEC_PATHWAYS: Record<string, string[]> = {
  R: ["ENGINEERING", "TVET_TRADES", "BUILT_ENV"], I: ["SCIENCES", "MED_HEALTH", "COMPSCI"], A: ["CREATIVE", "BUILT_ENV"],
  S: ["HUMANITIES", "EDUCATION", "NURSING"], E: ["COMMERCE", "LAW"], C: ["ACTUARIAL_CA", "COMMERCE"],
};
export function pathwaysFromCode(code: string): string[] {
  const out: string[] = [];
  for (const ch of code) {
    const p = RIASEC_PATHWAYS[ch]?.find((x) => !out.includes(x));
    if (p) out.push(p);
  }
  return out.slice(0, 3);
}

/** Honest routes when a required subject is missing. Every route must be verified before publishing. */
export function gapRoutes(missing: string[], switchOpen: boolean): string[] {
  const routes: string[] = [];
  if (switchOpen) routes.push(`Switch to ${missing.join(" and ")} now, while your school still allows changes.`);
  routes.push("Look for extended or bridging programmes (an extra foundation year) at universities that offer them.");
  routes.push(`Upgrade or add ${missing.join(" and ")} after matric, e.g. through the department's Second Chance Matric Programme.`);
  routes.push("Explore TVET college routes into the same field.");
  routes.push("Look at related careers your current subjects already keep open.");
  return routes;
}

const REQUIRES_SUBJECT = /^(Mathematics|Physical Sciences|Life Sciences)$/;

export function checkPathways(ids: string[], subjects: string[], switchOpen: boolean): CareerPathwayCheck[] {
  return ids.map((id) => {
    const p = pathwayById.get(id)!;
    const status = doorStatus(p, subjects);
    const missing: string[] = [];
    for (const r of p.typical_requires) {
      if (REQUIRES_SUBJECT.test(r) && !subjects.includes(r)) missing.push(r);
      else if (r === "Mathematics (most degrees)" && !subjects.includes("Mathematics")) missing.push("Mathematics");
      else if (r === "Physical Sciences or Life Sciences" && !subjects.includes("Physical Sciences") && !subjects.includes("Life Sciences")) missing.push(r);
    }
    return { pathway: id, name: p.name, status, missing, routes: status === "open" ? [] : gapRoutes(missing.length ? missing : ["the required subject"], switchOpen) };
  });
}

export const EXPLORATION_ACTIONS = [
  "Talk to one person who works in each of your top three fields about what their actual week looks like.",
  "Spend 30 minutes on each field's university or TVET pages: entry requirements, first-year subjects, where graduates work.",
  "Ask your LO teacher about one job-shadow day or career expo you can attend before the June holidays.",
];
