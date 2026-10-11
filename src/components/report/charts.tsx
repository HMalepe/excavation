/**
 * One chart library, two renderers. Every chart is written against a handful of drawing primitives
 * (`Prims`), so the same code draws on the web (plain SVG, themed with CSS variables) and into the
 * downloadable PDF (react-pdf SVG, literal colours). Nothing here prints a percentage: positions are
 * for drawing, and what you read are words ("Strong pull", "Solid").
 */
import type { ReactNode } from "react";
import type { Insights, DeltaBar } from "@/lib/insights/build";

export interface Pal {
  ink: string; muted: string; line: string; soft: string; accent: string; accentSoft: string; accentLine: string;
  teal: string; tealInk: string; tealSoft: string; danger: string; dangerSoft: string; surface: string; control: string;
  strata: [string, string, string, string, string];
}
export interface Prims {
  G: (p: { children: ReactNode }) => ReactNode;
  Svg: (p: { w: number; h: number; label: string; children: ReactNode }) => ReactNode;
  Rect: (p: { x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string; sw?: number; opacity?: number }) => ReactNode;
  Circle: (p: { cx: number; cy: number; r: number; fill?: string; stroke?: string; sw?: number }) => ReactNode;
  Line: (p: { x1: number; y1: number; x2: number; y2: number; stroke: string; sw?: number; dash?: string }) => ReactNode;
  Path: (p: { d: string; fill?: string; stroke?: string; sw?: number }) => ReactNode;
  Poly: (p: { pts: [number, number][]; fill?: string; stroke?: string; sw?: number; opacity?: number }) => ReactNode;
  Text: (p: { x: number; y: number; children: ReactNode; size?: number; weight?: number; fill?: string; anchor?: "start" | "middle" | "end" }) => ReactNode;
}

const W = 560;
export const wrapText = (t: string, max: number): string[] => {
  const out: string[] = []; let cur = "";
  for (const w of t.split(/\s+/)) { if ((cur + " " + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) out.push(cur);
  return out;
};
const clip = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);
const dots = (level: number) => Math.max(0, Math.min(5, Math.round(level / 20)));

export function makeCharts(P: Prims, c: Pal) {
  const { Svg, G, Rect, Circle, Line, Path, Poly, Text } = P;

  /** Six-pointed shape of what pulls you; Grade 11 adds the Grade 9 shape underneath. */
  function Radar({ scores, before }: { scores: Insights["radar"]; before?: Insights["radarBefore"] }) {
    const order = ["R", "I", "A", "S", "E", "C"] as const;
    const names = { R: "Builder", I: "Thinker", A: "Creator", S: "Helper", E: "Leader", C: "Organiser" };
    const cx = 160, cy = 138, R = 92;
    const pt = (i: number, v: number): [number, number] => { const a = -Math.PI / 2 + (i * Math.PI) / 3; const r = (Math.max(0, Math.min(100, v)) / 100) * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    return (
      <Svg w={320} h={276} label="Shape of what pulls you most">
        {[0.25, 0.5, 0.75, 1].map((f) => <Poly key={f} pts={order.map((_, i) => pt(i, f * 100))} fill={f === 1 ? c.surface : "none"} stroke={c.line} sw={1} />)}
        {order.map((t, i) => { const [x, y] = pt(i, 100); const [lx, ly] = pt(i, 128); return <G key={t}><Line x1={cx} y1={cy} x2={x} y2={y} stroke={c.line} sw={1} /><Text x={lx} y={ly + 4} size={13} weight={700} anchor="middle" fill={c.ink}>{names[t]}</Text></G>; })}
        {before && <Poly pts={order.map((t, i) => pt(i, before[t]))} fill={c.muted} opacity={0.12} stroke={c.muted} sw={2} />}
        <Poly pts={order.map((t, i) => pt(i, scores[t]))} fill={c.accent} opacity={0.2} stroke={c.accent} sw={3} />
        {order.map((t, i) => { const [x, y] = pt(i, scores[t]); return <Circle key={t} cx={x} cy={y} r={5} fill={c.surface} stroke={c.accent} sw={3} />; })}
      </Svg>
    );
  }

  /** Interests as ranked bars with a named pull, longest first. */
  function InterestBars({ bars, w = W }: { bars: Insights["interests"]; w?: number }) {
    const h = bars.length * 40 + 8, tx = 112, tw = w - tx - 112;
    return (
      <Svg w={w} h={h} label="Your interests, strongest first">
        {bars.map((b, i) => {
          const y = 8 + i * 40, first = i === 0;
          return (
            <G key={b.type}>
              <Text x={0} y={y + 20} size={15} weight={700} fill={c.ink}>{b.name}</Text>
              <Rect x={tx} y={y + 4} w={tw} h={22} r={11} fill={c.soft} />
              <Rect x={tx} y={y + 4} w={Math.max(22, (b.level / 100) * tw)} h={22} r={11} fill={first ? c.accent : c.accentLine} />
              <Text x={w} y={y + 20} size={13} weight={first ? 700 : 600} anchor="end" fill={first ? c.accent : c.muted}>{b.band}</Text>
            </G>
          );
        })}
      </Svg>
    );
  }

  /** How you work: five spectra with a dot, ends named. No scores, no good end. */
  function Spectra({ traits, w = W }: { traits: Insights["traits"]; w?: number }) {
    const row = 60, h = traits.length * row + 4;
    return (
      <Svg w={w} h={h} label="How you work, on five spectrums">
        {traits.map((t, i) => {
          const y = 4 + i * row, x0 = 12, x1 = w - 12, mid = w / 2, x = x0 + (t.pos / 100) * (x1 - x0);
          return (
            <G key={t.key}>
              <Text x={0} y={y + 14} size={15} weight={700} fill={c.ink}>{t.name}</Text>
              <Text x={w} y={y + 14} size={13} weight={600} anchor="end" fill={c.accent}>{t.read}</Text>
              <Rect x={x0} y={y + 24} w={x1 - x0} h={8} r={4} fill={c.soft} />
              <Rect x={Math.min(x, mid)} y={y + 24} w={Math.abs(x - mid)} h={8} r={4} fill={c.accentLine} />
              <Line x1={mid} y1={y + 20} x2={mid} y2={y + 36} stroke={c.control} sw={1.5} />
              <Circle cx={x} cy={y + 28} r={10} fill={c.accent} stroke={c.surface} sw={3} />
              <Text x={0} y={y + 52} size={12} fill={c.muted}>{t.low}</Text>
              <Text x={w} y={y + 52} size={12} anchor="end" fill={c.muted}>{t.high}</Text>
            </G>
          );
        })}
      </Svg>
    );
  }

  /** Subject combinations side by side: a bar for the overall match and three small meters for why. */
  function FitBars({ fits, w = W }: { fits: Insights["fits"]; w?: number }) {
    const compact = w < 420, row = compact ? 112 : 88, h = fits.length * row + 4;
    const short: Record<string, string> = { "Marks and readiness": "Readiness", "How you work": "Work style" };
    return (
      <Svg w={w} h={h} label="How well each subject combination fits you">
        {fits.map((f, i) => {
          const y = 4 + i * row, caution = f.role === "caution";
          const col = caution ? c.danger : i === 0 ? c.accent : c.accentLine;
          const tag = f.keepsMostDoors ? "Keeps the most doors open" : caution ? (f.cautionType === "competence_trap" ? "Good at it, may drain you" : "A stretch for now") : "";
          const tagCol = caution ? c.danger : c.tealInk;
          const by = compact ? y + 40 : y + 32;
          return (
            <G key={f.id}>
              <Circle cx={14} cy={y + 14} r={14} fill={caution ? c.dangerSoft : i === 0 ? c.accent : c.accentSoft} stroke={caution ? c.danger : c.accentLine} sw={1.5} />
              <Text x={14} y={y + 19} size={14} weight={700} anchor="middle" fill={caution ? c.danger : i === 0 ? c.surface : c.accent}>{caution ? "!" : String(f.rank)}</Text>
              <Text x={38} y={y + 20} size={15} weight={700} fill={c.ink}>{clip(f.name, compact ? 30 : 44)}</Text>
              {tag && (compact ? <Text x={38} y={y + 36} size={12} weight={700} fill={tagCol}>{tag}</Text> : <Text x={w} y={y + 20} size={12} weight={700} anchor="end" fill={tagCol}>{tag}</Text>)}
              <Rect x={38} y={by} w={w - 38} h={14} r={7} fill={c.soft} />
              <Rect x={38} y={by} w={Math.max(16, (f.fit / 100) * (w - 38))} h={14} r={7} fill={col} />
              {f.parts.map((p, k) => {
                const colW = (w - 38) / 3;
                return (
                  <G key={p.label}>
                    <Text x={38 + k * colW} y={by + 36} size={12} weight={600} fill={c.muted}>{compact ? short[p.label] ?? p.label : p.label}</Text>
                    {[0, 1, 2, 3, 4].map((d) => <Circle key={d} cx={46 + k * colW + d * 15} cy={by + 48} r={5} fill={d < dots(p.level) ? col : c.soft} stroke={d < dots(p.level) ? col : c.line} sw={1} />)}
                  </G>
                );
              })}
            </G>
          );
        })}
      </Svg>
    );
  }

  /** Which career doors each option keeps open, shut or half-open. */
  function DoorsMatrix({ combos, rows, w = W }: { combos: Insights["combos"]; rows: Insights["doors"]; w?: number }) {
    const compact = w < 420, step = compact ? 44 : 62, rowH = compact ? 30 : 27, top = 40, h = top + rows.length * rowH + 40;
    const x0 = w - combos.length * step + step / 2 - 4, labelW = x0 - 24, maxChars = Math.floor(labelW / (compact ? 6.4 : 7.4));
    const cell = (cx: number, cy: number, st: string) =>
      st === "open" ? <G><Circle cx={cx} cy={cy} r={10} fill={c.teal} /><Path d={`M${cx - 4.5} ${cy}l3.2 3.5 6-7`} stroke={c.surface} sw={2.4} /></G>
        : st === "partly_open" ? <G><Circle cx={cx} cy={cy} r={10} fill={c.surface} stroke={c.accent} sw={2.4} /><Path d={`M${cx - 5} ${cy}h10`} stroke={c.accent} sw={2.4} /></G>
          : <G><Circle cx={cx} cy={cy} r={10} fill={c.dangerSoft} stroke={c.danger} sw={2} /><Path d={`M${cx - 4} ${cy - 4}l8 8M${cx + 4} ${cy - 4}l-8 8`} stroke={c.danger} sw={2.2} /></G>;
    return (
      <Svg w={w} h={h} label="Which career doors each subject option keeps open">
        {combos.map((cb, i) => <G key={cb.id}><Text x={x0 + i * step} y={22} size={compact ? 11 : 12} weight={700} anchor="middle" fill={c.ink}>{cb.caution ? "Careful" : compact ? `#${i + 1}` : `Option ${i + 1}`}</Text></G>)}
        {rows.map((r, i) => {
          const y = top + i * rowH;
          return (
            <G key={r.pathway}>
              {i % 2 === 0 && <Rect x={0} y={y - 14} w={w} h={rowH} r={6} fill={c.soft} opacity={0.6} />}
              <Text x={8} y={y + 5} size={compact ? 12 : 13} weight={600} fill={c.ink}>{clip(r.name, maxChars)}</Text>
              {r.cells.map((ce, k) => <G key={ce.id}>{cell(x0 + k * step, y, ce.status)}</G>)}
            </G>
          );
        })}
        <G>
          <Circle cx={12} cy={h - 14} r={7} fill={c.teal} /><Text x={26} y={h - 9} size={12} fill={c.muted}>Stays open</Text>
          <Circle cx={compact ? 108 : 128} cy={h - 14} r={7} fill={c.surface} stroke={c.accent} sw={2} /><Text x={compact ? 122 : 142} y={h - 9} size={12} fill={c.muted}>{compact ? "Condition" : "Open, with a condition"}</Text>
          <Circle cx={compact ? 218 : 304} cy={h - 14} r={7} fill={c.dangerSoft} stroke={c.danger} sw={2} /><Text x={compact ? 232 : 318} y={h - 9} size={12} fill={c.muted}>Closes</Text>
        </G>
      </Svg>
    );
  }

  /** What each readiness check showed, next to the mark the learner entered. */
  function MarksVsChecks({ items, w = W }: { items: Insights["marksVsChecks"]; w?: number }) {
    const compact = w < 420, row = compact ? 92 : 78, h = items.length * row + 4;
    const lv = (l: number | null) => (l === null ? 0 : [0, 28, 52, 74, 96][l]!);
    const tx = compact ? 88 : 96, tw = w - tx - (compact ? 74 : 130), vx = tx + tw + 12, o = compact ? 16 : 0;
    return (
      <Svg w={w} h={h} label="What each readiness check showed next to your school mark">
        {items.map((m, i) => {
          const y = 4 + i * row;
          return (
            <G key={m.check}>
              <Text x={0} y={y + 14} size={15} weight={700} fill={c.ink}>{m.title}</Text>
              {m.vsMark === "above" && (compact ? <Text x={0} y={y + 30} size={12} weight={700} fill={c.tealInk}>Your marks may undersell you</Text> : <Text x={w} y={y + 14} size={12} weight={700} anchor="end" fill={c.tealInk}>Your marks may undersell you</Text>)}
              <Text x={0} y={y + 38 + o} size={12} fill={c.muted}>School mark</Text>
              <Rect x={tx} y={y + 26 + o} w={tw} h={14} r={7} fill={c.soft} />
              {m.mark !== null && <Rect x={tx} y={y + 26 + o} w={Math.max(14, (m.mark / 100) * tw)} h={14} r={7} fill={c.control} />}
              <Text x={vx} y={y + 38 + o} size={13} weight={600} fill={c.muted}>{m.mark !== null ? String(m.mark) : "Not entered"}</Text>
              <Text x={0} y={y + 62 + o} size={12} fill={c.muted}>Check showed</Text>
              <Rect x={tx} y={y + 50 + o} w={tw} h={14} r={7} fill={c.soft} />
              {m.level !== null && <Rect x={tx} y={y + 50 + o} w={Math.max(14, (lv(m.level) / 100) * tw)} h={14} r={7} fill={c.accent} />}
              <Text x={vx} y={y + 62 + o} size={13} weight={700} fill={m.band ? c.accent : c.muted}>{m.band ? m.band[0]!.toUpperCase() + m.band.slice(1) : "Skipped"}</Text>
            </G>
          );
        })}
      </Svg>
    );
  }

  /** Taster tasks: how much you expected to enjoy it, and how much you did. */
  function TasterDots({ items, w = W }: { items: Insights["tasters"]; w?: number }) {
    const compact = w < 420, row = compact ? 62 : 54, h = items.length * row + 26;
    const t0 = compact ? 14 : 250, t1 = w - 14;
    const X = (v: number) => t0 + ((v - 1) / 4) * (t1 - t0);
    const o = compact ? 22 : 0;
    return (
      <Svg w={w} h={h} label="Taster tasks: expected enjoyment and actual enjoyment">
        <Text x={t0} y={12} size={11} weight={600} fill={c.muted}>Not at all</Text>
        <Text x={t1} y={12} size={11} weight={600} anchor="end" fill={c.muted}>Loved it</Text>
        {items.map((t, i) => {
          const y = 26 + i * row;
          return (
            <G key={t.id}>
              <Text x={0} y={y + 14 + (compact ? 0 : 0)} size={14} weight={700} fill={c.ink}>{clip(t.title, 30)}</Text>
              <Text x={compact ? w : 0} y={compact ? y + 14 : y + 32} size={11} anchor={compact ? "end" : "start"} fill={c.muted}>{clip(t.work, compact ? 20 : 38)}</Text>
              <Line x1={X(1)} y1={y + 20 + o} x2={X(5)} y2={y + 20 + o} stroke={c.line} sw={6} />
              {t.before !== null && t.after !== null && <Line x1={X(t.before)} y1={y + 20 + o} x2={X(t.after)} y2={y + 20 + o} stroke={c.accentLine} sw={6} />}
              {t.before !== null && <Circle cx={X(t.before)} cy={y + 20 + o} r={8} fill={c.surface} stroke={c.accent} sw={3} />}
              {t.after !== null && <Circle cx={X(t.after)} cy={y + 20 + o} r={8} fill={c.accent} stroke={c.surface} sw={2} />}
              {t.after === null && <Text x={X(1)} y={y + 24 + o} size={12} fill={c.muted}>Skipped</Text>}
            </G>
          );
        })}
        <G><Circle cx={t0} cy={h - 4} r={5} fill={c.surface} stroke={c.accent} sw={2.5} /><Text x={t0 + 12} y={h} size={11} fill={c.muted}>Expected</Text><Circle cx={t0 + 94} cy={h - 4} r={5} fill={c.accent} /><Text x={t0 + 106} y={h} size={11} fill={c.muted}>How it was</Text></G>
      </Svg>
    );
  }

  /** Mindset, study habits and what drives schoolwork: three segments each, one lit. */
  function Habits({ habits, w = W }: { habits: Insights["habits"]; w?: number }) {
    const compact = w < 420, row = compact ? 58 : 44, h = habits.length * row + 4, segW = compact ? 56 : 60, sx = compact ? 12 : 250;
    return (
      <Svg w={w} h={h} label="Your habits and drive">
        {habits.map((hb, i) => {
          const y = 4 + i * row;
          return (
            <G key={hb.label}>
              <Text x={0} y={y + 20} size={14} weight={700} fill={c.ink}>{hb.label}</Text>
              {[1, 2, 3].map((k) => <Rect key={k} x={sx + (k - 1) * (segW + 6)} y={compact ? y + 28 : y + 6} w={segW} h={18} r={9} fill={k <= hb.level ? c.accent : c.soft} />)}
              <Text x={compact ? sx + 3 * (segW + 6) + 4 : 462} y={compact ? y + 42 : y + 20} size={13} weight={600} fill={c.muted}>{hb.value}</Text>
            </G>
          );
        })}
      </Svg>
    );
  }

  /** Grade 9 → now: a dot for then, a dot for now, on one line per interest or trait. */
  function Dumbbells({ items, label, w = W }: { items: DeltaBar[]; label: string; w?: number }) {
    const row = 38, h = items.length * row + 28, narrow = w < 420;
    const lx = narrow ? 124 : 150, rw = narrow ? 70 : 120;
    const X = (v: number) => lx + (v / 100) * (w - lx - rw);
    return (
      <Svg w={w} h={h} label={label}>
        {items.map((d, i) => {
          const y = 8 + i * row;
          return (
            <G key={d.name}>
              <Text x={0} y={y + 18} size={14} weight={700} fill={c.ink}>{d.name}</Text>
              <Line x1={X(0)} y1={y + 14} x2={X(100)} y2={y + 14} stroke={c.soft} sw={8} />
              <Line x1={X(d.from)} y1={y + 14} x2={X(d.to)} y2={y + 14} stroke={d.moved ? c.accent : c.accentLine} sw={4} />
              <Circle cx={X(d.from)} cy={y + 14} r={7} fill={c.surface} stroke={c.muted} sw={2.5} />
              <Circle cx={X(d.to)} cy={y + 14} r={8} fill={d.moved ? c.accent : c.control} stroke={c.surface} sw={2} />
              <Text x={w} y={y + 18} size={12} weight={d.moved ? 700 : 500} anchor="end" fill={d.moved ? c.accent : c.muted}>{d.moved ? (d.direction === "up" ? "Moved up" : "Moved down") : narrow ? "Same" : "Stayed the same"}</Text>
            </G>
          );
        })}
        <G><Circle cx={lx} cy={h - 6} r={5} fill={c.surface} stroke={c.muted} sw={2} /><Text x={lx + 12} y={h - 2} size={11} fill={c.muted}>Grade 9</Text><Circle cx={lx + 82} cy={h - 6} r={5} fill={c.accent} /><Text x={lx + 94} y={h - 2} size={11} fill={c.muted}>Now</Text></G>
      </Svg>
    );
  }

  /** Grade 11: each subject placed by how well it fits you (across) and how it's going (up). */
  function SubjectMap({ points, w = W }: { points: Insights["subjects"]; w?: number }) {
    const compact = w < 420, L = compact ? 64 : 78, T = 14, Wd = w - L - 12, Ht = 262;
    const X = (v: number) => L + (v / 100) * Wd, Y = (v: number) => T + (1 - v / 100) * Ht;
    const col = { CONFIRM: c.teal, RESCUE: c.accent, RETHINK: c.control, REDIRECT: c.danger } as const;
    const fs = compact ? 11 : 12;
    return (
      <Svg w={w} h={T + Ht + 44} label="Each subject placed by how well it fits you and how it is going">
        <Rect x={L} y={T} w={Wd} h={Ht} r={8} fill={c.soft} opacity={0.5} />
        <Rect x={X(50)} y={T} w={Wd / 2} h={Ht / 2} r={8} fill={c.tealSoft} />
        <Line x1={X(50)} y1={T} x2={X(50)} y2={T + Ht} stroke={c.control} sw={1.5} dash="5 5" />
        <Line x1={L} y1={Y(50)} x2={L + Wd} y2={Y(50)} stroke={c.control} sw={1.5} dash="5 5" />
        <Text x={L + Wd - 8} y={T + 20} size={fs} weight={700} anchor="end" fill={c.tealInk}>{compact ? "Fits, working" : "Fits and working"}</Text>
        <Text x={L + 8} y={T + 20} size={fs} weight={700} fill={c.muted}>{compact ? "Draining" : "Working, but draining"}</Text>
        <Text x={L + Wd - 8} y={T + Ht - 10} size={fs} weight={700} anchor="end" fill={c.accent}>{compact ? "Fits, struggling" : "Fits, but struggling"}</Text>
        <Text x={L + 8} y={T + Ht - 10} size={fs} weight={700} fill={c.danger}>{compact ? "Not fitting" : "Not fitting, not working"}</Text>
        {(() => {
          const placed: { x0: number; x1: number; y: number }[] = [];
          return points.map((p) => {
            const x = X(Math.max(4, Math.min(96, p.fit))), y = Y(Math.max(3, Math.min(97, p.mark)));
            const label = clip(p.subject, compact ? 14 : 22), lw = label.length * (compact ? 6 : 6.6) + 10;
            const left = x > L + Wd - lw - 24;
            const x0 = left ? x - 14 - lw : x + 12, x1 = x0 + lw;
            let ly = y + 4;
            for (let k = 0; k < 8 && placed.some((q) => x0 < q.x1 && x1 > q.x0 && Math.abs(ly - q.y) < 14); k++) ly += k % 2 ? -(k + 1) * 8 : (k + 1) * 8;
            placed.push({ x0, x1, y: ly });
            return <G key={p.subject}><Circle cx={x} cy={y} r={9} fill={col[p.quadrant]} stroke={c.surface} sw={2.5} /><Text x={left ? x - 14 : x + 14} y={ly} size={fs} weight={600} anchor={left ? "end" : "start"} fill={c.ink}>{label}</Text></G>;
          });
        })()}
        <Text x={L} y={T + Ht + 24} size={fs} weight={600} fill={c.muted}>Fits less</Text>
        <Text x={L + Wd} y={T + Ht + 24} size={fs} weight={600} anchor="end" fill={c.muted}>Fits more</Text>
        <Text x={L + Wd / 2} y={T + Ht + 24} size={fs} weight={700} anchor="middle" fill={c.ink}>{compact ? "Suits you" : "How well it suits you"}</Text>
        <Text x={L - 6} y={T + 12} size={11} weight={600} anchor="end" fill={c.muted}>{compact ? "Well" : "Going well"}</Text>
        <Text x={L - 6} y={T + Ht} size={11} weight={600} anchor="end" fill={c.muted}>{compact ? "Hard" : "Struggling"}</Text>
      </Svg>
    );
  }

  return { Radar, InterestBars, Spectra, FitBars, DoorsMatrix, MarksVsChecks, TasterDots, Habits, Dumbbells, SubjectMap };
}
export type Charts = ReturnType<typeof makeCharts>;
