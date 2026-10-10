import { Hexagon } from "./Hexagon";
import { Reveal } from "./Reveal";
import { Doors } from "./Doors";
import { PlanChecklist } from "./PlanChecklist";
import { DOORS_DISCLAIMER } from "@/lib/scoring/doors";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";
import { skillsLines } from "@/lib/skills/plain";
import type { SkillsResult } from "@/lib/skills/types";

/** Deterministic (not AI-written): what the learner did in Part 1 and what it changed. */
function WhatYouTried({ skills, marks }: { skills: SkillsResult; marks: Record<string, unknown> }) {
  const { checks, tasters } = skillsLines(skills, marks);
  const practise = checks.find((c) => c.check === "maths")?.practise ?? [];
  return (
    <Section title="What you tried">
      <p className="text-muted">Before the conversation you did three short checks and some taster tasks. The checks could only ever help you: they never lowered anything.</p>
      {skills.gate_lift && (
        <p className="card border-accent text-lg">Your maths check went well enough to open the Mathematics option. Your marks alone pointed somewhere safer — see the Maths section above.</p>
      )}
      <ul className="space-y-2 text-lg">{checks.map((c) => <li key={c.check}>{c.you}</li>)}</ul>
      {practise.length > 0 && <p><strong>Worth practising:</strong> {practise.join(" · ")}</p>}
      {skills.reading_support && (
        <p><strong>Worth building:</strong> reading in English. Every Grade 10 subject is taught and tested in it, so 20 minutes of reading a day pays off everywhere.
          {skills.language_note ? " Some of your maths marks may reflect reading the question, not the maths itself." : ""}</p>
      )}
      {tasters.length > 0 && (
        <>
          <h3 className="font-semibold text-accent-ink">Taster tasks</h3>
          <ul className="space-y-2">{tasters.map((t) => <li key={t.id}><strong>{t.title}</strong> <span className="text-muted">({t.work})</span> — {t.you}.</li>)}</ul>
          <p className="text-sm text-muted">How much you enjoyed real work counted a little towards your subject options. Getting answers right didn&apos;t.</p>
        </>
      )}
    </Section>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3 border-t border-line pt-8">
    <h2 className="text-2xl">{title}</h2>
    {children}
  </section>
);
const Paras = ({ text }: { text: string }) => <>{text.split(/\n{2,}/).map((p, i) => <p key={i} className="text-lg leading-relaxed">{p}</p>)}</>;
const Headline = ({ text }: { text: string }) => <h1 className="font-display text-3xl leading-tight sm:text-4xl">&ldquo;{text}&rdquo;</h1>;

/** The Grade 9 Foundation Report. Closing line is the last element; nothing after it. */
export function G9Report({ r, profile }: { r: ReportG9; profile: ScoreProfile }) {
  return (
    <article className="space-y-10 pb-24">
      <Reveal headline={<Headline text={r.headline.text} />}>
        <div className="space-y-10">
          <Hexagon scores={profile.interests.scores} />
          <Section title="Your shape">
            <h3 className="font-semibold text-accent-ink">What you&apos;d love doing</h3><p className="text-lg">{r.shape.interests_plain}</p>
            <h3 className="font-semibold text-accent-ink">How you&apos;re wired</h3><p className="text-lg">{r.shape.personality_plain}</p>
            <h3 className="font-semibold text-accent-ink">What matters most</h3><p className="text-lg">{r.shape.values_plain}</p>
            {r.shape.quality_note && <p className="text-muted">{r.shape.quality_note}</p>}
            {profile.norm_state === "pre_norm" && <p className="text-xs text-muted">These are reflective insights from your answers, not a measurement.</p>}
          </Section>
          <Section title="Who you are"><Paras text={r.who_you_are} /></Section>
          <Section title="How you work"><Paras text={r.how_you_work} /></Section>
          <Section title="Your subject options">
            <ol className="space-y-5">
              {r.subject_options.fits.map((f, i) => {
                const combo = profile.combinations.find((c) => c.id === f.combination_id);
                return (
                  <li key={f.combination_id} className="card">
                    <p className="text-sm text-muted">Option {i + 1}{combo?.label === "keeps_most_doors_open" ? " · keeps the most doors open" : ""}</p>
                    <h3 className="text-xl">{f.name}</h3>
                    {combo && <p className="text-sm text-muted">{[...combo.subjects.electives, combo.subjects.maths].join(" · ")}</p>}
                    <p className="mt-3">{f.why}</p>
                    <p className="mt-2 text-sm text-muted">{f.readiness_note}</p>
                    <Doors open={f.doors_open} closed={f.doors_closed} />
                  </li>
                );
              })}
            </ol>
            {r.subject_options.cautions.map((c) => (
              <div key={c.combination_id} className="card border-danger/40">
                <p className="text-sm text-danger">Be careful with · {c.type === "competence_trap" ? "competence trap" : "a stretch"}</p>
                <h3 className="text-xl">{profile.combinations.find((x) => x.id === c.combination_id)?.name ?? c.combination_id}</h3>
                <p className="mt-2">{c.why}</p>
              </div>
            ))}
            <div className="card"><h3 className="font-semibold">Maths</h3><p className="mt-1">{r.subject_options.maths_gate}</p></div>
            <p className="text-sm text-muted">{r.subject_options.school_check} {DOORS_DISCLAIMER}</p>
          </Section>
          {profile.skills && <WhatYouTried skills={profile.skills} marks={profile.marks} />}
          <Section title={`The pattern to watch: ${r.pattern_to_watch.name.toLowerCase()}`}>
            <p className="text-lg">{r.pattern_to_watch.how_it_shows_up}</p>
            <p><strong>Early warning:</strong> {r.pattern_to_watch.early_warning}</p>
            <p><strong>Counter-move:</strong> {r.pattern_to_watch.counter_move}</p>
          </Section>
          <Section title={`Your first move (${r.first_move.by_when})`}><p className="text-lg">{r.first_move.action}</p></Section>
          <Section title="The question we'll ask you in Grade 11"><p className="font-display text-xl">&ldquo;{r.grade11_question}&rdquo;</p></Section>
          <p className="font-display border-t border-line pt-10 text-2xl leading-snug">{r.closing_line}</p>
        </div>
      </Reveal>
    </article>
  );
}

const VERDICT_WORD: Record<string, string> = {
  CONFIRM: "CONFIRM", RESCUE: "RESCUE", RETHINK: "RETHINK", ADJUST_ONE: "ADJUST ONE", REDIRECT: "REDIRECT", REDIRECT_AFTER_MATRIC: "REDIRECT AFTER MATRIC",
};

/** The Grade 11 Confirmation Report. */
export function G11Report({ r, profile, g9Profile, verdict, planState }: { r: ReportG11; profile: ScoreProfile; g9Profile: ScoreProfile | null; verdict: VerdictResult; planState: Record<string, boolean> }) {
  return (
    <article className="space-y-10 pb-24">
      <Reveal headline={<Headline text={r.headline.text} />}>
        <div className="space-y-10">
          <Hexagon scores={profile.interests.scores} before={g9Profile?.interests.scores ?? null} />
          <Section title="Two years: what stayed">
            <ul className="list-disc space-y-2 pl-5 text-lg">{r.two_years.what_stayed.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </Section>
          <Section title="Two years: what moved">
            <ul className="list-disc space-y-2 pl-5 text-lg">{r.two_years.what_moved.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <p className="text-lg"><strong>Who you&apos;re becoming:</strong> {r.two_years.identity_shift}</p>
          </Section>
          <Section title="Your subjects, honestly">
            <ul className="space-y-2">{r.subjects.map((s) => <li key={s.subject} className="text-lg"><strong>{s.subject}</strong> — {s.plain}</li>)}</ul>
          </Section>
          <section className="space-y-3 border-t border-line pt-8">
            <p className="text-sm uppercase tracking-widest text-muted">Verdict</p>
            <p className="font-display text-5xl text-accent-ink">{VERDICT_WORD[verdict.verdict]}</p>
            <p className="text-xl">{r.verdict.headline}</p>
            <Paras text={r.verdict.explanation} />
          </section>
          <Section title="Your pathway">
            <ul className="list-disc space-y-2 pl-5 text-lg">
              <li>{r.pathway.pass_type_now}</li><li>{r.pathway.gap_to_next}</li><li>{r.pathway.aps_note}</li><li>{r.pathway.grade11_finals_note}</li>
            </ul>
            <p className="text-lg">{r.pathway.career_check}</p>
          </Section>
          <Section title="Your plan"><PlanChecklist plan={r.plan} initial={planState} /></Section>
          <Section title={`The pattern to watch: ${r.pattern_to_watch.name.toLowerCase()}`}>
            <p className="text-lg">{r.pattern_to_watch.how_it_shows_up}</p><p><strong>Counter-move:</strong> {r.pattern_to_watch.counter_move}</p>
          </Section>
          <Section title={`Your first move (${r.first_move.by_when})`}><p className="text-lg">{r.first_move.action}</p></Section>
          <p className="font-display border-t border-line pt-10 text-2xl leading-snug">{r.closing_line}</p>
        </div>
      </Reveal>
    </article>
  );
}
