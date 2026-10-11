"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";
import { IconTile } from "@/components/ui/Brand";
import { TasterArt } from "@/components/ui/TasterArt";
import type { CheckView, OptionView, TasterStepView, TasterView } from "@/lib/skills/views";

const ErrorLine = ({ error }: { error: string | null }) => (error ? <p role="alert" className="alert">{error}</p> : null);

function OptionList({ name, options, chosen, onChoose, disabled, correct }: {
  name: string; options: OptionView[]; chosen: number | null; onChoose: (i: number) => void; disabled?: boolean; correct?: number | null;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2.5">
      {options.map((o, n) => {
        const on = chosen === o.i;
        const isRight = disabled && correct !== undefined && correct !== null && o.i === correct;
        const tone = isRight ? "!border-teal !bg-teal-soft" : on ? "choice-on" : "";
        return (
          <label key={o.i} className={`choice justify-start gap-3 text-base ${tone} ${disabled ? "!cursor-default" : ""}`}>
            <input type="radio" name={name} value={o.i} checked={on} disabled={disabled} onChange={() => onChoose(o.i)} className="sr-only" />
            <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${isRight ? "border-teal bg-teal text-white" : on ? "border-accent bg-accent text-on-accent" : "border-control text-muted"}`}>
              {isRight ? "✓" : String.fromCharCode(65 + n)}
            </span>
            <span className="whitespace-pre-line text-left">{o.text}</span>
            {isRight && <span className="sr-only">correct answer</span>}
          </label>
        );
      })}
    </div>
  );
}

function Scale({ name, labels, value, onChange }: { name: string; labels: string[]; value: number | null; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2 sm:grid-cols-5">
      {labels.map((l, i) => {
        const v = i + 1, on = value === v;
        return (
          <label key={v} className={`choice justify-center text-center text-sm ${on ? "choice-on" : ""}`}>
            <input type="radio" name={name} value={v} checked={on} onChange={() => onChange(v)} className="sr-only" />{l}
          </label>
        );
      })}
    </div>
  );
}

// ---------------- Readiness checks ----------------
export function CheckRunner({ v }: { v: CheckView }) {
  const router = useRouter();
  const [started, setStarted] = useState(!v.showIntro);
  const [chosen, setChosen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t0 = useRef<number>(0);
  useEffect(() => { if (started) t0.current = Date.now(); }, [started, v.itemId]);

  async function send(action: "check_answer" | "check_skip", body: unknown) {
    setBusy(true); setError(null);
    try { await learn(action, body); router.refresh(); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  const answer = (choice: number) => send("check_answer", { itemId: v.itemId, choice, ms: Date.now() - t0.current });
  const skip = () => { if (window.confirm(`Skip the rest of the ${v.title.toLowerCase()}? Nothing counts against you.`)) send("check_skip", { check: v.check }); };

  if (!started) {
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <IconTile name={v.check} />
          <p className="eyebrow">Check {v.checkNumber} of {v.checkCount} · about {v.minutes} minutes</p>
        </div>
        <h1 className="text-[2rem] sm:text-4xl">{v.title}</h1>
        <p className="text-lg leading-relaxed">{v.intro}</p>
        <ul className="note list-disc space-y-1 pl-9">
          <li>No timer. Take your time.</li>
          <li>&ldquo;I&apos;m not sure&rdquo; is a real answer — use it instead of guessing.</li>
          <li>You won&apos;t see right or wrong here. Your report tells you what it showed.</li>
        </ul>
        <ErrorLine error={error} />
        <div className="grid gap-3">
          <button className="btn-primary" onClick={() => setStarted(true)}>Start</button>
          <button className="btn-ghost" disabled={busy} onClick={skip}>Skip this check</button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-live="polite">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl">{v.title}</h1>
        <span className="text-sm text-muted">{v.index + 1} of {v.total}</span>
      </header>
      {v.passage && (
        <details open className="card">
          <summary className="font-semibold">{v.passage.title}</summary>
          <div className="mt-3 space-y-3 text-lg leading-relaxed">{v.passage.text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
        </details>
      )}
      <div className="card space-y-4">
        <p id="stem" className="text-xl font-semibold leading-snug tracking-[-0.01em]">{v.stem}</p>
        <OptionList key={v.itemId} name={v.itemId} options={v.options} chosen={chosen} onChoose={setChosen} disabled={busy} />
      </div>
      <ErrorLine error={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-primary" disabled={chosen === null || busy} onClick={() => chosen !== null && answer(chosen)}>{busy ? "Saving…" : "Next"}</button>
        <button className="btn-ghost" disabled={busy} onClick={() => answer(-1)}>I&apos;m not sure</button>
      </div>
      <button className="w-full text-center text-sm text-muted underline" disabled={busy} onClick={skip}>Skip the rest of this check</button>
    </section>
  );
}

// ---------------- Taster tasks ----------------
function PosterAB() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden="true">
      <figure className="space-y-1">
        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-white p-2 text-[9px] leading-tight text-black">
          <p className="font-serif italic text-pink-600">come one come all!!!</p>
          <p className="font-mono text-blue-700">SCHOOL CONCERT featuring the choir, the band, poetry, dancers, the drama club and more</p>
          <p className="text-right font-bold text-green-700">tickets R20 · learners R10 · bring a friend</p>
          <p className="mt-1 text-center text-[13px] font-black text-fuchsia-600">MUSIC!!</p>
          <p className="font-serif text-purple-700">refreshments on sale · parking at the back gate · ask Mr Dlamini for details</p>
          <p className="mt-3 text-[7px] text-gray-500">Friday 7 November, 18:00, school hall</p>
        </div>
        <figcaption className="text-center text-sm font-semibold">Poster A</figcaption>
      </figure>
      <figure className="space-y-1">
        <div className="flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-lg bg-white p-3 text-black">
          <p className="text-[18px] font-black leading-none">SCHOOL CONCERT</p>
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600" />
          <div>
            <p className="text-[12px] font-bold text-slate-300">Fri 7 Nov · 18:00</p>
            <p className="text-[10px]">School hall · R20 (learners R10)</p>
          </div>
        </div>
        <figcaption className="text-center text-sm font-semibold">Poster B</figcaption>
      </figure>
    </div>
  );
}

type Phase = "before" | "task" | "after" | "another" | "bonus" | "bonus_after" | "sending";

function StepRunner({ steps, onDone, prefix }: { steps: TasterStepView[]; onDone: (choices: number[]) => void; prefix: string }) {
  const [i, setI] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const s = steps[i]!;
  const next = () => {
    const all = [...choices, chosen!];
    if (i + 1 >= steps.length) return onDone(all);
    setChoices(all); setI(i + 1); setChosen(null); setRevealed(false);
  };
  const verdict = s.answer === null ? null : chosen === s.answer;
  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <p className="text-sm text-muted">Step {i + 1} of {steps.length}</p>
        <p className="text-lg leading-snug">{s.stem}</p>
        <OptionList key={`${prefix}${i}`} name={`${prefix}${i}`} options={s.options} chosen={chosen} onChoose={setChosen} disabled={revealed} correct={revealed ? s.answer : undefined} />
        {revealed && (
          <p className="rounded-xl border border-line bg-sunken p-4 leading-relaxed" role="status">
            {verdict === null ? "" : verdict ? <strong className="text-ok">Yes. </strong> : <strong className="text-accent-ink">Not quite. </strong>}
            {s.feedback}
          </p>
        )}
      </div>
      {!revealed
        ? <button className="btn-primary w-full" disabled={chosen === null} onClick={() => setRevealed(true)}>Check</button>
        : <button className="btn-primary w-full" onClick={next}>{i + 1 >= steps.length ? "Done" : "Next step"}</button>}
    </div>
  );
}

export function TasterRunner({ v }: { v: TasterView }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("before");
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [steps, setSteps] = useState<number[]>([]);
  const [bonusSteps, setBonusSteps] = useState<number[] | null>(null);
  const [bonusAfter, setBonusAfter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t0 = useRef<number>(0);

  async function submit(body: Record<string, unknown>) {
    const back = phase;
    setPhase("sending"); setError(null);
    try { await learn("taster", { id: v.id, ms: t0.current ? Date.now() - t0.current : null, ...body }); router.refresh(); }
    catch (e) { setError((e as Error).message); setPhase(back); }
  }
  const finish = (bonus: { steps: number[]; after: number | null } | null) =>
    submit({ skipped: false, before, after, steps, bonus });

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-4">
          <IconTile name={v.id} />
          <p className="eyebrow">Taster {v.index + 1} of {v.total} · {v.work}</p>
        </div>
        <h1 className="text-[2rem] sm:text-4xl">{phase === "bonus" || phase === "bonus_after" ? v.bonus.title : v.title}</h1>
      </header>

      {phase === "before" && (
        <div className="space-y-5">
          {v.index === 0 && (
            <p className="note leading-relaxed">Six tiny slices of real work, about 3 minutes each. You&apos;ll see how you did after every step. What we care about most is how much you <em>enjoy</em> it — there&apos;s no wrong way to feel.</p>
          )}
          <p className="text-lg">{v.before_prompt}</p>
          <Scale name="before" labels={v.before_scale} value={before} onChange={setBefore} />
          <ErrorLine error={error} />
          <button className="btn-primary w-full" disabled={before === null} onClick={() => { t0.current = Date.now(); setPhase("task"); }}>Show me the task</button>
          <button className="w-full text-center text-sm text-muted underline" onClick={() => submit({ skipped: true, before, after: null, steps: [], bonus: null })}>Skip this one</button>
        </div>
      )}

      {phase === "task" && (
        <div className="space-y-4">
          <p className={`card whitespace-pre-line text-lg leading-relaxed ${v.id === "HEALTH" || v.id === "CODE" ? "sr-only" : ""}`}>{v.scene}</p>
          {v.visual === "poster_ab" ? <PosterAB /> : <TasterArt id={v.id} />}
          <StepRunner steps={v.steps} prefix="s" onDone={(c) => { setSteps(c); setPhase("after"); }} />
        </div>
      )}

      {phase === "after" && (
        <div className="space-y-5">
          <p className="text-lg">Honestly — how much did you enjoy that?</p>
          <Scale name="after" labels={v.after_scale} value={after} onChange={setAfter} />
          <button className="btn-primary w-full" disabled={after === null} onClick={() => setPhase("another")}>Next</button>
        </div>
      )}

      {phase === "another" && (
        <div className="space-y-5">
          <p className="text-lg">Want another one like it? It&apos;s optional — about a minute.</p>
          <ErrorLine error={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="btn-primary" onClick={() => setPhase("bonus")}>Yes, give me another</button>
            <button className="btn-ghost" onClick={() => finish(null)}>No thanks, next task</button>
          </div>
        </div>
      )}

      {phase === "bonus" && (
        <div className="space-y-4">
          <p className="card whitespace-pre-line text-lg leading-relaxed">{v.bonus.scene}</p>
          <StepRunner steps={v.bonus.steps} prefix="b" onDone={(c) => { setBonusSteps(c); setPhase("bonus_after"); }} />
        </div>
      )}

      {phase === "bonus_after" && (
        <div className="space-y-5">
          <p className="text-lg">And that one?</p>
          <Scale name="bonus_after" labels={v.after_scale} value={bonusAfter} onChange={setBonusAfter} />
          <ErrorLine error={error} />
          <button className="btn-primary w-full" disabled={bonusAfter === null} onClick={() => finish({ steps: bonusSteps ?? [], after: bonusAfter })}>Next task</button>
        </div>
      )}

      {phase === "sending" && <p className="text-muted">Saving…</p>}
    </section>
  );
}

// ---------------- Break between Part 1 and Part 2 ----------------
export function PartOneBreak() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function go(choice: "continue" | "later") {
    setBusy(true); setError(null);
    try {
      const r = await learn<{ next?: string }>("part1_done", { choice });
      if (r.next) window.location.assign(r.next); else router.refresh();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return (
    <section className="space-y-6">
      <p className="eyebrow">Halfway</p>
      <h1 className="text-[2rem] sm:text-4xl">Part 1 is done.</h1>
      <p className="text-lg leading-relaxed">Questions, checks, tasks — all saved. Part 2 is a conversation with The Guide, about 30–40 minutes. It goes best when you&apos;re fresh, so this is a good place for a break.</p>
      <p className="text-muted">If you stop now, log in with the same codes later (or tomorrow) and you&apos;ll start right at the conversation.</p>
      <ErrorLine error={error} />
      <div className="grid gap-3">
        <button className="btn-primary" disabled={busy} onClick={() => go("continue")}>I&apos;m fresh — keep going</button>
        <button className="btn-ghost" disabled={busy} onClick={() => go("later")}>Stop here for today</button>
      </div>
    </section>
  );
}
