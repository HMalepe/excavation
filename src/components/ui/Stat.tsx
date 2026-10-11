import { Icon } from "./Brand";

/** One figure with a label: the dashboards' unit. Icon tile on the left, tabular number. */
export function Stat({ label, value, note, tone, icon = "chart" }: { label: string; value: React.ReactNode; note?: string; tone?: "danger"; icon?: string; layer?: number }) {
  return (
    <div className="card flex items-start gap-4 !p-4 sm:!p-5">
      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tone === "danger" ? "border-danger/30 bg-danger-soft text-danger" : "border-tint-line bg-tint text-accent-ink"}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className={`text-3xl font-bold leading-tight tracking-[-0.03em] tabular-nums ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>
    </div>
  );
}
