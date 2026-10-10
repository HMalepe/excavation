"use client";
import { useEffect, useState } from "react";

/** Headline alone on screen for ~1.5 s, then the rest draws in (spec 08 Part 7). Instant if reduced motion. */
export function Reveal({ headline, children }: { headline: React.ReactNode; children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <div className={shown ? "pt-6" : "flex min-h-[70dvh] items-center"}>{headline}</div>
      <div className={shown ? "animate-fade-up" : "hidden"} aria-hidden={!shown}>{children}</div>
    </>
  );
}
