"use client";
import { useState } from "react";
import { post } from "./api";

interface Settings {
  offered_combination_ids: string[]; readiness_overrides: Record<string, { needs: Record<string, number> }>;
  subject_change_deadline_g10: string | null; subject_change_deadline_g11: string | null;
  safeguarding_contact_name: string; safeguarding_contact_phone: string; safeguarding_contact_email: string;
  safeguarding_backup_name: string; safeguarding_backup_phone: string; safeguarding_backup_email: string | null;
  offered_subjects_fet: string[]; timetable_allows: Record<string, boolean>; performance_overrides: Record<string, number>;
  school_day_start: string; school_day_end: string; partnership_agreement_signed: string;
}

export function SettingsForm({ initial, combinations, subjects }: { initial: Settings; combinations: { id: string; name: string }[]; subjects: string[] }) {
  const [s, setS] = useState<Settings>(initial);
  const [overrides, setOverrides] = useState(JSON.stringify(initial.readiness_overrides, null, 2));
  const [perf, setPerf] = useState(JSON.stringify(initial.performance_overrides, null, 2));
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));
  const toggle = (k: "offered_combination_ids" | "offered_subjects_fet", id: string) => set(k, s[k].includes(id) ? s[k].filter((x) => x !== id) : [...s[k], id]);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await post("/api/school/settings", {
        ...s,
        readiness_overrides: JSON.parse(overrides || "{}"),
        performance_overrides: JSON.parse(perf || "{}"),
        subject_change_deadline_g10: s.subject_change_deadline_g10 || null,
        subject_change_deadline_g11: s.subject_change_deadline_g11 || null,
        safeguarding_backup_email: s.safeguarding_backup_email || null,
      });
      setMsg("Saved.");
    } catch (e) { setMsg(e instanceof SyntaxError ? "One of the JSON boxes isn't valid JSON." : (e as Error).message); } finally { setBusy(false); }
  }

  const Field = ({ k, label, type = "text" }: { k: keyof Settings; label: string; type?: string }) => (
    <div><label className="label" htmlFor={k}>{label}</label><input id={k} type={type} className="field" value={(s[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} /></div>
  );

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h2 className="text-2xl">Safeguarding contacts <span className="chip !border-danger align-middle text-danger">required</span></h2>
        <p className="text-sm text-muted">No school goes live without a designated contact and a backup.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field k="safeguarding_contact_name" label="Designated contact" /><Field k="safeguarding_contact_phone" label="Phone (for us to call)" /><Field k="safeguarding_contact_email" label="Email" type="email" />
          <Field k="safeguarding_backup_name" label="Backup contact" /><Field k="safeguarding_backup_phone" label="Backup phone" /><Field k="safeguarding_backup_email" label="Backup email" type="email" />
          <Field k="school_day_start" label="School day starts" type="time" /><Field k="school_day_end" label="School day ends" type="time" /><Field k="partnership_agreement_signed" label="Partnership agreement signed" type="date" />
        </div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-2xl">Subject-change deadlines</h2>
        <p className="text-sm text-muted">The Grade 11 verdict depends on this. Without a deadline, reports never say a switch is possible.</p>
        <div className="grid gap-3 sm:grid-cols-2"><Field k="subject_change_deadline_g10" label="Grade 10 deadline" type="date" /><Field k="subject_change_deadline_g11" label="Grade 11 deadline" type="date" /></div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-2xl">Combinations you offer (Grade 10)</h2>
        <div className="grid gap-2 sm:grid-cols-2">{combinations.map((c) => (
          <label key={c.id} className="choice gap-3"><input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={s.offered_combination_ids.includes(c.id)} onChange={() => toggle("offered_combination_ids", c.id)} />{c.name}</label>
        ))}</div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-2xl">FET subjects you offer · can a Grade 11 learner switch into/out of it?</h2>
        <div className="grid gap-2 sm:grid-cols-2">{subjects.map((sub) => (
          <div key={sub} className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={s.offered_subjects_fet.includes(sub)} onChange={() => toggle("offered_subjects_fet", sub)} />{sub}</label>
            <select aria-label={`Timetable allows switching ${sub}`} className="field min-h-9 w-36 py-1 text-sm" value={s.timetable_allows[sub] === undefined ? "" : String(s.timetable_allows[sub])}
              onChange={(e) => { const v = e.target.value; const next = { ...s.timetable_allows }; if (v === "") delete next[sub]; else next[sub] = v === "true"; set("timetable_allows", next); }}>
              <option value="">Not sure</option><option value="true">Switch possible</option><option value="false">No switch</option>
            </select>
          </div>
        ))}</div>
      </section>
      <section className="card space-y-3">
        <h2 className="text-2xl">Your own thresholds (optional)</h2>
        <p className="text-sm text-muted">School values always win over the defaults. Readiness: <code>{`{"Physical Sciences": {"needs": {"Natural Sciences": 60}}}`}</code>. Grade 11 pass mark you require: <code>{`{"Physical Sciences": 60}`}</code></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <textarea aria-label="Readiness overrides JSON" className="field min-h-32 font-mono text-xs" value={overrides} onChange={(e) => setOverrides(e.target.value)} />
          <textarea aria-label="Performance overrides JSON" className="field min-h-32 font-mono text-xs" value={perf} onChange={(e) => setPerf(e.target.value)} />
        </div>
      </section>
      <button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
      {msg && <p role="status" className="note">{msg}</p>}
    </div>
  );
}

export function ImportBox({ kind, help, example }: { kind: "roster" | "marks"; help: string; example: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[]; codes?: { name: string; grade: number; class: string | null; code: string }[] } | null>(null);
  async function onFile(f: File) {
    setBusy(true); setResult(null);
    try { setResult(await post("/api/school/import", { kind, csv: await f.text() })); }
    catch (e) { setResult({ imported: 0, errors: [(e as Error).message] }); } finally { setBusy(false); }
  }
  return (
    <section className="card space-y-3">
      <h2 className="text-2xl">{kind === "roster" ? "Import learners" : "Import marks (SA-SAMS export)"}</h2>
      <p className="text-sm text-muted">{help}</p>
      <pre className="overflow-x-auto rounded-[14px] border-[1.5px] border-line bg-sunken/60 p-3 text-xs">{example}</pre>
      <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {result && (
        <div className="space-y-2">
          <p>{result.imported} imported.</p>
          {!!result.errors.length && <ul className="list-disc pl-5 text-sm text-danger">{result.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}</ul>}
          {!!result.codes?.length && (
            <div>
              <p className="font-semibold">Login codes — print these now and hand them out (school code on each slip).</p>
              <table className="mt-2 w-full text-sm"><tbody>{result.codes.map((c) => <tr key={c.code} className="border-t border-line"><td className="py-1">{c.name}</td><td>Gr {c.grade} {c.class ?? ""}</td><td className="font-mono">{c.code}</td></tr>)}</tbody></table>
              <button className="btn-ghost mt-2" onClick={() => window.print()}>Print</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
