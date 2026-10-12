import Link from "next/link";
import { AppPreview, IconTile, Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { Hexagon } from "@/components/report/Hexagon";
import { Doors } from "@/components/report/Doors";

/** Sample learner (fictional, from the product spec): shown so a learner knows what they get. */
const SAMPLE_SHAPE = { R: 30, I: 78, A: 64, S: 70, E: 25, C: 33 };

const STEPS = [
  { icon: "reading", title: "Answer honestly", text: "What you enjoy, how you work, what matters to you. Nothing here is marked." },
  { icon: "maths", title: "Try real work", text: "Short maths, science and reading checks, then tiny tasks from real jobs. They can only help you." },
  { icon: "EVIDENCE", title: "Talk it through", text: "Chat with The Guide, an AI that asks one question at a time and reads what you write." },
  { icon: "FIELD", title: "Get your report", text: "Your best-fit subjects, what each one opens or closes, and one move for this week." },
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Wordmark sub="School Edition" />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="grid items-center gap-10 py-6 md:grid-cols-[1.1fr_1fr] md:py-14">
          <div className="space-y-6">
            <p className="eyebrow">For Grade 9 and Grade 11 · South African schools</p>
            <h1 className="text-[2.25rem] leading-[1.05] sm:text-6xl">Choose your subjects from <span className="text-accent-ink">who you are</span>, not just your marks.</h1>
            <p className="max-w-lg text-lg text-muted">
              Built for Grade 9s choosing Grade 10 subjects, and Grade 11s checking they chose right. You answer questions, try a few real tasks and chat with The Guide. You get a report that says which subjects fit you, and why.
            </p>
            <nav className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn-primary sm:px-7">
                I&apos;m a learner
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link href="/demo" className="btn-ghost">Try the 5-minute demo</Link>
              <Link href="/staff/login" className="btn-ghost">Staff login</Link>
            </nav>
            <p className="text-sm font-medium text-muted">Know Thy Self measures. The Excavation interprets. A real person reviews every report before you see it.</p>
          </div>
          <AppPreview />
        </section>

        <section aria-labelledby="how" className="space-y-6 pt-6">
          <h2 id="how" className="text-2xl sm:text-3xl">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <IconTile name={s.icon} />
                  <span className="text-3xl font-bold tabular-nums text-control" aria-hidden="true">0{i + 1}</span>
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
            <h2 id="sample" className="text-3xl sm:text-4xl">A report that sounds like you.</h2>
            <p className="max-w-2xl text-lg text-muted">Not a score and a label. A picture of how you think, the subject combinations that fit, what each one keeps open or closes, and one move for this week.</p>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Hexagon scores={SAMPLE_SHAPE} />
              <p className="text-center text-sm text-muted">Sample · a fictional learner</p>
            </div>
            <div className="space-y-4">
              <div className="card-raised space-y-3">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-on-accent">1</span>
                  <div><h3 className="text-2xl">Humanities &amp; Social Sciences</h3><p className="text-sm text-muted">History · Geography · Life Sciences · Mathematics</p></div>
                </div>
                <p className="text-lg leading-snug">The closest match to how you think and what you care about. It keeps psychology, social work, law, journalism and teaching open.</p>
                <Doors open={["Humanities, psychology & social sciences", "Law", "Teaching & education"]} closed={["Medicine, pharmacy & health sciences", "Engineering"]} />
              </div>
              <div className="rounded-2xl bg-accent p-6 text-on-accent" style={{ boxShadow: "var(--shadow-soft)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-90">Your first move · this week</p>
                <p className="mt-2 text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl">Ask your gran why she thought of medicine for you. Not to argue, just to understand.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-3">
          {[
            ["Not a test", "There are no right answers. What you get is insight, not a diagnosis."],
            ["Yours first", "Teachers and parents only see a summary if you switch it on."],
            ["Made for here", "CAPS subjects, South African pathways and your school's own rules."],
          ].map(([t, d]) => (
            <div key={t} className="card flex gap-3 !p-4">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
              <p><strong>{t}.</strong> <span className="text-muted">{d}</span></p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark sub="Know Thy Self × The Excavation" />
          <div className="max-w-md space-y-1 text-sm text-muted"><p>Reflective insights to help you decide. Not a diagnosis, not a test. Questions about your information: <a href="mailto:privacy@theexcavation.co.za">privacy@theexcavation.co.za</a></p><p className="flex flex-wrap gap-x-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link><Link href="/demo">Demo</Link></p></div>
        </div>
      </footer>
    </div>
  );
}
