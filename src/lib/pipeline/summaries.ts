import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { adminDb } from "@/lib/db/admin";
import { anthropic, models, strongExtras } from "@/lib/ai/client";
import { PARENT_SUMMARY, TEACHER_SUMMARY } from "@/lib/ai/prompts";
import { ParentSchema, TeacherSchema, type ParentSummary, type ReportG9, type ReportG11, type TeacherSummary } from "@/lib/ai/schemas";
import { lintParent, lintTeacher } from "@/lib/ai/reportLint";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";

/**
 * The teacher sees only what's needed to help (spec 07 3G): the report's subject/verdict content
 * and support flags. Remove sensitive fields BEFORE the model sees them, then lint the output too.
 */
export function teacherInput(report: ReportG9 | ReportG11, profile: ScoreProfile, verdict: VerdictResult | null, firstName: string) {
  if ("subject_options" in report) {
    return {
      learner_first_name: firstName, touchpoint: "G9",
      how_you_work: report.how_you_work,
      subject_options: report.subject_options,
      first_move: report.first_move,
      flags: {
        maths: profile.maths_gate?.recommendation,
        study_habits: profile.study?.band,
        marks_self_reported: profile.marks.source === "self_report",
        readiness: profile.combinations.filter((c) => c.role?.startsWith("fit")).map((c) => ({ id: c.id, readiness: c.readiness })),
      },
    };
  }
  return {
    learner_first_name: firstName, touchpoint: "G11",
    subjects: report.subjects.map((s) => {
      const v = verdict?.subjects.find((x) => x.subject === s.subject);
      // never pass teaching_environment or wellbeing causes to the teacher summary
      const cause = v?.cause && !["teaching_environment", "wellbeing", "circumstances"].includes(v.cause) ? v.cause : null;
      return { subject: s.subject, quadrant: s.quadrant, marks: v ? { grade10: v.m10, grade11: v.m11 } : null, cause };
    }),
    verdict: { code: report.verdict.code, headline: report.verdict.headline },
    plan: report.plan.filter((p) => !/trusted adult|counsell|talk to one adult/i.test(p.action)),
    pathway: { pass_type_now: report.pathway.pass_type_now, gap_to_next: report.pathway.gap_to_next },
    study_habits: profile.study?.band,
  };
}

async function call<T>(schema: typeof TeacherSchema | typeof ParentSchema, system: string, user: string): Promise<T | null> {
  try {
    const res = await anthropic().beta.messages.parse({
      model: models().strong, max_tokens: 8000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
      output_config: { format: betaZodOutputFormat(schema), effort: "medium" },
      ...strongExtras,
    });
    return res.stop_reason === "refusal" ? null : ((res.parsed_output as T) ?? null);
  } catch (e) {
    console.error("[summaries] call failed", e);
    return null;
  }
}

export async function generateSummary(kind: "teacher" | "parent", sessionId: string, report: ReportG9 | ReportG11, profile: ScoreProfile, verdict: VerdictResult | null, firstName: string) {
  const isTeacher = kind === "teacher";
  const base = isTeacher
    ? `<report>${JSON.stringify(teacherInput(report, profile, verdict, firstName))}</report>\n<quality>${profile.quality.status}</quality>`
    : `<report>${JSON.stringify({ learner_first_name: firstName, ...report })}</report>\n<direction_flags>${JSON.stringify(profile.identity.direction_flags)}</direction_flags>`;
  let content: TeacherSummary | ParentSummary | null = null;
  let issues: string[] = ["not generated"];
  for (let i = 0; i < 2; i++) {
    const fb = i > 0 ? `\n<previous_attempt_problems>\n- ${issues.join("\n- ")}\n</previous_attempt_problems>` : "";
    content = await call(isTeacher ? TeacherSchema : ParentSchema, isTeacher ? TEACHER_SUMMARY : PARENT_SUMMARY, base + fb);
    if (!content) { issues = ["no valid JSON"]; continue; }
    if (isTeacher && profile.quality.status === "caution") (content as TeacherSummary).quality_note = "Some answers may have been rushed; treat these results as a starting point.";
    issues = isTeacher ? lintTeacher(content as TeacherSummary) : lintParent(content as ParentSummary);
    if (!issues.length) break;
  }
  const status = content && !issues.length ? "released" : "needs_review";
  const now = new Date().toISOString();
  const { data, error } = await adminDb().from("reports").upsert({
    session_id: sessionId, kind, status, content: content ?? {}, model: models().strong,
    released_at: status === "released" ? now : null, meta: { lint: issues, generated_at: now },
  }, { onConflict: "session_id,kind" }).select("id, status").single();
  if (error) throw new Error(`save ${kind} summary: ${error.message}`);
  return data as { id: string; status: string };
}
