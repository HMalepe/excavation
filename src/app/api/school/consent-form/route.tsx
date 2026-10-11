import { handle } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { consentFormApproved } from "@/lib/consent/form";
import { consentStatus, type ConsentRow } from "@/lib/consent/records";
import { ConsentFormPdf } from "@/lib/pdf/consent";
import { renderPdf } from "@/lib/pdf/documents";

export const runtime = "nodejs";

/** GET ?scope=missing (default) | all, or ?learner=<id>: pre-filled consent forms for the admin's own school. */
export const GET = handle(async (req: Request) => {
  const admin = await requireRole("school_admin");
  if (!admin.schoolId) throw new HttpError(403, "No school");
  const url = new URL(req.url);
  const one = url.searchParams.get("learner");
  const db = adminDb();
  const [{ data: school }, { data: learners }, { data: consents }] = await Promise.all([
    db.from("schools").select("name").eq("id", admin.schoolId).single(),
    db.from("learners").select("id, first_name, last_name, current_grade, class_label, school_learner_ref").eq("school_id", admin.schoolId).order("class_label").order("last_name"),
    db.from("guardian_consents").select("*, learners!inner(school_id)").eq("learners.school_id", admin.schoolId),
  ]);
  const byLearner = new Map<string, ConsentRow[]>();
  for (const c of (consents ?? []) as unknown as (ConsentRow & { learner_id: string })[]) byLearner.set(c.learner_id, [...(byLearner.get(c.learner_id) ?? []), c]);
  let list = learners ?? [];
  if (one) list = list.filter((l) => l.id === one);
  else if ((url.searchParams.get("scope") ?? "missing") === "missing") list = list.filter((l) => consentStatus(byLearner.get(l.id) ?? []).status !== "on_file");
  if (!list.length) throw new HttpError(404, "Every learner already has consent on file.");
  await audit(admin.userId, "export_consent_forms", `${admin.schoolId}:${list.length}`);
  const buf = await renderPdf(<ConsentFormPdf approved={consentFormApproved()} learners={list.map((l) => ({ name: `${l.first_name} ${l.last_name}`, grade: l.current_grade, school: school?.name ?? "", ref: l.school_learner_ref }))} />);
  return new Response(new Uint8Array(buf), { headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="consent-forms.pdf"', "cache-control": "no-store" } });
});
