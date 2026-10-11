import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Brand";
import { Art, hasArt } from "@/components/ui/Art";
import type { Insights } from "@/lib/insights/build";

/** "Your excavation is complete": the keepsake card, top right of the report. */
export function IssuedCard({ grade, issued, name }: { grade: string; issued: string; name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 p-3.5 pr-5" style={{ background: "var(--tint)", borderColor: "var(--tint-line)" }}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent"><Icon name="check" className="h-6 w-6" /></span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-accent-ink">Excavation complete</p>
        <p className="truncate text-[1.05rem] font-bold leading-tight">{name} · {grade}</p>
        <p className="text-xs text-muted">Issued {issued}</p>
      </div>
    </div>
  );
}

export function StatCards({ stats }: { stats: Insights["stats"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="card !p-4">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tint text-accent-ink">{hasArt(s.icon) ? <Art id={s.icon} className="h-6 w-6" /> : <Icon name={s.icon} className="h-5 w-5" />}</span>
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{s.label}</span>
          </div>
          <p className="text-[1.45rem] font-extrabold leading-[1.1] tracking-[-0.02em]">{s.value}</p>
          <p className="mt-1.5 text-sm leading-snug text-muted">{s.note}</p>
        </div>
      ))}
    </div>
  );
}

/** The five layers of the dig, shallow to deep, each with what it turned up. */
export function LayerStack({ layers }: { layers: Insights["layers"] }) {
  return (
    <ol className="overflow-hidden rounded-2xl border border-line" style={{ boxShadow: "var(--shadow-soft)" }}>
      {layers.map((l, i) => {
        const dark = i >= 3;
        const bg = ["#dbe8ff", "#9fbfff", "#6b9cfa", "#1b57e5", "#0f2f8f"][i];
        return (
          <li key={l.name} className="grid grid-cols-[6.2rem_1fr] sm:grid-cols-[8.5rem_1fr]">
            <div className="flex items-center gap-2 px-3 py-3.5 sm:px-4" style={{ background: bg, color: dark ? "#fff" : "#0e1a2b" }}>
              <Art id={l.icon} className="hidden h-7 w-7 shrink-0 sm:block" />
              <span className="text-sm font-bold leading-tight">{l.name}</span>
            </div>
            <div className="border-b border-line bg-surface px-4 py-3 last:border-b-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{l.title}</p>
              <p className="text-[1rem] font-semibold leading-snug">{l.finding}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** A titled card around a chart, so the report reads as a dashboard. */
export function Panel({ title, kicker, note, children }: { title: string; kicker?: string; note?: string; children: ReactNode }) {
  return (
    <section className="card space-y-4">
      <div>
        {kicker && <p className="eyebrow">{kicker}</p>}
        <h3 className="text-xl font-bold">{title}</h3>
        {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Draws a chart twice, compact for phones and full for wider screens, so text stays readable on both. */
export function Resp({ children }: { children: (w: number) => ReactNode }) {
  return (
    <>
      <div className="md:hidden">{children(360)}</div>
      <div className="hidden md:block">{children(560)}</div>
    </>
  );
}
