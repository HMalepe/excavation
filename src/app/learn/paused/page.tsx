import Link from "next/link";
import { pageLearner } from "@/lib/auth/guards";
import { getOrCreateSession } from "@/lib/session/service";
import { Resources } from "@/components/ui/Resources";
import { LogoutButton } from "@/components/client/LoginForms";
import { Banner } from "@/components/ui/Question";
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
          <Banner sec="identity" art="shield" />
          <p className="eyebrow">Taking a break</p>
          <h1 className="text-[2rem] sm:text-4xl">We&apos;ve paused here for now.</h1>
          <p className="text-lg">Thank you for telling us what&apos;s going on. An adult at your school who can help has been told, so you&apos;re not on your own with this. Nothing you&apos;ve done is lost. You can finish later.</p>
          <p className="text-lg font-semibold">If you need someone right now:</p>
          <Resources />
        </>
      ) : (
        <>
          <Banner sec="direction" art="pause" />
          <p className="eyebrow">Paused</p>
          <h1 className="text-[2rem] sm:text-4xl">Everything is saved.</h1>
          <p className="text-lg text-muted">Log in any time with the same codes and you&apos;ll pick up exactly where you stopped.</p>
          <Link href="/learn" className="btn-primary">Carry on</Link>
          <details className="card"><summary className="font-semibold">People you can talk to</summary><div className="mt-4"><Resources compact /></div></details>
        </>
      )}
      <LogoutButton className="btn-quiet self-start" />
    </PlainPage>
  );
}
