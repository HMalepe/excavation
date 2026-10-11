"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";
import { Interstitial } from "./Interstitial";
import type { SectionEvents } from "./ScoredLayer";

interface Card { id: string; text: string }

/**
 * spec 02 VALUES: put the 3 cards that matter MOST in order, then pick the 2 that matter LEAST.
 * Works by tap on phones (tap to add, arrows to reorder) and by drag on computers.
 */
export function ValuesSort({ cards, resources }: { cards: Card[]; resources: React.ReactNode }) {
  const router = useRouter();
  const [top, setTop] = useState<string[]>([]);
  const [bottom, setBottom] = useState<string[]>([]);
  const [step, setStep] = useState<"top" | "bottom">("top");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<SectionEvents | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [started] = useState(() => Date.now());
  const text = (id: string) => cards.find((c) => c.id === id)!.text;

  const toggleTop = (id: string) => setTop((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length < 3 ? [...t, id] : t));
  const toggleBottom = (id: string) => setBottom((b) => (b.includes(id) ? b.filter((x) => x !== id) : b.length < 2 ? [...b, id] : b));
  const move = (i: number, d: -1 | 1) => setTop((t) => { const a = [...t]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j]!, a[i]!]; return a; });
  const dropOn = (target: string) => setTop((t) => {
    if (!dragId || dragId === target) return t;
    const a = t.filter((x) => x !== dragId);
    a.splice(a.indexOf(target), 0, dragId);
    return a;
  });

  async function submit() {
    setBusy(true); setError(null);
    try {
      const r = await learn<{ events: SectionEvents }>("values", { top3: top, bottom2: bottom, ms: Date.now() - started });
      if (r.events.microMoment || r.events.softInterstitial) { setEvents(r.events); setBusy(false); return; }
      router.refresh();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  if (events) return <Interstitial events={events} resources={resources} onContinue={() => router.refresh()} />;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">{step === "top" ? "Step 1 of 2" : "Step 2 of 2"}</p>
        <h1 className="text-[2rem] sm:text-4xl">What matters most to you</h1>
        <p className="text-muted">
          {step === "top" ? "Tap the 3 cards that matter most to you. The first one you tap is number 1. Use the arrows to change the order." : "Now tap the 2 that matter least to you."}
        </p>
      </header>

      {step === "top" && top.length > 0 && (
        <ol className="space-y-2" aria-label="Your top three, in order">
          {top.map((id, i) => (
            <li key={id} draggable onDragStart={() => setDragId(id)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(id)}
              className="flex items-center gap-3 rounded-xl border border-tint-line bg-tint px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold text-on-accent">{i + 1}</span>
              <span className="flex-1">{text(id)}</span>
              <button aria-label="Move up" className="btn-ghost min-h-11 min-w-11 px-3 py-1" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button aria-label="Move down" className="btn-ghost min-h-11 min-w-11 px-3 py-1" onClick={() => move(i, 1)} disabled={i === top.length - 1}>↓</button>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {cards.filter((c) => (step === "top" ? !top.includes(c.id) : !top.includes(c.id))).map((c) => {
          const on = step === "bottom" && bottom.includes(c.id);
          const full = step === "top" ? top.length >= 3 : bottom.length >= 2 && !on;
          return (
            <button key={c.id} onClick={() => (step === "top" ? toggleTop(c.id) : toggleBottom(c.id))} disabled={full}
              aria-pressed={on}
              className={`choice min-h-14 justify-between gap-2 text-left disabled:opacity-40 ${on ? "!border-danger !bg-danger/10" : ""}`}>
              <span>{c.text}</span>{on ? <span className="chip !border-danger text-danger">least</span> : null}
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="alert">{error}</p>}
      {step === "top" ? (
        <button className="btn-primary w-full" disabled={top.length !== 3} onClick={() => setStep("bottom")}>Next</button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => { setStep("top"); setBottom([]); }}>Change top 3</button>
          <button className="btn-primary" disabled={bottom.length !== 2 || busy} onClick={submit}>{busy ? "Saving…" : "Done"}</button>
        </div>
      )}
    </section>
  );
}
