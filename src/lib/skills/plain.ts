/**
 * Plain-language summary of Part 1 checks + tasters. Used by The Guide's score context, the report
 * writer, the report page/PDF and the teacher summary — so everyone describes the same facts the
 * same way, and no percentage ever reaches a model or a learner. Pure.
 */
import { CHECK_IDS, TASTER_IDS, checkById, tasterById, type CheckId, type TasterId } from "./content";
import type { CheckResult, SkillsResult, TasterResult } from "./types";

export type CheckBand = "strong" | "solid" | "mixed" | "hard going";
export const checkBand = (score: number): CheckBand => (score >= 80 ? "strong" : score >= 60 ? "solid" : score >= 40 ? "mixed" : "hard going");

/** `text` is about the learner (for models and staff); `you` is the same fact addressed to the learner. */
export interface CheckLine { check: CheckId; title: string; status: "used" | "not_used" | "skipped"; band: CheckBand | null; vs_mark: "above" | "in_line" | "below" | null; text: string; you: string; practise: string[] }
export interface TasterLine { id: TasterId; title: string; work: string; reaction: string; text: string; you: string }

export function checkLine(check: CheckId, r: CheckResult | null, mark: number | null | undefined): CheckLine | null {
  if (!r) return null;
  const cfg = checkById(check);
  const base = { check, title: cfg.title, practise: [] as string[] };
  if (r.status === "skipped") return { ...base, status: "skipped", band: null, vs_mark: null, text: `${cfg.title}: skipped.`, you: `${cfg.title}: you skipped it. Nothing changed because of that.` };
  if (!r.reliable || r.score === null) {
    const why = r.reasons.includes("rushed") ? "went very fast" : "was only partly done";
    return { ...base, status: "not_used", band: null, vs_mark: null, text: `${cfg.title}: ${why}, so it wasn't used.`, you: `${cfg.title}: it ${why}, so we didn't use it. Your marks stand as they are.` };
  }
  const band = checkBand(r.score);
  const vs = typeof mark === "number" ? (r.score - mark >= 20 ? "above" : mark - r.score >= 20 ? "below" : "in_line") : null;
  const vsText = vs === "above" ? `, well above the school ${cfg.informs_mark} mark` : vs === "below" ? `, below the school ${cfg.informs_mark} mark` : vs === "in_line" ? ", in line with the school mark" : "";
  const youVs = vs === "above" ? ` — well above your school ${cfg.informs_mark} mark. Your marks may undersell you here.` : vs === "below" ? ". Your school mark is the better guide here." : ".";
  return { ...base, status: "used", band, vs_mark: vs, text: `${cfg.title}: ${band}${vsText}.`, you: `${cfg.title}: ${band}${youVs}`, practise: band === "strong" ? [] : r.missed_topics.slice(0, 3) };
}

export function tasterLine(id: TasterId, r: TasterResult | null): TasterLine | null {
  if (!r) return null;
  const t = tasterById.get(id)!;
  const base = { id, title: t.title, work: t.work };
  if (r.skipped || !r.signal) return { ...base, reaction: "skipped", text: `Skipped "${t.title}" (${t.work}).`, you: "you skipped this one" };
  const reaction = { pull: "loved it and asked for another one", warm: "enjoyed it", neutral: "it was okay", cold: "it left them cold" }[r.signal];
  const you = { pull: "you loved it and asked for another one", warm: "you enjoyed it", neutral: "it was okay for you", cold: "it didn't grab you" }[r.signal];
  const surprise = r.surprise === "up" ? " — much more than they expected" : r.surprise === "down" ? " — much less than they expected" : "";
  const youSurprise = r.surprise === "up" ? " (far more than you expected)" : r.surprise === "down" ? " (far less than you expected)" : "";
  return { ...base, reaction: reaction + surprise, text: `"${t.title}" (${t.work}): ${reaction}${surprise}.`, you: you + youSurprise };
}

/** Structured lines for the report page and PDF. */
export function skillsLines(s: SkillsResult, marks: Record<string, unknown>) {
  return {
    checks: CHECK_IDS.map((c) => checkLine(c, s.checks[c], marks[checkById(c).informs_mark] as number | undefined)).filter((x): x is CheckLine => !!x),
    tasters: TASTER_IDS.map((t) => tasterLine(t, s.tasters[t])).filter((x): x is TasterLine => !!x),
  };
}

/** The compact form given to models (score context, report writer, teacher summary). */
export function skillsPlain(s: SkillsResult | null, marks: Record<string, unknown>) {
  if (!s) return null;
  const { checks, tasters } = skillsLines(s, marks);
  return {
    checks: checks.map((c) => c.text),
    tasters: tasters.map((t) => t.text),
    maths_option_opened_by_check: s.gate_lift !== null,
    marks_undersell: s.marks_undersell,
    reading_support: s.reading_support,
    language_note: s.language_note,
    maths_topics_to_practise: checks.find((c) => c.check === "maths")?.practise ?? [],
  };
}
export type SkillsPlain = NonNullable<ReturnType<typeof skillsPlain>>;
