/** A single number with a label: staff and school dashboards. Layer colour = which earth layer it sits in. */
export function Stat({ label, value, note, tone, layer = 2 }: { label: string; value: React.ReactNode; note?: string; tone?: "danger"; layer?: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="card relative overflow-hidden pl-7">
      <span className="absolute inset-y-0 left-0 w-2.5" style={{ background: tone === "danger" ? "var(--danger)" : `var(--strata-${layer})` }} aria-hidden="true" />
      <p className="font-display text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`font-display text-5xl font-extrabold leading-tight tracking-[-0.03em] ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
      {note && <p className="text-sm text-muted">{note}</p>}
    </div>
  );
}
