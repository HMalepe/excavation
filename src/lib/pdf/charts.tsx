import "server-only";
import { Svg, G, Rect, Circle, Line, Path, Polygon, Text as SvgText } from "@react-pdf/renderer";
import { makeCharts, type Pal, type Prims } from "@/components/report/charts";

/** Print palette: the light theme as literal colours (react-pdf has no CSS variables). */
export const PDF_PAL: Pal = {
  ink: "#0e1a2b", muted: "#566276", line: "#e1e6ee", soft: "#eef2f8", accent: "#1b57e5", accentSoft: "#edf3ff", accentLine: "#bcd0fb",
  teal: "#0f9b8a", tealInk: "#0a6f63", tealSoft: "#e6f6f3", danger: "#c62828", dangerSoft: "#fdecec", surface: "#ffffff", control: "#7e8ba0",
  strata: ["#0f2f8f", "#1b57e5", "#6b9cfa", "#9fbfff", "#dbe8ff"],
};

/** react-pdf renderer for the shared charts, drawn `widthPt` wide (height follows the chart's aspect). */
const prims = (widthPt: number): Prims => ({
  Svg: ({ w, h, children }) => <Svg width={widthPt} height={(widthPt * h) / w} viewBox={`0 0 ${w} ${h}`}>{children}</Svg>,
  G: ({ children }) => <G>{children}</G>,
  Rect: ({ x, y, w, h, r, fill, stroke, sw, opacity }) => <Rect x={x} y={y} width={w} height={h} rx={r} fill={fill ?? "none"} stroke={stroke} strokeWidth={sw} fillOpacity={opacity} />,
  Circle: ({ cx, cy, r, fill, stroke, sw }) => <Circle cx={cx} cy={cy} r={r} fill={fill ?? "none"} stroke={stroke} strokeWidth={sw} />,
  Line: ({ x1, y1, x2, y2, stroke, sw, dash }) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw ?? 1} strokeDasharray={dash} strokeLinecap="round" />,
  Path: ({ d, fill, stroke, sw }) => <Path d={d} fill={fill ?? "none"} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />,
  Poly: ({ pts, fill, stroke, sw, opacity }) => <Polygon points={pts.map((p) => p.join(",")).join(" ")} fill={fill ?? "none"} fillOpacity={opacity} stroke={stroke} strokeWidth={sw} />,
  Text: ({ x, y, children, size = 13, weight = 500, fill, anchor = "start" }) => (
    <SvgText x={x} y={y} fill={fill} textAnchor={anchor} style={{ fontSize: size, fontFamily: weight >= 600 ? "Helvetica-Bold" : "Helvetica" }}>{String(children)}</SvgText>
  ),
});

const cache = new Map<number, ReturnType<typeof makeCharts>>();
export const pdfCharts = (widthPt: number) => {
  let c = cache.get(widthPt);
  if (!c) { c = makeCharts(prims(widthPt), PDF_PAL); cache.set(widthPt, c); }
  return c;
};
