"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/ui/Brand";
import { Figure, hasFigure } from "@/components/ui/Figures";
import { QuestionCard } from "@/components/ui/Question";
import { GUIDE_SCRIPT } from "@/lib/demo/script";

interface Check { id: string; stem: string; options: string[] }
interface Msg { id: number; role: "guide" | "you"; text: string }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SafetyBadge() {
  return (
    <span className="chip mt-1 self-end text-teal-ink">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
      Checked for safety before the Guide saw it
    </span>
  );
}

/** A skill check (no right/wrong shown, as in the real thing) and a scripted Guide chat. Nothing is stored or sent. */
export function DemoPart2({ check }: { check: Check }) {
  const [stage, setStage] = useState<"check" | "chat">("check");
  const [chosen, setChosen] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [turn, setTurn] = useState(0);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = turn >= GUIDE_SCRIPT.turns.length && !typing;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "end" }); }, [msgs, typing]);

  function guideSays(text: string, after?: () => void) {
    const wait = reduced() ? 0 : 900;
    setTyping(true);
    timers.current.push(setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: ++idRef.current, role: "guide", text }]); after?.(); }, wait));
  }
  function startChat() { setStage("chat"); guideSays(GUIDE_SCRIPT.opening); }
  function reply(i: number) {
    const opt = GUIDE_SCRIPT.turns[turn]![i]!;
    setMsgs((m) => [...m, { id: ++idRef.current, role: "you", text: opt.say }]);
    setTurn((t) => t + 1);
    guideSays(opt.reply);
  }

  if (stage === "check") {
    const letters = ["A", "B", "C", "D", "E"];
    return (
      <section className="space-y-5" aria-label="Sample skill check">
        <p className="eyebrow">Maths check · one sample question</p>
        <QuestionCard sec="interests" label="Maths check" art="maths" id="chk" stem={check.stem}>
          {hasFigure(check.id) && <Figure id={check.id} />}
          <div role="radiogroup" aria-labelledby="chk" className="grid gap-2.5">
            {check.options.map((o, i) => {
              const on = chosen === i;
              return (
                <label key={i} className={`choice justify-start gap-3 !min-h-14 text-[1.05rem] font-semibold ${on ? "!border-[var(--sec)] !bg-[var(--sec-soft)] shadow-[0_0_0_1px_var(--sec)]" : "hover:!border-[var(--sec)] hover:!bg-[var(--sec-soft)]"}`}>
                  <input type="radio" name="demo-check" checked={on} onChange={() => setChosen(i)} className="sr-only" />
                  <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${on ? "border-[var(--sec)] bg-[var(--sec)] text-[var(--surface)]" : "border-control text-muted"}`}>{letters[i]}</span>
                  <span className="text-left">{o}</span>
                </label>
              );
            })}
            <label className={`choice justify-start gap-3 !min-h-12 text-base font-semibold ${chosen === -1 ? "!border-[var(--sec)] !bg-[var(--sec-soft)]" : ""}`}>
              <input type="radio" name="demo-check" checked={chosen === -1} onChange={() => setChosen(-1)} className="sr-only" />
              <span className="text-left">I&apos;m not sure</span>
            </label>
          </div>
        </QuestionCard>
        <p className="note text-sm">Checks can only help a learner: a low score never lowers anything, and &ldquo;I&apos;m not sure&rdquo; is a real answer. The learner doesn&apos;t see right or wrong as they go. Their report explains what the check showed.</p>
        <button className="btn-primary w-full !min-h-14 text-lg" disabled={chosen === null} onClick={startChat}>Next: talk it through with the Guide</button>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70dvh] flex-col gap-4" aria-label="Sample conversation with The Guide">
      <p className="mx-auto chip text-muted"><Mark className="h-4 w-4" /> Scripted for the demo · in the real product the Guide is an AI</p>
      <ol className="flex flex-1 flex-col gap-4" aria-live="polite">
        {msgs.map((m) => (
          <li key={m.id} className={m.role === "guide" ? "flex max-w-[94%] items-end gap-2 self-start" : "flex max-w-[85%] flex-col self-end"}>
            {m.role === "guide" && <Mark className="mb-1 h-7 w-7 shrink-0" />}
            <div className={`whitespace-pre-wrap px-4 py-3 text-lg leading-relaxed ${m.role === "guide" ? "rounded-2xl rounded-bl-md border border-line bg-surface" : "rounded-2xl rounded-br-md bg-accent text-on-accent"}`}>{m.text}</div>
            {m.role === "you" && <SafetyBadge />}
          </li>
        ))}
        {typing && (
          <li className="flex items-end gap-2 self-start"><Mark className="mb-1 h-7 w-7 shrink-0" />
            <div className="rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-4" role="status" aria-label="The Guide is typing"><span className="inline-flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-muted" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:240ms]" /></span></div>
          </li>
        )}
      </ol>
      <div ref={endRef} />
      {!typing && msgs.length > 0 && !done && (
        <div className="sticky bottom-0 -mx-4 space-y-2 border-t-[1.5px] border-line bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur">
          <p className="text-sm font-semibold text-muted">Tap a reply (the learner would type their own):</p>
          {GUIDE_SCRIPT.turns[turn]!.map((o, i) => (
            <button key={i} type="button" onClick={() => reply(i)} className="btn-ghost w-full !min-h-14 justify-start whitespace-normal text-left text-base">{o.say}</button>
          ))}
        </div>
      )}
      {done && <Link href="/demo/results" className="btn-primary w-full !min-h-14 text-lg no-underline">See the finished report</Link>}
    </section>
  );
}
