/**
 * Diagrams for readiness-check questions and scenes for reading passages. Each is keyed by the item
 * (or passage) it belongs to and only shows what the question already says: nothing here gives an
 * answer away. Inline SVG, section-coloured, readable in both themes.
 */
import type { ReactNode } from "react";

const T = ({ x, y, children, anchor = "middle", size = 13, weight = 700, fill = "currentColor" }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; size?: number; weight?: number; fill?: string }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill} stroke="none" style={{ fontFamily: "var(--font-sans)" }}>{children}</text>
);

const A = "var(--sec)", M = "var(--sec-mid)", P = "var(--surface)";

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border-2" style={{ borderColor: "var(--sec-line)", background: "var(--sec-soft)" }}>
      <svg viewBox="0 0 280 150" className="block h-auto w-full text-fg" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label}>
        {children}
      </svg>
    </figure>
  );
}

function Chart({ xs, ys, xLabel, yLabel, xMax, yMax, label }: { xs: number[]; ys: number[]; xLabel: string; yLabel: string; xMax: number; yMax: number; label: string }) {
  const X = (v: number) => 48 + (v / xMax) * 206, Y = (v: number) => 112 - (v / yMax) * 88;
  const d = xs.map((x, i) => `${i ? "L" : "M"}${X(x)} ${Y(ys[i]!)}`).join(" ");
  return (
    <Frame label={label}>
      <path d="M48 20v92h210" />
      {[0, 0.5, 1].map((f) => <path key={f} d={`M48 ${112 - f * 88}h210`} stroke="var(--sec-line)" strokeWidth="1.2" />)}
      <path d={d} stroke={A} strokeWidth="3" />
      {xs.map((x, i) => <g key={i}><circle cx={X(x)} cy={Y(ys[i]!)} r="4.6" fill={P} stroke={A} strokeWidth="2.6" /><T x={X(x)} y={128} size={11} weight={600}>{x}</T></g>)}
      {[0, 0.5, 1].map((f) => <T key={f} x={42} y={116 - f * 88} anchor="end" size={11} weight={600}>{Math.round(f * yMax)}</T>)}
      <T x={153} y={144} size={11} weight={700} fill="var(--sec-ink)">{xLabel}</T>
      <T x={48} y={13} anchor="start" size={11} weight={700} fill="var(--sec-ink)">{yLabel}</T>
    </Frame>
  );
}

function Circuit({ parallel }: { parallel: boolean }) {
  return (
    <Frame label={parallel ? "Two bulbs in parallel with a battery. One bulb is broken." : "Two bulbs in series with a battery. One bulb is broken."}>
      {/* battery */}
      <path d="M26 56v12M32 50v24" strokeWidth="3.2" /><path d="M26 62H18v-30h244v30" />
      <T x={60} y={86} size={11} weight={700} fill="var(--sec-ink)">battery</T>
      {!parallel ? (
        <>
          <path d="M26 62" /><path d="M32 62h0" />
          <path d="M262 62v38H32V74" />
          <circle cx="110" cy="32" r="14" fill={P} /><path d="M104 26l12 12M116 26l-12 12" stroke={A} />
          <circle cx="190" cy="32" r="14" fill={M} /><path d="M184 36l3-5 3 4 3-4 3 5" />
          <T x={110} y={14} size={11} weight={700}>broken</T><T x={190} y={14} size={11} weight={700}>bulb</T>
        </>
      ) : (
        <>
          <path d="M262 62v38H32V74" />
          <path d="M120 32v68M200 32v68" />
          <circle cx="120" cy="66" r="14" fill={P} /><path d="M114 60l12 12M126 60l-12 12" stroke={A} />
          <circle cx="200" cy="66" r="14" fill={M} /><path d="M194 70l3-5 3 4 3-4 3 5" />
          <T x={120} y={96} size={11} weight={700}>broken</T><T x={200} y={96} size={11} weight={700}>bulb</T>
        </>
      )}
    </Frame>
  );
}

const FIGURES: Record<string, () => ReactNode> = {
  // ---- maths ----
  M8a: () => (
    <Frame label="A 5 metre ladder leans on a wall. Its foot is 3 metres from the wall. The height it reaches is unknown.">
      <path d="M40 120h210M232 20v100" strokeWidth="3" />
      <path d="M232 120" /><path d="M120 120L232 36" stroke={A} strokeWidth="5" />
      <path d="M135 110l12 -3M158 94l12 -3M181 76l12 -3M204 58l12 -3" stroke={A} strokeWidth="2.4" />
      <path d="M120 120h112" strokeDasharray="1 7" strokeWidth="3" />
      <T x={176} y={138} size={13}>3 m</T><T x={166} y={64} size={13} anchor="end" fill="var(--sec-ink)">5 m ladder</T><T x={250} y={82} size={18} anchor="start" fill={A}>?</T>
      <path d="M232 108h-10v12" strokeWidth="2" />
    </Frame>
  ),
  M8b: () => (
    <Frame label="A rectangle 8 centimetres long and 6 centimetres wide with its diagonal drawn. The diagonal length is unknown.">
      <rect x="60" y="22" width="160" height="96" rx="2" fill={P} /><path d="M60 118L220 22" stroke={A} strokeWidth="4" />
      <T x={140} y={138} size={13}>8 cm</T><T x={44} y={74} size={13} anchor="end">6 cm</T><T x={150} y={104} size={20} fill={A}>?</T>
    </Frame>
  ),
  // ---- science ----
  S1a: () => (
    <Frame label="Three identical pots with bean plants, with different amounts of sunlight.">
      <circle cx="40" cy="30" r="12" fill={A} stroke="none" /><path d="M40 8v6M40 46v6M18 30h6M56 30h6M24 14l4 4M52 42l4 4M56 14l-4 4M24 46l4-4" stroke={A} />
      {[90, 160, 230].map((x, i) => <g key={x}><path d={`M${x - 16} 98h32l-4 24h-24z`} fill={M} /><path d={`M${x} 98V${74 - i * 8}`} /><path d={`M${x} ${86 - i * 6}c-9 0-12-5-12-9 7 0 12 3 12 9zM${x} ${80 - i * 6}c0-6 4-9 10-9 0 6-4 9-10 9z`} fill={A} stroke="none" /></g>)}
      <T x={90} y={142} size={11} weight={600}>less light</T><T x={160} y={142} size={11} weight={600}>some</T><T x={230} y={142} size={11} weight={600}>more light</T>
    </Frame>
  ),
  S2a: () => <Chart xs={[0, 2, 4, 6, 8]} ys={[20, 35, 50, 65, 80]} xMax={10} yMax={100} xLabel="Time (min)" yLabel="Temperature (°C)" label="Line graph: water temperature at 0, 2, 4, 6 and 8 minutes is 20, 35, 50, 65 and 80 degrees." />,
  S2b: () => <Chart xs={[0, 1, 2, 3]} ys={[0, 2, 4, 6]} xMax={4} yMax={8} xLabel="Time (s)" yLabel="Distance (m)" label="Line graph: a trolley's distance at 0, 1, 2 and 3 seconds is 0, 2, 4 and 6 metres." />,
  S4a: () => (
    <Frame label="A block on a scale. Mass 60 grams, volume 20 cubic centimetres.">
      <path d="M70 100h140l10 22H60z" fill={M} /><path d="M100 100l16-14h52l16 14" />
      <path d="M118 44h56l14 12v36h-56l-14-12z" fill={P} /><path d="M118 44l14 12h56M132 56v36M132 92h56" /><path d="M118 44v36l14 12" />
      <T x={160} y={80} size={14} fill={A}>60 g</T>
      <T x={240} y={50} size={13} anchor="middle">volume</T><T x={240} y={68} size={14} fill={A}>20 cm³</T>
    </Frame>
  ),
  S5a: () => <Circuit parallel={false} />,
  S5b: () => <Circuit parallel />,
  S7a: () => (
    <Frame label="A ball thrown straight up, shown at the bottom, going up, and at its highest point.">
      <path d="M30 128h220" />
      <path d="M140 126V32" strokeDasharray="2 8" strokeWidth="3" /><path d="M134 44l6-8 6 8" />
      <circle cx="140" cy="24" r="10" fill={A} stroke="none" /><T x={160} y={28} anchor="start" size={12} weight={700}>highest point</T>
      <circle cx="140" cy="116" r="9" fill={P} /><T x={160} y={120} anchor="start" size={12} weight={700}>thrown up</T>
      <circle cx="140" cy="72" r="8" fill={M} />
    </Frame>
  ),
  // ---- reading passages (by passage title) ----
  "Gogo's spaza": () => (
    <Frame label="A small spaza shop with a taxi rank two streets away.">
      <path d="M20 126h240" />
      <path d="M26 54h96l-8-22H34z" fill={A} stroke="none" /><path d="M26 54h96l-8-22H34zM26 54c0 8 10 9 16 9s16-1 16-9c0 8 10 9 16 9s16-1 16-9" /><path d="M32 63v63h84V63" fill={P} /><rect x="52" y="82" width="22" height="44" fill={M} /><rect x="84" y="78" width="22" height="22" rx="2" fill={M} />
      <path d="M170 126v-40" /><path d="M156 86h28l-4-14h-20z" fill={M} /><T x={170} y={66} size={11}>taxi rank</T>
      <rect x="196" y="98" width="60" height="22" rx="6" fill={P} /><circle cx="210" cy="124" r="6" fill={P} /><circle cx="244" cy="124" r="6" fill={P} /><path d="M204 98l6-10h30l6 10" />
    </Frame>
  ),
  "Day Zero": () => (
    <Frame label="A dam wall with the water level low.">
      <path d="M20 40h60v80H20z" fill={P} /><path d="M80 40c40 0 40 20 70 40 20 14 70 20 110 20v30H80z" fill={M} stroke="none" /><path d="M80 90c30 10 50 4 70 0s70 2 110 2" stroke={A} strokeWidth="3" /><path d="M80 40v80M20 40h60" /><path d="M96 54v12M96 76v10" stroke={A} />
      <path d="M200 40c0 10-8 16-8 22a8 8 0 0 0 16 0c0-6-8-12-8-22z" fill={A} stroke="none" /><T x={150} y={140} size={11} weight={700} fill="var(--sec-ink)">water level</T>
    </Frame>
  ),
  "Phones belong in the classroom": () => (
    <Frame label="A learner's desk with a phone and an open book.">
      <path d="M20 118h240" /><rect x="40" y="62" width="130" height="10" rx="3" fill={M} /><path d="M60 72v46M150 72v46" />
      <path d="M62 62c14-6 28-6 38 0v-26c-10-6-24-6-38 0zM100 62c10-6 24-6 38 0v-26c-14-6-28-6-38 0z" fill={P} />
      <rect x="198" y="46" width="34" height="66" rx="7" fill={A} stroke="none" /><rect x="198" y="46" width="34" height="66" rx="7" /><rect x="203" y="54" width="24" height="42" rx="3" fill={P} /><path d="M210 104h10" />
    </Frame>
  ),
  "Should school start later?": () => (
    <Frame label="A clock and a bed.">
      <circle cx="80" cy="64" r="40" fill={P} /><circle cx="80" cy="64" r="40" /><path d="M80 36v28l20 12" stroke={A} strokeWidth="4" /><path d="M64 18l-8-8M96 18l8-8" />
      <path d="M170 116h90M170 116V86h90v30M170 96h30a8 8 0 0 1 8 8" fill="none" /><rect x="172" y="88" width="30" height="14" rx="6" fill={M} /><path d="M186 40l6 0-6 8 6 0M202 28l6 0-6 8 6 0" stroke={A} />
    </Frame>
  ),
};

export const hasFigure = (key: string) => key in FIGURES;
export function Figure({ id }: { id: string }) {
  const F = FIGURES[id];
  return F ? <>{F()}</> : null;
}
