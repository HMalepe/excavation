/**
 * spec 06 — the Grade 11 verdict engine. Rules, not AI: every verdict carries a rule_trace so a
 * school, parent or official can ask "why?" and get a traceable answer.
 *
 * Interpretation note (documented in docs/DECISIONS.md): in Rules 1–2, switchAllowed() is the
 * STRUCTURAL check (the school offers the target and the timetable allows it). The date window is
 * applied only in Rule 4. Read literally, the spec's pseudocode checks the date in Rules 1–2 too,
 * which turns worked example F into RESCUE instead of the REDIRECT_AFTER_MATRIC the spec expects.
 */
import { isLanguage, isMaths, LIFE_ORIENTATION, pathwayById } from "@/lib/config/subjectMap";
import { checkPathways, EXPLORATION_ACTIONS, matchPathways, NOT_SURE, pathwaysFromCode } from "./career";
import { genericAps, institutionAps, passProjection, type MarkRow } from "./nsc";
import { rescuePlan, verdictPlan } from "./plans";
import { scoreSubject } from "./subjects";
import type { MathsVerdict, Plan, SchoolSwitchInfo, SubjectResult, VerdictCode, VerdictInput, VerdictResult } from "./types";

export const VERDICT_ENGINE_VERSION = "1.0.0";

export function windowByDate(school: SchoolSwitchInfo, today: string): { known: boolean; open: boolean } {
  if (!school.deadline) return { known: false, open: false };
  return { known: true, open: today <= school.deadline };
}

/** Structural feasibility of a change involving `subject`. Unknown is not "no": the report says "ask". */
export function switchAllowedFor(school: SchoolSwitchInfo, subject: string): boolean {
  if (school.offeredSubjects.length && subject === "Mathematical Literacy" && !school.offeredSubjects.includes(subject)) return false;
  return school.timetableAllows[subject] !== false;
}

const targetNeedsMaths = (pathways: string[]) =>
  pathways.some((id) => pathwayById.get(id)?.typical_requires.some((r) => r === "Mathematics"));

export function computeVerdict(input: VerdictInput): VerdictResult {
  const analysed = input.subjects.filter((s) => s.subject !== LIFE_ORIENTATION && !isLanguage(s.subject));
  const subjects: SubjectResult[] = analysed.map((s) =>
    scoreSubject(s, input.riasec, input.signals?.subjects?.[s.subject], input.school.performanceOverrides?.[s.subject]));
  return decideVerdict(subjects, input);
}

/** Rules 1–5, career check, projections and plans, from already-classified subjects. */
export function decideVerdict(subjects: SubjectResult[], input: VerdictInput): VerdictResult {
  const trace: string[] = [];
  const q = Object.fromEntries(subjects.map((s) => [s.subject, s.quadrant]));
  const taken = input.subjects.map((s) => s.subject);

  // Direction → pathways (career check needs them for Rule 1 too)
  const notSure = !input.currentDirection || NOT_SURE.test(input.currentDirection);
  const named = notSure ? [] : matchPathways(input.currentDirection);
  const careerPathways = named.length ? named : pathwaysFromCode(input.riasecCode);

  // ---- Rule 1 — Maths first ----
  const maths = subjects.find((s) => s.subject === "Mathematics");
  let mathsVerdict: MathsVerdict = maths?.quadrant ?? subjects.find((s) => s.subject === "Mathematical Literacy")?.quadrant ?? "NOT_APPLICABLE";
  if (maths && (maths.quadrant === "RESCUE" || maths.quadrant === "REDIRECT")) {
    if (named.length && targetNeedsMaths(named)) {
      mathsVerdict = "RESCUE_REQUIRED";
      trace.push("Rule 1: Maths at risk and the target pathway needs Mathematics → RESCUE_REQUIRED");
    } else if (switchAllowedFor(input.school, "Mathematical Literacy") && maths.quadrant === "REDIRECT") {
      mathsVerdict = "REDIRECT_TO_MATHS_LIT";
      trace.push("Rule 1: Maths low fit and at risk; target doesn't need Maths; Maths Lit possible → REDIRECT_TO_MATHS_LIT");
    } else {
      mathsVerdict = "RESCUE";
      trace.push("Rule 1: Maths at risk → RESCUE");
    }
  }

  // ---- Rule 2 — electives by quadrant ----
  const electives = subjects.filter((s) => !isMaths(s.subject));
  const n = { CONFIRM: 0, RESCUE: 0, RETHINK: 0, REDIRECT: 0 };
  for (const e of electives) n[e.quadrant]++;
  const redirectSubject = electives.find((e) => e.quadrant === "REDIRECT")?.subject;
  let verdict: VerdictCode =
    n.REDIRECT >= 2 ? "REDIRECT"
    : n.REDIRECT === 1 ? (switchAllowedFor(input.school, redirectSubject!) ? "ADJUST_ONE" : "RESCUE")
    : n.RESCUE >= 1 ? "RESCUE"
    : n.RETHINK >= 2 ? "RETHINK"
    : "CONFIRM";
  trace.push(`Rule 2: electives CONFIRM ${n.CONFIRM} · RESCUE ${n.RESCUE} · RETHINK ${n.RETHINK} · REDIRECT ${n.REDIRECT} → ${verdict}`);

  // ---- Rule 3 — Maths can escalate, never soften ----
  if (mathsVerdict === "REDIRECT_TO_MATHS_LIT") {
    const before = verdict;
    verdict = verdict === "CONFIRM" || verdict === "RESCUE" ? "ADJUST_ONE" : verdict === "ADJUST_ONE" ? "REDIRECT" : verdict;
    if (before !== verdict) trace.push(`Rule 3: Maths → Maths Lit adds a change: ${before} → ${verdict}`);
  }
  if ((mathsVerdict === "RESCUE" || mathsVerdict === "RESCUE_REQUIRED") && verdict === "CONFIRM") {
    verdict = "RESCUE";
    trace.push("Rule 3: Maths needs rescue → CONFIRM escalated to RESCUE");
  }

  // ---- Rule 4 — switching window (date) ----
  const win = windowByDate(input.school, input.today);
  if ((verdict === "REDIRECT" || verdict === "ADJUST_ONE") && win.known && !win.open) {
    trace.push(`Rule 4: change deadline ${input.school.deadline} has passed → REDIRECT_AFTER_MATRIC`);
    verdict = "REDIRECT_AFTER_MATRIC";
  }
  if ((verdict === "REDIRECT" || verdict === "ADJUST_ONE") && !win.known) {
    trace.push("Rule 4: school has not uploaded a change deadline → report must say 'ask your LO teacher', never that a switch is possible");
  }

  // ---- Rule 5 — safeguarding hold ----
  const softWellbeing = input.subjects.some((s) => (s.fc?.FC6 ?? 0) >= 4) && (input.stressSensitivity ?? 0) >= 70;
  const wellbeingCause = subjects.some((s) => s.cause === "wellbeing");
  const wellbeingFlag = !!input.signals?.wellbeing_flag || wellbeingCause || softWellbeing;
  const hold = wellbeingFlag && (verdict === "REDIRECT" || verdict === "ADJUST_ONE");
  if (hold) trace.push("Rule 5: wellbeing flag → hold the change; talk to a trusted adult first");

  // ---- Career check ----
  const careerChecks = checkPathways(careerPathways, taken, win.open);
  const lowFit = subjects.length > 0 && subjects.filter((s) => s.fit_band === "low").length >= Math.ceil(subjects.length / 2);
  const parentLedLowFit = input.directionFlags.includes("parent_led") && (lowFit || verdict === "RETHINK" || verdict === "REDIRECT");

  // ---- Pass type + APS (current Grade 11 marks) ----
  const markRows: MarkRow[] = input.subjects.filter((s) => s.subject !== LIFE_ORIENTATION).map((s) => ({ subject: s.subject, mark: s.m11 }));
  const pass = passProjection(markRows);
  const aps: VerdictResult["aps_projection"] = { method: "generic_best6_excl_LO", value: genericAps(markRows) };
  if (input.institutionRule) {
    aps.institution = {
      name: input.institutionRule.institution, programme: input.institutionRule.programme,
      value: institutionAps(input.institutionRule, markRows, input.lifeOrientation), min_aps: input.institutionRule.min_aps ?? null,
    };
  }

  // ---- Plans ----
  const plans: Plan[] = [];
  const rescueTargets = subjects.filter((s) => s.quadrant === "RESCUE" || (s.is_maths && (mathsVerdict === "RESCUE" || mathsVerdict === "RESCUE_REQUIRED")));
  const seen = new Set<string>();
  // Wellbeing plans first: support before study plans (worked example G).
  for (const s of [...rescueTargets].sort((x, y) => Number(y.cause === "wellbeing") - Number(x.cause === "wellbeing"))) {
    if (seen.has(s.subject)) continue;
    seen.add(s.subject);
    plans.push(rescuePlan(s.subject, s.cause));
  }
  const vp = verdictPlan(verdict, subjects, input.school.deadline, win.known);
  if (vp) plans.push(vp);

  return {
    verdict,
    hold_redirect: hold,
    wellbeing_path: wellbeingFlag,
    subjects,
    maths_verdict: mathsVerdict,
    rule_trace: trace,
    switch_window: { known: win.known, open: win.open, deadline: input.school.deadline },
    career_check: {
      direction: input.currentDirection,
      not_sure: notSure || !named.length,
      pathways: careerChecks,
      parent_led_low_fit: parentLedLowFit,
      exploration_actions: notSure || !named.length ? EXPLORATION_ACTIONS : [],
    },
    pass_projection: pass,
    aps_projection: aps,
    plans,
    engine_version: VERDICT_ENGINE_VERSION,
  };
}
