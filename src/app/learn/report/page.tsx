import Link from "next/link";
import { redirect } from "next/navigation";
import { pageLearner } from "@/lib/auth/guards";
import { getOrCreateSession } from "@/lib/session/service";
import { loadReportBundle } from "@/lib/report/load";
import { G9Report, G11Report } from "@/components/report/ReportViews";
import { AutoRefresh } from "@/components/client/AutoRefresh";
import { Banner } from "@/components/ui/Question";
import { PlainPage } from "@/components/ui/PlainPage";
import { Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your report" };

export default async function ReportPage() {
  const { learner } = await pageLearner();
  const session = await getOrCreateSession(learner);
  if (!session) redirect("/learn");
  if (session.stage !== "processing" && session.stage !== "report") redirect("/learn");
  const b = await loadReportBundle(session.id);

  if (!b.report || b.report.status !== "released") {
    const generating = !b.report || b.report.status === "generating";
    return (
      <PlainPage>
        <Banner sec="identity" art={generating ? "layers" : "report"} />
        <p className="eyebrow">{generating ? "Putting it together" : "In review"}</p>
        <h1 className="text-[2rem] sm:text-4xl">{generating ? "Your report is being written." : "A person is reading your report first."}</h1>
        <p className="text-lg text-muted">
          {generating
            ? "This usually takes a minute or two. You can leave this page. Your report will be here when you log back in."
            : "While The Excavation is new, a trained reviewer reads every report before you see it. That usually takes less than a day. Log in again to check."}
        </p>
        {generating && <AutoRefresh seconds={15} />}
        <Link href="/learn/paused" className="btn-ghost">Close for now</Link>
      </PlainPage>
    );
  }

  const g9 = session.touchpoint === "G9_FOUNDATION";
  const issued = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" }).format(new Date(b.report.reviewed_at ?? b.report.created_at));
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <Wordmark />
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <a href={`/api/report/pdf?kind=learner`} className="inline-flex h-11 items-center rounded-[10px] border border-line bg-surface px-3 text-fg no-underline hover:bg-sunken">PDF</a>
            <Link href="/learn/report/share" className="inline-flex h-11 items-center rounded-[10px] border border-line bg-surface px-3 text-fg no-underline hover:bg-sunken">Share</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4">
        {g9 ? (
          <G9Report r={b.report.content as ReportG9} profile={b.profile!} name={learner.first_name} issued={issued} />
        ) : (
          <G11Report name={learner.first_name} issued={issued} r={b.report.content as ReportG11} profile={b.profile!} g9Profile={b.g9Profile} verdict={b.verdict!} planState={(b.report.learner_state?.plan as Record<string, boolean>) ?? {}} />
        )}
      </main>
    </div>
  );
}
