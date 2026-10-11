/**
 * RIASEC hexagon (spec 08 Part 7): drawn as a shape with friendly names; for Grade 11 the Grade 9
 * shape sits underneath in grey so change is visible at a glance. The line "draws on" with CSS.
 */
const ORDER = ["R", "I", "A", "S", "E", "C"] as const;
const NAMES: Record<(typeof ORDER)[number], string> = { R: "Builder", I: "Thinker", A: "Creator", S: "Helper", E: "Leader", C: "Organiser" };
type Scores = Partial<Record<(typeof ORDER)[number], number | null>>;

const C = 160, R = 110;
const pt = (i: number, v: number) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  const r = (Math.max(0, Math.min(100, v)) / 100) * R;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};
const poly = (s: Scores) => ORDER.map((t, i) => pt(i, s[t] ?? 0).join(",")).join(" ");

export function Hexagon({ scores, before, delayMs = 200 }: { scores: Scores; before?: Scores | null; delayMs?: number }) {
  return (
    <figure className="card mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 320" role="img" aria-label={`What you'd love doing: ${ORDER.map((t) => `${NAMES[t]} ${scores[t] ?? "not scored"}`).join(", ")}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ORDER.map((_, i) => pt(i, f * 100).join(",")).join(" ")} fill={f === 1 ? "var(--surface)" : "none"} stroke="var(--line)" strokeWidth={f === 1 ? 1.5 : 1} />
        ))}
        {ORDER.map((t, i) => {
          const [x, y] = pt(i, 100);
          const [lx, ly] = pt(i, 128);
          return (
            <g key={t}>
              <line x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--fg)" fontSize="14" fontWeight="600" letterSpacing="-0.2" style={{ fontFamily: "var(--font-display)" }}>{NAMES[t]}</text>
            </g>
          );
        })}
        {before && <polygon points={poly(before)} fill="var(--muted)" fillOpacity=".12" stroke="var(--muted)" strokeDasharray="5 5" strokeWidth="2" />}
        <polygon
          points={poly(scores)}
          fill="var(--accent)"
          fillOpacity=".18"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          pathLength={1000}
          style={{ strokeDasharray: 1000, ["--len" as string]: 1000, animation: `draw 1.6s ease-out ${delayMs}ms both` }}
        />
        {ORDER.map((t, i) => { const [x, y] = pt(i, scores[t] ?? 0); return <circle key={t} cx={x} cy={y} r="4.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />; })}
      </svg>
      {before && <figcaption className="mt-1 text-center text-sm text-muted">Dashed: Grade 9 · Filled: now</figcaption>}
    </figure>
  );
}
