import { pageRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { StaffShell } from "@/components/ui/StaffShell";
import { Stat } from "@/components/ui/Stat";
import { ConsentImport, ConsentRegister, type RegisterRow } from "@/components/client/ConsentRegister";
import { consentFormApproved } from "@/lib/consent/form";
import { consentStatus, summarise, type ConsentRow } from "@/lib/consent/records";
import { ADMIN_NAV } from "../page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Consent register" };

export default async function ConsentPage() {
  const admin = await pageRole(["school_admin"]);
  const db = adminDb();
  const [{ data: learners }, { data: consents }] = await Promise.all([
    db.from("learners").select("id, first_name, last_name, current_grade, class_label").eq("school_id", admin.schoolId!).order("class_label").order("last_name"),
    db.from("guardian_consents").select("*, learners!inner(school_id)").eq("learners.school_id", admin.schoolId!),
  ]);
  await audit(admin.userId, "view_consent_register", admin.schoolId!);
  const by = new Map<string, ConsentRow[]>();
  for (const c of (consents ?? []) as unknown as ConsentRow[]) by.set(c.learner_id, [...(by.get(c.learner_id) ?? []), c]);
  const rows: RegisterRow[] = (learners ?? []).map((l) => {
    const { status, latest } = consentStatus(by.get(l.id) ?? []);
    return { id: l.id, name: `${l.first_name} ${l.last_name}`, grade: l.current_grade, cls: l.class_label, status, guardian: latest?.guardian_name ?? null, research: !!latest?.consent_research, given: latest?.given_at ?? null };
  });
  const sum = summarise(rows.map((r) => r.status));
  return (
    <StaffShell title="Consent register" nav={ADMIN_NAV}>
      <p className="text-muted">A learner can only start once a parent or guardian&apos;s signed consent is recorded here. Nothing a learner does is saved before that.</p>
      {!consentFormApproved() && <p role="status" className="alert">The consent form is still a draft until our attorney signs it off. Don&apos;t send it home yet.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Cleared to start" value={`${sum.onFile} of ${sum.total}`} icon="check" />
        <Stat label="Still need a form" value={sum.missing} icon="doc" />
        <Stat label="Withdrawn" value={sum.withdrawn} icon="shield" tone={sum.withdrawn ? "danger" : undefined} />
      </div>
      <div className="flex flex-wrap gap-3">
        <a className="btn-primary no-underline" href="/api/school/consent-form?scope=missing">Download forms for learners without consent</a>
        <a className="btn-ghost no-underline" href="/api/school/consent-form?scope=all">Download forms for everyone</a>
      </div>
      <ConsentRegister rows={rows} />
      <ConsentImport />
    </StaffShell>
  );
}
