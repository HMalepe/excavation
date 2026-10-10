import { pageRole } from "@/lib/auth/guards";
import { one } from "@/lib/db/one";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { cohortStats, MIN_GROUP, type CohortLearner, type Distribution } from "@/lib/cohort/aggregate";
import { combinationById } from "@/lib/config/subjectMap";
import { IDENTITY_FRIENDLY, RIASEC_FRIENDLY } from "@/lib/scoring/scales";
import { Stat } from "@/components/ui/Stat";
import { StaffShell } from "@/components/ui/StaffShell";
import { ADMIN_NAV } from "../page";
import type { ScoreProfile } from "@/lib/scoring/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cohort dashboard" };

const label = (kind: string, k: string) =>
  kind === "riasec" ? `${RIASEC_FRIENDLY[k as keyof typeof RIASEC_FRIENDLY] ?? k} (${k})`
  : kind === "identity" ? IDENTITY_FRIENDLY[k as keyof typeof IDENTITY_FRIENDLY]?.name ?? k
  : k.replace(/_/g, " ");

function Dist({ title, d, kind }: { title: string; d: Distribution | null; kind: string }) {
  if (!d) return null;
  return (
    <div className="card">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {d.suppressed ? <p className="text-sm text-muted">Hidden: fewer than {MIN_GROUP} completed learners.</p> : (
        <ul className="space-y-1 text-sm">
          {d.cells.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className="w-44 shrink-0">{label(kind, c.label)}</span>
              {c.suppressed ? <span className="text-muted">fewer than {MIN_GROUP}</span> : (
                <><span className="h-3 rounded bg-accent" style={{ width: `${Math.max(4, (c.count! / d.total!) * 100)}%` }} /><span className="tabular-nums">{c.count}</span></>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Cohort aggregates computed server-side; groups smaller than 10 are suppressed (spec 10 Step 7). */
export default async function Cohort() {
  const admin = await pageRole(["school_admin"]);
  const db = adminDb();
  const [{ data: learners }, { data: settings }] = await Promise.all([
    db.from("learners").select("id, current_grade, sessions(touchpoint, status, score_profiles(profile), verdicts(code))").eq("school_id", admin.schoolId!),
    db.from("school_settings").select("offered_combination_ids").eq("school_id", admin.schoolId!).maybeSingle(),
  ]);
  await audit(admin.userId, "view_cohort", admin.schoolId!);
  const rows: CohortLearner[] = (learners ?? []).flatMap((l) => {
    const sessions = ((l.sessions ?? []) as unknown as { touchpoint: string; status: string; score_profiles: unknown; verdicts: unknown }[]).map((x) => ({ ...x, sp: one(x.score_profiles as { profile: ScoreProfile } | null), vd: one(x.verdicts as { code: string } | null) }));
    const tp = l.current_grade === 9 ? "G9_FOUNDATION" : l.current_grade === 11 ? "G11_CONFIRMATION" : null;
    if (!tp) return [];
    const s = sessions.find((x) => x.touchpoint === tp);
    const done = s?.status === "complete";
    const p = s?.sp?.profile;
    return [{
      grade: l.current_grade, completed: !!done && !!p,
      code: p?.interests.code, identity: p?.identity.status,
      fits: p?.combinations.filter((c) => c.role?.startsWith("fit")).map((c) => c.id),
      mathsGate: p?.maths_gate?.recommendation, verdict: s?.vd?.code ?? null,
    }];
  });
  const stats = cohortStats(rows, settings?.offered_combination_ids ?? []);
  return (
    <StaffShell title="Cohort dashboard" nav={ADMIN_NAV}>
      <p className="text-muted">Group statistics only. Any group smaller than {MIN_GROUP} learners is hidden so no individual can be identified. Results are never broken down by race.</p>
      {stats.grades.map((g) => (
        <section key={g.grade} className="space-y-3">
          <h2 className="text-3xl">Grade {g.grade}</h2>
          {g.suppressed ? <p className="card text-muted">Fewer than {MIN_GROUP} learners in this grade — nothing is shown.</p> : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Learners" value={g.learners} layer={1} />
                <Stat label="Completed" value={g.completed} layer={3} />
                <Stat label="Completion rate" value={`${g.completion_rate}%`} layer={4} />
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <Dist title="Strongest interest (first letter of the code)" d={g.interest_first_letter} kind="riasec" />
                <Dist title="Where learners are with their future" d={g.identity_status} kind="identity" />
                <Dist title="Maths recommendation" d={g.maths_gate} kind="plain" />
                <Dist title="Grade 11 verdicts" d={g.verdicts} kind="plain" />
              </div>
              {g.grade === 9 && (
                <div className="card">
                  <h3 className="mb-2 font-semibold">Recommended combinations vs what you offer</h3>
                  {!g.recommended_vs_offered.length ? <p className="text-sm text-muted">Hidden: fewer than {MIN_GROUP} completed learners.</p> : (
                    <table className="w-full text-sm"><thead className="text-muted"><tr><th className="text-left">Combination</th><th className="text-left">Times recommended</th><th className="text-left">Offered?</th></tr></thead>
                      <tbody>{g.recommended_vs_offered.map((r) => (
                        <tr key={r.id} className="border-t border-line"><td className="py-1">{combinationById.get(r.id)?.name ?? r.id}</td><td>{r.count ?? `fewer than ${MIN_GROUP}`}</td><td className={r.offered === false ? "text-danger" : ""}>{r.offered === null ? "not uploaded" : r.offered ? "yes" : "no"}</td></tr>
                      ))}</tbody></table>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      ))}
    </StaffShell>
  );
}
