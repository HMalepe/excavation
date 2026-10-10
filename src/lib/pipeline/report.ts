import "server-only";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import g9Example from "@config/examples/lerato_g9_report.json";
import g11Example from "@config/examples/lerato_g11_report.json";
import { adminDb } from "@/lib/db/admin";
import { serverEnv } from "@/lib/env.server";
import { anthropic, models, strongExtras } from "@/lib/ai/client";
import { REPORT_G9, REPORT_G11, SIGNALS_EXTRACTOR, SIGNALS_EXTRACTOR_G11_ADDENDUM } from "@/lib/ai/prompts";
import { ReportG9Schema, ReportG11Schema, SignalsG9Schema, SignalsG11Schema, type ReportG9, type ReportG11, type SignalsG11 } from "@/lib/ai/schemas";
import { lintG9, lintG11 } from "@/lib/ai/reportLint";
import { stripMarkers } from "@/lib/guide/markers";
import { buildScoreContext } from "@/lib/guide/scoreContext";
import { loadMessages } from "@/lib/guide/state";
import { pathwayName } from "@/lib/scoring/doors";
import { advanceTo, loadResponses } from "@/lib/session/service";
import { computeAndSaveVerdict, type G11Signals } from "./g11";
import { loadProfile, scoreSession } from "./scoring";
import type { LearnerRow, MessageRow, SessionRow } from "@/lib/db/types";
import type { ConversationAdjustments, ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";

const strip = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_")));

export function transcriptText(rows: MessageRow[]): string {
  return rows.map((r) =>
    r.role === "learner" ? `Learner: ${r.content}` : r.role === "guide" ? `Guide${r.question_ref ? ` [${r.question_ref}]` : ""}: ${stripMarkers(r.content)}` : `[system] ${r.content}`,
  ).join("\n\n");
}

/** Structured call on the strong model with one parse retry (spec 07 §1). */
async function structured<T extends z.ZodType>(schema: T, system: string, cachedExtra: string | null, user: string, effort: "medium" | "high"): Promise<z.infer<T> | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await anthropic().beta.messages.parse({
        model: models().strong,
        max_tokens: 16000,
        system: [
          { type: "text", text: system, cache_control: { type: "ephemeral" } },
          ...(cachedExtra ? [{ type: "text" as const, text: cachedExtra, cache_control: { type: "ephemeral" as const } }] : []),
        ],
        messages: [{ role: "user", content: user }],
        output_config: { format: betaZodOutputFormat(schema), effort },
        ...strongExtras,
      });
      if (res.stop_reason === "refusal") return null;
      if (res.parsed_output) return res.parsed_output as z.infer<T>;
    } catch (e) {
      console.error("[pipeline] structured call failed", e);
    }
  }
  return null;
}

/** Map extracted signals onto the engine's conversation adjustments (each capped at ±5 in the engine). */
export function adjustmentsFromSignals(s: z.infer<typeof SignalsG9Schema>): ConversationAdjustments {
  return {
    unpressuredSubjects: s.unpressured_subject_choice,
    competenceTrapSubject: s.competence_trap.subject_or_activity,
    contradictionResolutions: s.contradictions.filter((c) => c.watch_id).map((c) => ({ watchId: c.watch_id!, learnerSaysTruer: c.learner_says_truer })),
  };
}

export function g11SignalsForVerdict(s: SignalsG11, wellbeing: boolean): G11Signals {
  return {
    current_direction: s.current_direction,
    subject_attributions: Object.fromEntries(s.subject_attributions.map((a) => [a.subject, { attribution: a.attribution, sentiment: a.sentiment }])),
    failure_story: Object.fromEntries(s.failure_story.map((f) => [f.subject, { supports_cause: f.supports_cause }])),
    wellbeing_flag: wellbeing,
    institution_named: s.institution_named,
  };
}

/** Plain-name doors for the report writer, so it never invents a pathway name. */
function profileForWriter(p: ScoreProfile) {
  return {
    ...p,
    ranking: undefined,
    combinations: p.combinations.map((c) => ({
      ...c,
      doors_named: Object.fromEntries(Object.entries(c.doors).map(([id, st]) => [pathwayName(id), st])),
      readiness_detail: undefined,
    })),
  };
}

async function releaseDecision(sessionId: string, quality: string, lintIssues: string[]): Promise<{ status: "needs_review" | "released"; reason: string; spotCheck: boolean }> {
  const db = adminDb();
  const n = serverEnv().REVIEW_FIRST_N_REPORTS;
  const { count } = await db.from("reports").select("id", { count: "exact", head: true }).eq("kind", "learner").neq("status", "withdrawn").neq("session_id", sessionId);
  if ((count ?? 0) < n) return { status: "needs_review", reason: `launch review (first ${n} reports)`, spotCheck: false };
  if (quality !== "ok") return { status: "needs_review", reason: `quality ${quality}`, spotCheck: false };
  const { count: sg } = await db.from("safeguarding_events").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
  if ((sg ?? 0) > 0) return { status: "needs_review", reason: "safeguarding event on this session", spotCheck: false };
  if (lintIssues.length) return { status: "needs_review", reason: "report checks failed after retry", spotCheck: false };
  return { status: "released", reason: "auto-release", spotCheck: Math.random() < 0.1 }; // spot-check 10% (spec 07 §1)
}

async function saveReport(sessionId: string, status: "needs_review" | "released", content: unknown, meta: Record<string, unknown>) {
  const now = new Date().toISOString();
  const { error } = await adminDb().from("reports").upsert({
    session_id: sessionId, kind: "learner", status, content: content ?? {}, model: models().strong,
    released_at: status === "released" ? now : null, reviewed_by: null, reviewed_at: null, meta: { ...meta, generated_at: now },
  }, { onConflict: "session_id,kind" });
  if (error) throw new Error(`save report: ${error.message}`);
}

/**
 * After <<SESSION_COMPLETE>> (spec 10 Step 5):
 * 1 signals (3C) → Zod → signals table; 2 rescore with conversation adjustments (G9) / verdict with
 * signals (G11); 3 report writer (3D/3F) → Zod + lint → one retry → else needs_review;
 * 4 release policy. Idempotent: safe to re-run ("regenerate").
 */
export async function runReportPipeline(sessionId: string, opts: { reuseSignals?: boolean } = {}): Promise<void> {
  const db = adminDb();
  const { data: s } = await db.from("sessions").select("*").eq("id", sessionId).single();
  const session = s as SessionRow;
  const { data: l } = await db.from("learners").select("*").eq("id", session.learner_id).single();
  const learner = l as LearnerRow;
  const isG9 = session.touchpoint === "G9_FOUNDATION";
  await db.from("reports").upsert({ session_id: sessionId, kind: "learner", status: "generating", content: {}, model: models().strong }, { onConflict: "session_id,kind", ignoreDuplicates: true });

  try {
    const rows = await loadMessages(sessionId);
    let profile = (await loadProfile(sessionId))!;
    const { json } = await loadResponses(sessionId);
    const intake = { world: json.INTAKE_WORLD as string | undefined, right_now: json.INTAKE_RIGHT_NOW as string | undefined, why_here: json.INTAKE_WHY_HERE as string | undefined };
    const ctx = buildScoreContext(profile, learner.first_name, isG9 ? 9 : 11, intake);

    // 1. Signals — the wellbeing flag is set by the safeguarding protocol, never by the model.
    const { count: sgCount } = await db.from("safeguarding_events").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
    const wellbeing = (sgCount ?? 0) > 0;
    let signals: z.infer<typeof SignalsG9Schema> | SignalsG11 | null = null;
    if (opts.reuseSignals) signals = (await db.from("signals").select("payload").eq("session_id", sessionId).maybeSingle()).data?.payload ?? null;
    if (!signals) {
      signals = await structured(
        isG9 ? SignalsG9Schema : SignalsG11Schema,
        isG9 ? SIGNALS_EXTRACTOR : `${SIGNALS_EXTRACTOR}\n\n${SIGNALS_EXTRACTOR_G11_ADDENDUM}`,
        null,
        `<score_context>${JSON.stringify(ctx)}</score_context>\n<transcript>\n${transcriptText(rows)}\n</transcript>`,
        "medium",
      );
      if (!signals) throw new Error("signals extraction failed twice");
      signals.wellbeing_flag = wellbeing;
      await db.from("signals").upsert({ session_id: sessionId, payload: signals, model: models().strong, extracted_at: new Date().toISOString() });
    }

    // 2. Deterministic recompute with conversation input.
    let verdict: VerdictResult | null = null;
    if (isG9) {
      profile = await scoreSession(session, learner.school_id, adjustmentsFromSignals(signals));
    } else {
      verdict = await computeAndSaveVerdict(session, learner, profile, g11SignalsForVerdict(signals as SignalsG11, wellbeing));
    }

    // 3. Report writer with the Lerato gold standard as a cached few-shot example.
    const example = `<example_report learner="Lerato (fictional)">${JSON.stringify(strip(isG9 ? g9Example : g11Example))}</example_report>\nThe example shows voice and structure only. Never copy its facts.`;
    let input: string;
    if (isG9) {
      input = `<score_profile>${JSON.stringify(profileForWriter(profile))}</score_profile>\n<signals>${JSON.stringify(signals)}</signals>`;
    } else {
      const { data: g9 } = await db.from("sessions").select("reports(kind, status, content)").eq("learner_id", learner.id).eq("touchpoint", "G9_FOUNDATION").maybeSingle();
      const g9r = (g9?.reports as { kind: string; status: string; content: ReportG9 }[] | undefined)?.find((r) => r.kind === "learner" && r.status === "released")?.content;
      const g9Summary = g9r ? { headline: g9r.headline.text, fits: g9r.subject_options.fits.map((f) => f.name), first_move: g9r.first_move.action } : null;
      input = `<score_profile>${JSON.stringify({ ...profile, combinations: undefined, ranking: undefined })}</score_profile>\n<verdict>${JSON.stringify(verdict)}</verdict>\n<signals>${JSON.stringify(signals)}</signals>\n<g9_report_summary>${JSON.stringify(g9Summary)}</g9_report_summary>`;
    }

    const lint = (r: ReportG9 | ReportG11) => (isG9 ? lintG9(r as ReportG9, profile, signals!.raw_material) : lintG11(r as ReportG11, verdict!, signals!.raw_material));
    const attempts: { issues: string[] }[] = [];
    let report: ReportG9 | ReportG11 | null = null;
    for (let i = 0; i < 2; i++) {
      const feedback = attempts.length ? `\n<previous_attempt_problems>\nFix every one of these:\n- ${attempts.at(-1)!.issues.join("\n- ")}\n</previous_attempt_problems>` : "";
      const r = await structured(isG9 ? ReportG9Schema : ReportG11Schema, isG9 ? REPORT_G9 : REPORT_G11, example, input + feedback, "high");
      if (!r) { attempts.push({ issues: ["no valid JSON returned"] }); continue; }
      report = r;
      const issues = lint(r);
      attempts.push({ issues });
      if (!issues.length) break;
    }
    const finalIssues = attempts.at(-1)?.issues ?? ["not generated"];

    // 4. Release policy.
    const decision = report ? await releaseDecision(sessionId, profile.quality.status, finalIssues) : { status: "needs_review" as const, reason: "report could not be generated", spotCheck: false };
    await saveReport(sessionId, decision.status, report, { attempts, lint: finalIssues, release_reason: decision.reason, spot_check: decision.spotCheck });
    const { data: fresh } = await db.from("sessions").select("*").eq("id", sessionId).single();
    if (fresh && fresh.stage !== "report") await advanceTo(fresh as SessionRow, "report");
  } catch (e) {
    console.error("[pipeline] failed", sessionId, e);
    await saveReport(sessionId, "needs_review", {}, { error: String(e), release_reason: "pipeline error — regenerate from the review screen" });
  }
}
