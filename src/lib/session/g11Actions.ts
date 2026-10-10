import "server-only";
import { z } from "zod";
import { adminDb } from "@/lib/db/admin";
import { HttpError } from "@/lib/auth/guards";
import { questionBank } from "@/lib/config/questionBank";
import { LIFE_ORIENTATION, subjectVectors, isLanguage } from "@/lib/config/subjectMap";
import { g11Subjects, computeAndSaveVerdict } from "@/lib/pipeline/g11";
import { marksFor, scoreSession } from "@/lib/pipeline/scoring";
import { advanceTo, assertStage, loadResponses, upsertResponse } from "./service";
import type { Ctx } from "./actions";
import type { LearnerRow, SessionRow } from "@/lib/db/types";

const LONG_TEXT = z.string().trim().max(800);
const Likert = z.number().int().min(1).max(5);
const SE = z.object({ SE1: Likert, SE2: Likert, SE3: Likert, SE4: Likert, SE5: Likert, SE6: Likert });
const FC = z.object({ FC1: Likert, FC2: Likert, FC3: Likert, FC4: Likert, FC5: Likert, FC6: Likert });
const CU2_OPTIONS = questionBank.grade11_only.CAREER_UPDATE.find((q) => q.id === "CU2")!.options!;
const CU3_OPTIONS = questionBank.grade11_only.CAREER_UPDATE.find((q) => q.id === "CU3")!.options!;

const def = <S extends z.ZodType>(body: S, run: (ctx: Ctx, body: z.infer<S>) => Promise<unknown>) => ({ body, run });

/** Subjects still needing Subject Experience / Failure Cause answers. */
export async function g11Pending(session: SessionRow, learner: LearnerRow) {
  const [subjects, { likert }] = await Promise.all([g11Subjects(learner), loadResponses(session.id)]);
  const se = subjects.filter((s) => typeof likert[`SE1:${s.subject}`] !== "number").map((s) => s.subject);
  const fc = subjects.filter((s) => s.m11 !== null && s.m11 < 50 && typeof likert[`FC1:${s.subject}`] !== "number").map((s) => s.subject);
  return { subjects, se, fc };
}

async function afterSubjectExperience(session: SessionRow, learner: LearnerRow) {
  const p = await g11Pending(session, learner);
  if (p.se.length) return;
  await advanceTo(session, p.fc.length ? "failure_cause" : "career_update");
}

export const g11Actions = {
  two_years: def(z.object({ text: LONG_TEXT }), async ({ session }, b) => {
    assertStage(session, "two_years");
    if (b.text) await upsertResponse(session.id, "TWO_YEARS", { value_json: b.text });
    await advanceTo(session, "scored");
    return {};
  }),

  /** Grade 10 final + Grade 11 latest term. School import preferred; otherwise self-report. */
  marks_g11: def(z.object({
    rows: z.array(z.object({ subject: z.string().max(80), g10: z.number().min(0).max(100).nullable(), g11: z.number().min(0).max(100) })).max(10).default([]),
    estimates: z.array(z.string()).max(10).default([]),
  }), async ({ session, caller }, b) => {
    assertStage(session, "marks");
    const learner = caller.learner;
    const imported = (await marksFor(learner.id, 11)).rows.some((r) => r.source === "school_import");
    if (!imported) {
      const valid = b.rows.filter((r) => r.subject === LIFE_ORIENTATION || isLanguage(r.subject) || subjectVectors.has(r.subject));
      if (valid.length < 5) throw new HttpError(400, "Add your subjects and marks (at least 5).");
      const g11Rows = valid.map((r) => ({ learner_id: learner.id, grade: 11, term_label: "latest", subject: r.subject, percentage: r.g11, source: "self_report", is_estimate: b.estimates.includes(r.subject) }));
      const g10Rows = valid.filter((r) => r.g10 !== null).map((r) => ({ learner_id: learner.id, grade: 10, term_label: "G10-final", subject: r.subject, percentage: r.g10, source: "self_report", is_estimate: b.estimates.includes(r.subject) }));
      const { error } = await adminDb().from("marks").upsert([...g11Rows, ...g10Rows], { onConflict: "learner_id,grade,term_label,subject" });
      if (error) throw new Error(`save marks: ${error.message}`);
      if (!learner.fet_subjects.length) await adminDb().from("learners").update({ fet_subjects: valid.map((r) => r.subject) }).eq("id", learner.id);
    } else if (!learner.fet_subjects.length) {
      const g11 = await marksFor(learner.id, 11);
      await adminDb().from("learners").update({ fet_subjects: Object.keys(g11.subjects) }).eq("id", learner.id);
    }
    await advanceTo(session, "subject_experience");
    return {};
  }),

  subject_experience: def(z.object({ subject: z.string().max(80), answers: SE }), async ({ session, caller }, b) => {
    assertStage(session, "subject_experience");
    const learner = { ...caller.learner, fet_subjects: await freshSubjects(caller.learner) };
    const p = await g11Pending(session, learner);
    if (!p.subjects.some((s) => s.subject === b.subject)) throw new HttpError(400, "That isn't one of your subjects.");
    for (const [k, v] of Object.entries(b.answers)) await upsertResponse(session.id, `${k}:${b.subject}`, { value: v });
    await afterSubjectExperience(session, learner);
    return {};
  }),

  failure_cause: def(z.object({ subject: z.string().max(80), answers: FC }), async ({ session, caller }, b) => {
    assertStage(session, "failure_cause");
    const learner = { ...caller.learner, fet_subjects: await freshSubjects(caller.learner) };
    const p = await g11Pending(session, learner);
    const target = p.subjects.find((s) => s.subject === b.subject);
    if (!target || target.m11 === null || target.m11 >= 50) throw new HttpError(400, "This check is only for subjects below 50%.");
    for (const [k, v] of Object.entries(b.answers)) await upsertResponse(session.id, `${k}:${b.subject}`, { value: v });
    if (p.fc.filter((s) => s !== b.subject).length === 0) await advanceTo(session, "career_update");
    return {};
  }),

  career_update: def(z.object({
    cu1: LONG_TEXT.min(1),
    cu2: z.enum(CU2_OPTIONS as [string, ...string[]]),
    cu3: z.array(z.enum(CU3_OPTIONS as [string, ...string[]])).min(1),
  }), async ({ session, caller }, b) => {
    assertStage(session, "career_update");
    await upsertResponse(session.id, "CU1", { value_json: b.cu1 });
    await upsertResponse(session.id, "CU2", { value_json: b.cu2 });
    await upsertResponse(session.id, "CU3", { value_json: b.cu3 });
    // Score now (with deltas) and compute a preliminary verdict: The Guide gets the subject summary,
    // and the final verdict is recomputed after the conversation with its attributions.
    const learner = { ...caller.learner, fet_subjects: await freshSubjects(caller.learner) };
    const profile = await scoreSession(session, learner.school_id);
    await computeAndSaveVerdict(session, learner, profile);
    await advanceTo(session, "guide_notice");
    return {};
  }),
};

async function freshSubjects(learner: LearnerRow): Promise<string[]> {
  const { data } = await adminDb().from("learners").select("fet_subjects").eq("id", learner.id).single();
  return (data?.fet_subjects as string[]) ?? learner.fet_subjects;
}
