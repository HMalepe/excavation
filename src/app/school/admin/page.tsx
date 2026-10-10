import { pageRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { subjectMap } from "@/lib/config/subjectMap";
import { StaffShell } from "@/components/ui/StaffShell";
import { SettingsForm, ImportBox } from "@/components/client/SchoolAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "School settings" };

export const ADMIN_NAV = [{ href: "/school/admin", label: "Settings & imports" }, { href: "/school/admin/cohort", label: "Cohort dashboard" }];

export default async function SchoolAdmin() {
  const admin = await pageRole(["school_admin"]);
  const db = adminDb();
  const [{ data: school }, { data: settings }] = await Promise.all([
    db.from("schools").select("name, school_code").eq("id", admin.schoolId!).single(),
    db.from("school_settings").select("*").eq("school_id", admin.schoolId!).maybeSingle(),
  ]);
  await audit(admin.userId, "view_school_settings", admin.schoolId!);
  const initial = settings ?? {
    offered_combination_ids: [], readiness_overrides: {}, subject_change_deadline_g10: null, subject_change_deadline_g11: null,
    safeguarding_contact_name: "", safeguarding_contact_phone: "", safeguarding_contact_email: "", safeguarding_backup_name: "",
    safeguarding_backup_phone: "", safeguarding_backup_email: null, offered_subjects_fet: [], timetable_allows: {}, performance_overrides: {},
    school_day_start: "07:30", school_day_end: "14:30", partnership_agreement_signed: "",
  };
  return (
    <StaffShell title={`${school?.name ?? "Your school"} · school code ${school?.school_code ?? "—"}`} nav={ADMIN_NAV}>
      <p className="text-muted">You see settings and group statistics only. Individual reports, scores and conversations are never shown to school admins.</p>
      <SettingsForm initial={{ ...initial, school_day_start: String(initial.school_day_start).slice(0, 5), school_day_end: String(initial.school_day_end).slice(0, 5) }}
        combinations={subjectMap.combinations.map((c) => ({ id: c.id, name: c.name }))} subjects={subjectMap.subjects.map((s) => s.name)} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ImportBox kind="roster" help="One row per learner. Never include ID numbers. Each learner gets a login code to print." example={"first_name,last_name,grade,class,learner_ref\nLerato,M.,9,9A,1001"} />
        <ImportBox kind="marks" help="Latest term marks from SA-SAMS. learner_ref must match the roster. Grade 10 finals use term G10-final." example={"learner_ref,grade,term,subject,percentage\n1001,9,T2,Mathematics,58\n1001,9,T2,Natural Sciences,71"} />
      </div>
    </StaffShell>
  );
}
