import { after } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { ReportG9Schema, ReportG11Schema, TeacherSchema, ParentSchema } from "@/lib/ai/schemas";
import { lintG9, lintG11, lintTeacher, lintParent } from "@/lib/ai/reportLint";
import { runReportPipeline } from "@/lib/pipeline/report";
import { loadReportBundle } from "@/lib/report/load";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), reportId: z.string().uuid() }),
  z.object({ action: z.literal("edit"), reportId: z.string().uuid(), content: z.unknown() }),
  z.object({ action: z.literal("regenerate"), reportId: z.string().uuid(), fresh_signals: z.boolean().default(false) }),
  z.object({ action: z.literal("withdraw"), reportId: z.string().uuid() }),
]);

export const POST = handle(async (req: Request) => {
  const staff = await requireRole("excavation_staff");
  const b = Body.parse(await req.json());
  const db = adminDb();
  const { data: report } = await db.from("reports").select("id, session_id, kind, meta, sessions(touchpoint)").eq("id", b.reportId).single();
  if (!report) throw new HttpError(404, "Report not found");
  const now = new Date().toISOString();
  await audit(staff.userId, `review_${b.action}`, b.reportId);

  if (b.action === "approve") {
    await db.from("reports").update({ status: "released", reviewed_by: staff.userId, reviewed_at: now, released_at: now }).eq("id", b.reportId);
    return ok();
  }
  if (b.action === "withdraw") {
    await db.from("reports").update({ status: "withdrawn", reviewed_by: staff.userId, reviewed_at: now }).eq("id", b.reportId);
    return ok();
  }
  if (b.action === "edit") {
    const g9 = (report.sessions as unknown as { touchpoint: string }).touchpoint === "G9_FOUNDATION";
    const schema = report.kind === "teacher" ? TeacherSchema : report.kind === "parent" ? ParentSchema : g9 ? ReportG9Schema : ReportG11Schema;
    const parsed = schema.safeParse(b.content);
    if (!parsed.success) throw new HttpError(400, `Doesn't match the report schema: ${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
    const bundle = await loadReportBundle(report.session_id);
    const { data: sig } = await db.from("signals").select("payload").eq("session_id", report.session_id).maybeSingle();
    const raw = (sig?.payload as { raw_material?: string[] } | undefined)?.raw_material ?? [];
    const lint = report.kind === "teacher" ? lintTeacher(parsed.data as never) : report.kind === "parent" ? lintParent(parsed.data as never)
      : g9 ? lintG9(parsed.data as never, bundle.profile!, raw) : lintG11(parsed.data as never, bundle.verdict!, raw);
    await db.from("reports").update({ content: parsed.data, meta: { ...(report.meta as object), edited_by: staff.userId, edited_at: now, lint } }).eq("id", b.reportId);
    return ok({ lint }); // staff are the human authority: warnings are shown, not blocking
  }
  // regenerate (learner reports only; summaries regenerate when the learner re-shares)
  if (report.kind !== "learner") throw new HttpError(400, "Only learner reports can be regenerated here.");
  await db.from("reports").update({ status: "generating" }).eq("id", b.reportId);
  after(() => runReportPipeline(report.session_id, { reuseSignals: !b.fresh_signals }));
  return ok({ queued: true });
});
