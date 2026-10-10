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
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 320 320" role="img" aria-label={`What you'd love doing: ${ORDER.map((t) => `${NAMES[t]} ${scores[t] ?? "not scored"}`).join(", ")}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ORDER.map((_, i) => pt(i, f * 100).join(",")).join(" ")} fill="none" stroke="var(--color-line)" strokeWidth="1" />
        ))}
        {ORDER.map((t, i) => {
          const [x, y] = pt(i, 100);
          const [lx, ly] = pt(i, 128);
          return (
            <g key={t}>
              <line x1={C} y1={C} x2={x} y2={y} stroke="var(--color-line)" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--color-muted)" fontSize="13">{NAMES[t]}</text>
            </g>
          );
        })}
        {before && <polygon points={poly(before)} fill="rgba(181,169,147,0.12)" stroke="var(--color-muted)" strokeDasharray="4 4" strokeWidth="1.5" />}
        <polygon
          points={poly(scores)}
          fill="rgba(200,151,58,0.18)"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          pathLength={1000}
          style={{ strokeDasharray: 1000, ["--len" as string]: 1000, animation: `draw 1.6s ease-out ${delayMs}ms both` }}
        />
      </svg>
      {before && <figcaption className="mt-1 text-center text-xs text-muted">Dashed grey: Grade 9 · Gold: now</figcaption>}
    </figure>
  );
}
