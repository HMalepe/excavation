import Link from "next/link";
import { redirect } from "next/navigation";
import { pageLearner } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { getOrCreateSession } from "@/lib/session/service";
import { ShareToggles } from "@/components/client/ShareToggles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sharing" };

export default async function SharePage() {
  const { learner } = await pageLearner();
  const session = await getOrCreateSession(learner);
  if (!session || session.stage !== "report") redirect("/learn/report");
  const { data: grants } = await adminDb().from("share_grants").select("audience, reports!inner(session_id)").eq("learner_id", learner.id).is("revoked_at", null).eq("reports.session_id", session.id);
  const live = new Set((grants ?? []).map((g) => g.audience));
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <Link href="/learn/report" className="text-sm no-underline">← Back to my report</Link>
      <h1 className="text-3xl">Sharing</h1>
      <p className="text-muted">Your report is yours. Nobody sees a summary unless you switch it on here.</p>
      <ShareToggles initial={{ teacher: live.has("teacher"), parent: live.has("parent") }} />
    </main>
  );
}
