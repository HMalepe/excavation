import type { ReactNode } from "react";
import { Art, hasArt } from "./Art";
import { ListenButton, useIsReading, type ReadWhere } from "@/components/client/readAloud";

/** What the Listen button reads for a question: its stem, then its choices. */
export interface Listen { id: string; where: ReadWhere; choices?: string[]; lettered?: boolean; quiet?: boolean }

/** Highlight words worth catching at a glance: numbers with units, money, and SHOUTED words. */
const KEY = /(R\s?\d[\d\s]*(?:,\d+)?|\d+(?:[,.]\d+)?\s?(?:%|°C|km\/h|m\/s|g\/cm³|cm³|litres?|km|kg|min|cm|m|g|s|hours?)\b|\b[A-Z]{3,}\b)/g;

export function StemText({ text, lead = false }: { text: string; lead?: boolean }) {
  // "Solve for x: 5x − 7 = 2x + 8" → a label chip over the expression, set large.
  const m = /^([^:.?]{3,30}):\s+(.{2,70})$/s.exec(text);
  if (m && /[\d=+×−÷²³()]/.test(m[2]!) && m[1]!.split(" ").length <= 4) {
    return (
      <span className="block">
        <span className="mb-2 inline-block rounded-full bg-[var(--sec-soft)] px-3 py-1 text-sm font-bold text-[var(--sec-ink)] ring-1 ring-[var(--sec-line)]">{m[1]}</span>
        <span className="block text-[1.7rem] font-extrabold tabular-nums tracking-tight sm:text-[2rem]">{m[2]}</span>
      </span>
    );
  }
  if (lead) {
    // Activity prompts start with the activity ("Fixing a broken phone"): mark the first word.
    const [first, ...rest] = text.split(" ");
    return <><mark className="hl">{first}</mark> {rest.join(" ")}</>;
  }
  const parts = text.split(KEY);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="hl">{p}</mark> : <span key={i}>{p}</span>))}</>;
}

/**
 * A framed question: coloured band with where you are, a big illustrated stem, then the answers.
 * `sec` picks the section colour (see globals.css [data-sec]).
 */
export function QuestionCard({ sec, label, n, art, lead, stem, id, children, hint, listen }: {
  sec: string; label: string; n?: number; art?: string; lead?: boolean; stem: string; id?: string; children: ReactNode; hint?: string; listen?: Listen;
}) {
  const withArt = art && hasArt(art);
  const reading = useIsReading(listen?.id ?? "");
  const parts = listen ? [stem, ...(listen.choices ? [listen.lettered ? "The choices are:" : "Your choices are:", ...listen.choices.map((c, i) => (listen.lettered ? `${String.fromCharCode(65 + i)}, ${c}.` : `${c}.`))] : [])] : [];
  return (
    <section data-sec={sec} className="qcard" style={reading ? { boxShadow: "0 0 0 4px var(--sec-mid), var(--shadow-soft)" } : undefined}>
      <div className="qband">
        <span>{label}</span>
        {n !== undefined && <span aria-hidden="true">Question {n}</span>}
      </div>
      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {withArt && (
            <div className="art-tile relative h-24 w-full overflow-hidden sm:h-28 sm:w-28">
              <span aria-hidden="true" className="absolute -left-4 -top-4 h-20 w-20 rounded-full" style={{ background: "var(--sec-mid)", opacity: 0.55 }} />
              <span aria-hidden="true" className="absolute -bottom-6 -right-3 h-20 w-20 rounded-full" style={{ background: "var(--sec-mid)", opacity: 0.4 }} />
              <Art id={art} className="relative h-[4.75rem] w-[4.75rem] sm:h-20 sm:w-20" />
            </div>
          )}
          <p id={id} className="min-w-0 flex-1 text-[1.5rem] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[1.7rem]"><StemText text={stem} lead={lead} /></p>
        </div>
        {hint && <p className="text-sm font-medium text-muted">{hint}</p>}
        {listen && <ListenButton id={listen.id} where={listen.where} parts={parts} quiet={listen.quiet} />}
        {children}
      </div>
    </section>
  );
}

/** Big section header with its emblem: tells the learner which part they're in at a glance. */
export function SectionHero({ sec, art, title, eyebrow, children }: { sec: string; art?: string; title: string; eyebrow: string; children?: ReactNode }) {
  return (
    <header data-sec={sec} className="flex items-center gap-4 rounded-2xl border-2 p-4 sm:gap-5 sm:p-5" style={{ background: "var(--sec-soft)", borderColor: "var(--sec-line)" }}>
      <div className="art-tile h-16 w-16 !bg-[var(--surface)] sm:h-20 sm:w-20"><Art id={art ?? sec} className="h-12 w-12 sm:h-14 sm:w-14" /></div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--sec-ink)]">{eyebrow}</p>
        <h1 className="text-[1.6rem] font-extrabold leading-[1.1] sm:text-[2rem]">{title}</h1>
        {children}
      </div>
    </header>
  );
}

// ---------- rating scales with pictures ----------

function Face({ level, on }: { level: number; on: boolean }) {
  // level 0 (low) .. 4 (high): flat-out frown to big smile, same face throughout so only the mouth changes.
  const mouths = ["M18 38c4-9 12-9 16 0", "M21 36c3-4 7-4 10 0", "M21 34h10", "M20 32c3 4 9 4 12 0", "M18 30h16c0 9-5 12-8 12s-8-3-8-12z"];
  return (
    <svg viewBox="0 0 52 52" className="h-11 w-11" aria-hidden="true">
      <circle cx="26" cy="26" r="21" fill={on ? "var(--sec)" : "var(--sec-soft)"} stroke={on ? "var(--sec)" : "var(--sec-line)"} strokeWidth="2.5" />
      <g stroke={on ? "var(--surface)" : "var(--fg)"} fill="none" strokeWidth="2.6" strokeLinecap="round">
        <path d="M18.5 22h.01M33.5 22h.01" strokeWidth="3.6" />
        {level === 0 && <path d="M14 15l8 3M38 15l-8 3" strokeWidth="2.2" />}
        <path d={mouths[level]} fill={level === 4 ? (on ? "var(--surface)" : "var(--fg)") : "none"} />
      </g>
    </svg>
  );
}
function Bars({ level, on }: { level: number; on: boolean }) {
  return (
    <svg viewBox="0 0 52 52" className="h-11 w-11" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={6 + i * 8.5} y={40 - (i + 1) * 6.4} width="6" height={(i + 1) * 6.4} rx="2" fill={i <= level ? (on ? "var(--sec)" : "var(--sec-ink)") : "var(--sec-mid)"} opacity={i <= level ? 1 : 0.7} />
      ))}
    </svg>
  );
}

/**
 * Five or three choices drawn as faces (liking) or rising bars (how much it's true). Rows on phones,
 * tiles on computers. The text label always stays, so nothing depends on the picture.
 */
export function RatingScale({ name, labelledBy, points, value, onChange }: {
  name: string; labelledBy?: string; points: [number, string][]; value: number | undefined; onChange: (v: number) => void;
}) {
  const liking = /dislike|love|like/i.test(points[0]![1] + points.at(-1)![1]) && !/like me/i.test(points[0]![1] + points.at(-1)![1]);
  const idx = (i: number) => (points.length === 5 ? i : Math.round((i / (points.length - 1)) * 4));
  const cols = points.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-5";
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : name} className={`grid gap-2 ${cols}`}>
      {points.map(([v, label], i) => {
        const on = value === v;
        return (
          <label key={v} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 text-left font-semibold transition-[border-color,background-color,box-shadow,transform] duration-150 active:scale-[.98] sm:flex-col sm:justify-center sm:gap-1.5 sm:px-2 sm:py-3 sm:text-center sm:text-[0.95rem] ${on ? "border-[var(--sec)] bg-[var(--sec-soft)] shadow-[0_0_0_1px_var(--sec)]" : "border-line bg-surface hover:border-[var(--sec)] hover:bg-[var(--sec-soft)]"}`}
            style={on ? undefined : { borderColor: "color-mix(in srgb, var(--control) 50%, var(--line))" }}>
            <input type="radio" name={name} value={v} checked={on} onChange={() => onChange(v)} className="sr-only" />
            {liking ? <Face level={idx(i)} on={on} /> : <Bars level={idx(i)} on={on} />}
            <span className={on ? "text-[var(--sec-ink)]" : ""}>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** A wide illustrated panel for screens that aren't questions (welcome, break, report waiting). */
export function Banner({ sec, art, className = "" }: { sec: string; art: string; className?: string }) {
  return (
    <div data-sec={sec} className={`art-tile relative h-32 w-full overflow-hidden sm:h-40 ${className}`} aria-hidden="true">
      <span className="absolute -left-6 -top-8 h-32 w-32 rounded-full" style={{ background: "var(--sec-mid)", opacity: 0.6 }} />
      <span className="absolute -bottom-10 right-6 h-32 w-32 rounded-full" style={{ background: "var(--sec-mid)", opacity: 0.45 }} />
      <span className="absolute left-1/4 top-5 h-3 w-3 rounded-full" style={{ background: "var(--sec)", opacity: 0.5 }} />
      <span className="absolute bottom-6 right-1/4 h-2.5 w-2.5 rounded-full" style={{ background: "var(--sec)", opacity: 0.4 }} />
      <Art id={art} className="relative h-24 w-24 sm:h-28 sm:w-28" />
    </div>
  );
}
