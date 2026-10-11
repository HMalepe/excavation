/**
 * Illustration set for questions: one duotone drawing per idea, on a 64-unit grid. Drawn with
 * currentColor ink plus the section's colour (--sec, --sec-mid), so every section keeps its own cool
 * palette and light/dark both work. Inline SVG only (no image requests, nothing to load on cheap data).
 */
import type { ReactNode } from "react";

const A = "var(--sec)";          // accent shapes
const M = "var(--sec-mid)";      // soft fills
const P = "var(--surface)";      // paper

const I = (n: ReactNode) => n;

const ART: Record<string, ReactNode> = {
  // ---------- Builder ----------
  IR1: I(<><rect x="20" y="8" width="24" height="46" rx="5" fill={M} /><rect x="20" y="8" width="24" height="46" rx="5" /><path d="M28 14h8" /><circle cx="32" cy="47" r="1.6" fill="currentColor" /><path d="M42 30l9-9a6 6 0 0 0-8-8l-3 3 3 3-3 3-3-3-6 6 3 3-5 5a3 3 0 0 0 4 4l5-5 3 3 5-5" fill={P} /><circle cx="49" cy="15" r="2" fill={A} stroke="none" /></>),
  IR2: I(<><rect x="6" y="48" width="52" height="9" rx="2" fill={M} /><rect x="6" y="48" width="52" height="9" rx="2" /><g transform="rotate(-35 32 30)"><rect x="26" y="20" width="12" height="34" rx="3" fill={P} /><rect x="14" y="8" width="36" height="14" rx="3" fill={A} stroke="none" /><rect x="14" y="8" width="36" height="14" rx="3" /></g><path d="M52 40v8" strokeWidth="3" /></>),
  IR3: I(<><circle cx="49" cy="15" r="7" fill={M} stroke="none" /><path d="M10 54h44" /><path d="M32 54V30" /><path d="M32 38c-10 0-14-6-14-14 9 0 14 5 14 14z" fill={M} /><path d="M32 32c0-8 5-13 14-13 0 8-5 13-14 13z" fill={A} stroke="none" /><path d="M32 32c0-8 5-13 14-13 0 8-5 13-14 13z" /></>),
  IR4: I(<><path d="M6 40v-8l7-3 6-9h22l9 9 7 3v8" fill={M} /><path d="M6 40h52M6 40v4h6M58 40v4h-6" /><path d="M20 29l5-7h14l5 7z" fill={P} /><circle cx="18" cy="44" r="6" fill={P} /><circle cx="46" cy="44" r="6" fill={P} /><circle cx="18" cy="44" r="2" fill={A} stroke="none" /><circle cx="46" cy="44" r="2" fill={A} stroke="none" /></>),
  IR5: I(<><path d="M14 26h36M18 26l-4 28M46 26l4 28" /><rect x="14" y="20" width="36" height="8" rx="2" fill={M} /><rect x="14" y="20" width="36" height="8" rx="2" /><path d="M24 54l3-14h10l3 14" /><path d="M44 42l9-9" stroke={A} strokeWidth="4" /><path d="M50 30l5 5" /></>),
  IR6: I(<><path d="M8 30L32 10l24 20" /><path d="M14 27v27h36V27" fill={M} /><path d="M14 27v27h36V27" /><rect x="26" y="38" width="12" height="16" rx="2" fill={P} /><path d="M46 14v10" strokeWidth="5" stroke={A} /><circle cx="35" cy="46" r="1.2" fill="currentColor" /></>),
  // ---------- Thinker ----------
  II1: I(<><path d="M26 8h12M28 8v16L14 50a4 4 0 0 0 3.6 6h28.8A4 4 0 0 0 50 50L36 24V8" fill={P} /><path d="M20 40h24l6 11a3 3 0 0 1-2.6 4.5H16.6A3 3 0 0 1 14 51z" fill={M} stroke="none" /><circle cx="32" cy="38" r="2.5" fill={A} stroke="none" /><circle cx="38" cy="45" r="2" fill={A} stroke="none" /><circle cx="27" cy="46" r="1.6" fill={A} stroke="none" /></>),
  II2: I(<><circle cx="26" cy="28" r="11" fill={M} /><circle cx="26" cy="28" r="11" /><path d="M26 13v-4M26 47v-4M11 28H7M45 28h-4M15 17l-3-3M37 39l3 3M37 17l3-3M15 39l-3 3" /><circle cx="26" cy="28" r="4" fill={A} stroke="none" /><circle cx="46" cy="44" r="9" fill={P} /><path d="M52 50l8 8" strokeWidth="4" /></>),
  II3: I(<><path d="M10 22h12a6 6 0 1 1 12 0h12v12a6 6 0 1 0 0 12v10H34a6 6 0 1 0-12 0H10V46a6 6 0 1 0 0-12z" fill={M} /><path d="M10 22h12a6 6 0 1 1 12 0h12v12a6 6 0 1 0 0 12v10H34a6 6 0 1 0-12 0H10V46a6 6 0 1 0 0-12z" /><circle cx="28" cy="16" r="2" fill={A} stroke="none" /></>),
  II4: I(<><path d="M24 12c-8 0-12 6-10 12-5 3-5 11 0 14-1 8 7 13 14 10 7 3 15-2 14-10 5-3 5-11 0-14 2-6-2-12-10-12-3-3-7-3-8 0z" fill={M} /><path d="M24 12c-8 0-12 6-10 12-5 3-5 11 0 14-1 8 7 13 14 10 7 3 15-2 14-10 5-3 5-11 0-14 2-6-2-12-10-12-3-3-7-3-8 0z" /><path d="M32 14v38M22 26c4 0 6 2 10 2M42 36c-4 0-6 2-10 2" stroke={A} /></>),
  II5: I(<><rect x="8" y="10" width="48" height="40" rx="4" fill={P} /><path d="M14 40l10-12 8 6 12-16" stroke={A} strokeWidth="3" /><circle cx="24" cy="28" r="3" fill={P} /><circle cx="32" cy="34" r="3" fill={P} /><circle cx="44" cy="18" r="3" fill={P} /><path d="M14 56h36" /><path d="M20 50v6M32 50v6M44 50v6" /></>),
  II6: I(<><circle cx="28" cy="28" r="17" fill={M} /><circle cx="28" cy="28" r="17" /><path d="M40 40l16 16" strokeWidth="5" /><path d="M22 23a6 6 0 1 1 8 5.5c-2 1-2 2.5-2 4" stroke={A} strokeWidth="3" /><circle cx="28" cy="38" r="1.8" fill={A} stroke="none" /></>),
  // ---------- Creator ----------
  IA1: I(<><rect x="10" y="8" width="34" height="46" rx="4" fill={M} /><rect x="10" y="8" width="34" height="46" rx="4" /><path d="M16 8v46" /><path d="M24 20h14M24 28h14" /><path d="M44 30l12-12 4 4-12 12-6 2z" fill={P} /><circle cx="34" cy="42" r="3" fill={A} stroke="none" /><path d="M37 42V34l7 2" stroke={A} strokeWidth="2.4" /></>),
  IA2: I(<><path d="M22 10l-14 8 6 10 6-3v28h24V25l6 3 6-10-14-8c-2 5-6 7-10 7s-8-2-10-7z" fill={M} /><path d="M22 10l-14 8 6 10 6-3v28h24V25l6 3 6-10-14-8c-2 5-6 7-10 7s-8-2-10-7z" /><path d="M32 33l3 6h-6z" fill={A} stroke="none" /></>),
  IA3: I(<><path d="M8 14c0 14 4 26 14 30 6-2 8-8 8-14V14c-8 3-14 3-22 0z" fill={M} /><path d="M8 14c0 14 4 26 14 30 6-2 8-8 8-14V14c-8 3-14 3-22 0z" /><path d="M14 26h2M24 26h2" /><path d="M14 33c2 3 8 3 10 0" /><path d="M34 22c0 14 4 26 14 30 6-2 8-8 8-14V22c-8 3-14 3-22 0z" fill={P} /><path d="M34 22c0 14 4 26 14 30 6-2 8-8 8-14V22c-8 3-14 3-22 0z" /><path d="M40 34h2M50 34h2" /><path d="M40 44c2-3 8-3 10 0" stroke={A} strokeWidth="3" /></>),
  IA4: I(<><path d="M32 8C16 8 6 20 6 32c0 10 8 16 16 16 6 0 5-6 9-6h8c8 0 17-4 17-14C56 18 46 8 32 8z" fill={M} /><path d="M32 8C16 8 6 20 6 32c0 10 8 16 16 16 6 0 5-6 9-6h8c8 0 17-4 17-14C56 18 46 8 32 8z" /><circle cx="18" cy="30" r="3.5" fill={A} stroke="none" /><circle cx="26" cy="20" r="3.5" fill={P} /><circle cx="39" cy="19" r="3.5" fill={A} stroke="none" /><circle cx="47" cy="29" r="3.5" fill={P} /></>),
  IA5: I(<><rect x="8" y="26" width="48" height="28" rx="3" fill={M} /><rect x="8" y="26" width="48" height="28" rx="3" /><path d="M8 26l6-14 8 4-6 14M22 16l8 4-6 10M34 20l8 4-6 6" fill={P} /><path d="M28 36l12 7-12 7z" fill={A} stroke="none" /></>),
  IA6: I(<><path d="M32 8a17 17 0 0 0-9 31c2 2 3 4 3 7h12c0-3 1-5 3-7A17 17 0 0 0 32 8z" fill={M} /><path d="M32 8a17 17 0 0 0-9 31c2 2 3 4 3 7h12c0-3 1-5 3-7A17 17 0 0 0 32 8z" /><path d="M26 52h12M28 57h8" /><path d="M26 26l6 6 6-6" stroke={A} strokeWidth="3" /><path d="M32 32v8" stroke={A} strokeWidth="3" /></>),
  // ---------- Helper ----------
  IS1: I(<><circle cx="20" cy="18" r="7" fill={M} /><circle cx="20" cy="18" r="7" /><path d="M8 50c0-9 5-14 12-14s12 5 12 14" fill={M} /><path d="M8 50c0-9 5-14 12-14s12 5 12 14" /><circle cx="46" cy="28" r="5" fill={P} /><path d="M38 52c0-7 3-11 8-11s8 4 8 11" fill={P} /><rect x="30" y="42" width="16" height="12" rx="2" fill={A} stroke="none" /><path d="M38 42v12" stroke={P} /></>),
  IS2: I(<><path d="M8 12h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H22l-8 7v-7H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" fill={M} /><path d="M8 12h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H22l-8 7v-7H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" /><path d="M46 28h10a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-2v7l-8-7H38" fill={P} /><path d="M23 29c-5-4-8-6-8-9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3-3 5-8 9z" fill={A} stroke="none" /></>),
  IS3: I(<><rect x="8" y="16" width="48" height="34" rx="6" fill={M} /><rect x="8" y="16" width="48" height="34" rx="6" /><path d="M24 16v-4a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4" /><path d="M32 25v16M24 33h16" stroke={A} strokeWidth="5" /></>),
  IS4: I(<><rect x="10" y="28" width="44" height="28" rx="4" fill={M} /><rect x="10" y="28" width="44" height="28" rx="4" /><path d="M22 28v-5h20v5" /><path d="M26 36h12" /><path d="M32 22c-6-5-9-7-9-11a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4-3 6-9 11z" fill={A} stroke="none" transform="translate(0 -2)" /></>),
  IS5: I(<><rect x="6" y="8" width="52" height="32" rx="3" fill={M} /><rect x="6" y="8" width="52" height="32" rx="3" /><path d="M14 18h22M14 25h16" stroke={A} strokeWidth="3" /><path d="M44 16l8 20" /><path d="M20 40v14M44 40v14M12 54h16M36 54h16" /><circle cx="50" cy="46" r="0" /></>),
  IS6: I(<><circle cx="26" cy="38" r="15" fill={M} /><circle cx="26" cy="38" r="15" /><rect x="38" y="28" width="20" height="9" rx="2" fill={P} /><circle cx="26" cy="38" r="4.5" fill={P} /><path d="M26 17v-8M13 22l-5-5M39 22l5-5" stroke={A} strokeWidth="3" /></>),
  // ---------- Leader ----------
  IE1: I(<><path d="M8 20h48l-4-10H12z" fill={A} stroke="none" /><path d="M8 20h48l-4-10H12zM8 20c0 5 5 6 8 6s8-1 8-6c0 5 5 6 8 6s8-1 8-6c0 5 5 6 8 6s8-1 8-6" fill={M} /><path d="M12 26v28h40V26" fill={P} /><rect x="24" y="36" width="16" height="18" rx="2" fill={M} /><rect x="24" y="36" width="16" height="18" rx="2" /></>),
  IE2: I(<><path d="M10 26v12l8 2 20 10V16L18 24z" fill={M} /><path d="M10 26v12l8 2 20 10V16L18 24z" /><path d="M14 40l3 12h7l-3-12" fill={P} /><path d="M44 24c4 2 4 14 0 16" stroke={A} strokeWidth="3" /><path d="M50 18c8 5 8 23 0 28" stroke={A} strokeWidth="3" /></>),
  IE3: I(<><path d="M20 10h24v14c0 7-5 12-12 12s-12-5-12-12z" fill={M} /><path d="M20 10h24v14c0 7-5 12-12 12s-12-5-12-12z" /><path d="M20 14h-8c0 8 3 12 9 13M44 14h8c0 8-3 12-9 13" /><path d="M32 36v10M22 54h20M26 46h12v8H26z" fill={P} /><path d="M32 16l2 4 4 .6-3 3 .7 4-3.7-2-3.7 2 .7-4-3-3 4-.6z" fill={A} stroke="none" /></>),
  IE4: I(<><path d="M8 32L32 8h20a4 4 0 0 1 4 4v20L32 56z" fill={M} /><path d="M8 32L32 8h20a4 4 0 0 1 4 4v20L32 56z" /><circle cx="46" cy="18" r="3.5" fill={P} /><text x="31" y="42" textAnchor="middle" fontSize="17" fontWeight="800" fill={A} stroke="none" transform="rotate(-45 31 36)">R</text></>),
  IE5: I(<><rect x="10" y="26" width="44" height="28" rx="4" fill={M} /><rect x="10" y="26" width="44" height="28" rx="4" /><path d="M24 26h16" strokeWidth="4" /><path d="M20 12h24v14H20z" fill={P} /><path d="M26 18l4 4 8-8" stroke={A} strokeWidth="3.4" /><path d="M20 40h24" /></>),
  IE6: I(<><circle cx="32" cy="32" r="22" fill={M} /><circle cx="32" cy="32" r="22" /><path d="M18 26h26M38 20l6 6-6 6" stroke={A} strokeWidth="3.2" /><path d="M46 38H20M26 32l-6 6 6 6" stroke={A} strokeWidth="3.2" /></>),
  // ---------- Organiser ----------
  IC1: I(<><path d="M8 18a4 4 0 0 1 4-4h38v8" /><rect x="8" y="18" width="48" height="34" rx="5" fill={M} /><rect x="8" y="18" width="48" height="34" rx="5" /><path d="M56 30H44a5 5 0 0 0 0 10h12" fill={P} /><circle cx="45" cy="35" r="1.8" fill={A} stroke="none" /></>),
  IC2: I(<><path d="M6 20a3 3 0 0 1 3-3h14l5 6h27a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill={M} /><path d="M6 20a3 3 0 0 1 3-3h14l5 6h27a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" /><path d="M16 34h32M16 42h20" stroke={A} strokeWidth="3" /></>),
  IC3: I(<><path d="M14 8h26l10 10v38H14z" fill={P} /><path d="M14 8h26l10 10v38H14zM40 8v10h10" /><path d="M22 28h18M22 36h12" /><circle cx="44" cy="46" r="11" fill={M} /><circle cx="44" cy="46" r="11" /><path d="M39 46l4 4 7-8" stroke={A} strokeWidth="3.2" /></>),
  IC4: I(<><rect x="8" y="10" width="48" height="44" rx="4" fill={P} /><rect x="8" y="10" width="48" height="12" rx="4" fill={M} /><rect x="8" y="10" width="48" height="44" rx="4" /><path d="M8 22h48M8 34h48M8 44h48M24 10v44M40 10v44" /><rect x="25" y="35" width="14" height="9" fill={A} stroke="none" /></>),
  IC5: I(<><rect x="22" y="6" width="20" height="12" rx="3" fill={M} /><rect x="22" y="6" width="20" height="12" rx="3" /><path d="M32 18v6" /><path d="M32 24l12 10-12 10-12-10z" fill={P} /><path d="M32 44v6" /><rect x="22" y="50" width="20" height="10" rx="3" fill={A} stroke="none" /><path d="M44 34h10v-8" /></>),
  IC6: I(<><rect x="8" y="12" width="48" height="44" rx="5" fill={P} /><path d="M8 24h48" /><path d="M8 17a5 5 0 0 1 5-5h38a5 5 0 0 1 5 5v7H8z" fill={M} /><rect x="8" y="12" width="48" height="44" rx="5" /><path d="M20 6v10M44 6v10" /><path d="M16 34l3 3 5-6M16 46l3 3 5-6" stroke={A} strokeWidth="2.8" /><path d="M30 34h18M30 46h12" /></>),
  // ---------- Values ----------
  V_SD: I(<><path d="M32 56V30" /><path d="M32 30L16 18M32 30l16-12" /><path d="M16 18l-2 8M16 18l8 1M48 18l2 8M48 18l-8 1" stroke={A} strokeWidth="3.2" /><circle cx="32" cy="56" r="3.5" fill={A} stroke="none" /><circle cx="32" cy="30" r="3.5" fill={M} /></>),
  V_ST: I(<><path d="M34 6L14 34h14l-4 24 26-32H36z" fill={M} /><path d="M34 6L14 34h14l-4 24 26-32H36z" /><path d="M48 10l2 4M54 20l-4 2" stroke={A} strokeWidth="3" /></>),
  V_HE: I(<><circle cx="32" cy="32" r="12" fill={M} /><circle cx="32" cy="32" r="12" /><path d="M26 31h.01M38 31h.01" strokeWidth="3.4" /><path d="M26 36c3 4 9 4 12 0" stroke={A} strokeWidth="2.8" /><path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4" /></>),
  V_AC: I(<><path d="M6 56l20-34 10 16 6-8 16 26z" fill={M} /><path d="M6 56l20-34 10 16 6-8 16 26z" /><path d="M26 22V8" /><path d="M26 8h14l-4 5 4 5H26z" fill={A} stroke="none" /></>),
  V_PO: I(<><path d="M8 46V20l12 12 12-18 12 18 12-12v26z" fill={M} /><path d="M8 46V20l12 12 12-18 12 18 12-12v26zM8 54h48" /><circle cx="8" cy="18" r="3" fill={A} stroke="none" /><circle cx="32" cy="12" r="3" fill={A} stroke="none" /><circle cx="56" cy="18" r="3" fill={A} stroke="none" /></>),
  V_SE: I(<><path d="M8 30L32 10l24 20" /><path d="M14 27v27h36V27" fill={M} /><path d="M14 27v27h36V27" /><path d="M32 33l9 3.5v6c0 5-4 8-9 10-5-2-9-5-9-10v-6z" fill={P} /><path d="M28 43l3 3 5-6" stroke={A} strokeWidth="2.8" /></>),
  V_CO: I(<><circle cx="14" cy="26" r="6" fill={M} /><circle cx="32" cy="26" r="6" fill={M} /><circle cx="50" cy="26" r="6" fill={M} /><circle cx="14" cy="26" r="6" /><circle cx="32" cy="26" r="6" /><circle cx="50" cy="26" r="6" /><path d="M5 52c0-8 4-12 9-12s9 4 9 12M23 52c0-8 4-12 9-12s9 4 9 12M41 52c0-8 4-12 9-12s9 4 9 12" fill={M} /><path d="M5 52c0-8 4-12 9-12s9 4 9 12M23 52c0-8 4-12 9-12s9 4 9 12M41 52c0-8 4-12 9-12s9 4 9 12" /><path d="M32 8v6" stroke={A} strokeWidth="3" /></>),
  V_TR: I(<><path d="M32 56V30M32 56c-6 0-10 2-14 4M32 56c6 0 10 2 14 4" /><circle cx="32" cy="22" r="14" fill={M} /><circle cx="32" cy="22" r="14" /><path d="M32 30c0-6 3-10 8-12M32 36c0-4-3-8-8-9" stroke={A} strokeWidth="3" /></>),
  V_BE: I(<><path d="M32 54C14 42 8 32 8 22a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 10-6 20-24 32z" fill={M} /><path d="M32 54C14 42 8 32 8 22a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 10-6 20-24 32z" /><path d="M24 31c2 6 14 6 16 0" stroke={A} strokeWidth="3" /><circle cx="26" cy="24" r="1.6" fill="currentColor" stroke="none" /><circle cx="38" cy="24" r="1.6" fill="currentColor" stroke="none" /></>),
  V_UN: I(<><circle cx="32" cy="32" r="22" fill={M} /><circle cx="32" cy="32" r="22" /><path d="M10 32h44M32 10c-9 7-9 37 0 44M32 10c9 7 9 37 0 44" /><path d="M20 20c4 2 8 1 10 4M38 40c4-2 8-1 10 2" stroke={A} strokeWidth="3" /></>),
  // ---------- Study situation ----------
  CX1: I(<><path d="M10 54h44" /><path d="M16 54V44h32v10" /><rect x="22" y="36" width="20" height="8" rx="2" fill={M} /><rect x="22" y="36" width="20" height="8" rx="2" /><path d="M44 42V18l-8-4" /><path d="M36 14l-8 8h16z" fill={A} stroke="none" transform="rotate(-8 38 18)" /></>),
  CX2: I(<><path d="M8 26c13-12 35-12 48 0" /><path d="M16 34c9-8 23-8 32 0" /><path d="M24 42c5-4 11-4 16 0" stroke={A} strokeWidth="3" /><circle cx="32" cy="52" r="3.5" fill={A} stroke="none" /></>),
  CX3: I(<><circle cx="20" cy="18" r="7" fill={M} /><circle cx="20" cy="18" r="7" /><path d="M8 52c0-9 5-14 12-14s12 5 12 14" fill={M} /><path d="M8 52c0-9 5-14 12-14s12 5 12 14" /><circle cx="44" cy="30" r="5" fill={P} /><path d="M36 54c0-7 3-11 8-11s8 4 8 11" fill={P} /><circle cx="54" cy="40" r="3.5" fill={A} stroke="none" /><path d="M48 54c0-4 2-6 6-6" /></>),
  // ---------- Section emblems ----------
  interests: I(<><circle cx="32" cy="32" r="22" fill={M} /><circle cx="32" cy="32" r="22" /><path d="M32 12v4M32 48v4M12 32h4M48 32h4" /><path d="M40 24l-6 14-10 2 6-14z" fill={A} stroke="none" /><path d="M40 24l-6 14-10 2 6-14z" /></>),
  personality: I(<><circle cx="32" cy="22" r="10" fill={M} /><circle cx="32" cy="22" r="10" /><path d="M12 56c0-12 8-18 20-18s20 6 20 18" fill={M} /><path d="M12 56c0-12 8-18 20-18s20 6 20 18" /><path d="M28 22h.01M36 22h.01" strokeWidth="3.4" /><path d="M28 27c2 2 6 2 8 0" stroke={A} strokeWidth="2.6" /></>),
  values: I(<><path d="M32 6l20 18-20 34L12 24z" fill={M} /><path d="M32 6l20 18-20 34L12 24zM12 24h40M24 24l8 34 8-34M24 24l8-18 8 18" /><circle cx="32" cy="24" r="3.5" fill={A} stroke="none" /></>),
  motivation: I(<><rect x="8" y="22" width="44" height="22" rx="5" fill={M} /><rect x="8" y="22" width="44" height="22" rx="5" /><path d="M52 29h4v8h-4" /><rect x="13" y="27" width="10" height="12" rx="2" fill={A} stroke="none" /><rect x="26" y="27" width="10" height="12" rx="2" fill={A} stroke="none" /><path d="M40 33h6" /></>),
  mindset: I(<><path d="M20 30c-6-1-9-6-7-11 2-6 9-8 14-5 4-5 14-3 15 4 6 1 8 8 4 12-2 3-6 4-9 3" fill={M} /><path d="M20 30c-6-1-9-6-7-11 2-6 9-8 14-5 4-5 14-3 15 4 6 1 8 8 4 12-2 3-6 4-9 3" /><path d="M32 56V38" /><path d="M32 46c-8 0-11-5-11-10 7 0 11 4 11 10z" fill={A} stroke="none" /><path d="M32 42c0-6 4-9 10-9 0 6-4 9-10 9z" fill={A} stroke="none" /></>),
  identity: I(<><rect x="14" y="8" width="36" height="46" rx="18" fill={M} /><rect x="14" y="8" width="36" height="46" rx="18" /><circle cx="32" cy="26" r="6" fill={P} /><path d="M20 44c2-7 7-10 12-10s10 3 12 10" stroke={A} strokeWidth="3" /><path d="M24 58h16" /></>),
  direction: I(<><path d="M32 58V14" /><path d="M32 14h18l6 6-6 6H32z" fill={A} stroke="none" /><path d="M32 14h18l6 6-6 6H32z" /><path d="M32 30H14l-6 6 6 6h18z" fill={M} /><path d="M32 30H14l-6 6 6 6h18z" /><path d="M22 58h20" /></>),
  study: I(<><path d="M6 14c8-3 18-2 26 4 8-6 18-7 26-4v36c-8-3-18-2-26 4-8-6-18-7-26-4z" fill={M} /><path d="M6 14c8-3 18-2 26 4 8-6 18-7 26-4v36c-8-3-18-2-26 4-8-6-18-7-26-4zM32 18v36" /><path d="M14 24c4-1 9 0 12 2M14 32c4-1 9 0 12 2" /><path d="M46 8l8 8-12 12-8 2 2-8z" fill={A} stroke="none" /></>),
  maths: I(<><rect x="14" y="6" width="36" height="52" rx="6" fill={M} /><rect x="14" y="6" width="36" height="52" rx="6" /><rect x="20" y="12" width="24" height="12" rx="2" fill={P} /><path d="M24 18h8" stroke={A} strokeWidth="3" /><path d="M22 33h.01M32 33h.01M42 33h.01M22 42h.01M32 42h.01M22 51h.01M32 51h.01" strokeWidth="4" /><path d="M42 40v12" stroke={A} strokeWidth="5" /></>),
  context: I(<><path d="M6 30L32 8l26 22" /><path d="M12 28v28h40V28" fill={M} /><path d="M12 28v28h40V28" /><rect x="26" y="38" width="12" height="18" rx="2" fill={P} /><circle cx="35" cy="48" r="1.2" fill="currentColor" /><rect x="40" y="12" width="6" height="12" fill={A} stroke="none" /></>),
};

ART.CODE = (<><rect x="6" y="12" width="52" height="40" rx="5" fill="var(--sec-mid)" /><rect x="6" y="12" width="52" height="40" rx="5" /><path d="M6 22h52" /><path d="M24 30l-7 6 7 6M40 30l7 6-7 6" stroke="var(--sec)" strokeWidth="3.2" /><path d="M35 28l-6 16" /></>);
ART.HEALTH = ART.IS3!; ART.EVIDENCE = ART.II6!; ART.BUSINESS = ART.IE1!; ART.FIELD = ART.IR3!; ART.DESIGN = ART.IA4!;
ART.PO = ART.IA6!; ART.PC = ART.IC6!; ART.PE = ART.IS2!; ART.PA = ART.V_BE!;
ART.PN = (<><path d="M18 36a10 10 0 0 1 2-19 14 14 0 0 1 26 3 9 9 0 0 1 0 16z" fill="var(--sec-mid)" /><path d="M18 36a10 10 0 0 1 2-19 14 14 0 0 1 26 3 9 9 0 0 1 0 16z" /><path d="M22 44l-3 8M32 44l-3 8M42 44l-3 8" stroke="var(--sec)" strokeWidth="3" /></>);
ART.shield = (<><path d="M32 6l20 8v16c0 14-9 24-20 28C21 54 12 44 12 30V14z" fill="var(--sec-mid)" /><path d="M32 6l20 8v16c0 14-9 24-20 28C21 54 12 44 12 30V14z" /><path d="M22 31l7 7 13-14" stroke="var(--sec)" strokeWidth="4" /></>);
ART.guide = (<><path d="M10 12h36a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H26l-10 9v-9h-6a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill="var(--sec-mid)" /><path d="M10 12h36a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H26l-10 9v-9h-6a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" /><path d="M20 27h.01M32 27h.01M44 27h.01" strokeWidth="4.2" /><path d="M54 6v8M50 10h8" stroke="var(--sec)" strokeWidth="3" /></>);
ART.pause = (<><circle cx="32" cy="32" r="24" fill="var(--sec-mid)" /><circle cx="32" cy="32" r="24" /><path d="M25 22v20M39 22v20" stroke="var(--sec)" strokeWidth="6" /></>);
ART.layers = (<><path d="M6 16h52v10H6z" fill="var(--sec-mid)" /><path d="M10 28h44v10H10z" fill="var(--sec-mid)" opacity=".7" /><path d="M16 40h32v10H16z" fill="var(--sec)" stroke="none" /><path d="M6 16h52v10H6zM10 28h44v10H10zM16 40h32v10H16z" /><path d="M32 54v6" /></>);
ART.report = (<><path d="M14 6h28l10 10v42H14z" fill="var(--surface)" /><path d="M14 6h28l10 10v42H14zM42 6v10h10" /><path d="M22 28h24M22 36h24M22 44h14" /><path d="M32 18l2 4 4 .6-3 3 .7 4-3.7-2-3.7 2 .7-4-3-3 4-.6z" fill="var(--sec)" stroke="none" transform="translate(-6 -2)" /></>);
ART.science = ART.II1!;
ART.reading = ART.study!;

/** One drawing, by id (an item id like "IR3", a value card "V_SD", or a section emblem). Returns null if there's none. */
export function Art({ id, className = "h-16 w-16", title }: { id: string; className?: string; title?: string }) {
  const art = ART[id];
  if (!art) return null;
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {art}
    </svg>
  );
}
/** The picture for a questionnaire item: its own drawing, else its trait or section emblem. */
export function artFor(itemId: string, sectionId: string): string | undefined {
  if (itemId in ART) return itemId;
  if (/^AC\d/.test(itemId)) return undefined;
  const trait = itemId.match(/^P[OCEAN]/)?.[0];
  if (trait && trait in ART) return trait;
  return sectionId in ART ? sectionId : undefined;
}
export const hasArt = (id: string) => id in ART;
export const ART_IDS = Object.keys(ART);
