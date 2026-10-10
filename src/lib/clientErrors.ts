/**
 * Browser-side error reporting. A learner's crash leaves nothing in the server logs (the server did
 * nothing wrong), so the browser tells us: one small JSON POST to /api/client-error, which writes a
 * single log line. No answers, no names, no page content: only the error, where it happened and the
 * browser. Client-safe: no server imports here.
 */
export interface ClientErrorReport {
  kind: "boundary" | "error" | "rejection";
  message: string;
  stack?: string;
  digest?: string;
  path: string;
  ua: string;
}

const MAX_PER_PAGE = 5;
let sent = 0;

export function reportClientError(kind: ClientErrorReport["kind"], err: unknown) {
  if (typeof window === "undefined" || sent >= MAX_PER_PAGE) return;
  const e = err as { message?: unknown; stack?: unknown; digest?: unknown } | null;
  const report: ClientErrorReport = {
    kind,
    message: String(e?.message ?? err ?? "unknown").slice(0, 400),
    stack: typeof e?.stack === "string" ? e.stack.slice(0, 1800) : undefined,
    digest: typeof e?.digest === "string" ? e.digest : undefined,
    path: window.location.pathname,
    ua: navigator.userAgent.slice(0, 160),
  };
  sent += 1;
  try {
    const body = JSON.stringify(report);
    if (!navigator.sendBeacon?.("/api/client-error", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/client-error", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
    }
  } catch { /* reporting must never itself throw */ }
}

/** Noise that is not a bug in the app. */
export const IGNORED = /ResizeObserver loop|Script error\.?$|Non-Error promise rejection|AbortError|NetworkError|Failed to fetch|Load failed/i;
