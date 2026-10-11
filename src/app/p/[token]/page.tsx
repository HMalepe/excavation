import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/db/admin";
import type { ParentSummary } from "@/lib/ai/schemas";
import { PlainPage } from "@/components/ui/PlainPage";

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
    return <PlainPage><h1 className="text-4xl">This summary is still being checked.</h1><p className="text-lg text-muted">Please try the link again later today.</p></PlainPage>;
  }
  const { data: learner } = await db.from("learners").select("first_name").eq("id", grant.learner_id).single();
  await db.from("audit_log").insert({ actor: null, action: "view_parent_summary", target: grant.id });
  const p = report.content as ParentSummary;
  const g11 = (report.sessions as unknown as { touchpoint: string }).touchpoint === "G11_CONFIRMATION";
  return (
    <PlainPage width="md" centered={false} sub="For parents and guardians">
      <header className="space-y-3">
        <p className="eyebrow">{g11 ? "Grade 11 Confirmation" : "Grade 9 Foundation"}</p>
        <h1 className="text-5xl">A summary from {learner?.first_name}</h1>
        <p className="text-lg text-muted">{learner?.first_name} chose to share this with you.</p>
      </header>
      <section className="card space-y-3"><h2 className="text-2xl">At their best, {learner?.first_name}…</h2><ul className="space-y-2">{p.at_their_best.map((x, i) => <li key={i} className="flex gap-3"><span className="diamond" aria-hidden="true" /><span>{x}</span></li>)}</ul></section>
      <section className="card space-y-2"><h2 className="text-2xl">Recommendation</h2><p className="text-lg">{p.recommendation_plain}</p></section>
      <section className="card space-y-3"><h2 className="text-2xl">What {learner?.first_name} needs from home</h2><ul className="space-y-2">{p.what_they_need_from_home.map((x, i) => <li key={i} className="flex gap-3"><span className="diamond" aria-hidden="true" /><span>{x}</span></li>)}</ul></section>
      <section className="card space-y-3"><h2 className="text-2xl">Questions you could ask this week</h2><ol className="space-y-3">{p.questions_to_ask.map((x, i) => <li key={i} className="flex gap-3"><span className="font-semibold flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-edge bg-accent text-sm font-extrabold text-on-accent">{i + 1}</span><span className="pt-0.5">{x}</span></li>)}</ol></section>
      <p className="text-sm text-muted">The Excavation offers reflective insights to support a conversation, not a diagnosis or a final decision. Questions about your child&apos;s information: privacy@theexcavation.co.za</p>
    </PlainPage>
  );
}
