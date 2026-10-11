import "server-only";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CONSENT_BLOCKS, CONSENT_CHOICES, CONSENT_FORM_VERSION, CONSENT_INTRO, DRAFT_BANNER } from "@/lib/consent/form";

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 40, paddingHorizontal: 46, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.33, color: "#0e1a2b" },
  bar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "#1b57e5" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 0.4, marginBottom: 8 },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 15, marginBottom: 8, lineHeight: 1.2 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 9.5, marginTop: 5, marginBottom: 1 },
  p: { marginBottom: 2.5 },
  draft: { backgroundColor: "#fdecec", borderWidth: 1, borderColor: "#c62828", borderRadius: 5, padding: 5, marginBottom: 8, color: "#c62828", fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  choice: { flexDirection: "row", gap: 7, marginBottom: 4 },
  box: { width: 11, height: 11, borderWidth: 1.3, borderColor: "#0e1a2b", borderRadius: 2, marginTop: 1 },
  line: { flexDirection: "row", alignItems: "flex-end", marginTop: 9, gap: 8 },
  rule: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#0e1a2b", height: 14 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  foot: { position: "absolute", bottom: 20, left: 46, right: 46, fontSize: 7.5, color: "#566276" },
});

export interface ConsentLearner { name: string; grade: number; school: string; ref?: string | null }

/** One page per learner, pre-filled with their name, so a parent signs for the right child. */
export function ConsentFormPdf({ learners, approved }: { learners: ConsentLearner[]; approved: boolean }) {
  return (
    <Document title="Guardian consent form" author="The Excavation">
      {learners.map((l, i) => (
        <Page key={i} size="A4" style={s.page}>
          <View style={s.bar} fixed />
          <Text style={s.brand}>THE EXCAVATION</Text>
          {!approved && <Text style={s.draft}>{DRAFT_BANNER}</Text>}
          <Text style={s.h1}>{CONSENT_INTRO({ learner: l.name, grade: l.grade, school: l.school })}</Text>
          {CONSENT_BLOCKS.map((b) => (
            <View key={b.heading} wrap={false}>
              <Text style={s.h2}>{b.heading}</Text>
              {b.body.map((t, k) => <Text key={k} style={s.p}>{t}</Text>)}
            </View>
          ))}
          <Text style={[s.h2, { marginTop: 7 }]}>Please tick</Text>
          {CONSENT_CHOICES.map((c) => (
            <View key={c.key} style={s.choice} wrap={false}>
              <View style={s.box} />
              <Text style={{ flex: 1 }}>{c.text}{c.required ? " (required)" : ""}</Text>
            </View>
          ))}
          <View style={s.line}><Text style={s.label}>Parent or guardian name</Text><View style={s.rule} /></View>
          <View style={s.line}><Text style={s.label}>Relationship to learner</Text><View style={s.rule} /><Text style={s.label}>Date</Text><View style={[s.rule, { flex: 0.5 }]} /></View>
          <View style={s.line}><Text style={s.label}>Signature</Text><View style={s.rule} /></View>
          <Text style={s.foot} fixed>Form version {CONSENT_FORM_VERSION}{l.ref ? ` · learner ref ${l.ref}` : ""} · Return to the class teacher. Questions: privacy@theexcavation.co.za</Text>
        </Page>
      ))}
    </Document>
  );
}
