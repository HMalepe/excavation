"use client";
import { useState } from "react";
import { post } from "./api";

export function LearnerLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null);
    try {
      const r = await post<{ next: string }>("/api/auth/learner-login", { schoolCode: f.get("school"), loginCode: f.get("code") });
      window.location.assign(r.next);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="school">School code</label>
        <input id="school" name="school" className="field uppercase" autoComplete="off" autoCapitalize="characters" required maxLength={32} /></div>
      <div><label className="label" htmlFor="code">Your code</label>
        <input id="code" name="code" className="field uppercase" autoComplete="off" autoCapitalize="characters" required maxLength={32} /></div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Checking…" : "Go in"}</button>
      <p className="text-sm text-muted">Your teacher gives you both codes. Lost yours? Ask them for it again.</p>
    </form>
  );
}

export function StaffLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null);
    try {
      const r = await post<{ next: string }>("/api/auth/staff-login", { email: f.get("email"), password: f.get("password") });
      window.location.assign(r.next);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="field" autoComplete="username" required /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" className="field" autoComplete="current-password" required minLength={8} /></div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export function LogoutButton({ className = "btn-ghost" }: { className?: string }) {
  return (
    <button className={className} onClick={async () => { const r = await post<{ next: string }>("/api/auth/logout"); window.location.assign(r.next); }}>
      Log out
    </button>
  );
}
