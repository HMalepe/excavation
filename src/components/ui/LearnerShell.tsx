import Link from "next/link";
import { Descent } from "./Descent";
import type { Descent as D } from "@/lib/flow/stages";

/** Learner page frame: descent indicator + a Pause button that is always visible. */
export function LearnerShell({ at, children, wide = false }: { at: D; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-ink-3 bg-ink/95 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-3 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
          <Descent at={at} />
          <Link href="/learn/paused" className="rounded-lg border border-ink-3 px-3 py-2 text-sm font-semibold text-cream no-underline hover:border-amber">
            Pause
          </Link>
        </div>
      </header>
      <main className={`mx-auto px-4 py-6 ${wide ? "max-w-4xl" : "max-w-xl"}`}>{children}</main>
    </div>
  );
}
