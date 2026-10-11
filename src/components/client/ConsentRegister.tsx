"use client";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./api";

export interface RegisterRow { id: string; name: string; grade: number; cls: string | null; status: "on_file" | "withdrawn" | "missing"; guardian: string | null; research: boolean; given: string | null }

const LABEL = { on_file: "Consent on file", withdrawn: "Withdrawn", missing: "No form yet" } as const;
const TONE = { on_file: "text-teal-ink", withdrawn: "text-danger", missing: "text-muted" } as const;

function RecordForm({ learnerId, onDone }: { learnerId: string; onDone: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError(null);
    try {
      await post("/api/school/consent", {
        action: "record", learnerId, guardian_name: f.get("guardian_name"), relationship: f.get("relationship"), consent_research: f.get("research") === "on",
        evidence_ref: String(f.get("form_ref") ?? "") || null, given_on: String(f.get("given_on") ?? "") || null,
      });
      onDone(); router.refresh();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="note space-y-3">
      <p className="text-sm">Only record a form where the parent or guardian ticked all three required boxes. If they declined, record nothing: the learner simply can&apos;t start.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor={`g-${learnerId}`}>Parent or guardian name</label><input id={`g-${learnerId}`} name="guardian_name" className="field" required minLength={2} maxLength={120} /></div>
        <div><label className="label" htmlFor={`r-${learnerId}`}>Relationship</label><input id={`r-${learnerId}`} name="relationship" className="field" required placeholder="e.g. mother" maxLength={60} /></div>
        <div><label className="label" htmlFor={`f-${learnerId}`}>Form reference (optional)</label><input id={`f-${learnerId}`} name="form_ref" className="field" maxLength={120} placeholder="e.g. box 3, sheet 12" /></div>
        <div><label className="label" htmlFor={`d-${learnerId}`}>Date on the form (optional)</label><input id={`d-${learnerId}`} name="given_on" type="date" className="field" /></div>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" name="research" /> They also ticked the optional research box</label>
      {error && <p role="alert" className="alert">{error}</p>}
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Record consent"}</button><button type="button" className="btn-ghost" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export function ConsentRegister({ rows }: { rows: RegisterRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function withdraw(r: RegisterRow) {
    if (!window.confirm(`Withdraw consent for ${r.name}? They won't be able to continue until a new form is recorded.`)) return;
    setBusy(r.id); setError(null);
    try { await post("/api/school/consent", { action: "withdraw", learnerId: r.id }); router.refresh(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }
  return (
    <div className="space-y-3">
      {error && <p role="alert" className="alert">{error}</p>}
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="p-3">Learner</th><th>Class</th><th>Status</th><th>Guardian</th><th>Research</th><th className="pr-3 text-right">Action</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-t border-line">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td>Gr {r.grade} {r.cls ?? ""}</td>
                  <td className={`font-semibold ${TONE[r.status]}`}>{LABEL[r.status]}</td>
                  <td>{r.guardian ?? "—"}</td>
                  <td>{r.status === "on_file" ? (r.research ? "Yes" : "No") : "—"}</td>
                  <td className="pr-3 text-right">
                    {r.status === "on_file"
                      ? <button className="btn-quiet" disabled={busy === r.id} onClick={() => withdraw(r)}>Withdraw</button>
                      : <button className="btn-ghost !min-h-10 !px-3 !py-1.5" onClick={() => setOpen(open === r.id ? null : r.id)}>Record form</button>}
                  </td>
                </tr>
                {open === r.id && <tr><td colSpan={6} className="p-3 pt-0"><RecordForm learnerId={r.id} onDone={() => setOpen(null)} /></td></tr>}
              </Fragment>
            ))}
            {!rows.length && <tr><td colSpan={6} className="p-4 text-muted">No learners yet. Import your roster first.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConsentImport() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  async function onFile(f: File) {
    setBusy(true); setResult(null);
    try { setResult(await post("/api/school/consent", { action: "import", csv: await f.text() })); router.refresh(); }
    catch (e) { setResult({ imported: 0, errors: [(e as Error).message] }); } finally { setBusy(false); }
  }
  return (
    <section className="card space-y-3">
      <h2 className="text-2xl">Record many forms at once</h2>
      <p className="text-sm text-muted">Type the forms you hold into a spreadsheet and upload it as CSV. Only include forms where all three required boxes were ticked.</p>
      <pre className="overflow-x-auto rounded-xl border border-line bg-sunken p-3 text-xs">{"learner_ref,guardian_name,relationship,research,form_ref,date\n1001,Nomsa Mokoena,mother,yes,box 3,2026-10-02"}</pre>
      <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {result && (
        <div className="space-y-1">
          <p>{result.imported} recorded.</p>
          {!!result.errors.length && <ul className="list-disc pl-5 text-sm text-danger">{result.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}
