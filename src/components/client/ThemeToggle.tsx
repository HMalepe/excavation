"use client";
import { useEffect, useState } from "react";

/** Light (Limestone) ↔ dark (Bedrock). Remembered on this device; default follows the phone. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setDark(set ? set === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* private mode: still switches for this visit */ }
  };
  return (
    <button type="button" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] border-control bg-surface text-fg hover:border-edge ${className}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {dark === null ? null : dark
          ? <><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>
          : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
      </svg>
    </button>
  );
}
