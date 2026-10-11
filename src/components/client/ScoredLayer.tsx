"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";
import { Interstitial } from "./Interstitial";

export interface ItemView { id: string; text: string; points: [number, string][]; optional: boolean }
export interface SectionEvents { microMoment?: string; softInterstitial?: boolean; done?: boolean }

interface Props {
  sectionId: string;
  title: string;
  stem?: string;
  intro?: string;
  /** Not-yet-locked items of the current section, in the order shown. */
  items: ItemView[];
  /** Index of items[0] within the section (the server's pointer). */
  startIndex: number;
  saved: Record<string, number>;
  resources: React.ReactNode;
}

const DESKTOP = "(min-width: 768px)";

/**
 * spec 02 §3: one item per screen on phones, up to 6 on computers; save every answer immediately;
 * the current answer can change until "Next" locks it; no back button within a section.
 */
export function ScoredLayer({ sectionId, title, stem, intro, items, startIndex, saved, resources }: Props) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState(1);
  const [offset, setOffset] = useState(0);
  const [values, setValues] = useState<Record<string, number>>(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<SectionEvents | null>(null);
  const shownAt = useRef<Record<string, number>>({});
  const firstMs = useRef<Record<string, number>>({});
  const changes = useRef<Record<string, number>>({});

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const set = () => setPageSize(mq.matches ? 6 : 1);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const page = useMemo(() => items.slice(offset, offset + pageSize), [items, offset, pageSize]);
  useEffect(() => {
    const now = performance.now();
    for (const it of page) shownAt.current[it.id] ??= now;
    window.scrollTo({ top: 0 });
  }, [page]);

  async function choose(id: string, value: number) {
    if (values[id] === value) return;
    if (values[id] !== undefined) changes.current[id] = (changes.current[id] ?? 0) + 1;
    firstMs.current[id] ??= Math.round(performance.now() - (shownAt.current[id] ?? performance.now()));
    setValues((v) => ({ ...v, [id]: value }));
    setError(null);
    try {
      await learn("answer", { itemId: id, value, ms: firstMs.current[id] ?? null, changes: changes.current[id] ?? 0 });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const ready = page.every((it) => it.optional || values[it.id] !== undefined);

  async function next() {
    setBusy(true); setError(null);
    try {
      const upTo = startIndex + offset + page.length;
      const r = await learn<{ events: SectionEvents; sectionComplete: boolean }>("lock", { upTo });
      if (!r.sectionComplete) { setOffset((o) => o + page.length); setBusy(false); return; }
      if (r.events.microMoment || r.events.softInterstitial) { setEvents(r.events); setBusy(false); return; }
      router.refresh();
    } catch (e) {
      setError((e as Error).message); setBusy(false);
    }
  }

  if (events) return <Interstitial events={events} resources={resources} onContinue={() => { setEvents(null); router.refresh(); }} />;

  return (
    <section aria-labelledby="sec-title" className="space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">Part 1 · questions</p>
        <h1 id="sec-title" className="text-[2rem] sm:text-4xl">{title}</h1>
        {offset === 0 && startIndex === 0 && intro && <p className="text-muted">{intro}</p>}
        {stem && <p className="font-semibold text-accent-ink">{stem}</p>}
      </header>

      <ol className="space-y-6">
        {page.map((it) => (
          <li key={it.id} className="card space-y-4">
            <p id={`q-${it.id}`} className="text-xl font-semibold leading-snug tracking-[-0.01em]">{it.text}</p>
            <div role="radiogroup" aria-labelledby={`q-${it.id}`} className={`grid gap-2 ${it.points.length === 3 ? "grid-cols-3" : "sm:grid-cols-5"}`}>
              {it.points.map(([v, label]) => {
                const on = values[it.id] === v;
                return (
                  <label key={v} className={`choice justify-center text-center text-sm ${on ? "choice-on" : ""}`}>
                    <input type="radio" name={it.id} value={v} checked={on} onChange={() => choose(it.id, v)} className="sr-only" />
                    {label}
                  </label>
                );
              })}
            </div>
            {it.optional && <p className="text-xs text-muted">Optional — skip it if you like.</p>}
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="alert">{error}</p>}
      <button className="btn-primary w-full" disabled={!ready || busy} onClick={next}>{busy ? "Saving…" : "Next"}</button>
      <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted"><svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-ink" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.5" /></svg>Your answers are saved as you go. {sectionId === "context" ? "These don't affect your results." : ""}</p>
    </section>
  );
}
