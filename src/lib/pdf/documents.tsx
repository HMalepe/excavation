import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { pathwayName } from "@/lib/scoring/doors";
import type { ParentSummary, ReportG9, ReportG11, TeacherSummary } from "@/lib/ai/schemas";

// Print-friendly: light paper, the brand amber only as an accent. Built-in fonts (no downloads).
const s = StyleSheet.create({
  page: { padding: 44, fontFamily: "Helvetica", fontSize: 10.5, lineHeight: 1.45, color: "#1d1a15" },
  kicker: { fontSize: 8, letterSpacing: 2, color: "#8a6a24", textTransform: "uppercase", marginBottom: 6 },
  h1: { fontFamily: "Times-Roman", fontSize: 22, marginBottom: 14, lineHeight: 1.2 },
  h2: { fontFamily: "Times-Bold", fontSize: 13.5, marginTop: 14, marginBottom: 5, color: "#3a2f1d" },
  h3: { fontFamily: "Helvetica-Bold", fontSize: 10.5, marginTop: 6, marginBottom: 2 },
  p: { marginBottom: 6 },
  muted: { color: "#6b6152", fontSize: 9 },
  card: { borderWidth: 1, borderColor: "#d9cfbd", borderRadius: 6, padding: 9, marginBottom: 8 },
  closing: { fontFamily: "Times-Italic", fontSize: 15, marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#d9cfbd" },
  row: { flexDirection: "row", gap: 8 },
  cell: { flex: 1 },
  footer: { position: "absolute", bottom: 22, left: 44, right: 44, fontSize: 7.5, color: "#8b8170" },
});

const Footer = () => (
  <Text style={s.footer} fixed>
    The Excavation · reflective insights to support a decision, not a diagnosis or an instruction. Requirements differ between universities and change yearly — check the prospectus.
  </Text>
);
const Paras = ({ t }: { t: string }) => <>{t.split(/\n{2,}/).map((x, i) => <Text key={i} style={s.p}>{x}</Text>)}</>;

export function G9Pdf({ r, name }: { r: ReportG9; name: string }) {
  return (
    <Document title={`Foundation Report — ${name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Grade 9 Foundation Report · {name}</Text>
        <Text style={s.h1}>“{r.headline.text}”</Text>
        <Text style={s.h2}>Your shape</Text>
        <Text style={s.h3}>What you&apos;d love doing</Text><Text style={s.p}>{r.shape.interests_plain}</Text>
        <Text style={s.h3}>How you&apos;re wired</Text><Text style={s.p}>{r.shape.personality_plain}</Text>
        <Text style={s.h3}>What matters most</Text><Text style={s.p}>{r.shape.values_plain}</Text>
        {r.shape.quality_note ? <Text style={s.muted}>{r.shape.quality_note}</Text> : null}
        <Text style={s.h2}>Who you are</Text><Paras t={r.who_you_are} />
        <Text style={s.h2}>How you work</Text><Paras t={r.how_you_work} />
        <Text style={s.h2}>Your subject options</Text>
        {r.subject_options.fits.map((f, i) => (
          <View key={f.combination_id} style={s.card} wrap={false}>
            <Text style={s.h3}>{i + 1}. {f.name}</Text>
            <Text style={s.p}>{f.why}</Text>
            <View style={s.row}>
              <View style={s.cell}><Text style={s.muted}>Keeps open: {f.doors_open.join(" · ") || "—"}</Text></View>
              <View style={s.cell}><Text style={s.muted}>Closes: {f.doors_closed.join(" · ") || "Nothing major"}</Text></View>
            </View>
          </View>
        ))}
        {r.subject_options.cautions.map((c) => (
          <View key={c.combination_id} style={s.card} wrap={false}>
            <Text style={s.h3}>Be careful with ({c.type === "competence_trap" ? "competence trap" : "a stretch"})</Text>
            <Text>{c.why}</Text>
          </View>
        ))}
        <Text style={s.h3}>Maths</Text><Text style={s.p}>{r.subject_options.maths_gate}</Text>
        <Text style={s.muted}>{r.subject_options.school_check}</Text>
        <Text style={s.h2}>The pattern to watch: {r.pattern_to_watch.name.toLowerCase()}</Text>
        <Text style={s.p}>{r.pattern_to_watch.how_it_shows_up}</Text>
        <Text style={s.p}>Early warning: {r.pattern_to_watch.early_warning}</Text>
        <Text style={s.p}>Counter-move: {r.pattern_to_watch.counter_move}</Text>
        <Text style={s.h2}>Your first move ({r.first_move.by_when})</Text><Text style={s.p}>{r.first_move.action}</Text>
        <Text style={s.h2}>The question we&apos;ll ask you in Grade 11</Text><Text style={s.p}>“{r.grade11_question}”</Text>
        <Text style={s.closing}>{r.closing_line}</Text>
        <Footer />
      </Page>
    </Document>
  );
}

export function G11Pdf({ r, name }: { r: ReportG11; name: string }) {
  return (
    <Document title={`Confirmation Report — ${name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Grade 11 Confirmation Report · {name}</Text>
        <Text style={s.h1}>“{r.headline.text}”</Text>
        <Text style={s.h2}>Two years: what stayed</Text>{r.two_years.what_stayed.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h2}>Two years: what moved</Text>{r.two_years.what_moved.map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.p}>Who you&apos;re becoming: {r.two_years.identity_shift}</Text>
        <Text style={s.h2}>Your subjects, honestly</Text>{r.subjects.map((x) => <Text key={x.subject} style={s.p}>{x.subject} — {x.plain}</Text>)}
        <Text style={s.h2}>Verdict: {r.verdict.code.replace(/_/g, " ")} — {r.verdict.headline}</Text><Paras t={r.verdict.explanation} />
        <Text style={s.h2}>Your pathway</Text>
        {[r.pathway.pass_type_now, r.pathway.gap_to_next, r.pathway.aps_note, r.pathway.grade11_finals_note, r.pathway.career_check].map((x, i) => <Text key={i} style={s.p}>• {x}</Text>)}
        <Text style={s.h2}>Your plan</Text>
        {r.plan.map((p, i) => <View key={i} style={s.card} wrap={false}><Text>☐ {p.action}</Text><Text style={s.muted}>{p.by_when} · {p.who}</Text></View>)}
        <Text style={s.h2}>The pattern to watch: {r.pattern_to_watch.name.toLowerCase()}</Text>
        <Text style={s.p}>{r.pattern_to_watch.how_it_shows_up}</Text><Text style={s.p}>Counter-move: {r.pattern_to_watch.counter_move}</Text>
        <Text style={s.h2}>Your first move ({r.first_move.by_when})</Text><Text style={s.p}>{r.first_move.action}</Text>
        <Text style={s.closing}>{r.closing_line}</Text>
        <Footer />
      </Page>
    </Document>
  );
}

export function TeacherPdf({ t }: { t: TeacherSummary }) {
  return (
    <Document title={`Teacher summary — ${t.learner_first_name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Teacher summary · shared by the learner</Text>
        <Text style={s.h1}>{t.learner_first_name} — {t.touchpoint === "G9" ? "Grade 9 Foundation" : "Grade 11 Confirmation"}</Text>
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
    <Document title={`Summary for family — ${name}`} author="The Excavation">
      <Page size="A4" style={s.page}>
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
