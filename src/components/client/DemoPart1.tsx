"use client";
import { useState } from "react";
import Link from "next/link";
import { artFor } from "@/components/ui/Art";
import { QuestionCard, RatingScale } from "@/components/ui/Question";

interface Q { id: string; sec: string; label: string; text: string; points: [number, string][] }
interface Card { id: string; text: string }

/** Three real questions and a values pick. Local state only: nothing is stored or sent. */
export function DemoPart1({ questions, cards }: { questions: Q[]; cards: Card[] }) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Record<string, number>>({});
  const [top, setTop] = useState<string[]>([]);
  const total = questions.length;

  if (step < total) {
    const q = questions[step]!;
    const answered = vals[q.id] !== undefined;
    return (
      <section className="space-y-5" aria-label={`Sample question ${step + 1} of ${total + 1}`}>
        <QuestionCard sec={q.sec} label={q.label} n={step + 1} art={artFor(q.id, q.sec)} lead={q.sec === "interests"} id={`q-${q.id}`} stem={q.text}
          listen={{ id: `demo:${q.id}`, where: "questions", quiet: true, choices: q.points.map((p) => p[1]) }}>
          <RatingScale name={q.id} labelledBy={`q-${q.id}`} points={q.points} value={vals[q.id]} onChange={(v) => setVals((s) => ({ ...s, [q.id]: v }))} />
        </QuestionCard>
        <button className="btn-primary w-full !min-h-14 text-lg" disabled={!answered} onClick={() => setStep(step + 1)}>Next</button>
        <p className="text-center text-sm text-muted">In the real session, answers save as you go and a Pause button is always on screen.</p>
      </section>
    );
  }

  if (step === total) {
    const toggle = (id: string) => setTop((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length < 3 ? [...t, id] : t));
    return (
      <section className="space-y-5" aria-label="Sample values question">
        <div data-sec="values" className="qcard">
          <div className="qband"><span>What matters most</span><span aria-hidden="true">Question {total + 1}</span></div>
          <div className="space-y-4 p-5 sm:p-7">
            <p id="vq" className="text-[1.5rem] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[1.7rem]">Pick the <mark className="hl">3</mark> that matter <mark className="hl">most</mark> to you.</p>
            <p className="text-sm font-medium text-muted">Tap to choose. The number shows the order you picked them in.</p>
            <div role="group" aria-labelledby="vq" className="grid gap-2.5 sm:grid-cols-2">
              {cards.map((c) => {
                const n = top.indexOf(c.id);
                const on = n >= 0;
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => toggle(c.id)}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left font-semibold ${on ? "border-[var(--sec)] bg-[var(--sec-soft)] shadow-[0_0_0_1px_var(--sec)]" : "border-line bg-surface hover:border-[var(--sec)] hover:bg-[var(--sec-soft)]"}`}>
                    <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${on ? "border-[var(--sec)] bg-[var(--sec)] text-[var(--surface)]" : "border-control text-muted"}`}>{on ? n + 1 : ""}</span>
                    <span>{c.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button className="btn-primary w-full !min-h-14 text-lg" disabled={top.length < 3} onClick={() => setStep(step + 1)}>Next</button>
      </section>
    );
  }

  return (
    <section className="space-y-5 text-center" aria-live="polite">
      <p className="eyebrow">Part 1 done</p>
      <h1 className="text-[2rem] sm:text-4xl">That is how it starts.</h1>
      <p className="text-lg text-muted">Every answer feeds a private picture of how the learner is wired: what pulls them, how they work, and what matters to them. No scores or labels are ever shown back to the learner.</p>
      <Link href="/demo/part-2" className="btn-primary w-full !min-h-14 text-lg no-underline">Part 2: try it, then talk it through</Link>
    </section>
  );
}
