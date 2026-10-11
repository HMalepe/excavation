import Link from "next/link";
import { pageLearner } from "@/lib/auth/guards";
import { getOrCreateSession } from "@/lib/session/service";
import { Resources } from "@/components/ui/Resources";
import { LogoutButton } from "@/components/client/LoginForms";
import { PlainPage } from "@/components/ui/PlainPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paused" };

export default async function Paused() {
  const { learner } = await pageLearner();
  const session = await getOrCreateSession(learner);
  const stopped = session?.status === "safety_stop" || !!session?.locked_at;
  return (
    <PlainPage>
      {stopped ? (
        <>
          <p className="eyebrow">Taking a break</p>
          <h1 className="text-5xl">We&apos;ve paused here for now.</h1>
          <p className="text-lg">Thank you for telling us what&apos;s going on. An adult at your school who can help has been let know, so you&apos;re not alone with this. Nothing you&apos;ve done is lost — you can finish later.</p>
          <p className="text-lg font-semibold">If you need someone right now:</p>
          <Resources />
        </>
      ) : (
        <>
          <p className="eyebrow">Paused</p>
          <h1 className="text-5xl">Everything is saved.</h1>
          <p className="text-lg text-muted">Come back any time with the same codes and you&apos;ll pick up exactly where you left off.</p>
          <Link href="/learn" className="btn-primary">Carry on now</Link>
          <details className="card"><summary className="font-semibold">People you can talk to</summary><div className="mt-4"><Resources compact /></div></details>
        </>
      )}
      <LogoutButton className="btn-quiet self-start" />
    </PlainPage>
  );
}
