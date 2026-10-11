"use client";
import { useEffect, useState } from "react";

/** Headline alone on screen for ~1.5 s, then the rest draws in (spec 08 Part 7). Instant if reduced motion. */
export function Reveal({ headline, kicker, children }: { headline: React.ReactNode; kicker?: string; children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <div className={`animate-fade-up ${shown ? "pt-8" : "flex min-h-[70dvh] flex-col justify-center"}`}>
        <div className="mb-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-accent" />
          {kicker && <span className="eyebrow">{kicker}</span>}
        </div>
        {headline}
      </div>
      <div className={shown ? "animate-fade-up" : "hidden"} aria-hidden={!shown}>{children}</div>
    </>
  );
}
