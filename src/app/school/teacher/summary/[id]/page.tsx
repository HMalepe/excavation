import { notFound } from "next/navigation";
import { pageRole } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { audit } from "@/lib/audit";
import { StaffShell } from "@/components/ui/StaffShell";
import type { TeacherSummary } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teacher summary" };

export default async function TeacherSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await pageRole(["teacher"]);
  // RLS: returns a row only for a released, teacher-kind report shared with this teacher.
  const { data } = await (await userDb()).from("reports").select("id, content").eq("id", id).eq("kind", "teacher").maybeSingle();
  if (!data) notFound();
  await audit(t.userId, "view_teacher_summary", id);
  const s = data.content as TeacherSummary;
  return (
    <StaffShell title={`${s.learner_first_name} — ${s.touchpoint === "G9" ? "Grade 9 Foundation" : "Grade 11 Confirmation"}`} nav={[{ href: "/school/teacher", label: "My learners" }]}>
      <article className="card max-w-2xl space-y-4">
        <div><h2 className="font-semibold text-amber-soft">Learns best when</h2><p>{s.learns_best_when}</p></div>
        <div><h2 className="font-semibold text-amber-soft">Strengths</h2><ul className="list-disc pl-5">{s.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><h2 className="font-semibold text-amber-soft">Recommendation</h2><p>{s.recommendation}</p></div>
        <div><h2 className="font-semibold text-amber-soft">Flags</h2><ul className="list-disc pl-5">{s.flags.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><h2 className="font-semibold text-amber-soft">One thing that helps most</h2><p>{s.one_thing_that_helps}</p></div>
        {s.quality_note && <p className="text-muted">{s.quality_note}</p>}
        <a href={`/api/report/pdf?kind=teacher&id=${data.id}`} className="btn-ghost inline-flex no-underline">Download PDF</a>
      </article>
    </StaffShell>
  );
}
