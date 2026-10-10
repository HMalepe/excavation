import Link from "next/link";
import { IconTile, StrataHero, StrataRule, Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { Hexagon } from "@/components/report/Hexagon";
import { Doors } from "@/components/report/Doors";

/** Sample learner (fictional, from the product spec): shown so a learner knows what they get. */
const SAMPLE_SHAPE = { R: 30, I: 78, A: 64, S: 70, E: 25, C: 33 };

const STEPS = [
  { icon: "reading", layer: 1, title: "Answer honestly", text: "What you love, how you work, what matters to you. No wrong answers." },
  { icon: "maths", layer: 2, title: "Try the work", text: "Short checks and taster tasks: real problems from real jobs." },
  { icon: "EVIDENCE", layer: 3, title: "Talk it through", text: "A conversation with The Guide, built to listen properly." },
  { icon: "FIELD", layer: 4, title: "Get your report", text: "Subject options, the doors they open, and your first move." },
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-contours">
      <StrataRule />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Wordmark sub="School Edition" />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="grid items-center gap-10 py-6 md:grid-cols-[1.1fr_1fr] md:py-14">
          <div className="space-y-6">
            <p className="eyebrow">For Grade 9 and Grade 11 · South African schools</p>
            <h1 className="text-[2.75rem] leading-[0.98] sm:text-6xl">
              Dig deeper <br className="hidden sm:block" />than your <span className="relative inline-block">marks.<span aria-hidden="true" className="absolute inset-x-0 bottom-1 -z-10 h-3.5 rounded-sm bg-accent" /></span>
            </h1>
            <p className="max-w-lg text-lg text-muted">
              Choose your Grade 10 subjects from who you are and what you can actually do — not from what sounds impressive. Then check, in Grade 11, whether they still fit.
            </p>
            <nav className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn-primary sm:px-7">
                I&apos;m a learner
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link href="/staff/login" className="btn-ghost">School or Excavation staff</Link>
            </nav>
            <p className="font-display text-sm font-semibold text-muted">Know Thy Self measures. The Excavation interprets.</p>
          </div>
          <div className="card-raised overflow-hidden p-0">
            <StrataHero className="block h-auto w-full" />
          </div>
        </section>

        <section aria-labelledby="how" className="space-y-6 pt-6">
          <h2 id="how" className="text-3xl">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <IconTile name={s.icon} layer={s.layer} />
                  <span className="font-display text-4xl font-extrabold text-line">0{i + 1}</span>
                </div>
                <h3 className="text-xl">{s.title}</h3>
                <p className="text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="sample" className="space-y-6 pt-16">
          <div className="space-y-2">
            <p className="eyebrow">What you get</p>
            <h2 id="sample" className="text-4xl sm:text-5xl">A report that sounds like you.</h2>
            <p className="max-w-2xl text-lg text-muted">Not a score and a label: a picture of how you think, the subject combinations that fit, the doors each one keeps open, and one thing to do this week.</p>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Hexagon scores={SAMPLE_SHAPE} />
              <p className="text-center text-sm text-muted">Sample · a fictional learner</p>
            </div>
            <div className="space-y-4">
              <div className="card-raised space-y-3">
                <div className="flex items-start gap-4">
                  <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-edge text-2xl font-extrabold" style={{ background: "var(--strata-1)", color: "#1a1613" }}>1</span>
                  <div><h3 className="text-2xl">Humanities &amp; Social Sciences</h3><p className="text-sm text-muted">History · Geography · Life Sciences · Mathematics</p></div>
                </div>
                <p className="text-lg leading-snug">The closest match to how you think and what you care about. It keeps psychology, social work, law, journalism and teaching open.</p>
                <Doors open={["Humanities, psychology & social sciences", "Law", "Teaching & education"]} closed={["Medicine, pharmacy & health sciences", "Engineering"]} />
              </div>
              <div className="rounded-[20px] border-2 border-edge bg-accent p-6 text-on-accent" style={{ boxShadow: "5px 5px 0 var(--shadow)" }}>
                <p className="font-display text-xs font-bold uppercase tracking-[0.16em] opacity-75">Your first move · this week</p>
                <p className="font-display mt-2 text-2xl font-bold leading-snug">Ask your gran why she thought of medicine for you. Not to argue, just to understand.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-3">
          {[
            ["Not a test", "There are no wrong answers. Results are insights, not a diagnosis."],
            ["Yours first", "Teachers and parents only see a summary if you choose to share it."],
            ["Built for here", "CAPS subjects, South African pathways, and your school's own rules."],
          ].map(([t, d]) => (
            <div key={t} className="flex gap-3 rounded-2xl border-[1.5px] border-dashed border-line p-4">
              <span className="mt-1 h-3 w-3 shrink-0 rotate-45 border-[1.5px] border-edge bg-accent" aria-hidden="true" />
              <p><strong className="font-display">{t}.</strong> <span className="text-muted">{d}</span></p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t-[1.5px] border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark sub="Know Thy Self × The Excavation" />
          <p className="max-w-md text-sm text-muted">Reflective insights to support a decision: not a diagnosis, not a test. Questions about your information: <a href="mailto:privacy@theexcavation.co.za">privacy@theexcavation.co.za</a></p>
        </div>
      </footer>
    </div>
  );
}
