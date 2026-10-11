"use client";
import { useState } from "react";
import { post } from "./api";
import { LogoutButton } from "./LoginForms";

interface Setup { factorId: string; qr: string; secret: string }

/** Authenticator setup (first time) or code entry (every sign-in). */
export function MfaForm({ mode }: { mode: "enrol" | "verify" }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin() {
    setBusy(true); setError(null);
    try { setSetup(await post<Setup>("/api/staff/mfa/enrol")); } catch (e) { setError((e as Error).message); }
    setBusy(false);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, "");
    setBusy(true); setError(null);
    try {
      const r = await post<{ next: string }>("/api/staff/mfa/verify", { code, factorId: setup?.factorId });
      window.location.assign(r.next);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  const codeField = (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">6-digit code</label>
        <input id="code" name="code" className="field text-center text-2xl font-semibold tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus={mode === "verify"} />
      </div>
      {error && <p role="alert" className="alert">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Checking…" : mode === "enrol" ? "Confirm and finish" : "Verify"}</button>
    </form>
  );

  if (mode === "verify") return <div className="space-y-4">{codeField}<LogoutButton className="btn-ghost w-full" /></div>;

  if (!setup) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>Install an authenticator app on your phone.</li>
          <li>Press the button below to show your QR code.</li>
          <li>Scan it, then type in the 6-digit code the app shows.</li>
        </ol>
        {error && <p role="alert" className="alert">{error}</p>}
        <button className="btn-primary w-full" onClick={begin} disabled={busy}>{busy ? "Starting…" : "Show my QR code"}</button>
        <LogoutButton className="btn-ghost w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI from the auth server, not an optimisable asset */}
      <img src={setup.qr} alt="QR code for your authenticator app" width={192} height={192} className="mx-auto rounded-xl bg-white p-2" />
      <p className="text-sm text-muted">Can&apos;t scan? Type this key into the app instead: <code className="break-all font-semibold text-fg">{setup.secret}</code></p>
      {codeField}
    </div>
  );
}
