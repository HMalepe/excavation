import "server-only";
import { adminDb } from "@/lib/db/admin";
import { LIFE_ORIENTATION } from "@/lib/config/subjectMap";
import { computeVerdict } from "@/lib/verdict/engine";
import { loadResponses } from "@/lib/session/service";
import { marksFor, schoolSettings } from "./scoring";
import type { LearnerRow, SessionRow } from "@/lib/db/types";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { InstitutionRule, SubjectInput, SubjectSignal, VerdictInput, VerdictResult } from "@/lib/verdict/types";

export interface G11Subject { subject: string; m10: number | null; m11: number | null }

/** The learner's FET subjects (excluding LO) with Grade 10 final and latest Grade 11 marks. */
export async function g11Subjects(learner: LearnerRow): Promise<G11Subject[]> {
  const [g10, g11] = await Promise.all([marksFor(learner.id, 10), marksFor(learner.id, 11)]);
  const names = learner.fet_subjects.length ? learner.fet_subjects : Object.keys(g11.subjects);
  return names.filter((s) => s !== LIFE_ORIENTATION).map((subject) => ({
    subject, m10: g10.subjects[subject] ?? null, m11: g11.subjects[subject] ?? null,
  }));
}

/** Today's date (YYYY-MM-DD) in the school's timezone — deadlines are school-local dates. */
export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export interface G11Signals {
  current_direction?: string | null;
  subject_attributions?: Record<string, { attribution: SubjectSignal["attribution"]; sentiment?: SubjectSignal["sentiment"] }>;
  failure_story?: Record<string, { supports_cause?: SubjectSignal["story_cause"] }>;
  wellbeing_flag?: boolean;
  institution_named?: string | null;
}

export async function buildVerdictInput(session: SessionRow, learner: LearnerRow, profile: ScoreProfile, signals?: G11Signals): Promise<VerdictInput> {
  const [subjects, { json, likert }, settings, g11All] = await Promise.all([
    g11Subjects(learner), loadResponses(session.id), schoolSettings(learner.school_id), marksFor(learner.id, 11),
  ]);
  const inputs: SubjectInput[] = subjects.filter((s) => s.m11 !== null).map((s) => ({
    subject: s.subject, m10: s.m10, m11: s.m11!,
    se: Object.fromEntries(["SE1", "SE2", "SE3", "SE4", "SE5", "SE6"].map((k) => [k, likert[`${k}:${s.subject}`]]).filter(([, v]) => typeof v === "number")),
    fc: Object.fromEntries(["FC1", "FC2", "FC3", "FC4", "FC5", "FC6"].map((k) => [k, likert[`${k}:${s.subject}`]]).filter(([, v]) => typeof v === "number")),
  }));

  const sigSubjects: Record<string, SubjectSignal> = {};
  for (const s of inputs) {
    const a = signals?.subject_attributions?.[s.subject];
    sigSubjects[s.subject] = { attribution: a?.attribution, sentiment: a?.sentiment, story_cause: signals?.failure_story?.[s.subject]?.supports_cause ?? null };
  }

  const cu1 = typeof json.CU1 === "string" ? json.CU1 : "";
  const direction = [signals?.current_direction, cu1].filter(Boolean).join(". ") || null;

  let institutionRule: InstitutionRule | null = null;
  if (signals?.institution_named) {
    const { data } = await adminDb().from("institution_rules").select("*").ilike("institution", `%${signals.institution_named}%`)
      .order("admissions_year", { ascending: false }).limit(1).maybeSingle();
    institutionRule = (data as InstitutionRule) ?? null;
  }

  return {
    today: todayIn(settings?.timezone ?? "Africa/Johannesburg"),
    subjects: inputs,
    lifeOrientation: g11All.subjects[LIFE_ORIENTATION] ?? null,
    riasec: Object.fromEntries(Object.entries(profile.interests.scores).map(([k, v]) => [k, v ?? 0])) as VerdictInput["riasec"],
    riasecCode: profile.interests.code,
    stressSensitivity: profile.personality.N,
    directionFlags: profile.identity.direction_flags,
    currentDirection: direction,
    signals: { subjects: sigSubjects, wellbeing_flag: signals?.wellbeing_flag },
    school: {
      deadline: settings?.subject_change_deadline_g11 ?? null,
      offeredSubjects: settings?.offered_subjects_fet ?? [],
      timetableAllows: settings?.timetable_allows ?? {},
      performanceOverrides: settings?.performance_overrides ?? {},
    },
    institutionRule,
  };
}

export async function computeAndSaveVerdict(session: SessionRow, learner: LearnerRow, profile: ScoreProfile, signals?: G11Signals): Promise<VerdictResult> {
  const verdict = computeVerdict(await buildVerdictInput(session, learner, profile, signals));
  const { error } = await adminDb().from("verdicts").upsert({
    session_id: session.id, code: verdict.verdict, hold_redirect: verdict.hold_redirect, payload: verdict,
    computed_at: new Date().toISOString(), engine_version: verdict.engine_version,
  });
  if (error) throw new Error(`save verdict: ${error.message}`);
  return verdict;
}
