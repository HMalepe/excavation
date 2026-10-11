/**
 * One small illustration per taster task: the scene as a picture, so the work feels real and the
 * numbers are easier to read on a phone. Inline SVG/HTML, theme-aware, no image requests.
 * (The poster task draws its own two posters in Skills.tsx.)
 */
const Chip = ({ children, tone }: { children: React.ReactNode; tone?: "danger" }) => (
  <span className={`chip ${tone === "danger" ? "!border-danger text-danger" : ""}`}>{children}</span>
);

function Clinic() {
  return (
    <div className="card flex items-center gap-4" aria-hidden="true">
      <svg viewBox="0 0 48 120" className="h-28 w-12 shrink-0">
        <rect x="16" y="6" width="16" height="84" rx="8" fill="var(--surface)" stroke="var(--control)" strokeWidth="2.5" />
        <circle cx="24" cy="98" r="14" fill="var(--danger)" />
        <rect x="21" y="26" width="6" height="68" rx="3" fill="var(--danger)" />
        {[0, 1, 2, 3].map((i) => <line key={i} x1="34" x2="42" y1={22 + i * 17} y2={22 + i * 17} stroke="var(--control)" strokeWidth="2" />)}
      </svg>
      <div className="space-y-2">
        <p className="text-3xl font-bold leading-none tracking-tight">39 °C</p>
        <p className="text-sm text-muted">14-year-old girl · today</p>
        <div className="flex flex-wrap gap-1.5"><Chip>Sore throat</Chip><Chip>Swollen glands</Chip><Chip tone="danger">No cough</Chip></div>
      </div>
    </div>
  );
}

function Code() {
  const steps = ["Take the customer's money", "If money ≥ price → give the drink", "Give change: price − money"];
  return (
    <ol className="card space-y-2" aria-hidden="true">
      {steps.map((t, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">{i + 1}</span>
          <code className="rounded-lg border border-line bg-sunken px-3 py-1.5 text-sm">{t}</code>
        </li>
      ))}
    </ol>
  );
}

function Evidence() {
  return (
    <div className="card space-y-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3">
        {[["Zola", "“I saw Kabelo at the desk at 10:15.”"], ["Mia", "“Kabelo was with me at the tuck shop all break.”"]].map(([who, say]) => (
          <div key={who} className="rounded-2xl rounded-bl-sm border border-line bg-sunken p-3 text-sm">
            <p className="font-semibold">{who}</p><p className="text-muted">{say}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-line pt-3">
        <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0"><circle cx="20" cy="20" r="17" fill="var(--surface)" stroke="var(--control)" strokeWidth="2.5" /><line x1="20" y1="20" x2="20" y2="9" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" /><line x1="20" y1="20" x2="28" y2="23" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" /></svg>
        <p className="text-sm">The classroom clock has been <strong>20 minutes fast</strong> all week.</p>
      </div>
    </div>
  );
}

function Business() {
  const total = 300;
  const parts = [["Ingredients", 150, "var(--accent)", "var(--on-accent)"], ["Stall fee", 50, "var(--tint-line)", "var(--fg)"], ["Left over?", 100, "var(--teal-soft)", "var(--teal-ink)"]] as const;
  return (
    <div className="card space-y-3" aria-hidden="true">
      <div className="flex items-baseline justify-between"><p className="font-semibold">50 vetkoek at R6</p><p className="text-xl font-bold">R{total}</p></div>
      <div className="flex h-9 overflow-hidden rounded-xl border border-line">
        {parts.map(([l, v, c, ink]) => <div key={l} className="flex items-center justify-center text-xs font-bold" style={{ width: `${(v / total) * 100}%`, background: c, color: ink }}>{l === "Left over?" ? "?" : `R${v}`}</div>)}
      </div>
      <div className="flex gap-4 text-xs text-muted">{parts.map(([l, , c]) => <span key={l} className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm border border-line" style={{ background: c }} />{l}</span>)}</div>
    </div>
  );
}

function Field() {
  const pts = [[300, 1.2], [450, 2.5], [600, 3.6], [750, 3.8], [900, 3.1]] as const;
  const x = (r: number) => 40 + ((r - 300) / 600) * 250, y = (t: number) => 120 - (t / 4.5) * 100;
  const d = pts.map(([r, t], i) => `${i ? "L" : "M"}${x(r)} ${y(t)}`).join(" ");
  return (
    <figure className="card" aria-label="Chart: maize harvest in tonnes per hectare against rainfall in millimetres">
      <svg viewBox="0 0 310 150" className="w-full">
        {[0, 1, 2, 3, 4].map((t) => <g key={t}><line x1="40" x2="295" y1={y(t)} y2={y(t)} stroke="var(--line)" /><text x="32" y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{t}</text></g>)}
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map(([r, t]) => <g key={r}><circle cx={x(r)} cy={y(t)} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" /><text x={x(r)} y="140" textAnchor="middle" fontSize="10" fill="var(--muted)">{r}</text></g>)}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted"><span>↑ harvest (t/ha)</span><span>rainfall (mm) →</span></figcaption>
    </figure>
  );
}

const ART: Record<string, () => React.ReactNode> = { HEALTH: Clinic, CODE: Code, EVIDENCE: Evidence, BUSINESS: Business, FIELD: Field };
export function TasterArt({ id }: { id: string }) {
  const A = ART[id];
  return A ? <A /> : null;
}
