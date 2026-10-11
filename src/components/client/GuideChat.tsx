"use client";
import Link from "next/link";
import { Mark } from "@/components/ui/Brand";
import { useEffect, useRef, useState } from "react";

interface Msg { id: number | string; role: "learner" | "guide"; text: string }
interface Initial { messages: Msg[]; awaitingReply: boolean; status: "active" | "complete" | "stopped" }
interface Outcome { complete: boolean; safetyStop: boolean }

const CONTROL = "\u001e";

// Minimal typing for the Web Speech API (not in TS's DOM lib everywhere).
type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const speechCtor = (): (new () => SpeechRec) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export function GuideChat({ initial }: { initial: Initial }) {
  const [messages, setMessages] = useState<Msg[]>(initial.messages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsRetry, setNeedsRetry] = useState(initial.awaitingReply);
  const [state, setState] = useState<Initial["status"]>(initial.status);
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Effect bodies are blocks on purpose: an effect must return nothing or a cleanup function, and a
  // browser extension that wraps scrollIntoView could otherwise hand React a non-function to "clean up".
  useEffect(() => { setCanSpeak(!!speechCtor()); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  async function send(text: string | null) {
    setBusy(true); setError(null); setNeedsRetry(false);
    const guideId = `g-${Date.now()}`;
    if (text !== null) setMessages((m) => [...m, { id: `l-${Date.now()}`, role: "learner", text }]);
    try {
      const res = await fetch("/api/guide/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "The Guide couldn't reply. Your message is saved. Try again in a minute.");
      }
      setMessages((m) => [...m, { id: guideId, role: "guide", text: "" }]);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let all = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        all += dec.decode(value, { stream: true });
        const shown = all.split(CONTROL)[0]!;
        setMessages((m) => m.map((x) => (x.id === guideId ? { ...x, text: shown } : x)));
      }
      const ctl = all.split(CONTROL)[1];
      const outcome: Outcome | null = ctl ? JSON.parse(ctl) : null;
      if (!outcome) throw new Error("The reply got cut off. Tap Try again.");
      if (outcome.safetyStop) setState("stopped");
      else if (outcome.complete) setState("complete");
    } catch (e) {
      setError((e as Error).message);
      setNeedsRetry(true);
      setMessages((m) => m.filter((x) => !(x.id === guideId && !x.text)));
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Ctor();
    rec.lang = "en-ZA";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const said = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ").trim();
      if (said) setDraft((d) => (d ? `${d} ${said}` : said));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  const lastIsLearner = messages.at(-1)?.role === "learner";
  return (
    <section className="flex min-h-[70dvh] flex-col gap-4" aria-label="Conversation with The Guide">
      <p className="mx-auto chip text-muted"><Mark className="h-4 w-4" /> You&apos;re chatting with The Guide, an AI</p>
      <ol className="flex flex-1 flex-col gap-4" aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className={m.role === "guide" ? "flex max-w-[94%] items-end gap-2 self-start" : "max-w-[85%] self-end"}>
            {m.role === "guide" && <Mark className="mb-1 h-7 w-7 shrink-0" />}
            <div className={`whitespace-pre-wrap px-4 py-3 text-lg leading-relaxed ${m.role === "guide"
              ? "rounded-2xl rounded-bl-md border border-line bg-surface"
              : "rounded-2xl rounded-br-md bg-accent text-on-accent"}`}>
              {m.text || <span className="inline-flex gap-1" aria-label="The Guide is typing"><span className="h-2 w-2 animate-bounce rounded-full bg-muted" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:240ms]" /></span>}
            </div>
          </li>
        ))}
      </ol>
      <div ref={endRef} />

      {error && <p role="alert" className="text-danger">{error}</p>}

      {state === "stopped" ? (
        <Link href="/learn/paused" className="btn-primary no-underline">OK</Link>
      ) : state === "complete" ? (
        <Link href="/learn/report" className="btn-primary no-underline">Go to my report</Link>
      ) : needsRetry && lastIsLearner ? (
        <button className="btn-primary" disabled={busy} onClick={() => send(null)}>{busy ? "Trying…" : "Try again"}</button>
      ) : (
        <form className="sticky bottom-0 -mx-4 flex items-end gap-2 border-t-[1.5px] border-line bg-canvas/95 px-4 pb-3 pt-3 backdrop-blur" onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (t && !busy) { setDraft(""); void send(t); } }}>
          <label htmlFor="reply" className="sr-only">Your answer</label>
          <textarea id="reply" rows={2} value={draft} maxLength={4000} onChange={(e) => setDraft(e.target.value)} placeholder={busy ? "The Guide is replying…" : "Type your answer, or tap the mic"}
            className="field min-h-14 flex-1 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
          {canSpeak && (
            <button type="button" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? "Stop voice input" : "Speak your answer"}
              className={`btn min-w-13 px-3 ${listening ? "bg-danger text-surface" : "bg-surface"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            </button>
          )}
          <button className="btn-primary" disabled={busy || !draft.trim()}>Send</button>
        </form>
      )}
    </section>
  );
}
