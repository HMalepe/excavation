/**
 * Report analytics as a pure view-model: everything the charts draw, derived from the deterministic
 * ScoreProfile (and the Grade 11 verdict). Numbers here are positions for DRAWING; what a learner
 * reads are named bands ("Strong pull", "Solid"), never a percentage, a rank among other people or a
 * percentile (spec 07 rule 2: plain words, and nothing "most people" while the instrument is pre-norm).
 */
import { pathwayName } from "@/lib/scoring/doors";
import { verdictLabel } from "@/lib/verdict/labels";
import { skillsLines } from "@/lib/skills/plain";
import { checkById } from "@/lib/skills/content";
import type { DoorStatus, ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult, Quadrant } from "@/lib/verdict/types";

export const RIASEC = ["R", "I", "A", "S", "E", "C"] as const;
export type Riasec = (typeof RIASEC)[number];
export const RIASEC_NAME: Record<Riasec, string> = { R: "Builder", I: "Thinker", A: "Creator", S: "Helper", E: "Leader", C: "Organiser" };
export const RIASEC_LINE: Record<Riasec, string> = {
  R: "building and fixing", I: "figuring things out", A: "making things", S: "helping and teaching", E: "leading and persuading", C: "organising and getting it exactly right",
};

export type PullBand = "Strong pull" | "Some pull" | "Light pull";
export const pullBand = (v: number): PullBand => (v >= 65 ? "Strong pull" : v >= 45 ? "Some pull" : "Light pull");

export const TRAITS = [
  { key: "O", name: "Curiosity", low: "Sticks to the familiar", high: "Chases new ideas" },
  { key: "C", name: "Follow-through", low: "Goes with the flow", high: "Plans and finishes" },
  { key: "E", name: "Social energy", low: "Recharges alone", high: "Energised by people" },
  { key: "A", name: "Warmth", low: "Direct and tough-minded", high: "Warm and cooperative" },
  { key: "N", name: "Feeling pressure", low: "Steady under pressure", high: "Feels pressure strongly" },
] as const;
type TraitKey = (typeof TRAITS)[number]["key"];

export interface InterestBar { type: Riasec; name: string; level: number; band: PullBand; rank: number }
export interface TraitSpectrum { key: TraitKey; name: string; low: string; high: string; pos: number; read: string }
export interface FitBar { id: string; name: string; role: "fit" | "caution"; rank: number | null; keepsMostDoors: boolean; fit: number; parts: { label: string; level: number }[]; doorsOpen: number; doorsTotal: number; cautionType?: "competence_trap" | "stretch" }
export interface DoorRow { pathway: string; name: string; cells: { id: string; status: DoorStatus }[] }
export interface MarkVsCheck { check: "maths" | "science" | "reading"; title: string; subject: string; mark: number | null; band: string | null; level: number | null; vsMark: "above" | "in_line" | "below" | null }
export interface TasterDot { id: string; title: string; work: string; before: number | null; after: number | null; read: string }
export interface Layer { name: string; icon: string; title: string; finding: string }
export interface Stat { label: string; value: string; note: string; icon: string }
export interface DeltaBar { name: string; from: number; to: number; moved: boolean; direction: "up" | "down" | "same" | null }
export interface SubjectPoint { subject: string; fit: number; mark: number; quadrant: Quadrant }

export interface Insights {
  touchpoint: "G9" | "G11";
  stats: Stat[];
  layers: Layer[];
  interests: InterestBar[];
  radar: Record<Riasec, number>;
  radarBefore: Record<Riasec, number> | null;
  traits: TraitSpectrum[];
  fits: FitBar[];
  combos: { id: string; name: string; caution: boolean }[];
  doors: DoorRow[];
  marksVsChecks: MarkVsCheck[];
  tasters: TasterDot[];
  confidence: { label: "Solid" | "Take with care" | "Low"; level: 1 | 2 | 3; note: string };
  habits: { label: string; value: string; level: 1 | 2 | 3 }[];
  deltas: { interests: DeltaBar[]; traits: DeltaBar[] } | null;
  subjects: SubjectPoint[];
}

const n = (v: number | null | undefined, d = 0) => (typeof v === "number" ? v : d);
const joinNames = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

function traitRead(key: TraitKey, pos: number): string {
  const t = TRAITS.find((x) => x.key === key)!;
  return pos >= 62 ? t.high : pos <= 38 ? t.low : "Somewhere in the middle";
}

function buildDoors(p: ScoreProfile) {
  const shown = p.combinations.filter((c) => c.role);
  const ids = Object.keys(shown[0]?.doors ?? {});
  const rows: DoorRow[] = ids.map((id) => ({ pathway: id, name: pathwayName(id), cells: shown.map((c) => ({ id: c.id, status: c.doors[id] ?? "open" })) }));
  // The interesting rows are the ones that differ between combinations, then the ones that are shut for someone.
  const differs = (r: DoorRow) => new Set(r.cells.map((c) => c.status)).size > 1;
  const score = (r: DoorRow) => (differs(r) ? 2 : r.cells.some((c) => c.status !== "open") ? 1 : 0);
  return { combos: shown.map((c) => ({ id: c.id, name: c.name, caution: c.role === "caution" })), rows: rows.sort((a, b) => score(b) - score(a)).slice(0, 9) };
}

export function buildInsights(args: { profile: ScoreProfile; g9Profile?: ScoreProfile | null; verdict?: VerdictResult | null }): Insights {
  const { profile: p, g9Profile, verdict } = args;
  const g11 = p.touchpoint === "G11_CONFIRMATION";

  const interests: InterestBar[] = RIASEC.map((t) => ({ type: t, name: RIASEC_NAME[t], level: n(p.interests.scores[t]), band: pullBand(n(p.interests.scores[t])), rank: 0 }))
    .sort((a, b) => b.level - a.level).map((x, i) => ({ ...x, rank: i + 1 }));
  const radar = Object.fromEntries(RIASEC.map((t) => [t, n(p.interests.scores[t])])) as Record<Riasec, number>;
  const radarBefore = g9Profile ? (Object.fromEntries(RIASEC.map((t) => [t, n(g9Profile.interests.scores[t])])) as Record<Riasec, number>) : null;

  const traits: TraitSpectrum[] = TRAITS.map((t) => { const pos = n(p.personality[t.key], 50); return { ...t, pos, read: traitRead(t.key, pos) }; });

  const fitCombos = p.combinations.filter((c) => c.role?.startsWith("fit"));
  const cautionCombos = p.combinations.filter((c) => c.role === "caution");
  const doorCount = (c: (typeof p.combinations)[number]) => ({ open: Object.values(c.doors).filter((d) => d === "open").length, total: Object.values(c.doors).length });
  const toFit = (c: (typeof p.combinations)[number], i: number | null): FitBar => ({
    id: c.id, name: c.name, role: c.role === "caution" ? "caution" : "fit", rank: i, keepsMostDoors: c.label === "keeps_most_doors_open", fit: c.score,
    parts: [{ label: "Interests", level: c.interest_fit }, { label: "Marks and readiness", level: c.readiness }, { label: "How you work", level: c.trait_fit }],
    doorsOpen: doorCount(c).open, doorsTotal: doorCount(c).total, cautionType: c.caution_type,
  });
  const fits = [...fitCombos.map((c, i) => toFit(c, i + 1)), ...cautionCombos.map((c) => toFit(c, null))];
  const { combos, rows } = buildDoors(p);

  // Part 1 skills (Grade 9): what the checks showed next to the marks the learner typed in.
  const lines = p.skills ? skillsLines(p.skills, p.marks) : null;
  const LEVEL: Record<string, number> = { strong: 4, solid: 3, mixed: 2, "hard going": 1 };
  const marksVsChecks: MarkVsCheck[] = (lines?.checks ?? []).map((c) => {
    const subject = checkById(c.check).informs_mark;
    const mark = p.marks[subject];
    return { check: c.check, title: c.title, subject, mark: typeof mark === "number" ? mark : null, band: c.band, level: c.band ? LEVEL[c.band]! : null, vsMark: c.vs_mark };
  });
  const tasters: TasterDot[] = (lines?.tasters ?? []).map((t) => {
    const r = p.skills!.tasters[t.id];
    return { id: t.id, title: t.title, work: t.work, before: r?.before ?? null, after: r?.after ?? null, read: t.you };
  });

  const q = p.quality.status;
  const confidence: Insights["confidence"] = q === "ok" && p.norm_state !== "pre_norm"
    ? { label: "Solid", level: 3, note: "Your answers were consistent and complete." }
    : q === "ok"
      ? { label: "Solid", level: 3, note: "Your answers were consistent. This is an early version of The Excavation, so read it as insight, not measurement." }
      : q === "caution"
        ? { label: "Take with care", level: 2, note: "Some answers may have been rushed, so the conversation carried more weight." }
        : { label: "Low", level: 1, note: "Too many answers looked rushed to rely on. Treat this as a starting point." };

  const habits: Insights["habits"] = [];
  if (p.mindset) habits.push({ label: "Belief that effort works", value: p.mindset.band === "growth" ? "Strong" : p.mindset.band === "moderate" ? "Mixed" : "Shaky", level: p.mindset.band === "growth" ? 3 : p.mindset.band === "moderate" ? 2 : 1 });
  if (p.study) habits.push({ label: "Study habits", value: p.study.band === "high" ? "Solid" : p.study.band === "moderate" ? "In the middle" : "Needs building", level: p.study.band === "high" ? 3 : p.study.band === "moderate" ? 2 : 1 });
  if (p.motivation) habits.push({ label: "What drives your schoolwork", value: p.motivation.label === "self_driven" ? "Your own interest" : p.motivation.label === "mixed" ? "A mix" : "Pressure from outside", level: p.motivation.label === "self_driven" ? 3 : p.motivation.label === "mixed" ? 2 : 1 });

  let deltas: Insights["deltas"] = null;
  if (p.deltas) {
    deltas = {
      interests: RIASEC.map((t) => { const d = p.deltas!.interests[t]; return { name: RIASEC_NAME[t], from: n(d.from), to: n(d.to), moved: d.moved, direction: d.direction }; }),
      traits: TRAITS.map((t) => { const d = p.deltas!.personality[t.key]; return { name: t.name, from: n(d.from, 50), to: n(d.to, 50), moved: d.moved, direction: d.direction }; }),
    };
  }
  const subjects: SubjectPoint[] = (verdict?.subjects ?? []).map((s) => ({ subject: s.subject, fit: s.subject_fit, mark: s.m11, quadrant: s.quadrant }));

  // ---- the three headline numbers-in-words, and the five layers of the dig ----
  const top = interests.slice(0, 3);
  const strongest = top[0]!;
  const stats: Stat[] = [];
  if (!g11) {
    const best = fits[0];
    stats.push({ label: "Strongest pull", value: strongest.name, note: p.interests.no_strong_pull ? "Nothing pulled much harder than the rest" : `${strongest.band} · then ${top[1]!.name} and ${top[2]!.name}`, icon: "interests" });
    if (best) stats.push({ label: "Best-fit subjects", value: best.name, note: `Keeps ${best.doorsOpen} of ${best.doorsTotal} career doors open`, icon: "direction" });
    stats.push({ label: "How sure we are", value: confidence.label, note: confidence.note.split(". ")[0]!.replace(/\.$/, ""), icon: "shield" });
  } else if (verdict) {
    const bad = verdict.subjects.filter((s) => s.quadrant !== "CONFIRM").length;
    stats.push({ label: "Your verdict", value: verdictLabel(verdict.verdict), note: `${verdict.subjects.length - bad} of ${verdict.subjects.length} subjects fit and work`, icon: "direction" });
    stats.push({ label: "Pass type now", value: verdict.pass_projection.current_label, note: verdict.pass_projection.next_label ? `Next level: ${verdict.pass_projection.next_label}` : "Top level reached", icon: "chart" });
    stats.push({ label: "Subjects to watch", value: String(bad), note: bad ? joinNames(verdict.subjects.filter((s) => s.quadrant !== "CONFIRM").map((s) => s.subject).slice(0, 3)) : "None right now", icon: "shield" });
  }

  const layers: Layer[] = [
    { name: "Surface", icon: "interests", title: "What you said you enjoy", finding: `${joinNames(top.map((t) => RIASEC_NAME[t.type]))}: you're pulled to ${RIASEC_LINE[strongest.type]} first.` },
    { name: "Wading in", icon: "personality", title: "How you're wired", finding: joinNames(traits.filter((t) => t.read !== "Somewhere in the middle").slice(0, 2).map((t) => t.read.toLowerCase())) || "Mostly in the middle on how you work" },
    { name: "Deep water", icon: "values", title: "What drives you", finding: habits.length ? joinNames(habits.slice(0, 2).map((h) => `${h.label.toLowerCase()}: ${h.value.toLowerCase()}`)) : "Your values and what drives your schoolwork" },
    { name: "The trench", icon: "study", title: g11 ? "What two years of marks show" : "What you can do", finding: g11 ? (verdict ? `${verdict.subjects.filter((s) => s.quadrant === "CONFIRM").length} of ${verdict.subjects.length} subjects both fit and work.` : "Your subjects, honestly") : marksVsChecks.length ? joinNames(marksVsChecks.filter((m) => m.band).map((m) => `${m.title.toLowerCase()}: ${m.band}`)) || "Checks and taster tasks" : "Your marks and what you tried" },
    { name: "The floor", icon: "direction", title: "What we dug up", finding: g11 ? (verdict ? verdictLabel(verdict.verdict) + "." : "") : fits[0] ? `${fits[0].name} is your closest match.` : "Your closest-fitting subjects" },
  ];

  return { touchpoint: g11 ? "G11" : "G9", stats, layers, interests, radar, radarBefore, traits, fits, combos, doors: rows, marksVsChecks, tasters, confidence, habits, deltas, subjects };
}
