import Link from "next/link";
import { DEMO_STEPS } from "@/lib/demo/script";
import { questionBank } from "@/lib/config/questionBank";

export default function DemoHome() {
  const total = questionBank.scales.reduce((n, s) => n + (s.items?.length ?? 0), 0);
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="eyebrow">Five-minute demo</p>
        <h1 className="text-[2rem] sm:text-4xl">See The Excavation in five minutes.</h1>
        <p className="text-lg text-muted">The real learner session takes much longer. This tour shows you a taste of each part, then the finished report, so you can see what a Grade 9 learner experiences and what they take away.</p>
      </div>
      <ol className="space-y-3">
        {DEMO_STEPS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="card flex items-center gap-4 no-underline hover:bg-sunken">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-on-accent" aria-hidden="true">{s.n}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{s.title.split(" · ").at(-1)}</span>
                <span className="block text-sm text-muted">{s.n === 1 ? "Three real questions, including the pictures and Listen button." : s.n === 2 ? "A skill check, then a short chat with the Guide." : "The learner's finished report, with charts and a PDF to download."}</span>
              </span>
              <span className="chip">{s.min}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href="/demo/part-1" className="btn-primary w-full !min-h-14 text-lg no-underline">Start the demo</Link>
      <div className="note space-y-1.5 text-sm">
        <p><strong>Honest labels.</strong> The learner is fictional (&ldquo;Lerato&rdquo;). Nothing you tap is saved or sent anywhere. The Guide conversation is scripted for the demo; in the real product it is an AI whose every message is safety-checked first. The report and its charts are computed by the real scoring engine.</p>
        <p>The full learner session has {total} scored questions, plus values, skill checks, taster tasks and the Guide conversation.</p>
      </div>
      <details className="card text-sm">
        <summary className="cursor-pointer text-base font-bold">Presenter notes</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li><strong>0:00 Part 1.</strong> Answer the first question aloud. Press Listen. Point out the pictures, large type and faces. Pick three values.</li>
          <li><strong>1:30 Part 2.</strong> Answer the maths check (no right/wrong shown to the learner). Play the Guide chat: tap the two replies. Point out the safety badge on every message.</li>
          <li><strong>3:30 Results.</strong> Let the headline land, then scroll: interests, how they are wired, subject fit, doors kept open, one thing to do this week. Download the PDF.</li>
          <li><strong>5:00.</strong> Stop. &ldquo;That is what a learner leaves with. Now let me show you why a school can trust it.&rdquo;</li>
        </ol>
      </details>
    </div>
  );
}
