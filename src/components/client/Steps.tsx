"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { learn } from "./api";

function useStep() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: string, body: unknown = {}) => {
    setBusy(true); setError(null);
    try {
      const r = await learn<{ next?: string }>(action, body);
      if (r.next) window.location.assign(r.next); else router.refresh();
    } catch (e) { setError((e as Error).message); setBusy(false); }
  };
  return { busy, error, run };
}
const ErrorLine = ({ error }: { error: string | null }) => (error ? <p role="alert" className="alert">{error}</p> : null);

// ---------- spec 09 §3.3 assent ----------
export function Assent({ firstName }: { firstName: string }) {
  const { busy, error, run } = useStep();
  const [question, setQuestion] = useState(false);
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Before you start</p>
        <h1 className="text-[2rem] sm:text-4xl">Hey {firstName}.</h1>
      </div>
      <ul className="space-y-3">
        {[
          <><strong>This isn&apos;t a test.</strong> There are no right or wrong answers, and nothing here is marked.</>,
          <><strong>You&apos;ll talk to an AI.</strong> The Guide is an AI. It asks one question at a time and it&apos;s built to listen.</>,
          <><strong>Your report is yours.</strong> Teachers and parents only see a summary if you choose to share it.</>,
          <><strong>One exception.</strong> If what you write makes us think you might be unsafe, an adult at school who can help will be told. We&apos;d rather tell someone than say nothing.</>,
          <><strong>You&apos;re in control.</strong> Pause or stop whenever you want. Everything saves as you go.</>,
        ].map((t, i) => (
          <li key={i} className="card flex gap-4 text-lg leading-snug"><span className="diamond" aria-hidden="true" /><span>{t}</span></li>
        ))}
      </ul>
      {question && (
        <div className="note space-y-2">
          <p>Ask your LO teacher before you start. You can come back to this screen any time with the same codes.</p>
          <p>Questions about your information can also go to privacy@theexcavation.co.za.</p>
        </div>
      )}
      <ErrorLine error={error} />
      <div className="grid gap-3">
        <button className="btn-primary" disabled={busy} onClick={() => run("assent", { choice: "agree" })}>I understand, let&apos;s start</button>
        <button className="btn-ghost" onClick={() => setQuestion(true)}>I have a question</button>
        <button className="btn-ghost" disabled={busy} onClick={() => run("assent", { choice: "not_today" })}>Not today</button>
      </div>
    </section>
  );
}

// ---------- intake (3 short questions) ----------
export const INTAKE_QUESTIONS = [
  { key: "world", label: "Tell us a bit about your world: where you stay, who's at home, what languages you speak.", hint: "Only share what you're comfortable with. Short is fine." },
  { key: "right_now", label: "What's on your mind about school or your future right now?" },
  { key: "why_here", label: "What brought you here today? Any reason is fine, including \"my teacher told me to\"." },
] as const;

export function Intake() {
  const { busy, error, run } = useStep();
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run("intake", Object.fromEntries(INTAKE_QUESTIONS.map((q) => [q.key, String(f.get(q.key) ?? "")]))); }}>
      <h1 className="text-[2rem] sm:text-4xl">Three quick questions about you.</h1>
      {INTAKE_QUESTIONS.map((q) => (
        <div key={q.key}>
          <label className="label text-base text-fg" htmlFor={q.key}>{q.label}</label>
          {"hint" in q && <p className="mb-2 text-sm text-muted">{q.hint}</p>}
          <textarea id={q.key} name={q.key} rows={3} maxLength={800} className="field" />
        </div>
      ))}
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={busy}>Next</button>
    </form>
  );
}

// ---------- G9 academic snapshot (spec 02 §5) ----------
export function Snapshot({ subjects, imported }: { subjects: string[]; imported: Record<string, number> | null }) {
  const { busy, error, run } = useStep();
  if (imported) {
    return (
      <section className="space-y-6">
        <h1 className="text-[2rem] sm:text-4xl">Your latest marks</h1>
        <p className="text-muted">Your school sent these. If one looks wrong, tell your LO teacher.</p>
        <ul className="card divide-y divide-line">
          {Object.entries(imported).map(([s, m]) => <li key={s} className="flex justify-between py-2"><span>{s}</span><span className="font-semibold">{m}%</span></li>)}
        </ul>
        <ErrorLine error={error} />
        <button className="btn-primary w-full" disabled={busy} onClick={() => run("snapshot", {})}>{busy ? "Putting your results together…" : "These are right, continue"}</button>
      </section>
    );
  }
  return (
    <form className="space-y-6" onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const marks: Record<string, number | null> = {};
      const estimates: string[] = [];
      for (const s of subjects) {
        const v = String(f.get(`m:${s}`) ?? "").trim();
        marks[s] = v === "" ? null : Math.max(0, Math.min(100, Number(v)));
        if (f.get(`e:${s}`)) estimates.push(s);
      }
      run("snapshot", { marks, estimates });
    }}>
      <h1 className="text-[2rem] sm:text-4xl">Your latest marks</h1>
      <p className="text-muted">Enter your latest term mark for each subject. Not sure? Give your best guess and tick &lsquo;estimate&rsquo;. Honest marks get you honest advice.</p>
      <div className="space-y-3">
        {subjects.map((s) => (
          <div key={s} className="grid grid-cols-[1fr_6rem] items-center gap-3">
            <label htmlFor={`m:${s}`}>{s}{s === "Life Orientation" ? <span className="block text-xs text-muted">optional</span> : null}</label>
            <input id={`m:${s}`} name={`m:${s}`} inputMode="numeric" pattern="[0-9]{1,3}" className="field text-right" placeholder="%" />
            <label className="col-start-2 -mt-1 flex items-center justify-end gap-2 text-xs text-muted"><input type="checkbox" name={`e:${s}`} /> estimate</label>
          </div>
        ))}
      </div>
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Putting your results together…" : "Continue"}</button>
    </form>
  );
}

// ---------- AI disclosure before The Guide (spec 03 §3) + retake offer (spec 04 §7) ----------
export function GuideNotice({ offerRetake }: { offerRetake: boolean }) {
  const { busy, error, run } = useStep();
  if (offerRetake) {
    return (
      <section className="space-y-6">
        <h1 className="text-[2rem] sm:text-4xl">Before the next part</h1>
        <p>Some of your answers may not have come through the way you meant them. You can redo the questions (about 20 minutes) or carry on. If you carry on, the chat with The Guide will count for more in your report.</p>
        <ErrorLine error={error} />
        <div className="grid gap-3">
          <button className="btn-primary" disabled={busy} onClick={() => run("retake", { choice: "retake" })}>Redo the questions</button>
          <button className="btn-ghost" disabled={busy} onClick={() => run("retake", { choice: "continue" })}>Carry on</button>
        </div>
      </section>
    );
  }
  return (
    <section className="space-y-6">
      <h1 className="text-[2rem] sm:text-4xl">Next: a chat with The Guide</h1>
      <p className="card text-lg leading-relaxed">
        The Guide is an AI we built for The Excavation. It asks one question at a time and reads what you actually write.
        Nobody at school sees the chat unless you choose to share it. The one exception: if The Guide thinks you might be unsafe, someone who can help will be told.
      </p>
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={busy} onClick={() => run("guide_ok")}>Start the chat</button>
    </section>
  );
}

// ---------- Grade 11 ----------
export function TwoYears({ headline, fits, taken }: { headline: string | null; fits: string[]; taken: string[] }) {
  const { busy, error, run } = useStep();
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); run("two_years", { text: String(new FormData(e.currentTarget).get("text") ?? "") }); }}>
      <h1 className="text-[2rem] sm:text-4xl">Two years ago…</h1>
      {headline ? (
        <div className="card space-y-3">
          <p className="text-xl font-semibold sm:text-2xl leading-snug">&ldquo;{headline}&rdquo;</p>
          {fits.length > 0 && <p className="text-muted">Your top combinations were: {fits.join(" · ")}</p>}
          {taken.length > 0 && <p className="text-muted">You took: {taken.join(", ")}</p>}
        </div>
      ) : (
        <p className="note">We don&apos;t have a Grade 9 report for you, so today is your starting point. That&apos;s fine. Your report will say so.</p>
      )}
      <div>
        <label className="label text-base text-fg" htmlFor="text">Reading that now, what still fits and what doesn&apos;t?</label>
        <textarea id="text" name="text" rows={4} maxLength={800} className="field" />
      </div>
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={busy}>Next</button>
    </form>
  );
}

export function MarksG11({ imported, subjects }: { imported: { subject: string; m10: number | null; m11: number | null }[] | null; subjects: string[] }) {
  const { busy, error, run } = useStep();
  const [rows, setRows] = useState<{ subject: string; g10: string; g11: string; est: boolean }[]>(
    () => ["Home Language", "First Additional Language", "Mathematics", "", "", "", "Life Orientation"].map((s) => ({ subject: s, g10: "", g11: "", est: false })),
  );
  if (imported) {
    return (
      <section className="space-y-6">
        <h1 className="text-[2rem] sm:text-4xl">Your marks</h1>
        <p className="text-muted">From your school: your Grade 10 final and your latest Grade 11 term.</p>
        <table className="card w-full text-left">
          <thead><tr className="text-sm text-muted"><th className="py-1">Subject</th><th>Gr 10</th><th>Gr 11</th></tr></thead>
          <tbody>{imported.map((r) => <tr key={r.subject} className="border-t border-line"><td className="py-2">{r.subject}</td><td>{r.m10 ?? "—"}</td><td className="font-semibold">{r.m11 ?? "—"}</td></tr>)}</tbody>
        </table>
        <ErrorLine error={error} />
        <button className="btn-primary w-full" disabled={busy} onClick={() => run("marks_g11", {})}>These are right, continue</button>
      </section>
    );
  }
  const set = (i: number, k: "subject" | "g10" | "g11" | "est", v: string | boolean) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  return (
    <form className="space-y-6" onSubmit={(e) => {
      e.preventDefault();
      const valid = rows.filter((r) => r.subject && r.g11 !== "");
      run("marks_g11", {
        rows: valid.map((r) => ({ subject: r.subject, g10: r.g10 === "" ? null : Number(r.g10), g11: Number(r.g11) })),
        estimates: valid.filter((r) => r.est).map((r) => r.subject),
      });
    }}>
      <h1 className="text-[2rem] sm:text-4xl">Your subjects and marks</h1>
      <p className="text-muted">Your Grade 10 final and your latest Grade 11 term. A best guess is fine. Tick &lsquo;estimate&rsquo; if it is one.</p>
      <datalist id="fet">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2">
            <input list="fet" aria-label="Subject" className="field" value={r.subject} onChange={(e) => set(i, "subject", e.target.value)} placeholder="Subject" />
            <input aria-label={`${r.subject || "Subject"} Grade 10`} inputMode="numeric" className="field px-2 text-right" placeholder="Gr10" value={r.g10} onChange={(e) => set(i, "g10", e.target.value)} />
            <input aria-label={`${r.subject || "Subject"} Grade 11`} inputMode="numeric" className="field px-2 text-right" placeholder="Gr11" value={r.g11} onChange={(e) => set(i, "g11", e.target.value)} />
            <label className="col-span-3 -mt-1 flex items-center justify-end gap-2 text-xs text-muted"><input type="checkbox" checked={r.est} onChange={(e) => set(i, "est", e.target.checked)} /> estimate</label>
          </div>
        ))}
      </div>
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={busy}>Continue</button>
    </form>
  );
}

interface LikertQ { id: string; text: string }
export function PerSubjectLikert({ action, subject, header, stem, items, points }: { action: "subject_experience" | "failure_cause"; subject: string; header: string; stem?: string; items: LikertQ[]; points: [number, string][] }) {
  const { busy, error, run } = useStep();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const done = items.every((i) => answers[i.id] !== undefined);
  return (
    <section className="space-y-6">
      <h1 className="text-[2rem] sm:text-4xl">{header}</h1>
      {stem && <p className="eyebrow !normal-case !tracking-normal text-base">{stem}</p>}
      <ol className="space-y-5">
        {items.map((it) => (
          <li key={it.id} className="card space-y-3">
            <p id={`q-${it.id}`}>{it.text}</p>
            <div role="radiogroup" aria-labelledby={`q-${it.id}`} className="grid gap-2 sm:grid-cols-5">
              {points.map(([v, label]) => (
                <label key={v} className={`choice justify-center px-2 text-center text-sm ${answers[it.id] === v ? "choice-on" : ""}`}>
                  <input type="radio" className="sr-only" name={it.id} checked={answers[it.id] === v} onChange={() => setAnswers((a) => ({ ...a, [it.id]: v }))} />{label}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={!done || busy} onClick={() => run(action, { subject, answers })}>Next</button>
    </section>
  );
}

export function CareerUpdate({ cu2Options, cu3Options }: { cu2Options: string[]; cu3Options: string[] }) {
  const { busy, error, run } = useStep();
  const [cu2, setCu2] = useState<string>("");
  const [cu3, setCu3] = useState<string[]>([]);
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); run("career_update", { cu1: String(new FormData(e.currentTarget).get("cu1") ?? ""), cu2, cu3 }); }}>
      <h1 className="text-[2rem] sm:text-4xl">Where you&apos;re heading</h1>
      <div>
        <label className="label text-base text-fg" htmlFor="cu1">What career or field are you leaning towards right now? &ldquo;Not sure&rdquo; is a fine answer.</label>
        <input id="cu1" name="cu1" className="field" maxLength={300} required />
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2">Compared to Grade 9, your direction is…</legend>
        {cu2Options.map((o) => (
          <label key={o} className={`choice gap-3 ${cu2 === o ? "choice-on" : ""}`}>
            <input type="radio" name="cu2" checked={cu2 === o} onChange={() => setCu2(o)} /> {o}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2">What have you done to explore careers since Grade 9? Tick all that apply.</legend>
        {cu3Options.map((o) => (
          <label key={o} className={`choice gap-3 ${cu3.includes(o) ? "choice-on" : ""}`}>
            <input type="checkbox" checked={cu3.includes(o)} onChange={(e) => setCu3((c) => (e.target.checked ? [...c, o] : c.filter((x) => x !== o)))} /> {o}
          </label>
        ))}
      </fieldset>
      <ErrorLine error={error} />
      <button className="btn-primary w-full" disabled={busy || !cu2 || !cu3.length}>{busy ? "Saving…" : "Next"}</button>
    </form>
  );
}
