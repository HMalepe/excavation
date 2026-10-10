"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./api";

export function ReviewActions({ reportId, content, kind, status }: { reportId: string; content: unknown; kind: string; status: string }) {
  const router = useRouter();
  const [json, setJson] = useState(JSON.stringify(content, null, 2));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (body: Record<string, unknown>, done: string) => {
    setBusy(true); setMsg(null);
    try {
      const r = await post<{ lint?: string[] }>("/api/staff/review", { reportId, ...body });
      setMsg(r.lint?.length ? `${done} Checks to look at: ${r.lint.join(" · ")}` : done);
      router.refresh();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy || status === "released"} onClick={() => run({ action: "approve" }, "Released to the learner.")}>Approve &amp; release</button>
        {kind === "learner" && <button className="btn-ghost" disabled={busy} onClick={() => run({ action: "regenerate" }, "Regenerating the report (same signals)…")}>Regenerate report</button>}
        {kind === "learner" && <button className="btn-ghost" disabled={busy} onClick={() => run({ action: "regenerate", fresh_signals: true }, "Re-extracting signals and regenerating…")}>Re-extract signals + report</button>}
        <button className="btn-ghost" disabled={busy} onClick={() => { if (confirm("Withdraw this report? The learner will no longer see it.")) void run({ action: "withdraw" }, "Withdrawn."); }}>Withdraw</button>
      </div>
      <details className="card">
        <summary className="cursor-pointer font-semibold">Edit report JSON</summary>
        <textarea aria-label="Report JSON" className="field mt-3 min-h-[28rem] font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
        <button className="btn-ghost mt-2" disabled={busy} onClick={() => {
          let parsed: unknown;
          try { parsed = JSON.parse(json); } catch { setMsg("That isn't valid JSON."); return; }
          void run({ action: "edit", content: parsed }, "Saved.");
        }}>Save edit</button>
      </details>
      {msg && <p role="status" className="text-muted">{msg}</p>}
    </div>
  );
}
