import Link from "next/link";
import { Mark, Stepper } from "./Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import type { Descent as D } from "@/lib/flow/stages";

/**
 * Learner page frame: quiet header (brand, theme, Pause always visible), the stage as a breadcrumb,
 * and the full stepper at the foot so progress is always legible without numbers.
 */
export function LearnerShell({ at, children, wide = false }: { at: D; children: React.ReactNode; wide?: boolean }) {
  const w = wide ? "max-w-4xl" : "max-w-xl";
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-2.5 ${w}`}>
          <div className="flex min-w-0 items-center gap-3">
            <Mark className="h-8 w-8" title="The Excavation" />
            <span className="hidden text-[0.95rem] font-bold tracking-[-0.02em] sm:inline">The Excavation</span>
            <span className="hidden h-5 w-px bg-line sm:inline-block" aria-hidden="true" />
            <span className="truncate text-sm font-medium text-muted">{at}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/learn/paused" className="btn-ghost !min-h-11 !px-3.5 !py-2 text-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              Pause
            </Link>
          </div>
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-4 pb-10 pt-8 ${w}`}>{children}</main>
      <footer className="border-t border-line bg-surface/70">
        <div className={`mx-auto px-4 py-4 ${w}`}><Stepper at={at} /></div>
      </footer>
    </div>
  );
}
