import { makeCharts, type Pal, type Prims } from "./charts";

/** Web renderer: plain SVG, coloured by the theme tokens so light and dark both work. */
export const WEB_PAL: Pal = {
  ink: "var(--fg)", muted: "var(--muted)", line: "var(--line)", soft: "var(--sunken)", accent: "var(--accent)", accentSoft: "var(--tint)", accentLine: "var(--tint-line)",
  teal: "var(--teal)", tealInk: "var(--teal-ink)", tealSoft: "var(--teal-soft)", danger: "var(--danger)", dangerSoft: "var(--danger-soft)", surface: "var(--surface)", control: "var(--control)",
  strata: ["var(--strata-5)", "var(--strata-4)", "var(--strata-3)", "var(--strata-2)", "var(--strata-1)"],
};

const dom: Prims = {
  Svg: ({ w, h, label, children }) => <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" style={{ fontFamily: "var(--font-sans)" }} role="img" aria-label={label}>{children}</svg>,
  G: ({ children }) => <g>{children}</g>,
  Rect: ({ x, y, w, h, r, fill, stroke, sw, opacity }) => <rect x={x} y={y} width={w} height={h} rx={r} fill={fill ?? "none"} stroke={stroke} strokeWidth={sw} opacity={opacity} />,
  Circle: ({ cx, cy, r, fill, stroke, sw }) => <circle cx={cx} cy={cy} r={r} fill={fill ?? "none"} stroke={stroke} strokeWidth={sw} />,
  Line: ({ x1, y1, x2, y2, stroke, sw, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw ?? 1} strokeDasharray={dash} strokeLinecap="round" />,
  Path: ({ d, fill, stroke, sw }) => <path d={d} fill={fill ?? "none"} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  Poly: ({ pts, fill, stroke, sw, opacity }) => <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={fill ?? "none"} fillOpacity={opacity} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />,
  Text: ({ x, y, children, size = 13, weight = 500, fill, anchor = "start" }) => <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}>{children}</text>,
};

export const WebCharts = makeCharts(dom, WEB_PAL);
