"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";
import { TasterArt } from "@/components/ui/TasterArt";
import { Figure, hasFigure } from "@/components/ui/Figures";
import { Banner, QuestionCard, RatingScale, SectionHero } from "@/components/ui/Question";
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
        const tone = isRight ? "!border-teal !bg-teal-soft" : on ? "!border-[var(--sec)] !bg-[var(--sec-soft)] shadow-[0_0_0_1px_var(--sec)]" : "hover:!border-[var(--sec)] hover:!bg-[var(--sec-soft)]";
        return (
          <label key={o.i} className={`choice justify-start gap-3 !min-h-14 text-[1.05rem] font-semibold ${tone} ${disabled ? "!cursor-default" : ""}`}>
            <input type="radio" name={name} value={o.i} checked={on} disabled={disabled} onChange={() => onChoose(o.i)} className="sr-only" />
            <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${isRight ? "border-teal bg-teal text-white" : on ? "border-[var(--sec)] bg-[var(--sec)] text-[var(--surface)]" : "border-control text-muted"}`}>
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
  return <RatingScale name={name} points={labels.map((l, i) => [i + 1, l] as [number, string])} value={value ?? undefined} onChange={onChange} />;
}

const CHECK_SEC: Record<string, string> = { maths: "interests", science: "personality", reading: "values" };
const TASTER_SEC: Record<string, string> = { HEALTH: "personality", CODE: "interests", EVIDENCE: "values", BUSINESS: "motivation", FIELD: "direction", DESIGN: "mindset" };

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
      <section data-sec={CHECK_SEC[v.check]} className="space-y-6">
        <SectionHero sec={CHECK_SEC[v.check]!} art={v.check} title={v.title} eyebrow={`Check ${v.checkNumber} of ${v.checkCount} · about ${v.minutes} minutes`} />
        <p className="text-lg leading-relaxed">{v.intro}</p>
        <ul className="note list-disc space-y-1 pl-9">
          <li>No timer. Take your time.</li>
          <li>&ldquo;I&apos;m not sure&rdquo; is a real answer. Use it instead of guessing.</li>
          <li>You won&apos;t see right or wrong as you go. Your report tells you what the check showed.</li>
          <li>A check can only help you. A low score never lowers anything.</li>
        </ul>
        <ErrorLine error={error} />
        <div className="grid gap-3">
          <button className="btn-primary" onClick={() => setStarted(true)}>Start</button>
          <button className="btn-ghost" disabled={busy} onClick={skip}>Skip this check</button>
        </div>
      </section>
    );
  }

  const sec = CHECK_SEC[v.check]!;
  const fig = hasFigure(v.itemId) ? v.itemId : null;
  return (
    <section data-sec={sec} className="space-y-5" aria-live="polite">
      {v.passage && (
        <details open className="qcard">
          <summary className="qband cursor-pointer"><span>{v.passage.title}</span><span>Read this first</span></summary>
          <div className="space-y-4 p-5 sm:p-7">
            {hasFigure(v.passage.title) && <Figure id={v.passage.title} />}
            <div className="space-y-3 text-[1.1rem] leading-relaxed">{v.passage.text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
          </div>
        </details>
      )}
      <QuestionCard sec={sec} label={v.title} n={v.index + 1} art={fig || v.passage ? undefined : v.check} id="stem" stem={v.stem}>
        {fig && <Figure id={fig} />}
        <OptionList key={v.itemId} name={v.itemId} options={v.options} chosen={chosen} onChoose={setChosen} disabled={busy} />
      </QuestionCard>
      <ErrorLine error={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-primary !min-h-14 text-lg" disabled={chosen === null || busy} onClick={() => chosen !== null && answer(chosen)}>{busy ? "Saving…" : "Next"}</button>
        <button className="btn-ghost !min-h-14" disabled={busy} onClick={() => answer(-1)}>I&apos;m not sure</button>
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

function StepRunner({ steps, onDone, prefix, sec, label }: { steps: TasterStepView[]; onDone: (choices: number[]) => void; prefix: string; sec: string; label: string }) {
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
    <div data-sec={sec} className="space-y-4">
      <QuestionCard sec={sec} label={label} n={i + 1} stem={s.stem} id={`${prefix}stem${i}`} hint={`Step ${i + 1} of ${steps.length}`}>
        <OptionList key={`${prefix}${i}`} name={`${prefix}${i}`} options={s.options} chosen={chosen} onChoose={setChosen} disabled={revealed} correct={revealed ? s.answer : undefined} />
        {revealed && (
          <p className="rounded-xl border-2 p-4 text-[1.05rem] leading-relaxed" style={{ background: "var(--sec-soft)", borderColor: "var(--sec-line)" }} role="status">
            {verdict === null ? "" : verdict ? <strong className="text-ok">Yes. </strong> : <strong className="text-[var(--sec-ink)]">Not quite. </strong>}
            {s.feedback}
          </p>
        )}
      </QuestionCard>
      {!revealed
        ? <button className="btn-primary w-full !min-h-14 text-lg" disabled={chosen === null} onClick={() => setRevealed(true)}>Check answer</button>
        : <button className="btn-primary w-full !min-h-14 text-lg" onClick={next}>{i + 1 >= steps.length ? "Done" : "Next step"}</button>}
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

  const sec = TASTER_SEC[v.id]!;
  const bonusPhase = phase === "bonus" || phase === "bonus_after";
  return (
    <section data-sec={sec} className="space-y-6">
      <SectionHero sec={sec} art={v.id} title={bonusPhase ? v.bonus.title : v.title} eyebrow={`Taster ${v.index + 1} of ${v.total} · ${v.work}`} />

      {phase === "before" && (
        <div className="space-y-5">
          {v.index === 0 && (
            <p className="note leading-relaxed">Six tiny slices of real jobs, about 3 minutes each. You get feedback after every step, but we&apos;re not marking you. What we want to know is whether you <em>enjoy</em> this kind of work. There&apos;s no wrong way to feel.</p>
          )}
          <QuestionCard sec={sec} label="Before you start" stem={v.before_prompt} id="before-q">
            <Scale name="before" labels={v.before_scale} value={before} onChange={setBefore} />
          </QuestionCard>
          <ErrorLine error={error} />
          <button className="btn-primary w-full !min-h-14 text-lg" disabled={before === null} onClick={() => { t0.current = Date.now(); setPhase("task"); }}>Show me the task</button>
          <button className="w-full text-center text-sm text-muted underline" onClick={() => submit({ skipped: true, before, after: null, steps: [], bonus: null })}>Skip this one</button>
        </div>
      )}

      {phase === "task" && (
        <div className="space-y-4">
          <p className={`qcard whitespace-pre-line p-5 text-[1.15rem] font-semibold leading-relaxed ${v.id === "HEALTH" || v.id === "CODE" ? "sr-only" : ""}`}>{v.scene}</p>
          {v.visual === "poster_ab" ? <PosterAB /> : <TasterArt id={v.id} />}
          <StepRunner sec={TASTER_SEC[v.id]!} label={v.title} steps={v.steps} prefix="s" onDone={(c) => { setSteps(c); setPhase("after"); }} />
        </div>
      )}

      {phase === "after" && (
        <div className="space-y-5">
          <QuestionCard sec={sec} label="How was that?" stem="Honestly, how much did you enjoy that?" id="after-q">
            <Scale name="after" labels={v.after_scale} value={after} onChange={setAfter} />
          </QuestionCard>
          <button className="btn-primary w-full !min-h-14 text-lg" disabled={after === null} onClick={() => setPhase("another")}>Next</button>
        </div>
      )}

      {phase === "another" && (
        <div className="space-y-5">
          <p className="text-lg">Want another one like it? Optional, about a minute.</p>
          <ErrorLine error={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="btn-primary" onClick={() => setPhase("bonus")}>Yes, one more</button>
            <button className="btn-ghost" onClick={() => finish(null)}>No, next task</button>
          </div>
        </div>
      )}

      {phase === "bonus" && (
        <div className="space-y-4">
          <p className="qcard whitespace-pre-line p-5 text-[1.15rem] font-semibold leading-relaxed">{v.bonus.scene}</p>
          <StepRunner sec={TASTER_SEC[v.id]!} label={v.bonus.title} steps={v.bonus.steps} prefix="b" onDone={(c) => { setBonusSteps(c); setPhase("bonus_after"); }} />
        </div>
      )}

      {phase === "bonus_after" && (
        <div className="space-y-5">
          <QuestionCard sec={sec} label="And that one?" stem="How much did you enjoy that one?" id="bonus-q">
            <Scale name="bonus_after" labels={v.after_scale} value={bonusAfter} onChange={setBonusAfter} />
          </QuestionCard>
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
      <Banner sec="direction" art="pause" />
      <p className="eyebrow">Halfway</p>
      <h1 className="text-[2rem] sm:text-4xl">Part 1 is done.</h1>
      <p className="text-lg leading-relaxed">Your questions, checks and tasks are all saved. Part 2 is a chat with The Guide, about 30 to 40 minutes. It goes better when you&apos;re fresh, so this is a good place to stop.</p>
      <p className="text-muted">Stop now and log in later with the same codes. You&apos;ll land straight on the chat.</p>
      <ErrorLine error={error} />
      <div className="grid gap-3">
        <button className="btn-primary" disabled={busy} onClick={() => go("continue")}>I&apos;m fresh, keep going</button>
        <button className="btn-ghost" disabled={busy} onClick={() => go("later")}>Stop for today</button>
      </div>
    </section>
  );
}
