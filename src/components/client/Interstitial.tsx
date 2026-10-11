"use client";
import Link from "next/link";
import type { SectionEvents } from "./ScoredLayer";

const SOFT_COPY =
  "Some of these questions can land heavier on some days. You can keep going, take a break, or come back another time. If talking to someone would help, there are people available now.";

/**
 * Between-section moments. The soft safeguarding interstitial (spec 09 §5.1) takes priority over a
 * micro-moment; its two choices are visually equal, and the resources stay open until closed.
 */
export function Interstitial({ events, onContinue, resources }: { events: SectionEvents; onContinue: () => void; resources: React.ReactNode }) {
  if (events.softInterstitial) {
    return (
      <section className="space-y-6 py-6" aria-live="polite">
        <div className="card space-y-3">
          <p className="eyebrow">A quick pause</p>
          <p className="text-xl font-semibold leading-snug">{SOFT_COPY}</p>
        </div>
        <details className="card">
          <summary className="font-semibold">People you can talk to now</summary>
          <div className="mt-4">{resources}</div>
        </details>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={onContinue}>Continue</button>
          <Link href="/learn/paused" className="btn-ghost no-underline">Take a break</Link>
        </div>
      </section>
    );
  }
  return (
    <section className="flex min-h-[60dvh] flex-col justify-center gap-8 animate-fade-up" aria-live="polite">
      <div className="space-y-5">
        <span className="diamond !mt-0 block h-3 w-3" aria-hidden="true" />
        <p className="text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">{events.microMoment}</p>
      </div>
      <button className="btn-primary" onClick={onContinue} autoFocus>Keep going</button>
    </section>
  );
}
