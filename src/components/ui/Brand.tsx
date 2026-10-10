/**
 * The Excavation brand artwork. All inline SVG (a few KB, no image requests on slow data),
 * coloured through the theme tokens so Limestone and Bedrock both look right.
 */
import type { CSSProperties } from "react";

/** The mark: a core sample. Four earth layers, a find at the bottom. */
export function Mark({ className = "h-8 w-8", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`${className} shrink-0 overflow-hidden rounded-[28%] border-2 border-edge`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect width="32" height="32" fill="var(--strata-1)" />
      <path d="M0 10C8 7 14 12 22 9.5S30 8.5 32 9.5V32H0Z" fill="var(--strata-2)" />
      <path d="M0 16.5C7 14.5 15 18.5 22 16S30 15.5 32 16.5V32H0Z" fill="var(--strata-3)" />
      <path d="M0 22.5C9 20.5 15 24.5 23 22S30 21.5 32 22.5V32H0Z" fill="var(--strata-5)" />
      <path d="M16 23.6l2.7 2.7-2.7 2.7-2.7-2.7z" fill="var(--accent)" />
    </svg>
  );
}

export function Wordmark({ className = "", sub }: { className?: string; sub?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-8 w-8" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.15rem] font-extrabold tracking-[-0.04em] text-fg">The Excavation</span>
        {sub && <span className="mt-1 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">{sub}</span>}
      </span>
    </span>
  );
}

/** Five-colour rule used as a signature at the top of every page. */
export function StrataRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1.5 w-full ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className="flex-1" style={{ background: `var(--strata-${i})` }} />)}
    </div>
  );
}

const LAYER_TOPS = [48, 104, 160, 216, 272];
const LAYER_PATHS = [
  "M0 48C60 34 120 60 200 46S330 34 400 50V340H0Z",
  "M0 104C70 92 140 118 210 104S340 90 400 108V340H0Z",
  "M0 160C80 148 150 174 230 158S350 146 400 164V340H0Z",
  "M0 216C60 204 150 230 220 214S340 202 400 220V340H0Z",
  "M0 272C90 260 160 284 240 268S350 258 400 274V340H0Z",
];
const DEPTHS = ["Surface", "Wading in", "Deep water", "The trench", "The floor"];

/**
 * The cover art: a cross-section of the ground. The shaft on the right is the learner's
 * descent (the same five stages as the progress gauge); what's buried is what they find.
 */
export function StrataHero({ className = "", depth = 4, labels = true, crop = false }: { className?: string; depth?: number; labels?: boolean; crop?: boolean }) {
  const mid = (i: number) => (LAYER_TOPS[i]! + (LAYER_TOPS[i + 1] ?? 330)) / 2 + 2;
  return (
    <svg viewBox="0 0 400 330" preserveAspectRatio={crop ? "xMidYMid slice" : undefined} className={className} role="img" aria-label="A cross-section of the ground: five layers from sand down to bedrock, with a shaft dug through them and a find at the bottom.">
      {/* grass */}
      <g stroke="#6f8f3c" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M34 44l-3-9M38 43l1-10M42 44l4-8" /><path d="M128 46l-2-8M132 46l2-9" /><path d="M236 42l-3-8M240 41l1-9M244 42l4-7" /><path d="M352 46l-2-8M356 46l3-8" />
      </g>
      {LAYER_PATHS.map((d, i) => <path key={i} d={d} fill={`var(--strata-${i + 1})`} />)}
      {/* layer edges */}
      {LAYER_PATHS.slice(1).map((d, i) => <path key={i} d={d.split("V")[0]} fill="none" stroke="#1a1613" strokeOpacity=".18" strokeWidth="1.5" />)}
      {/* pebbles and grit */}
      <g fill="var(--strata-4)" fillOpacity=".28">
        <ellipse cx="60" cy="78" rx="7" ry="4" /><ellipse cx="170" cy="70" rx="4" ry="2.5" /><ellipse cx="226" cy="84" rx="6" ry="3.5" /><ellipse cx="90" cy="134" rx="5" ry="3" />
        <ellipse cx="250" cy="138" rx="8" ry="4.5" /><ellipse cx="34" cy="128" rx="3" ry="2" />
      </g>
      <g fill="#fff6e6" fillOpacity=".22">
        <circle cx="200" cy="198" r="2" /><circle cx="58" cy="186" r="1.6" /><circle cx="250" cy="240" r="1.8" /><circle cx="130" cy="300" r="1.5" /><circle cx="70" cy="306" r="2" />
      </g>
      {/* ammonite in the laterite */}
      <g stroke="var(--strata-1)" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".9">
        <path d="M112 190a14 14 0 1 1 28 0a10.5 10.5 0 1 1-21 0a7 7 0 1 1 14 0a3.5 3.5 0 1 1-7 0" />
        <path d="M126 176v5M138 184l-4 2M139 196l-4-1M126 204v-4M114 197l4-2" strokeWidth="1.6" />
      </g>
      {/* crystals in the umber */}
      <g stroke="#1a1613" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M44 262l7-24 7 24z" fill="var(--accent)" /><path d="M56 262l9-32 8 32z" fill="var(--accent)" /><path d="M70 262l5-16 6 16z" fill="var(--accent)" />
        <path d="M65 230l-1 32" stroke="#1a1613" strokeOpacity=".35" />
      </g>
      {/* the find, in bedrock */}
      <g className="animate-glint">
        <path d="M180 286l14 14-14 14-14-14z" fill="var(--accent)" stroke="#1a1613" strokeWidth="1.5" />
        <path d="M180 278v-6M196 290l5-4M164 290l-5-4M180 322v5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* the shaft: your descent */}
      <path d="M300 36V312" stroke="#1a1613" strokeOpacity=".55" strokeWidth="2" strokeDasharray="4 5" />
      {DEPTHS.map((name, i) => (
        <g key={name}>
          <circle cx="300" cy={mid(i)} r={i === depth ? 8 : 4} fill={i === depth ? "var(--accent)" : "#fff6e6"} stroke="#1a1613" strokeWidth="2" />
          {labels && (
            <text x="314" y={mid(i) + 4} fontSize="12" fontWeight="700" letterSpacing="-0.2" fill={i < 2 ? "#2a201a" : "#fff6e6"} style={{ fontFamily: "var(--font-display)" }}>{name}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Line icons for checks and taster tasks (24px grid, currentColor). */
const ICONS: Record<string, React.ReactNode> = {
  maths: <><path d="M5 7h6M8 4v6M14 7h5M5 17l4-4M9 17l-4-4M14 15h5M14 19h5" /></>,
  science: <><path d="M10 3h4M11 3v6l-5.5 9.5A2 2 0 0 0 7.2 21.5h9.6a2 2 0 0 0 1.7-3L13 9V3" /><path d="M8 15h8" /></>,
  reading: <><path d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5c3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z" /><path d="M12 6.5V20" /></>,
  HEALTH: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M7.5 12h2.5l1.2-2.5 1.8 5 1.2-2.5h2.3" /></>,
  CODE: <><path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 5l-3 14" /></>,
  EVIDENCE: <><path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z" /></>,
  BUSINESS: <><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" /></>,
  FIELD: <><path d="M12 21v-9M12 12C12 7 8.5 4.5 4 4.5 4 9 7 12 12 12zM12 14c0-4 3-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5z" /></>,
  DESIGN: <><path d="M12 3l6 7-6 11-6-11z" /><path d="M12 13v8M10 10.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0" /></>,
};

export function Icon({ name, className = "h-6 w-6", style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] ?? null}
    </svg>
  );
}

/** Icon in a strata-coloured tile, for section headers. */
export function IconTile({ name, layer = 2 }: { name: string; layer?: 1 | 2 | 3 | 4 | 5 }) {
  const dark = layer >= 3;
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-edge" style={{ background: `var(--strata-${layer})`, color: dark ? "#fff6e6" : "#1a1613", boxShadow: "3px 3px 0 var(--shadow)" }}>
      <Icon name={name} className="h-6 w-6" />
    </span>
  );
}
