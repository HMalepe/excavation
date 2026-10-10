import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/db/admin";
import type { ParentSummary } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";
export const metadata = { title: "A summary from your child", robots: { index: false } };

/** Parent summary through a revocable link (spec 08 Part 6). No login; the token is the key. */
export default async function ParentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const hash = createHash("sha256").update(token).digest("hex");
  const db = adminDb();
  const { data: grant } = await db.from("share_grants").select("id, report_id, learner_id, revoked_at, audience").eq("token_hash", hash).maybeSingle();
  if (!grant || grant.revoked_at || grant.audience !== "parent") notFound();
  const { data: report } = await db.from("reports").select("content, status, kind, sessions(touchpoint)").eq("id", grant.report_id).single();
  if (!report || report.status !== "released" || report.kind !== "parent") {
    return <main className="mx-auto max-w-xl px-5 py-12"><h1 className="text-2xl">This summary is still being checked.</h1><p className="mt-3 text-muted">Please try the link again later today.</p></main>;
  }
  const { data: learner } = await db.from("learners").select("first_name").eq("id", grant.learner_id).single();
  await db.from("audit_log").insert({ actor: null, action: "view_parent_summary", target: grant.id });
  const p = report.content as ParentSummary;
  const g11 = (report.sessions as unknown as { touchpoint: string }).touchpoint === "G11_CONFIRMATION";
  return (
    <main className="mx-auto max-w-xl space-y-8 px-5 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-ink">The Excavation · {g11 ? "Grade 11 Confirmation" : "Grade 9 Foundation"}</p>
        <h1 className="text-3xl">A summary from {learner?.first_name}</h1>
        <p className="text-muted">{learner?.first_name} chose to share this with you.</p>
      </header>
      <section className="space-y-2"><h2 className="text-xl">At their best, {learner?.first_name}…</h2><ul className="list-disc space-y-1 pl-5">{p.at_their_best.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
      <section className="space-y-2"><h2 className="text-xl">Recommendation</h2><p>{p.recommendation_plain}</p></section>
      <section className="space-y-2"><h2 className="text-xl">What {learner?.first_name} needs from home</h2><ul className="list-disc space-y-1 pl-5">{p.what_they_need_from_home.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
      <section className="space-y-2"><h2 className="text-xl">Questions you could ask this week</h2><ol className="list-decimal space-y-1 pl-5">{p.questions_to_ask.map((x, i) => <li key={i}>{x}</li>)}</ol></section>
      <p className="text-xs text-muted">The Excavation offers reflective insights to support a conversation, not a diagnosis or a final decision. Questions about your child&apos;s information: privacy@theexcavation.co.za</p>
    </main>
  );
}
