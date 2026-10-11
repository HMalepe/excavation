import { IssuedCard, LayerStack, Panel, Resp, StatCards } from "./Dashboard";
import { WebCharts as C } from "./charts.web";
import { Art } from "@/components/ui/Art";
import { buildInsights } from "@/lib/insights/build";
import { valueCards } from "@/lib/config/questionBank";
import { Reveal } from "./Reveal";
import { Doors } from "./Doors";
import { PlanChecklist } from "./PlanChecklist";
import { DOORS_DISCLAIMER } from "@/lib/scoring/doors";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";
import { skillsLines } from "@/lib/skills/plain";
import { verdictLabel } from "@/lib/verdict/labels";
import type { SkillsResult } from "@/lib/skills/types";

/** Deterministic (not AI-written): what the learner did in Part 1 and what it changed. */
function WhatYouTried({ skills, marks, ins }: { skills: SkillsResult; marks: Record<string, unknown>; ins: ReturnType<typeof buildInsights> }) {
  const { checks, tasters } = skillsLines(skills, marks);
  const practise = checks.find((c) => c.check === "maths")?.practise ?? [];
  return (
    <Section title="What you tried">
      <p className="text-muted">Before the chat you did three short checks and some taster tasks. The checks could only help you. They never lowered anything.</p>
      {skills.gate_lift && (
        <p className="card text-lg">Your maths check went well enough to open the Mathematics option. Your marks alone pointed somewhere safer. See the Maths section above.</p>
      )}
      {ins.marksVsChecks.length > 0 && <Panel title="What the checks showed" kicker="Next to your school marks"><Resp>{(w) => <C.MarksVsChecks items={ins.marksVsChecks} w={w} />}</Resp></Panel>}
      <Bullets items={checks.map((c) => c.you)} />
      {practise.length > 0 && <p className="note"><strong>Worth practising:</strong> {practise.join(" · ")}</p>}
      {skills.reading_support && (
        <p className="note"><strong>Worth building:</strong> reading in English. Every Grade 10 subject is taught and tested in it, so 20 minutes of reading a day pays off everywhere.
          {skills.language_note ? " Some of your maths marks may reflect reading the question, not the maths itself." : ""}</p>
      )}
      {tasters.length > 0 && (
        <>
          <Sub>Taster tasks</Sub>
          {ins.tasters.length > 0 && <Panel title="How the tasters felt" kicker="Expected, then real"><Resp>{(w) => <C.TasterDots items={ins.tasters} w={w} />}</Resp></Panel>}
          <ul className="space-y-3">{tasters.map((t) => <li key={t.id} className="card text-lg leading-snug"><strong>{t.title}</strong> <span className="text-muted">({t.work})</span>: {t.you}.</li>)}</ul>
          <p className="text-sm text-muted">How much you enjoyed the work counted a little towards your subject options. Getting answers right didn&apos;t count at all.</p>
        </>
      )}
    </Section>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode; tone?: 1 | 2 | 3 | 4 | 5 }) => (
  <section className="reveal space-y-4 pt-10">
    <div className="flex items-center gap-3">
      <span className="h-1 w-6 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
    </div>
    {children}
  </section>
);
const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-3">{items.map((x, i) => <li key={i} className="flex gap-3 text-lg leading-snug"><span className="diamond" aria-hidden="true" /><span>{x}</span></li>)}</ul>
);
const Closing = ({ text }: { text: string }) => (
  <p className="mt-14 border-t border-line pt-10 text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-4xl">{text}</p>
);
const Sub = ({ children }: { children: React.ReactNode }) => <h3 className="eyebrow !text-sm">{children}</h3>;
const Paras = ({ text }: { text: string }) => <>{text.split(/\n{2,}/).map((p, i) => <p key={i} className="text-lg leading-relaxed">{p}</p>)}</>;
const Headline = ({ text }: { text: string }) => <h1 className="text-[2rem] leading-[1.1] sm:text-5xl">&ldquo;{text}&rdquo;</h1>;

/** The Grade 9 Foundation Report. Closing line is the last element; nothing after it. */
export function G9Report({ r, profile, name, issued }: { r: ReportG9; profile: ScoreProfile; name: string; issued: string }) {
  const ins = buildInsights({ profile });
  const vtext = (id: string) => valueCards.find((c) => c.id === id)?.text ?? id;
  return (
    <article className="space-y-2 pb-24">
      <Reveal kicker="Your Grade 9 report" headline={<Headline text={r.headline.text} />}>
        <div className="space-y-2">
          <div className="space-y-4 pt-8">
            <IssuedCard name={name} grade="Grade 9 report" issued={issued} />
            <StatCards stats={ins.stats} />
          </div>
          <Section title="Your dig, layer by layer" tone={1}><LayerStack layers={ins.layers} /></Section>
          <Section title="Your shape" tone={1}>
            <div className="grid items-start gap-4 md:grid-cols-2">
              <Panel title="What pulls you most" kicker="Interests"><C.Radar scores={ins.radar} /></Panel>
              <Panel title="Your pulls, strongest first" kicker="Interests"><C.InterestBars bars={ins.interests} w={400} /></Panel>
            </div>
            <Panel title="How you work" kicker="Wired" note="No end of these is better. They just describe you."><Resp>{(w) => <C.Spectra traits={ins.traits} w={w} />}</Resp></Panel>
            {profile.values && (
              <Panel title="What matters most to you" kicker="Values">
                <ul className="grid gap-3 sm:grid-cols-3">
                  {profile.values.top3.map((id, i) => (
                    <li key={id} data-sec="values" className="flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center" style={{ background: "var(--sec-soft)", borderColor: "var(--sec-line)" }}>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sec)] text-sm font-extrabold text-[var(--surface)]">{i + 1}</span>
                      <Art id={id} className="h-14 w-14 text-fg" />
                      <span className="font-semibold leading-snug">{vtext(id)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted">Mattered least: {profile.values.bottom2.map((id) => vtext(id).toLowerCase()).join(" and ")}.</p>
              </Panel>
            )}
            {ins.habits.length > 0 && <Panel title="Your habits and drive" kicker="Wired"><Resp>{(w) => <C.Habits habits={ins.habits} w={w} />}</Resp></Panel>}
            <div className="card space-y-4">
              <div className="space-y-1"><Sub>What you&apos;d love doing</Sub><p className="text-lg">{r.shape.interests_plain}</p></div>
              <div className="space-y-1 border-t-[1.5px] border-line pt-4"><Sub>How you&apos;re wired</Sub><p className="text-lg">{r.shape.personality_plain}</p></div>
              <div className="space-y-1 border-t-[1.5px] border-line pt-4"><Sub>What matters most</Sub><p className="text-lg">{r.shape.values_plain}</p></div>
            </div>
            {r.shape.quality_note && <p className="note">{r.shape.quality_note}</p>}
            {profile.norm_state === "pre_norm" && <p className="text-sm text-muted">These are reflective insights from your answers, not a measurement.</p>}
          </Section>
          <Section title="Who you are" tone={2}><Paras text={r.who_you_are} /></Section>
          <Section title="How you work" tone={2}><Paras text={r.how_you_work} /></Section>
          <Section title="Your subject options" tone={3}>
            <ol className="space-y-5">
              {r.subject_options.fits.map((f, i) => {
                const combo = profile.combinations.find((c) => c.id === f.combination_id);
                return (
                  <li key={f.combination_id} className={`space-y-3 ${i === 0 ? "card" : "card"}`}>
                    <div className="flex items-start gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${i === 0 ? "bg-accent text-on-accent" : "border border-tint-line bg-tint text-accent-ink"}`}>{i + 1}</span>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-2xl">{f.name}</h3>
                        {combo?.label === "keeps_most_doors_open" && <span className="chip">keeps the most doors open</span>}
                        {combo && <p className="text-sm text-muted">{[...combo.subjects.electives, combo.subjects.maths].join(" · ")}</p>}
                      </div>
                    </div>
                    <p className="text-lg leading-snug">{f.why}</p>
                    <p className="text-sm text-muted">{f.readiness_note}</p>
                    <Doors open={f.doors_open} closed={f.doors_closed} />
                  </li>
                );
              })}
            </ol>
            <Panel title="How the options compare" kicker="Subject options" note="The bar is the overall match. The dots show why: your interests, your marks and readiness, and how you work."><Resp>{(w) => <C.FitBars fits={ins.fits} w={w} />}</Resp></Panel>
            <Panel title="Which career doors each option keeps open" kicker="Doors" note="Options are numbered in the order above. The last column is the one to be careful with."><Resp>{(w) => <C.DoorsMatrix combos={ins.combos} rows={ins.doors} w={w} />}</Resp></Panel>
            {r.subject_options.cautions.map((c) => (
              <div key={c.combination_id} className="card space-y-2 border-l-[10px] !border-l-danger">
                <p className="eyebrow !text-danger">Be careful with · {c.type === "competence_trap" ? "good at it, but it could drain you" : "a stretch for now"}</p>
                <h3 className="text-2xl">{profile.combinations.find((x) => x.id === c.combination_id)?.name ?? c.combination_id}</h3>
                <p className="text-lg leading-snug">{c.why}</p>
              </div>
            ))}
            <div className="card space-y-2"><span className="chip">Maths</span><p className="text-lg leading-snug">{r.subject_options.maths_gate}</p></div>
            <p className="text-sm text-muted">{r.subject_options.school_check} {DOORS_DISCLAIMER}</p>
          </Section>
          {profile.skills && <WhatYouTried skills={profile.skills} marks={profile.marks} ins={ins} />}
          <Section title={`The pattern to watch: ${r.pattern_to_watch.name.toLowerCase()}`} tone={4}>
            <p className="text-lg leading-snug">{r.pattern_to_watch.how_it_shows_up}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card space-y-1"><Sub>Early warning</Sub><p>{r.pattern_to_watch.early_warning}</p></div>
              <div className="card space-y-1"><Sub>Counter-move</Sub><p>{r.pattern_to_watch.counter_move}</p></div>
            </div>
          </Section>
          <Section title="Your first move" tone={5}>
            <div className="rounded-2xl bg-accent p-6 text-on-accent" style={{ boxShadow: "var(--shadow-soft)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-90">{r.first_move.by_when}</p>
              <p className="mt-2 text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl">{r.first_move.action}</p>
            </div>
          </Section>
          <Section title="The question we'll ask you in Grade 11" tone={5}><p className="text-xl font-semibold leading-snug sm:text-2xl">&ldquo;{r.grade11_question}&rdquo;</p></Section>
          <Closing text={r.closing_line} />
        </div>
      </Reveal>
    </article>
  );
}


/** The Grade 11 Confirmation Report. */
export function G11Report({ r, profile, g9Profile, verdict, planState, name, issued }: { r: ReportG11; profile: ScoreProfile; g9Profile: ScoreProfile | null; verdict: VerdictResult; planState: Record<string, boolean>; name: string; issued: string }) {
  const ins = buildInsights({ profile, g9Profile, verdict });
  return (
    <article className="space-y-2 pb-24">
      <Reveal kicker="Your Grade 11 report" headline={<Headline text={r.headline.text} />}>
        <div className="space-y-2">
          <div className="space-y-4 pt-8">
            <IssuedCard name={name} grade="Grade 11 report" issued={issued} />
            <StatCards stats={ins.stats} />
          </div>
          <Section title="Your dig, layer by layer" tone={1}><LayerStack layers={ins.layers} /></Section>
          <Section title="What stayed the same" tone={1}>
            {ins.deltas && (
              <div className="grid items-start gap-4 md:grid-cols-2">
                <Panel title="Your pulls: Grade 9 and now" kicker="Interests"><C.Dumbbells items={ins.deltas.interests} label="Interests from Grade 9 to now" w={400} /></Panel>
                <Panel title="How you work: Grade 9 and now" kicker="Wired"><C.Dumbbells items={ins.deltas.traits} label="How you work from Grade 9 to now" w={400} /></Panel>
              </div>
            )}
            <Bullets items={r.two_years.what_stayed} />
          </Section>
          <Section title="What changed" tone={2}>
            <Panel title="Your shape, then and now" kicker="Interests"><div className="mx-auto max-w-sm"><C.Radar scores={ins.radar} before={ins.radarBefore} /></div></Panel>
            <Bullets items={r.two_years.what_moved} />
            <p className="card text-lg"><strong>Who you&apos;re becoming:</strong> {r.two_years.identity_shift}</p>
          </Section>
          <Section title="Your subjects, honestly" tone={3}>
            {ins.subjects.length > 0 && <Panel title="Where each subject sits" kicker="Fit and marks" note="Across: how well the subject suits you. Up: how it's going."><Resp>{(w) => <C.SubjectMap points={ins.subjects} w={w} />}</Resp></Panel>}
            <ul className="space-y-3">{r.subjects.map((s) => <li key={s.subject} className="card text-lg leading-snug"><strong>{s.subject}:</strong> {s.plain}</li>)}</ul>
          </Section>
          <section className="pt-10">
            <div className="card relative space-y-3 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-accent" aria-hidden="true" />
              <p className="eyebrow pt-2">Your verdict</p>
              <p className="text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-accent-ink sm:text-5xl">{verdictLabel(verdict.verdict)}</p>
              <p className="text-xl font-semibold leading-snug sm:text-2xl">{r.verdict.headline}</p>
              <Paras text={r.verdict.explanation} />
            </div>
          </section>
          <Section title="Your pathway" tone={4}>
            <Bullets items={[r.pathway.pass_type_now, r.pathway.gap_to_next, r.pathway.aps_note, r.pathway.grade11_finals_note]} />
            <p className="text-lg leading-snug">{r.pathway.career_check}</p>
          </Section>
          <Section title="Your plan" tone={4}><PlanChecklist plan={r.plan} initial={planState} /></Section>
          <Section title={`The pattern to watch: ${r.pattern_to_watch.name.toLowerCase()}`} tone={5}>
            <p className="text-lg leading-snug">{r.pattern_to_watch.how_it_shows_up}</p>
            <div className="card space-y-1"><Sub>Counter-move</Sub><p>{r.pattern_to_watch.counter_move}</p></div>
          </Section>
          <Section title="Your first move" tone={5}>
            <div className="rounded-2xl bg-accent p-6 text-on-accent" style={{ boxShadow: "var(--shadow-soft)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-90">{r.first_move.by_when}</p>
              <p className="mt-2 text-xl font-semibold leading-snug tracking-[-0.01em] sm:text-2xl">{r.first_move.action}</p>
            </div>
          </Section>
          <Closing text={r.closing_line} />
        </div>
      </Reveal>
    </article>
  );
}
