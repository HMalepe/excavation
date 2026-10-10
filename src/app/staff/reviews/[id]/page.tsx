import { notFound } from "next/navigation";
import { pageRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { loadReportBundle } from "@/lib/report/load";
import { StaffShell, STAFF_NAV } from "@/components/ui/StaffShell";
import { ReviewActions } from "@/components/client/ReviewActions";
import { G9Report, G11Report } from "@/components/report/ReportViews";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review report" };

const Json = ({ v }: { v: unknown }) => <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-3 text-xs">{JSON.stringify(v, null, 2)}</pre>;

/** Side-by-side ScoreProfile, signals and report (spec 10 Step 5). Every view is audited. */
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await pageRole(["excavation_staff"]);
  const db = adminDb();
  const { data: rep } = await db.from("reports").select("*, sessions(touchpoint, learner_id, learners(first_name, last_name))").eq("id", id).maybeSingle();
  if (!rep) notFound();
  await audit(staff.userId, "view_report", id);
  const b = await loadReportBundle(rep.session_id);
  const { data: sig } = await db.from("signals").select("payload, model, extracted_at").eq("session_id", rep.session_id).maybeSingle();
  const { data: sg } = await db.from("safeguarding_events").select("level, trigger_source, created_at").eq("session_id", rep.session_id);
  const s = rep.sessions as { touchpoint: string; learners: { first_name: string; last_name: string } };
  const meta = rep.meta as { release_reason?: string; lint?: string[]; attempts?: { issues: string[] }[]; error?: string };
  const g9 = s.touchpoint === "G9_FOUNDATION";
  const hasContent = rep.content && Object.keys(rep.content).length > 0;

  return (
    <StaffShell title={`${s.learners.first_name} ${s.learners.last_name} · ${g9 ? "Grade 9" : "Grade 11"} · ${rep.kind}`} nav={STAFF_NAV}>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="card py-2">Status: <strong>{rep.status}</strong></span>
        <span className="card py-2">Why here: {meta.release_reason ?? "—"}</span>
        <span className="card py-2">Quality: {b.profile?.quality.status ?? "—"} {b.profile?.quality.flags.join(", ")}</span>
        {!!sg?.length && <span className="card border-danger py-2 text-danger">Safeguarding: {sg.map((e) => `${e.level} (${e.trigger_source})`).join(", ")}</span>}
      </div>
      {meta.error && <p className="card border-danger text-danger">Pipeline error: {meta.error}</p>}
      {!!meta.lint?.length && <div className="card"><p className="font-semibold">Automatic checks still failing</p><ul className="mt-2 list-disc pl-5 text-sm text-muted">{meta.lint.map((l, i) => <li key={i}>{l}</li>)}</ul></div>}
      <ReviewActions reportId={rep.id} content={rep.content} kind={rep.kind} status={rep.status} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-2"><h2 className="text-xl">ScoreProfile</h2>
          {b.profile && (
            <div className="card space-y-1 text-sm">
              <p>Code {b.profile.interests.code} · identity {b.profile.identity.status} {b.profile.identity.direction_flags.join(" ")}</p>
              <p>Fits: {b.profile.combinations.filter((c) => c.role?.startsWith("fit")).map((c) => `${c.id} ${c.score}${c.label ? "*" : ""}`).join(" · ") || "—"}</p>
              <p>Cautions: {b.profile.combinations.filter((c) => c.role === "caution").map((c) => `${c.id} (${c.caution_type})`).join(" · ") || "—"}</p>
              <p>Maths gate: {b.profile.maths_gate?.recommendation ?? "—"}</p>
              {b.verdict && <p>Verdict: <strong>{b.verdict.verdict}</strong>{b.verdict.hold_redirect ? " (hold)" : ""} — {b.verdict.rule_trace.join(" → ")}</p>}
            </div>
          )}
          <Json v={b.verdict ? { profile: b.profile, verdict: b.verdict } : b.profile} />
        </section>
        <section className="space-y-2"><h2 className="text-xl">Signals</h2><p className="text-xs text-muted">{sig?.model} · {sig?.extracted_at}</p><Json v={sig?.payload} /></section>
        <section className="space-y-2"><h2 className="text-xl">Report (as the learner sees it)</h2>
          <div className="card max-h-[48rem] overflow-auto">
            {!hasContent ? <p className="text-muted">No content yet.</p>
              : rep.kind !== "learner" ? <Json v={rep.content} />
              : g9 && b.profile ? <G9Report r={rep.content as ReportG9} profile={b.profile} />
              : b.profile && b.verdict ? <G11Report r={rep.content as ReportG11} profile={b.profile} g9Profile={b.g9Profile} verdict={b.verdict} planState={{}} />
              : <Json v={rep.content} />}
          </div>
        </section>
      </div>
    </StaffShell>
  );
}
