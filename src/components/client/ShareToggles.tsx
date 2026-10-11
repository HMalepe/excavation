"use client";
import { useState } from "react";
import { learn } from "./api";

export function ShareToggles({ initial }: { initial: { teacher: boolean; parent: boolean } }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(audience: "teacher" | "parent") {
    const on = !state[audience];
    setBusy(audience); setError(null); setNote(null);
    try {
      const r = await learn<{ shared: boolean; link?: string | null; pending?: boolean }>("share", { audience, on });
      setState((s) => ({ ...s, [audience]: r.shared }));
      if (r.link) setLink(r.link);
      if (!on && audience === "parent") setLink(null);
      if (r.pending) setNote("Your summary is being checked by a person first. It'll be shared as soon as that's done.");
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  const Row = ({ audience, label, help }: { audience: "teacher" | "parent"; label: string; help: string }) => (
    <div className="card flex items-start justify-between gap-4">
      <div><p className="text-lg font-semibold">{label}</p><p className="mt-1 text-sm text-muted">{help}</p></div>
      <button role="switch" aria-checked={state[audience]} aria-label={label} disabled={busy !== null} onClick={() => toggle(audience)}
        className={`relative h-9 w-16 shrink-0 rounded-full border-2 transition-colors ${state[audience] ? "border-accent bg-accent" : "border-control bg-sunken"}`}>
        <span className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-all ${state[audience] ? "left-[34px]" : "left-[3px]"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Row audience="teacher" label="Share a summary with my LO teacher" help="A one-page summary: how you learn best, your strengths and your subject options. Never your conversation." />
      <Row audience="parent" label="Share a summary with my parent/guardian" help="A short summary to help you have one good conversation at home. You get a private link to send them." />
      {link && (
        <div className="card space-y-3">
          <p className="font-semibold">Your parent/guardian link</p>
          <p className="break-all text-sm">{link}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(link)}>Copy link</button>
            <a className="btn-ghost no-underline" href={`https://wa.me/?text=${encodeURIComponent(`Here's a summary of my Excavation report: ${link}`)}`}>Send on WhatsApp</a>
          </div>
          <p className="text-xs text-muted">This link is shown once. Turning sharing off stops it working.</p>
        </div>
      )}
      {note && <p className="text-muted">{note}</p>}
      {error && <p role="alert" className="alert">{error}</p>}
      <p className="text-sm text-muted">You can change these any time.</p>
    </div>
  );
}
