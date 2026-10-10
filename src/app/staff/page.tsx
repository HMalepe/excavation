import Link from "next/link";
import { pageRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { serverEnv } from "@/lib/env.server";
import { audit } from "@/lib/audit";
import { StaffShell, STAFF_NAV } from "@/components/ui/StaffShell";
import { Stat } from "@/components/ui/Stat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review queue" };

export default async function StaffHome() {
  const staff = await pageRole(["excavation_staff"]);
  const db = adminDb();
  const [{ data: queue }, { count: released }, { data: spot }, { count: openSg }] = await Promise.all([
    db.from("reports").select("id, kind, status, created_at, meta, sessions(touchpoint, learners(first_name, last_name, schools(name)))").in("status", ["needs_review", "generating"]).order("created_at", { ascending: true }).limit(100),
    db.from("reports").select("id", { count: "exact", head: true }).eq("kind", "learner").eq("status", "released"),
    db.from("reports").select("id, created_at, reviewed_at, sessions(touchpoint, learners(first_name, last_name))").eq("kind", "learner").eq("status", "released").is("reviewed_at", null).contains("meta", { spot_check: true }).limit(50),
    db.from("safeguarding_events").select("id", { count: "exact", head: true }).eq("level", "hard").is("reviewed_at", null),
  ]);
  await audit(staff.userId, "view_review_queue", "reports");
  const name = (r: { sessions: unknown }) => {
    const s = r.sessions as { touchpoint: string; learners: { first_name: string; last_name: string; schools?: { name: string } } };
    return { learner: `${s.learners.first_name} ${s.learners.last_name}`, school: s.learners.schools?.name ?? "", g: s.touchpoint === "G9_FOUNDATION" ? "G9" : "G11" };
  };
  return (
    <StaffShell title="Review queue" nav={STAFF_NAV}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Waiting for review" value={queue?.length ?? 0} layer={2} />
        <Stat label="Learner reports released" value={released ?? 0} note={`Launch review applies to the first ${serverEnv().REVIEW_FIRST_N_REPORTS}`} layer={4} />
        <Link href="/staff/safeguarding" className="block no-underline"><Stat label="Hard safeguarding events not yet reviewed" value={openSg ?? 0} tone={openSg ? "danger" : undefined} layer={5} /></Link>
      </div>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">Learner</th><th>School</th><th>Report</th><th>Status</th><th>Why</th><th>Waiting since</th></tr></thead>
          <tbody>
            {(queue ?? []).map((r) => {
              const n = name(r);
              const meta = r.meta as { release_reason?: string; lint?: string[] };
              return (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-2"><Link href={`/staff/reviews/${r.id}`}>{n.learner}</Link></td>
                  <td>{n.school}</td><td>{n.g} · {r.kind}</td><td>{r.status}</td>
                  <td className="max-w-xs text-muted">{meta.release_reason ?? "—"}{meta.lint?.length ? ` · ${meta.lint.length} check(s)` : ""}</td>
                  <td className="text-muted">{new Date(r.created_at).toLocaleString("en-ZA")}</td>
                </tr>
              );
            })}
            {!queue?.length && <tr><td colSpan={6} className="py-4 text-muted">Nothing waiting. Target: every report reviewed within 24 hours.</td></tr>}
          </tbody>
        </table>
      </section>
      {!!spot?.length && (
        <section className="card">
          <h2 className="mb-2 text-2xl">Spot-checks (10% of auto-released reports)</h2>
          <ul className="space-y-1 text-sm">{spot.map((r) => <li key={r.id}><Link href={`/staff/reviews/${r.id}`}>{name(r).learner} · {name(r).g}</Link></li>)}</ul>
        </section>
      )}
    </StaffShell>
  );
}
