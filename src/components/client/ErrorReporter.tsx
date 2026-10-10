"use client";
import { useEffect } from "react";
import { IGNORED, reportClientError } from "@/lib/clientErrors";

/** Mounted once in the root layout: reports uncaught errors and rejected promises to the server log. */
export function ErrorReporter() {
  useEffect(() => {
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
