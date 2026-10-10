"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrors";

/**
 * Last line of defence for any page: a crash in the browser shows this instead of a blank screen.
 * Everything a learner does is saved on the server as they go, so reloading loses nothing.
 * The first crash in a tab is retried automatically (a re-render clears most transient ones).
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError("boundary", error);
    try {
      const last = Number(sessionStorage.getItem("auto-reset-at") ?? 0);
      if (Date.now() - last > 30_000) {
        sessionStorage.setItem("auto-reset-at", String(Date.now()));
        reset();
      }
    } catch { /* storage blocked: the buttons below still work */ }
  }, [error, reset]);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, padding: "40px 20px" }}>
      <h1 style={{ fontSize: "1.9rem", lineHeight: 1.15 }}>That didn&apos;t load properly.</h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.5 }}>It&apos;s on our side, not yours. Every answer you gave is saved, so you won&apos;t lose anything.</p>
      <div style={{ display: "grid", gap: 12 }}>
        <button className="btn-primary" onClick={() => reset()}>Try again</button>
        <button className="btn-ghost" onClick={() => window.location.assign("/learn")}>Go back to where I was</button>
      </div>
      <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>If this keeps happening, tell your teacher.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
    </main>
  );
}
