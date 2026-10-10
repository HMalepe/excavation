import Link from "next/link";
import { pageLearner } from "@/lib/auth/guards";
import { getOrCreateSession } from "@/lib/session/service";
import { Resources } from "@/components/ui/Resources";
import { LogoutButton } from "@/components/client/LoginForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paused" };

export default async function Paused() {
  const { learner } = await pageLearner();
  const session = await getOrCreateSession(learner);
  const stopped = session?.status === "safety_stop" || !!session?.locked_at;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      {stopped ? (
        <>
          <h1 className="text-3xl">We&apos;ve paused here for now.</h1>
          <p>Thank you for telling us what&apos;s going on. An adult at your school who can help has been let know, so you&apos;re not alone with this. Nothing you&apos;ve done is lost — you can finish later.</p>
          <p className="font-semibold">If you need someone right now:</p>
          <Resources />
        </>
      ) : (
        <>
          <h1 className="text-3xl">Paused. Everything is saved.</h1>
          <p className="text-muted">Come back any time with the same codes and you&apos;ll pick up exactly where you left off.</p>
          <Link href="/learn" className="btn-primary no-underline">Carry on now</Link>
          <details className="card"><summary className="cursor-pointer font-semibold">People you can talk to</summary><div className="mt-4"><Resources compact /></div></details>
        </>
      )}
      <LogoutButton />
    </main>
  );
}
