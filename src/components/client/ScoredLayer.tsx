"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";
import { Interstitial } from "./Interstitial";
import { artFor } from "@/components/ui/Art";
import { QuestionCard, RatingScale, SectionHero } from "@/components/ui/Question";

/** Section id → colour theme name (they match today, kept explicit so a section can be recoloured). */
const SECTION_THEME: Record<string, string> = {};

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

  const sec = SECTION_THEME[sectionId] ?? sectionId;
  const lead = sectionId === "interests";
  return (
    <section aria-labelledby="sec-title" className="space-y-6">
      <SectionHero sec={sec} title={title} eyebrow="Part 1 · Questions">
        {offset === 0 && startIndex === 0 && intro && <p className="text-[0.95rem] text-muted">{intro}</p>}
        {stem && <p className="text-base font-semibold text-[var(--sec-ink)]">{stem}</p>}
      </SectionHero>

      <ol className="space-y-6">
        {page.map((it, k) => (
          <li key={it.id}>
            <QuestionCard sec={sec} label={title} n={startIndex + offset + k + 1} art={artFor(it.id, sec)} lead={lead} id={`q-${it.id}`} stem={it.text}
              hint={it.optional ? "Optional. Skip it if you like." : undefined}>
              <RatingScale name={it.id} labelledBy={`q-${it.id}`} points={it.points} value={values[it.id]} onChange={(v) => choose(it.id, v)} />
            </QuestionCard>
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="alert">{error}</p>}
      <button className="btn-primary w-full !min-h-14 text-lg" disabled={!ready || busy} onClick={next}>{busy ? "Saving…" : "Next"}</button>
      <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted"><svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-ink" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.5" /></svg>Your answers are saved as you go. {sectionId === "context" ? "These don't affect your results." : ""}</p>
    </section>
  );
}
