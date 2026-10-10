"use client";
import { useEffect } from "react";
import { IGNORED, reportClientError } from "@/lib/clientErrors";

/** Mounted once in the root layout: reports uncaught errors and rejected promises to the server log. */
export function ErrorReporter() {
  useEffect(() => {
    // If React ever re-creates <html> (hydration recovery), the saved theme attribute is lost: restore it.
    try {
      const t = localStorage.getItem("theme");
      if ((t === "light" || t === "dark") && document.documentElement.dataset.theme !== t) document.documentElement.dataset.theme = t;
    } catch { /* storage blocked: follow the phone */ }
    const onError = (ev: ErrorEvent) => {
      if (IGNORED.test(ev.message ?? "")) return;
      reportClientError("error", ev.error ?? new Error(ev.message));
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const msg = String((ev.reason as { message?: string } | null)?.message ?? ev.reason ?? "");
      if (IGNORED.test(msg)) return;
      reportClientError("rejection", ev.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
