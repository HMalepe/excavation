"use client";
import { useState } from "react";
import { post } from "./api";

interface Found { id: string; first_name: string; last_name: string; current_grade: number; class_label: string | null }

/** Staff tool for POPIA requests: find a learner, download everything held, or erase it with a typed confirmation. */
export function PrivacyTool() {
  const [found, setFound] = useState<{ school: string; learners: Found[] } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [erasing, setErasing] = useState<Found | null>(null);
  const [cleared, setCleared] = useState(false);

  async function find(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null); setMsg(null); setErasing(null);
    try { setFound(await post("/api/staff/privacy", { action: "find", schoolCode: f.get("school"), query: f.get("query") })); }
    catch (err) { setError((err as Error).message); setFound(null); }
  }
  async function download(l: Found) {
    setError(null);
    const res = await fetch("/api/staff/privacy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "export", learnerId: l.id }) });
    if (!res.ok) { setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Export failed."); return; }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a"); a.href = url; a.download = `learner-data-${l.first_name}.json`; a.click(); URL.revokeObjectURL(url);
    setMsg(`Exported ${l.first_name} ${l.last_name}'s data. Send it to the guardian securely, not by ordinary email attachment.`);
  }
  async function erase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!erasing) return;
    const f = new FormData(e.currentTarget);
    setError(null);
    try {
      await post("/api/staff/privacy", { action: "erase", learnerId: erasing.id, confirmName: f.get("confirm"), safeguardingCleared: cleared });
      setMsg(`${erasing.first_name} ${erasing.last_name} and everything linked to them has been permanently deleted.`);
      setFound((x) => x && { ...x, learners: x.learners.filter((l) => l.id !== erasing.id) }); setErasing(null); setCleared(false);
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={find} className="card grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label className="label" htmlFor="school">School code</label><input id="school" name="school" className="field uppercase" required /></div>
        <div><label className="label" htmlFor="query">Learner&apos;s name</label><input id="query" name="query" className="field" required minLength={2} /></div>
        <button className="btn-primary">Find</button>
      </form>
      {error && <p role="alert" className="alert">{error}</p>}
      {msg && <p role="status" className="note">{msg}</p>}
      {found && (
        <div className="card space-y-2">
          <p className="font-semibold">{found.school}</p>
          {!found.learners.length && <p className="text-muted">Nobody matches.</p>}
          <ul className="divide-y divide-line">
            {found.learners.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{l.first_name} {l.last_name} · Gr {l.current_grade} {l.class_label ?? ""}</span>
                <span className="flex gap-2"><button className="btn-ghost !min-h-10 !px-3 !py-1.5" onClick={() => download(l)}>Download data</button><button className="btn-quiet !text-danger" onClick={() => setErasing(l)}>Erase…</button></span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {erasing && (
        <form onSubmit={erase} className="card space-y-3 !border-danger">
          <h2 className="text-xl text-danger">Erase {erasing.first_name} {erasing.last_name}</h2>
          <p>This permanently deletes their answers, chat, reports, consent records and login. It cannot be undone. Export first if the guardian wants a copy.</p>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={cleared} onChange={(e) => setCleared(e.target.checked)} /> Only tick this if the learner has safeguarding records AND the attorney has confirmed they may be deleted.</label>
          <div><label className="label" htmlFor="confirm">Type their first name ({erasing.first_name}) to confirm</label><input id="confirm" name="confirm" className="field" required autoComplete="off" /></div>
          <div className="flex gap-2"><button className="btn-primary !bg-danger !text-white">Erase permanently</button><button type="button" className="btn-ghost" onClick={() => setErasing(null)}>Cancel</button></div>
        </form>
      )}
    </div>
  );
}
