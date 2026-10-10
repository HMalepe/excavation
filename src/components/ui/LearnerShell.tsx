import Link from "next/link";
import { Descent } from "./Descent";
import { Mark, StrataRule } from "./Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import type { Descent as D } from "@/lib/flow/stages";

/** Learner page frame: depth gauge, theme switch and a Pause button that is always visible. */
export function LearnerShell({ at, children, wide = false }: { at: D; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b-[1.5px] border-line bg-canvas/90 backdrop-blur-md">
        <StrataRule />
        <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-2.5 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
          <div className="flex items-center gap-3">
            <Mark className="h-8 w-8" title="The Excavation" />
            <Descent at={at} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/learn/paused" className="inline-flex h-11 items-center gap-1.5 rounded-xl border-[1.5px] border-edge bg-surface px-3 font-display text-sm font-bold text-fg no-underline hover:bg-sunken">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              Pause
            </Link>
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 pb-16 pt-7 ${wide ? "max-w-4xl" : "max-w-xl"}`}>{children}</main>
    </div>
  );
}
