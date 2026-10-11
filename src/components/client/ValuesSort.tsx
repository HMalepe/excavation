"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";
import { Interstitial } from "./Interstitial";
import { Art } from "@/components/ui/Art";
import { SectionHero } from "@/components/ui/Question";
import { ListenButton } from "./readAloud";
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
    <section data-sec="values" className="space-y-6">
      <SectionHero sec="values" title="What matters most to you" eyebrow={step === "top" ? "Part 1 · Step 1 of 2" : "Part 1 · Step 2 of 2"}>
        <p className="text-[0.95rem] text-muted">
          {step === "top" ? "Tap the 3 cards that matter most to you. The first one you tap is number 1. Use the arrows to change the order." : "Now tap the 2 that matter least to you."}
        </p>
      </SectionHero>

      <ListenButton id={`values:${step}`} where="values" parts={[step === "top" ? "Tap the 3 cards that matter most to you. The first one you tap is number 1. The cards are:" : "Now tap the 2 that matter least to you. The cards are:", ...cards.filter((c) => !top.includes(c.id)).map((c) => `${c.text}.`)]} />

      {step === "top" && top.length > 0 && (
        <ol className="space-y-2" aria-label="Your top three, in order">
          {top.map((id, i) => (
            <li key={id} draggable onDragStart={() => setDragId(id)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(id)}
              className="flex items-center gap-3 rounded-2xl border-2 border-[var(--sec)] bg-[var(--sec-soft)] px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sec)] text-lg font-extrabold text-[var(--surface)]">{i + 1}</span>
              <Art id={id} className="h-10 w-10 shrink-0" />
              <span className="flex-1 text-lg font-bold leading-snug">{text(id)}</span>
              <button aria-label="Move up" className="btn-ghost min-h-11 min-w-11 px-3 py-1" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button aria-label="Move down" className="btn-ghost min-h-11 min-w-11 px-3 py-1" onClick={() => move(i, 1)} disabled={i === top.length - 1}>↓</button>
            </li>
          ))}
        </ol>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.filter((c) => !top.includes(c.id)).map((c) => {
          const on = step === "bottom" && bottom.includes(c.id);
          const full = step === "top" ? top.length >= 3 : bottom.length >= 2 && !on;
          return (
            <button key={c.id} onClick={() => (step === "top" ? toggleTop(c.id) : toggleBottom(c.id))} disabled={full}
              aria-pressed={on}
              className={`flex min-h-24 items-center gap-4 rounded-2xl border-2 p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[.98] disabled:opacity-40 ${on ? "border-danger bg-danger-soft" : "border-line bg-surface hover:border-[var(--sec)] hover:bg-[var(--sec-soft)]"}`}
              style={on ? undefined : { borderColor: "color-mix(in srgb, var(--control) 50%, var(--line))" }}>
              <span className="art-tile h-[4.25rem] w-[4.25rem]"><Art id={c.id} className="h-12 w-12" /></span>
              <span className="flex-1 text-[1.05rem] font-bold leading-snug">{c.text}</span>
              {on ? <span className="chip !border-danger text-danger">least</span> : null}
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="alert">{error}</p>}
      {step === "top" ? (
        <button className="btn-primary w-full !min-h-14 text-lg" disabled={top.length !== 3} onClick={() => setStep("bottom")}>Next</button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => { setStep("top"); setBottom([]); }}>Change top 3</button>
          <button className="btn-primary" disabled={bottom.length !== 2 || busy} onClick={submit}>{busy ? "Saving…" : "Done"}</button>
        </div>
      )}
    </section>
  );
}
