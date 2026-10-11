import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { pathwayName } from "@/lib/scoring/doors";
import { verdictLabel } from "@/lib/verdict/labels";
import type { ParentSummary, ReportG9, ReportG11, TeacherSummary } from "@/lib/ai/schemas";
import { Svg, Path as SvgPath } from "@react-pdf/renderer";
import { pdfCharts, PDF_PAL as K } from "./charts";
import { buildInsights, type Insights } from "@/lib/insights/build";
import { skillsLines } from "@/lib/skills/plain";
import { valueCards } from "@/lib/config/questionBank";
import type { ScoreProfile } from "@/lib/scoring/types";
import type { VerdictResult } from "@/lib/verdict/types";

// Print-friendly Limestone: light paper, ink text, aqua only as an accent, and the five
// earth layers as a signature rule. Built-in fonts (no downloads): bold Helvetica stands in for the
// display face on paper.
const STRATA = ["#1b57e5"];
const s = StyleSheet.create({
  page: { paddingTop: 52, paddingBottom: 54, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.45, color: "#0e1a2b", backgroundColor: "#ffffff" },
  strata: { position: "absolute", top: 0, left: 0, right: 0, height: 4, flexDirection: "row" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 0.4, color: "#0d1117", marginBottom: 14 },
  kicker: { fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 1.6, color: "#1b57e5", textTransform: "uppercase", marginBottom: 6 },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 24, marginBottom: 14, lineHeight: 1.12, letterSpacing: -0.4 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 14.5, marginTop: 16, marginBottom: 6, color: "#0d1117", paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: "#bcd0fb" },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 6, marginBottom: 2 },
  p: { marginBottom: 6 },
  muted: { color: "#4a5361", fontSize: 9 },
  card: { borderWidth: 1, borderColor: "#e1e6ee", borderRadius: 8, padding: 9, marginBottom: 8, backgroundColor: "#ffffff" },
  closing: { fontFamily: "Helvetica-Bold", fontSize: 16, lineHeight: 1.25, marginTop: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e1e6ee" },
  row: { flexDirection: "row", gap: 8 },
  cell: { flex: 1 },
  footer: { position: "absolute", bottom: 22, left: 44, right: 44, fontSize: 7.5, color: "#4a5361" },
});

const Strata = () => (
  <View style={s.strata} fixed>
    {STRATA.map((c) => <View key={c} style={{ flex: 1, backgroundColor: c }} />)}
  </View>
);
const Brand = () => <Text style={s.brand}>THE EXCAVATION</Text>;

const Footer = () => (
  <>
    <Text style={s.footer} fixed>
      The Excavation · Reflective insights to help with a decision. Not a diagnosis and not an instruction. University requirements differ and change every year, so check the prospectus.
    </Text>
    <Text style={{ position: "absolute", bottom: 22, right: 44, fontSize: 7.5, color: "#566276" }} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </>
);
const Paras = ({ t }: { t: string }) => <>{t.split(/\n{2,}/).map((x, i) => <Text key={i} style={s.p}>{x}</Text>)}</>;

// ---------- dashboard pieces ----------
const W_PAGE = 507, W_BLOCK = 483;
const Tick = () => <Svg width={14} height={14} viewBox="0 0 14 14"><SvgPath d="M3 7.4l2.8 2.8L11 4.2" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;

function IssuedBox({ name, grade, issued }: { name: string; grade: string; issued: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: K.accentSoft, borderWidth: 1, borderColor: K.accentLine, borderRadius: 10, padding: 10, marginBottom: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: K.accent, alignItems: "center", justifyContent: "center" }}><Tick /></View>
      <View>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 1.3, color: K.accent }}>EXCAVATION COMPLETE</Text>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>{name} · {grade}</Text>
        <Text style={{ fontSize: 8.5, color: K.muted }}>Issued {issued}</Text>
      </View>
    </View>
  );
}

function StatRow({ stats }: { stats: Insights["stats"] }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }} wrap={false}>
      {stats.map((st) => (
        <View key={st.label} style={{ flex: 1, borderWidth: 1, borderColor: K.line, borderRadius: 9, padding: 9 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 1, color: K.muted }}>{st.label.toUpperCase()}</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, lineHeight: 1.15, marginTop: 4 }}>{st.value}</Text>
          <Text style={{ fontSize: 8.5, color: K.muted, marginTop: 3 }}>{st.note}</Text>
        </View>
      ))}
    </View>
  );
}

function LayerRows({ layers }: { layers: Insights["layers"] }) {
  const bg = ["#dbe8ff", "#9fbfff", "#6b9cfa", "#1b57e5", "#0f2f8f"];
  return (
    <View style={{ borderWidth: 1, borderColor: K.line, borderRadius: 9, overflow: "hidden", marginBottom: 10 }} wrap={false}>
      {layers.map((l, i) => (
        <View key={l.name} style={{ flexDirection: "row", borderBottomWidth: i < layers.length - 1 ? 1 : 0, borderBottomColor: K.line }}>
          <View style={{ width: 84, backgroundColor: bg[i], padding: 8, justifyContent: "center" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: i >= 3 ? "#ffffff" : K.ink }}>{l.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 0.9, color: K.muted }}>{l.title.toUpperCase()}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, lineHeight: 1.3, marginTop: 1 }}>{l.finding}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** A titled, bordered block around a chart. Never split across pages. */
function Block({ title, kicker, note, children, flex }: { title: string; kicker?: string; note?: string; children: React.ReactNode; flex?: number }) {
  return (
    <View wrap={false} style={{ borderWidth: 1, borderColor: K.line, borderRadius: 10, padding: 12, marginBottom: 10, flex }}>
      {kicker ? <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 1.2, color: K.accent }}>{kicker.toUpperCase()}</Text> : null}
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11.5, marginBottom: note ? 1 : 6 }}>{title}</Text>
      {note ? <Text style={{ fontSize: 8.5, color: K.muted, marginBottom: 6 }}>{note}</Text> : null}
      {children}
    </View>
  );
}

const HowToRead = () => (
  <Text style={{ fontSize: 8.5, color: K.muted, marginTop: 4 }}>
    How to read this report: bars, dots and positions show how strongly something shows up in YOUR answers. They are not scores, and they don&apos;t rank you against anyone. The words matter more than the shapes.
  </Text>
);

const Check = () => <View style={{ width: 10, height: 10, borderWidth: 1.2, borderColor: K.control, borderRadius: 2, marginTop: 1.5 }} />;

export function G9Pdf({ r, name, profile = null, issued = "" }: { r: ReportG9; name: string; profile?: ScoreProfile | null; issued?: string }) {
  const ins = profile ? buildInsights({ profile }) : null;
  const lines = profile?.skills ? skillsLines(profile.skills, profile.marks) : null;
  const vtext = (id: string) => valueCards.find((c) => c.id === id)?.text ?? id;
  const half = pdfCharts(W_BLOCK / 2 - 12), full = pdfCharts(W_BLOCK), page = pdfCharts(W_PAGE);
  void page;
  return (
    <Document title={`Grade 9 report: ${name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Strata />
        <Brand />
        <Text style={s.kicker}>Grade 9 report · {name}</Text>
        <Text style={s.h1}>“{r.headline.text}”</Text>
        {ins && <>
          <IssuedBox name={name} grade="Grade 9 report" issued={issued || "today"} />
          <StatRow stats={ins.stats} />
          <Text style={[s.h2, { marginTop: 4 }]}>Your dig, layer by layer</Text>
          <LayerRows layers={ins.layers} />
          <HowToRead />
        </>}

        <Text style={s.h2} break minPresenceAhead={70}>Your shape</Text>
        {ins && <>
          <View style={{ flexDirection: "row", gap: 10 }} wrap={false}>
            <Block title="What pulls you most" kicker="Interests" flex={1}>{half.Radar({ scores: ins.radar })}</Block>
            <Block title="Your pulls, strongest first" kicker="Interests" flex={1}>{half.InterestBars({ bars: ins.interests, w: 400 })}</Block>
          </View>
          <Block title="How you work" kicker="Wired" note="No end of these is better. They just describe you.">{full.Spectra({ traits: ins.traits })}</Block>
        </>}
        {profile?.values && (
          <Block title="What matters most to you" kicker="Values">
            <View style={{ flexDirection: "row", gap: 8 }}>
              {profile.values.top3.map((id, i) => (
                <View key={id} style={{ flex: 1, backgroundColor: K.accentSoft, borderWidth: 1, borderColor: K.accentLine, borderRadius: 8, padding: 8, alignItems: "center" }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: K.accent, alignItems: "center", justifyContent: "center", marginBottom: 4 }}><Text style={{ color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 9 }}>{i + 1}</Text></View>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, textAlign: "center" }}>{vtext(id)}</Text>
                </View>
              ))}
            </View>
            <Text style={[s.muted, { marginTop: 6 }]}>Mattered least: {profile.values.bottom2.map((id) => vtext(id).toLowerCase()).join(" and ")}.</Text>
          </Block>
        )}
        {ins && ins.habits.length > 0 && <Block title="Your habits and drive" kicker="Wired">{full.Habits({ habits: ins.habits })}</Block>}
        <Text style={s.h3}>What you&apos;d love doing</Text><Text style={s.p}>{r.shape.interests_plain}</Text>
        <Text style={s.h3}>How you&apos;re wired</Text><Text style={s.p}>{r.shape.personality_plain}</Text>
        <Text style={s.h3}>What matters most</Text><Text style={s.p}>{r.shape.values_plain}</Text>
        {r.shape.quality_note ? <Text style={s.muted}>{r.shape.quality_note}</Text> : null}
        <Text style={s.h2} minPresenceAhead={70}>Who you are</Text><Paras t={r.who_you_are} />
        <Text style={s.h2} minPresenceAhead={70}>How you work</Text><Paras t={r.how_you_work} />

        <Text style={s.h2} minPresenceAhead={120}>Your subject options</Text>
        {ins && <>
          <Block title="How the options compare" kicker="Subject options" note="The bar is the overall match. The dots show why: your interests, your marks and readiness, and how you work.">{full.FitBars({ fits: ins.fits })}</Block>
          <Block title="Which career doors each option keeps open" kicker="Doors" note="Options are numbered in the order below. The last column is the one to be careful with.">{full.DoorsMatrix({ combos: ins.combos, rows: ins.doors })}</Block>
        </>}
        {r.subject_options.fits.map((f, i) => (
          <View key={f.combination_id} style={s.card} wrap={false}>
            <Text style={s.h3}>{i + 1}. {f.name}</Text>
            <Text style={s.p}>{f.why}</Text>
            <View style={s.row}>
              <View style={[s.cell, { backgroundColor: K.tealSoft, borderRadius: 6, padding: 6 }]}><Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 1, color: K.tealInk }}>KEEPS OPEN</Text><Text style={s.muted}>{f.doors_open.join(" · ") || "—"}</Text></View>
              <View style={[s.cell, { backgroundColor: K.dangerSoft, borderRadius: 6, padding: 6 }]}><Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 1, color: K.danger }}>CLOSES</Text><Text style={s.muted}>{f.doors_closed.join(" · ") || "Nothing major"}</Text></View>
            </View>
          </View>
        ))}
        {r.subject_options.cautions.map((c) => (
          <View key={c.combination_id} style={[s.card, { borderLeftWidth: 4, borderLeftColor: K.danger }]} wrap={false}>
            <Text style={s.h3}>Be careful with ({c.type === "competence_trap" ? "good at it, but it could drain you" : "a stretch for now"})</Text>
            <Text>{c.why}</Text>
          </View>
        ))}
        <Text style={s.h3}>Maths</Text><Text style={s.p}>{r.subject_options.maths_gate}</Text>
        <Text style={s.muted}>{r.subject_options.school_check}</Text>

        {lines && ins && (
          <View>
            <Text style={s.h2} minPresenceAhead={160}>What you tried</Text>
            <Text style={[s.muted, { marginBottom: 6 }]}>Three short checks and some taster tasks. The checks could only help you. They never lowered anything.</Text>
            {ins.marksVsChecks.length > 0 && <Block title="What the checks showed" kicker="Next to your school marks">{full.MarksVsChecks({ items: ins.marksVsChecks })}</Block>}
            {lines.checks.map((c) => <Text key={c.check} style={s.p}>{c.you}</Text>)}
            {ins.tasters.length > 0 && <Block title="How the tasters felt" kicker="Expected, then real">{full.TasterDots({ items: ins.tasters })}</Block>}
            {lines.tasters.map((t) => <Text key={t.id} style={s.p}>{t.title} ({t.work}): {t.you}.</Text>)}
          </View>
        )}
        <Text style={s.h2} minPresenceAhead={70}>The pattern to watch: {r.pattern_to_watch.name.toLowerCase()}</Text>
        <Text style={s.p}>{r.pattern_to_watch.how_it_shows_up}</Text>
        <Text style={s.p}>Early warning: {r.pattern_to_watch.early_warning}</Text>
        <Text style={s.p}>Counter-move: {r.pattern_to_watch.counter_move}</Text>
        <View style={{ backgroundColor: K.accent, borderRadius: 10, padding: 14, marginTop: 10 }} wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 1.3, color: "#ffffff" }}>YOUR FIRST MOVE · {r.first_move.by_when.toUpperCase()}</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, color: "#ffffff", marginTop: 4, lineHeight: 1.3 }}>{r.first_move.action}</Text>
        </View>
        <Text style={s.h2} minPresenceAhead={70}>The question we&apos;ll ask you in Grade 11</Text><Text style={s.p}>“{r.grade11_question}”</Text>
        <Text style={s.closing}>{r.closing_line}</Text>
        <Footer />
      </Page>
    </Document>
  );
}

export function G11Pdf({ r, name, profile = null, g9Profile = null, verdict = null, issued = "" }: { r: ReportG11; name: string; profile?: ScoreProfile | null; g9Profile?: ScoreProfile | null; verdict?: VerdictResult | null; issued?: string }) {
  const ins = profile ? buildInsights({ profile, g9Profile, verdict }) : null;
  const half = pdfCharts(W_BLOCK / 2 - 12), full = pdfCharts(W_BLOCK);
  return (
    <Document title={`Grade 11 report: ${name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Strata />
        <Brand />
        <Text style={s.kicker}>Grade 11 report · {name}</Text>
        <Text style={s.h1}>“{r.headline.text}”</Text>
        {ins && <>
          <IssuedBox name={name} grade="Grade 11 report" issued={issued || "today"} />
          <StatRow stats={ins.stats} />
          <Text style={[s.h2, { marginTop: 4 }]}>Your dig, layer by layer</Text>
          <LayerRows layers={ins.layers} />
          <HowToRead />
        </>}

        <Text style={s.h2} break minPresenceAhead={70}>What stayed the same</Text>
        {ins?.deltas && (
          <View style={{ flexDirection: "row", gap: 10 }} wrap={false}>
            <Block title="Your pulls: Grade 9 and now" kicker="Interests" flex={1}>{half.Dumbbells({ items: ins.deltas.interests, label: "Interests from Grade 9 to now", w: 330 })}</Block>
            <Block title="How you work: Grade 9 and now" kicker="Wired" flex={1}>{half.Dumbbells({ items: ins.deltas.traits, label: "How you work from Grade 9 to now", w: 330 })}</Block>
          </View>
        )}
        {r.two_years.what_stayed.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h2} minPresenceAhead={70}>What changed</Text>
        {ins && <Block title="Your shape, then and now" kicker="Interests"><View style={{ alignItems: "center" }}>{pdfCharts(260).Radar({ scores: ins.radar, before: ins.radarBefore })}</View></Block>}
        {r.two_years.what_moved.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.p}><Text style={{ fontFamily: "Helvetica-Bold" }}>Who you&apos;re becoming: </Text>{r.two_years.identity_shift}</Text>

        <Text style={s.h2} minPresenceAhead={160}>Your subjects, honestly</Text>
        {ins && ins.subjects.length > 0 && <Block title="Where each subject sits" kicker="Fit and marks" note="Across: how well the subject suits you. Up: how it is going.">{full.SubjectMap({ points: ins.subjects })}</Block>}
        {r.subjects.map((x) => <Text key={x.subject} style={s.p}><Text style={{ fontFamily: "Helvetica-Bold" }}>{x.subject}: </Text>{x.plain}</Text>)}

        <View style={{ borderLeftWidth: 4, borderLeftColor: K.accent, backgroundColor: K.accentSoft, borderRadius: 8, padding: 12, marginTop: 10 }} wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 1.3, color: K.accent }}>YOUR VERDICT</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 16, marginTop: 3 }}>{verdictLabel(r.verdict.code)}</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 3 }}>{r.verdict.headline}</Text>
        </View>
        <Paras t={r.verdict.explanation} />
        <Text style={s.h2} minPresenceAhead={70}>Your pathway</Text>
        {[r.pathway.pass_type_now, r.pathway.gap_to_next, r.pathway.aps_note, r.pathway.grade11_finals_note, r.pathway.career_check].map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h2} minPresenceAhead={70}>Your plan</Text>
        {r.plan.map((p, i) => (
          <View key={i} style={[s.card, { flexDirection: "row", gap: 8 }]} wrap={false}>
            <Check />
            <View style={{ flex: 1 }}><Text>{p.action}</Text><Text style={s.muted}>{p.by_when} · {p.who}</Text></View>
          </View>
        ))}
        <Text style={s.h2} minPresenceAhead={70}>The pattern to watch: {r.pattern_to_watch.name.toLowerCase()}</Text>
        <Text style={s.p}>{r.pattern_to_watch.how_it_shows_up}</Text><Text style={s.p}>Counter-move: {r.pattern_to_watch.counter_move}</Text>
        <View style={{ backgroundColor: K.accent, borderRadius: 10, padding: 14, marginTop: 10 }} wrap={false}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 1.3, color: "#ffffff" }}>YOUR FIRST MOVE · {r.first_move.by_when.toUpperCase()}</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, color: "#ffffff", marginTop: 4, lineHeight: 1.3 }}>{r.first_move.action}</Text>
        </View>
        <Text style={s.closing}>{r.closing_line}</Text>
        <Footer />
      </Page>
    </Document>
  );
}

export function TeacherPdf({ t }: { t: TeacherSummary }) {
  return (
    <Document title={`Teacher summary: ${t.learner_first_name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Strata />
        <Brand />
        <Text style={s.kicker}>Teacher summary · shared by the learner</Text>
        <Text style={s.h1}>{t.learner_first_name}: {t.touchpoint === "G9" ? "Grade 9 report" : "Grade 11 report"}</Text>
        <Text style={s.h3}>Learns best when</Text><Text style={s.p}>{t.learns_best_when}</Text>
        <Text style={s.h3}>Strengths</Text>{t.strengths.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h3}>Recommendation</Text><Text style={s.p}>{t.recommendation}</Text>
        <Text style={s.h3}>Flags</Text>{t.flags.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h3}>One thing that helps most</Text><Text style={s.p}>{t.one_thing_that_helps}</Text>
        {t.quality_note ? <Text style={s.muted}>{t.quality_note}</Text> : null}
        <Footer />
      </Page>
    </Document>
  );
}

export function ParentPdf({ p, name }: { p: ParentSummary; name: string }) {
  return (
    <Document title={`Summary for family: ${name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Strata />
        <Brand />
        <Text style={s.kicker}>Shared by {name}</Text>
        <Text style={s.h1}>A summary from {name}</Text>
        <Text style={s.h3}>At their best</Text>{p.at_their_best.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h3}>Recommendation</Text><Text style={s.p}>{p.recommendation_plain}</Text>
        <Text style={s.h3}>What they need from home</Text>{p.what_they_need_from_home.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h3}>Questions you could ask this week</Text>{p.questions_to_ask.map((x, i) => <Text key={i} style={s.p}>{i + 1}. {x}</Text>)}
        <Footer />
      </Page>
    </Document>
  );
}

export const renderPdf = (doc: React.ReactElement) => renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
export { pathwayName };
