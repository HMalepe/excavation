"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./api";

export function SafeguardingActions({ eventId, confirmed, reviewed, endpoint = "/api/staff/safeguarding", school = false }: { eventId: string; confirmed: boolean; reviewed: boolean; endpoint?: string; school?: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try { await post(endpoint, { eventId, action, ...extra }); setNote(""); router.refresh(); } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!confirmed && <button className="btn-primary min-h-10 py-1" disabled={busy} onClick={() => act(school ? "confirm" : "confirm_school")}>{school ? "Confirm we've received this" : "Record school confirmation"}</button>}
      {!school && !reviewed && <button className="btn-ghost min-h-10 py-1" disabled={busy} onClick={() => act("review_complete")}>Review complete (unlock)</button>}
      {!school && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) void act("note", { note }); }}>
          <input className="field min-h-10 py-1 text-sm" placeholder="Staff note (no learner content)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
          <button className="btn-ghost min-h-10 py-1" disabled={busy}>Add note</button>
        </form>
      )}
    </div>
  );
}
