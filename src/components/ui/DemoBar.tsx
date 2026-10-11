"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { DEMO_STEPS } from "@/lib/demo/script";

/** Sticky frame for the investor demo: where we are, and a clear "this is a sample" label. */
export function DemoBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/demo" className="no-underline"><Wordmark /></Link>
        <span className="chip">Demo · sample learner · nothing is saved</span>
        <ThemeToggle />
      </div>
      <nav aria-label="Demo steps" className="mx-auto max-w-3xl px-4 pb-2.5">
        <ol className="grid grid-cols-3 gap-2">
          {DEMO_STEPS.map((s) => {
            const here = path === s.href;
            return (
              <li key={s.href}>
                <Link href={s.href} aria-current={here ? "step" : undefined}
                  className={`flex min-h-11 flex-col justify-center rounded-xl border px-3 py-1.5 text-left no-underline ${here ? "border-accent bg-tint text-accent-ink" : "border-line bg-surface text-muted hover:bg-sunken"}`}>
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em]">{s.n} · {s.min}</span>
                  <span className="truncate text-sm font-semibold">{s.title.split(" · ").at(-1)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
