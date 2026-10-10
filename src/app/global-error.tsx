"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrors";

/** Catches crashes in the root layout itself, where error.tsx can't. Self-contained: no app CSS needed. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { reportClientError("boundary", error); }, [error]);
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0d12", color: "#f3f5f8" }}>
        <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, padding: "40px 20px" }}>
          <h1 style={{ fontSize: "1.9rem", lineHeight: 1.15, margin: 0 }}>That didn&apos;t load properly.</h1>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.5, margin: 0 }}>It&apos;s on our side, not yours. Every answer you gave is saved.</p>
          <button onClick={() => window.location.assign("/learn")} style={{ minHeight: 48, borderRadius: 12, border: 0, background: "#ffd60a", color: "#0a0d12", fontSize: "1.05rem", fontWeight: 700, cursor: "pointer" }}>Reload</button>
          {error.digest && <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: 0 }}>Reference: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
