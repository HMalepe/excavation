/**
 * Deterministic checks on AI-written report JSON (spec 07 3D/3F rules, spec 09 §6 language rules).
 * Pure. Problems are fed back to the model in the single retry; if they persist, the report goes to
 * human review with these notes attached.
 */
import type { ReportG11, ReportG9, ParentSummary, TeacherSummary } from "./schemas";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";

export const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** spec 07 3D rule 11 + spec 09 §6. */
export const BANNED: { re: RegExp; label: string }[] = [
  { re: /\bjourney\b/i, label: "journey" },
  { re: /\bunlock(s|ed|ing)?\b/i, label: "unlock" },
  { re: /\byour potential\b|\bpotential\b(?=[.,!]|\s+(is|as|to\s+be))/i, label: "potential (as a noun about them)" },
  { re: /you'?ve got this/i, label: "you've got this" },
  { re: /\bwell done\b/i, label: "well done" },
  { re: /\bcongratulations?\b/i, label: "congratulations" },
  { re: /thanks? (you )?for completing/i, label: "thanks for completing" },
  { re: /\bamazing\b/i, label: "amazing" },
  { re: /\byour true self\b/i, label: "your true self" },
  { re: /\bthe universe\b/i, label: "the universe" },
  { re: /\b(depress(ion|ed)|anxiety disorder|adhd|autis(m|tic)|trauma(tic)?|disorder|diagnos(is|ed|e))\b/i, label: "clinical word" },
  { re: /\bneurotic(ism)?\b|\banxious\b/i, label: "neurotic/anxious (say 'feels pressure strongly')" },
  { re: /\byou can'?t\b|\byou cannot\b|\byou shouldn'?t\b|\bnot suitable for you\b/i, label: "you can't / you shouldn't" },
  { re: /\bweak learner\b|\bfailing\b/i, label: "failing / weak learner (say 'a struggle right now')" },
  { re: /\byou need help\b|\bsee a psychologist\b/i, label: "you need help / see a psychologist" },
  { re: /\bscientifically proven\b|\baccurate assessment\b/i, label: "overclaiming certainty" },
  { re: /\bassessment\b/i, label: "assessment" },
  { re: /\bdelve\b|\btapestry\b|\bresonates?\b|\bnavigat(e|es|ing)\b|\bdig deep\b|\bunpack(ing)?\b/i, label: "stock AI phrasing" },
  { re: /\byour parents are pushing\b|\bpushing you\b/i, label: "blaming family" },
];

const PRE_NORM_COMPARE = /\b(than most|most people|higher than (other|most)|lower than (other|most)|about average)\b/i;
const NUMBERS = /\b\d{1,3}\s?(%|\/100|points?)\b/;

function range(issues: string[], field: string, text: string, min: number, max: number) {
  const n = words(text);
  if (n < Math.floor(min * 0.8) || n > Math.ceil(max * 1.2)) issues.push(`${field}: ${n} words (target ${min}–${max})`);
}
function maxW(issues: string[], field: string, text: string, max: number) {
  const n = words(text);
  if (n > Math.ceil(max * 1.2)) issues.push(`${field}: ${n} words (max ${max})`);
}
function scanBanned(issues: string[], obj: unknown, path = "") {
  if (typeof obj === "string") {
    for (const b of BANNED) if (b.re.test(obj)) issues.push(`${path || "text"}: banned wording — ${b.label}`);
  } else if (Array.isArray(obj)) obj.forEach((v, i) => scanBanned(issues, v, `${path}[${i}]`));
  else if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) scanBanned(issues, v, path ? `${path}.${k}` : k);
}

export function lintG9(r: ReportG9, p: ScoreProfile, rawMaterial: string[]): string[] {
  const issues: string[] = [];
  if (r.headline.text.length > 120) issues.push(`headline: ${r.headline.text.length} chars (max 120)`);
  range(issues, "shape.interests_plain", r.shape.interests_plain, 60, 90);
  range(issues, "shape.personality_plain", r.shape.personality_plain, 60, 90);
  range(issues, "shape.values_plain", r.shape.values_plain, 30, 50);
  range(issues, "who_you_are", r.who_you_are, 120, 180);
  range(issues, "how_you_work", r.how_you_work, 80, 120);
  range(issues, "subject_options.maths_gate", r.subject_options.maths_gate, 40, 80);
  maxW(issues, "first_move.action", r.first_move.action, 50);
  r.subject_options.fits.forEach((f, i) => range(issues, `fits[${i}].why`, f.why, 60, 90));
  r.subject_options.cautions.forEach((c, i) => range(issues, `cautions[${i}].why`, c.why, 40, 70));

  // FIXED engine outputs: same combinations, same order, same caution types (spec 07 3D rule 3).
  const fits = p.combinations.filter((c) => c.role?.startsWith("fit")).map((c) => c.id);
  const cautions = p.combinations.filter((c) => c.role === "caution").map((c) => `${c.id}:${c.caution_type}`);
  if (r.subject_options.fits.map((f) => f.combination_id).join() !== fits.join()) issues.push(`fits must be exactly ${fits.join(", ")} in that order`);
  if (r.subject_options.cautions.map((c) => `${c.combination_id}:${c.type}`).join() !== cautions.join()) issues.push(`cautions must be exactly ${cautions.join(", ") || "none"}`);

  if (p.norm_state === "pre_norm") {
    const shape = Object.values(r.shape).filter((v): v is string => typeof v === "string").join(" ");
    if (PRE_NORM_COMPARE.test(shape)) issues.push("shape: pre_norm — no 'most people' comparisons; use strongly / moderately / less");
  }
  for (const [k, v] of Object.entries({ who_you_are: r.who_you_are, how_you_work: r.how_you_work })) if (NUMBERS.test(v)) issues.push(`${k}: no score numbers outside the shape section`);
  if (p.quality.status === "caution" && !r.shape.quality_note) issues.push("shape.quality_note required when quality is caution");

  const quoted = rawMaterial.filter((q) => q.length > 8 && JSON.stringify(r).toLowerCase().includes(q.toLowerCase().slice(0, 40))).length;
  if (rawMaterial.length >= 3 && quoted < 3) issues.push(`quote the learner's own words at least 3 times (found ${quoted})`);
  if (/\b(thank|congrat|well done)/i.test(r.closing_line)) issues.push("closing_line must not thank or congratulate");
  if (/\b(reflect on|think about)\b/i.test(r.first_move.action)) issues.push("first_move: concrete action, not 'reflect on' / 'think about'");
  scanBanned(issues, r);
  return issues;
}

export function lintG11(r: ReportG11, v: VerdictResult, rawMaterial: string[]): string[] {
  const issues: string[] = [];
  if (r.headline.text.length > 120) issues.push(`headline: ${r.headline.text.length} chars (max 120)`);
  if (r.verdict.code !== v.verdict) issues.push(`verdict.code must be ${v.verdict} — the verdict is fixed`);
  if (r.verdict.headline.length > 80) issues.push("verdict.headline: max 80 chars");
  range(issues, "verdict.explanation", r.verdict.explanation, 100, 150);
  const first = r.verdict.explanation.split(/(?<=[.!?])\s/)[0] ?? "";
  if (!new RegExp(v.verdict.replace(/_/g, "[ _]"), "i").test(first) && !/\b(confirm|rescue|rethink|adjust|redirect)/i.test(first)) issues.push("verdict.explanation: state the verdict in the first sentence");
  if (!(r.two_years.what_stayed.length >= 2 && r.two_years.what_stayed.length <= 4)) issues.push("two_years.what_stayed: 2–4 items");
  if (!(r.two_years.what_moved.length >= 1 && r.two_years.what_moved.length <= 4)) issues.push("two_years.what_moved: 1–4 items (say so if little moved)");
  r.two_years.what_stayed.concat(r.two_years.what_moved).forEach((s, i) => maxW(issues, `two_years item ${i}`, s, 25));
  for (const s of v.subjects) {
    const row = r.subjects.find((x) => x.subject === s.subject);
    if (!row) issues.push(`subjects: missing ${s.subject}`);
    else if (row.quadrant !== s.quadrant) issues.push(`subjects: ${s.subject} quadrant must be ${s.quadrant}`);
    else maxW(issues, `subjects.${s.subject}`, row.plain, 35);
  }
  if (!v.switch_window.known && /\b(you can (still )?(switch|change)|switch(ing)? is (still )?possible)\b/i.test(JSON.stringify(r))) issues.push("switch window unknown: never say a switch is possible — say to ask the LO teacher");
  if (v.hold_redirect && !/trusted adult|talk to/i.test(r.verdict.explanation)) issues.push("hold_redirect: lead with talking to a trusted adult first");
  if (!/prospectus|varies by university|differ/i.test(r.pathway.aps_note)) issues.push("pathway.aps_note must say APS varies by university — check their prospectus");
  if (!/grade 11 final/i.test(r.pathway.grade11_finals_note)) issues.push("pathway.grade11_finals_note must mention Grade 11 finals");
  r.plan.forEach((a, i) => { maxW(issues, `plan[${i}].action`, a.action, 40); if (!a.by_when || !a.who) issues.push(`plan[${i}]: needs by_when and who`); });
  maxW(issues, "first_move.action", r.first_move.action, 50);
  if (/\b(thank|congrat|well done)/i.test(r.closing_line)) issues.push("closing_line must not thank or congratulate");
  const quoted = rawMaterial.filter((q) => q.length > 8 && JSON.stringify(r).toLowerCase().includes(q.toLowerCase().slice(0, 40))).length;
  if (rawMaterial.length >= 3 && quoted < 1) issues.push("quote the learner's own words at least once");
  scanBanned(issues, r);
  return issues;
}

/** spec 07 3G — teacher summaries must never leak sensitive fields. */
export function lintTeacher(t: TeacherSummary): string[] {
  const issues: string[] = [];
  const all = JSON.stringify(t);
  if (words(Object.values(t).flat().filter((x): x is string => typeof x === "string").join(" ")) > 260) issues.push("teacher summary: max 220 words");
  if (/teaching[_ ]environment|the way (it|this subject) is taught|teacher('?s)? (style|approach)/i.test(all)) issues.push("teacher summary must not include teaching-environment causes");
  if (/\b(foreclosure|moratorium|diffusion|achievement status|identity status|early commitment|open field|clear path|explorer)\b/i.test(all)) issues.push("teacher summary must not include identity status labels");
  if (/\b(self-direction|benevolence|universalism|values? card|top value)\b/i.test(all)) issues.push("teacher summary must not include values");
  if (/\b\d{1,3}\s?\/\s?100\b|\b(openness|conscientiousness|extraversion|agreeableness|neuroticism|stress sensitivity)\s*\d/i.test(all)) issues.push("teacher summary must not include personality numbers");
  if (/\b(wellbeing|safeguard|unsafe|counsell|mental health|stress(ed)? or tired)\b/i.test(all)) issues.push("teacher summary must not include wellbeing details");
  if (/\b(mom|mum|dad|father|mother|gran|granny|grandmother|aunt|uncle|family|home)\b/i.test(all)) issues.push("teacher summary must not include family details");
  if (t.strengths.length !== 3) issues.push("teacher summary: exactly 3 strengths");
  scanBanned(issues, t);
  return issues;
}

export function lintParent(p: ParentSummary): string[] {
  const issues: string[] = [];
  const total = words([...p.at_their_best, p.recommendation_plain, ...p.what_they_need_from_home, ...p.questions_to_ask].join(" "));
  if (total > 300) issues.push(`parent summary: ${total} words (max 250)`);
  if (p.at_their_best.length !== 3) issues.push("parent summary: exactly 3 'at their best' points");
  if (p.questions_to_ask.length !== 2) issues.push("parent summary: exactly 2 questions");
  if (/\b(you'?re pushing|your (expectations|pressure)|parent[- ]led|your plan for (him|her|them))\b/i.test(JSON.stringify(p))) issues.push("parent summary must not say the plan comes from family expectations");
  scanBanned(issues, p);
  return issues;
}
