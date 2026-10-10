import Link from "next/link";
import { pageRole } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { audit } from "@/lib/audit";
import { StaffShell } from "@/components/ui/StaffShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "My learners" };

const STATUS: Record<string, string> = { not_started: "Not started", scored_layer: "In progress", conversation: "In progress", complete: "Complete", safety_stop: "Paused", abandoned: "Not completed" };

/**
 * Teacher view (spec 10 Step 7): learners in their classes with completion status. Only summaries the
 * learner chose to share are viewable. Every query here runs under the teacher's JWT: RLS enforces it.
 */
export default async function TeacherHome() {
  const t = await pageRole(["teacher"]);
  const db = await userDb();
  const [{ data: learners }, { data: sessions }, { data: shared }] = await Promise.all([
    db.from("learners").select("id, first_name, last_name, current_grade, class_label").order("class_label").order("last_name"),
    db.from("sessions").select("learner_id, touchpoint, status"),
    db.from("reports").select("id, session_id, sessions(learner_id, touchpoint)").eq("kind", "teacher"),
  ]);
  await audit(t.userId, "view_teacher_class_list", t.userId);
  const sharedBy = new Map<string, { id: string; tp: string }[]>();
  for (const r of shared ?? []) {
    const s = r.sessions as unknown as { learner_id: string; touchpoint: string };
    sharedBy.set(s.learner_id, [...(sharedBy.get(s.learner_id) ?? []), { id: r.id, tp: s.touchpoint === "G9_FOUNDATION" ? "G9" : "G11" }]);
  }
  return (
    <StaffShell title={`My learners`} nav={[{ href: "/school/teacher", label: "My learners" }]}>
      <p className="text-muted">You see a learner&apos;s summary only if they chose to share it with you. Conversations are never shared.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">Learner</th><th>Class</th><th>Grade</th><th>Status</th><th>Shared summary</th></tr></thead>
          <tbody>
            {(learners ?? []).map((l) => {
              const s = (sessions ?? []).filter((x) => x.learner_id === l.id);
              const st = s.map((x) => `${x.touchpoint === "G9_FOUNDATION" ? "G9" : "G11"}: ${STATUS[x.status] ?? x.status}`).join(" · ") || "Not started";
              return (
                <tr key={l.id} className="border-t border-line">
                  <td className="py-2">{l.first_name} {l.last_name}</td><td>{l.class_label ?? "—"}</td><td>{l.current_grade}</td><td>{st}</td>
                  <td>{(sharedBy.get(l.id) ?? []).map((r) => <Link key={r.id} href={`/school/teacher/summary/${r.id}`} className="mr-3">{r.tp} summary</Link>)}{!sharedBy.get(l.id) && <span className="text-muted">Not shared</span>}</td>
                </tr>
              );
            })}
            {!learners?.length && <tr><td colSpan={5} className="py-4 text-muted">No learners linked to your classes yet. Ask your school admin.</td></tr>}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
}
