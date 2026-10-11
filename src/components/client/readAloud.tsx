"use client";
/**
 * Read-aloud for questions, using the phone's own voice (Web Speech API). Nothing is sent anywhere:
 * we only offer it when an English voice that runs ON THE DEVICE exists, because some desktop browsers
 * route "online" voices through a cloud service and these are minors' answers. One voice at a time;
 * pressing Listen on another question stops the first. The server only learns that it was used
 * (a count, never the text), so a reviewer can see it.
 */
import { useEffect, useSyncExternalStore } from "react";
import { learn } from "./api";

export type ReadWhere = "questions" | "values" | "checks" | "tasters" | "guide" | "intro";

// ---------- what the voice should say ----------
const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const UNITS: Record<string, string> = { km: "kilometres", cm: "centimetres", kg: "kilograms", m: "metres", g: "grams", s: "seconds", min: "minutes", litres: "litres", litre: "litre" };

/** Turn on-screen text (maths symbols, Rand, units, SA decimal commas) into words a voice reads correctly. */
export function speakable(raw: string): string {
  let t = raw;
  t = t.replace(/\bg\/cm³/g, " grams per cubic centimetre").replace(/\bcm³/g, " cubic centimetres").replace(/\bm\/s\b/g, " metres per second").replace(/\bkm\/h\b/g, " kilometres per hour");
  t = t.replace(/(\w|\))([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, base: string, sup: string) => {
    const n = [...sup].map((c) => SUP[c]).join("");
    return `${base} ${n === "2" ? "squared" : n === "3" ? "cubed" : `to the power of ${n}`}`;
  });
  t = t.replace(/°C/g, " degrees Celsius").replace(/°/g, " degrees").replace(/(\d)\s?%/g, "$1 percent");
  t = t.replace(/\bR\s?(\d[\d ]*)(?:,(\d+))?/g, (_m, whole: string, dec?: string) => `${whole.replace(/(\d) (?=\d{3}\b)/g, "$1")}${dec ? ` point ${dec}` : ""} rand`);
  t = t.replace(/(\d) (\d{3})\b/g, "$1$2").replace(/(\d),(\d)/g, "$1 point $2");
  t = t.replace(/(\d)\s?(km|cm|kg|min|m|g|s)\b/g, (_m, d: string, u: string) => `${d} ${UNITS[u] ?? u}`);
  t = t.replace(/−/g, " minus ").replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/√/g, " square root of ").replace(/≥/g, " is greater than or equal to ").replace(/≤/g, " is less than or equal to ");
  t = t.replace(/→/g, " gives ").replace(/\s=\s/g, " equals ").replace(/\s\+\s/g, " plus ").replace(/·/g, ", ");
  t = t.replace(/\bAI\b/g, "A I").replace(/\bLO\b/g, "L O").replace(/\be\.g\./g, "for example").replace(/\n+/g, ". ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s{2,}/g, " ");
  return t.trim();
}

/** Sentence-sized chunks: long utterances get cut off by some browsers. */
function chunks(parts: string[]): string[] {
  const out: string[] = [];
  for (const p of parts) for (const s of speakable(p).split(/(?<=[.?!:])\s+/)) if (s.trim()) out.push(s.trim().slice(0, 220));
  return out;
}

// ---------- a tiny shared store: one voice for the whole app ----------
interface Snap { supported: boolean; speakingKey: string | null; slow: boolean }
let snap: Snap = { supported: false, speakingKey: null, slow: false };
let voice: SpeechSynthesisVoice | null = null;
const subs = new Set<() => void>();
const emit = (next: Partial<Snap>) => { snap = { ...snap, ...next }; subs.forEach((f) => f()); };
const SERVER: Snap = { supported: false, speakingKey: null, slow: false };

function pickVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
  const rank = (v: SpeechSynthesisVoice) => (/^en[-_]ZA/i.test(v.lang) ? 0 : /^en[-_](GB|AU|NZ|IE)/i.test(v.lang) ? 1 : /^en[-_]US/i.test(v.lang) ? 2 : 3);
  return all.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

let started = false;
function init() {
  if (started || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  started = true;
  let slow = false;
  try { slow = localStorage.getItem("read-slow") === "1"; } catch { /* storage blocked */ }
  const refresh = () => { voice = pickVoice(); emit({ supported: !!voice, slow }); };
  refresh();
  window.speechSynthesis.addEventListener("voiceschanged", refresh);
  window.addEventListener("pagehide", () => window.speechSynthesis.cancel());
}

export function stopReading() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  emit({ speakingKey: null });
}

const reported = new Set<string>();
function report(where: ReadWhere, key: string) {
  const id = `${where}:${key}`;
  if (reported.has(id)) return;
  reported.add(id);
  void learn("read_aloud", { where }).catch(() => { /* usage count only: never block reading on it */ });
}

export function startReading(key: string, where: ReadWhere, parts: string[]) {
  if (!snap.supported || !voice) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const queue = chunks(parts);
  if (!queue.length) return;
  emit({ speakingKey: key });
  report(where, key);
  queue.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice; u.lang = voice!.lang; u.rate = snap.slow ? 0.75 : 0.95; u.pitch = 1;
    if (i === queue.length - 1) { u.onend = () => { if (snap.speakingKey === key) emit({ speakingKey: null }); }; }
    u.onerror = () => { if (snap.speakingKey === key) emit({ speakingKey: null }); };
    synth.speak(u);
  });
}

export function setSlow(slow: boolean) {
  try { localStorage.setItem("read-slow", slow ? "1" : "0"); } catch { /* storage blocked */ }
  emit({ slow });
}

function useSpeech(): Snap {
  useEffect(() => { init(); }, []);
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => snap, () => SERVER);
}

export const isReading = (key: string) => snap.speakingKey === key;

/** True while this key is being read: lets a card show it's the one speaking. */
export function useIsReading(key: string): boolean {
  return useSpeech().speakingKey === key;
}

/** "Listen" button with a Slower toggle. Renders nothing if the device has no on-device English voice. */
export function ListenButton({ id, where, parts, className = "" }: { id: string; where: ReadWhere; parts: string[]; className?: string }) {
  const s = useSpeech();
  const reading = s.speakingKey === id;
  useEffect(() => () => { if (isReading(id)) stopReading(); }, [id]);
  if (!s.supported) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button type="button" onClick={() => (reading ? stopReading() : startReading(id, where, parts))} aria-pressed={reading}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[0.95rem] font-bold transition-colors"
        style={{ borderColor: "var(--sec-line, var(--line))", background: reading ? "var(--sec, var(--accent))" : "var(--sec-soft, var(--tint))", color: reading ? "var(--surface)" : "var(--sec-ink, var(--accent-ink))" }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {reading ? <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" /> : <><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>}
        </svg>
        {reading ? "Stop" : "Listen"}
      </button>
      <button type="button" onClick={() => setSlow(!s.slow)} aria-pressed={s.slow}
        className="inline-flex min-h-11 items-center rounded-full border-2 px-3.5 text-sm font-semibold transition-colors"
        style={{ borderColor: s.slow ? "var(--sec, var(--accent))" : "var(--line)", background: s.slow ? "var(--sec-soft, var(--tint))" : "transparent", color: s.slow ? "var(--sec-ink, var(--accent-ink))" : "var(--muted)" }}>
        Slower
      </button>
      <span className="sr-only" role="status" aria-live="polite">{reading ? "Reading aloud" : ""}</span>
    </div>
  );
}
