import { handle } from "@/lib/http";
import { HttpError, assertMfa, getCaller } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { audit } from "@/lib/audit";
import { getOrCreateSession } from "@/lib/session/service";
import { loadReportBundle } from "@/lib/report/load";
import { adminDb } from "@/lib/db/admin";
import { G9Pdf, G11Pdf, TeacherPdf, ParentPdf, renderPdf } from "@/lib/pdf/documents";
import type { ParentSummary, ReportG9, ReportG11, TeacherSummary } from "@/lib/ai/schemas";

export const runtime = "nodejs";

const pdf = (buf: Buffer, name: string) =>
  new Response(new Uint8Array(buf), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${name}.pdf"`, "cache-control": "no-store" } });

/**
 * GET ?kind=learner|parent → the signed-in learner's own report / parent summary.
 * GET ?kind=teacher&id=<reportId> → a teacher's shared summary, read under RLS (spec 10 Step 7).
 */
export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const caller = await getCaller();
  if (!caller) throw new HttpError(401, "Not signed in");
  assertMfa(caller);

  if (caller.role === "learner" && caller.learner && (kind === "learner" || kind === "parent")) {
    const session = await getOrCreateSession(caller.learner);
    if (!session) throw new HttpError(404, "No report");
    if (kind === "learner") {
      const b = await loadReportBundle(session.id);
      if (b.report?.status !== "released") throw new HttpError(404, "Your report isn't ready yet.");
      const issued = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" }).format(new Date(b.report.reviewed_at ?? b.report.created_at));
      const doc = session.touchpoint === "G9_FOUNDATION"
        ? <G9Pdf r={b.report.content as ReportG9} name={caller.learner.first_name} profile={b.profile} issued={issued} />
        : <G11Pdf r={b.report.content as ReportG11} name={caller.learner.first_name} profile={b.profile} g9Profile={b.g9Profile} verdict={b.verdict} issued={issued} />;
      return pdf(await renderPdf(doc), "excavation-report");
    }
    const { data: p } = await adminDb().from("reports").select("content, status").eq("session_id", session.id).eq("kind", "parent").maybeSingle();
    if (p?.status !== "released") throw new HttpError(404, "No parent summary yet.");
    return pdf(await renderPdf(<ParentPdf p={p.content as ParentSummary} name={caller.learner.first_name} />), "excavation-family-summary");
  }

  if (caller.role === "teacher" && kind === "teacher") {
    const id = url.searchParams.get("id") ?? "";
    // RLS decides: a teacher can only read teacher-kind reports the learner shared with them.
    const { data } = await (await userDb()).from("reports").select("id, content").eq("id", id).eq("kind", "teacher").maybeSingle();
    if (!data) throw new HttpError(404, "Not found");
    await audit(caller.userId, "export_teacher_summary_pdf", id);
    return pdf(await renderPdf(<TeacherPdf t={data.content as TeacherSummary} />), "teacher-summary");
  }
  throw new HttpError(403, "Not allowed");
});
