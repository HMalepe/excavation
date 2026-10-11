/**
 * Brand artwork for Clear Progress. Inline SVG/HTML only (no image requests), coloured through the
 * theme tokens so light and dark both work.
 */
import type { CSSProperties } from "react";

/** The mark: three layers going down, the last one lit. Cobalt tile, white layers, teal at depth. */
export function Mark({ className = "h-8 w-8", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`${className} shrink-0`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <rect x="7" y="8.5" width="18" height="3.6" rx="1.8" fill="#fff" />
      <rect x="9.5" y="14.2" width="13" height="3.6" rx="1.8" fill="#fff" fillOpacity=".72" />
      <rect x="12" y="19.9" width="8" height="3.6" rx="1.8" fill="#37e0c5" />
    </svg>
  );
}

export function Wordmark({ className = "", sub }: { className?: string; sub?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-8 w-8" />
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-bold tracking-[-0.03em] text-fg">The Excavation</span>
        {sub && <span className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{sub}</span>}
      </span>
    </span>
  );
}

export const DEPTHS = ["Surface", "Wading in", "Deep water", "The trench", "The floor"] as const;

/**
 * Progress as ordered marks: done = teal check, here = cobalt, ahead = outline. Named stages only,
 * never a percentage (spec 02 §3.7).
 */
export function Stepper({ at, className = "" }: { at: string; className?: string }) {
  const idx = Math.max(0, DEPTHS.indexOf(at as (typeof DEPTHS)[number]));
  return (
    <nav aria-label={`How far along you are: ${at}, stage ${idx + 1} of ${DEPTHS.length}`} className={className}>
      <ol className="flex items-start">
        {DEPTHS.map((name, i) => {
          const done = i < idx, here = i === idx;
          return (
            <li key={name} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
              {i > 0 && <span aria-hidden="true" className="absolute right-1/2 top-[11px] h-0.5 w-full -translate-y-1/2" style={{ background: i <= idx ? "var(--teal)" : "var(--line)" }} />}
              <span aria-current={here ? "step" : undefined}
                className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${here ? "border-accent bg-accent" : done ? "border-teal bg-teal" : "border-control bg-surface"}`}>
                {done && <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.4l2.3 2.3 4.7-5" /></svg>}
                {here && <span className="h-1.5 w-1.5 rounded-full bg-on-accent" />}
              </span>
              <span className={`text-[0.7rem] leading-tight sm:text-xs ${here ? "font-semibold text-accent-ink" : done ? "font-medium text-fg" : "text-muted"}`}>{name}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Line icons for checks, tasks and navigation (24px grid, currentColor). */
const ICONS: Record<string, React.ReactNode> = {
  maths: <><path d="M5 7h6M8 4v6M14 7h5M5 17l4-4M9 17l-4-4M14 15h5M14 19h5" /></>,
  science: <><path d="M10 3h4M11 3v6l-5.5 9.5A2 2 0 0 0 7.2 21.5h9.6a2 2 0 0 0 1.7-3L13 9V3" /><path d="M8 15h8" /></>,
  reading: <><path d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5c3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z" /><path d="M12 6.5V20" /></>,
  HEALTH: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M7.5 12h2.5l1.2-2.5 1.8 5 1.2-2.5h2.3" /></>,
  CODE: <><path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 5l-3 14" /></>,
  EVIDENCE: <><path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z" /></>,
  BUSINESS: <><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" /></>,
  FIELD: <><path d="M12 21v-9M12 12C12 7 8.5 4.5 4 4.5 4 9 7 12 12 12zM12 14c0-4 3-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5z" /></>,
  DESIGN: <><path d="M12 3l6 7-6 11-6-11z" /><path d="M12 13v8M10 10.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0" /></>,
  inbox: <><path d="M3 13l2.6-7.2A2 2 0 0 1 7.5 4.5h9a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 13h5l1.5 2.5h5L16 13h5" /></>,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 20c.4-3.4 3-5.2 6.2-5.2s5.8 1.8 6.2 5.2M16.5 4.9a3.2 3.2 0 0 1 0 6.2M18 14.8c2 .5 3.4 2 3.7 4.6" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.5" /></>,
  doc: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" /></>,
  logout: <><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 16l4-4-4-4M19 12H9" /></>,
};

export function Icon({ name, className = "h-6 w-6", style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? null}
    </svg>
  );
}

/** Icon in a tinted tile (cobalt = what to do, teal = done). */
export function IconTile({ name, tone = "accent", className = "" }: { name: string; tone?: "accent" | "teal"; layer?: number; className?: string }) {
  const t = tone === "teal" ? "bg-teal-soft text-teal-ink border-teal/30" : "bg-tint text-accent-ink border-tint-line";
  return (
    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${t} ${className}`}>
      <Icon name={name} className="h-5 w-5" />
    </span>
  );
}

/** Static preview of the learner experience, used on the landing and login pages. Decorative. */
export function AppPreview({ className = "" }: { className?: string }) {
  const opts = ["Really dislike", "Dislike", "Not sure", "Like", "Love"];
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-surface ${className}`} style={{ boxShadow: "var(--shadow-soft)" }} aria-hidden="true">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="inline-flex items-center gap-2"><Mark className="h-6 w-6" /><span className="text-sm font-bold tracking-[-0.02em]">The Excavation</span></span>
        <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold text-accent-ink">Wading in</span>
      </div>
      <div className="space-y-5 px-5 py-6 sm:px-7">
        <div className="space-y-1.5"><p className="eyebrow">What you&apos;d love doing</p><p className="text-xl font-semibold leading-snug tracking-[-0.02em]">Investigating why something went wrong.</p></div>
        <div className="grid grid-cols-5 gap-1.5 text-center text-[0.68rem] font-medium sm:text-xs">
          {opts.map((o, i) => <span key={o} className={`flex min-h-11 items-center justify-center rounded-lg border px-1 ${i === 3 ? "border-accent bg-tint text-fg" : "border-line bg-surface text-muted"}`} style={i === 3 ? { boxShadow: "0 0 0 1px var(--accent) inset" } : undefined}>{o}</span>)}
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-ink"><Icon name="check" className="h-4 w-4" />Your answers are saved</span>
          <span className="rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-on-accent">Next</span>
        </div>
      </div>
      <div className="border-t border-line bg-sunken/60 px-4 pb-3 pt-4"><Stepper at="Wading in" /></div>
    </div>
  );
}
