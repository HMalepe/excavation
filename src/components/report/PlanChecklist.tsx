"use client";
import { useState } from "react";
import { learn } from "@/components/client/api";

/** Plan table with tick boxes the learner can check off (spec 08 Part 7). Saved to reports.learner_state. */
export function PlanChecklist({ plan, initial }: { plan: { action: string; by_when: string; who: string }[]; initial: Record<string, boolean> }) {
  const [done, setDone] = useState(initial);
  async function toggle(i: number) {
    const next: Record<string, boolean> = { ...done, [String(i)]: !done[String(i)] };
    setDone(next);
    try { await learn("plan_tick", { index: i, done: next[String(i)] }); } catch { setDone(done); }
  }
  return (
    <ul className="space-y-3">
      {plan.map((p, i) => (
        <li key={i} className="card flex gap-3">
          <input type="checkbox" className="mt-1 h-6 w-6 accent-amber" checked={!!done[i]} onChange={() => toggle(i)} aria-label={`Done: ${p.action}`} />
          <div className={done[i] ? "opacity-60" : ""}>
            <p className={done[i] ? "line-through" : ""}>{p.action}</p>
            <p className="mt-1 text-sm text-muted">{p.by_when} · {p.who}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
