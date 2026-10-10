import { redirect } from "next/navigation";
import { pageLearner } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { itemById, attentionCheckText, questionBank, valueCards, G9_SNAPSHOT_SUBJECTS } from "@/lib/config/questionBank";
import { subjectMap } from "@/lib/config/subjectMap";
import { sectionTitle } from "@/lib/flow/itemPlan";
import { descentFor, type Stage } from "@/lib/flow/stages";
import { getOrCreateSession, hasValidGuardianConsent, advanceTo, loadResponses, progressOf, isOptionalItem } from "@/lib/session/service";
import { marksFor, loadProfile } from "@/lib/pipeline/scoring";
import { g11Pending } from "@/lib/session/g11Actions";
import { g11Subjects } from "@/lib/pipeline/g11";
import { LearnerShell } from "@/components/ui/LearnerShell";
import { Resources } from "@/components/ui/Resources";
import { ScoredLayer, type ItemView } from "@/components/client/ScoredLayer";
import { ValuesSort } from "@/components/client/ValuesSort";
import { Assent, Intake, Snapshot, GuideNotice, TwoYears, MarksG11, PerSubjectLikert, CareerUpdate } from "@/components/client/Steps";
import { GuideChat } from "@/components/client/GuideChat";
import { loadChat } from "@/lib/guide/state";
import { LogoutButton } from "@/components/client/LoginForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your session" };

const PERSONALITY_NOTE =
  "There are no right answers here, and no good or bad personalities. Answer for how you actually are most of the time, not how you'd like to be or how your parents see you.";
const CONTEXT_NOTE = "These three help us suggest practical support. They don't affect your results. Skip any you like.";

function itemView(id: string): ItemView {
  const ac = attentionCheckText(id);
  if (ac) return { id, text: ac.text, points: ac.response.points as [number, string][], optional: false };
  const it = itemById.get(id)!;
  return { id, text: it.text, points: it.response.points as [number, string][], optional: isOptionalItem(id) };
}

export default async function LearnPage() {
  const { learner } = await pageLearner();
  let session = await getOrCreateSession(learner);

  if (!session) {
    return (
      <Centered title="Nothing to do right now">
        <p>The Excavation runs in Grade 9 and Grade 11. Your teacher will let you know when it&apos;s your turn.</p>
        <LogoutButton />
      </Centered>
    );
  }

  // spec 09 §3: block if there is no valid guardian consent. Nothing is collected.
  if (!(await hasValidGuardianConsent(learner.id))) {
    return (
      <Centered title="We need a grown-up's OK first">
        <p>Before you can start, a parent or guardian needs to give consent. Ask your LO teacher for the consent form — it only takes a few minutes.</p>
        <p className="text-muted">Nothing you do here is saved until that&apos;s done.</p>
        <LogoutButton />
      </Centered>
    );
  }
  if (session.stage === "consent") session = await advanceTo(session, "assent");
  if (session.status === "safety_stop" || session.locked_at) redirect("/learn/paused");

  const stage = session.stage as Stage;
  const resources = <Resources compact />;
  const isG9 = session.touchpoint === "G9_FOUNDATION";

  switch (stage) {
    case "assent":
      return <LearnerShell at="Surface"><Assent firstName={learner.first_name} /></LearnerShell>;
    case "intake":
      return <LearnerShell at="Surface"><Intake /></LearnerShell>;

    case "two_years": {
      const { data: g9 } = await adminDb().from("sessions").select("id, reports(content, kind, status)").eq("learner_id", learner.id).eq("touchpoint", "G9_FOUNDATION").maybeSingle();
      const rep = (g9?.reports as { content: { headline?: { text: string }; subject_options?: { fits?: { name: string }[] } }; kind: string; status: string }[] | undefined)
        ?.find((r) => r.kind === "learner" && r.status === "released");
      return (
        <LearnerShell at="Surface">
          <TwoYears headline={rep?.content.headline?.text ?? null} fits={rep?.content.subject_options?.fits?.map((f) => f.name) ?? []} taken={learner.fet_subjects.filter((s) => s !== "Life Orientation")} />
        </LearnerShell>
      );
    }

    case "scored": {
      const plan = session.item_order!;
      const prog = progressOf(session);
      const sec = plan.sections[prog.section]!;
      const at = descentFor("scored", sec.id);
      if (sec.id === "values") {
        return <LearnerShell at={at}><ValuesSort cards={valueCards.map((c) => ({ id: c.id, text: c.text }))} resources={resources} /></LearnerShell>;
      }
      const { likert } = await loadResponses(session.id);
      const remaining = sec.items.slice(prog.item);
      const scale = questionBank.scales.find((s) => s.items?.some((i) => i.id === remaining.find((x) => !x.startsWith("AC"))));
      return (
        <LearnerShell at={at} wide>
          <ScoredLayer
            key={`${sec.id}:${prog.item}`}
            sectionId={sec.id}
            title={sectionTitle(sec.id)}
            stem={scale?.stem}
            intro={sec.id === "personality" ? PERSONALITY_NOTE : sec.id === "context" ? CONTEXT_NOTE : undefined}
            items={remaining.map(itemView)}
            startIndex={prog.item}
            saved={Object.fromEntries(remaining.filter((id) => typeof likert[id] === "number").map((id) => [id, likert[id] as number]))}
            resources={resources}
          />
        </LearnerShell>
      );
    }

    case "snapshot": {
      const m = await marksFor(learner.id, 9);
      const imported = m.rows.some((r) => r.source === "school_import") ? (m.subjects as Record<string, number>) : null;
      return <LearnerShell at="The trench"><Snapshot subjects={G9_SNAPSHOT_SUBJECTS} imported={imported} /></LearnerShell>;
    }

    case "marks": {
      const g11 = await marksFor(learner.id, 11);
      const imported = g11.rows.some((r) => r.source === "school_import") ? await g11Subjects(learner) : null;
      return (
        <LearnerShell at="The trench">
          <MarksG11 imported={imported} subjects={[...subjectMap.subjects.map((s) => s.name), "Home Language", "First Additional Language", "Life Orientation"]} />
        </LearnerShell>
      );
    }

    case "subject_experience": case "failure_cause": {
      const fresh = (await adminDb().from("learners").select("*").eq("id", learner.id).single()).data ?? learner;
      const p = await g11Pending(session, fresh);
      const isSE = stage === "subject_experience";
      const subject = (isSE ? p.se : p.fc)[0];
      if (!subject) redirect("/learn");
      const block = isSE ? questionBank.grade11_only.SUBJECT_EXPERIENCE.items : questionBank.grade11_only.FAILURE_CAUSE.items;
      const points = (block[0]!.response as { points: [number, string][] }).points;
      return (
        <LearnerShell at="The trench">
          <PerSubjectLikert
            key={`${stage}:${subject}`}
            action={stage}
            subject={subject}
            header={isSE ? `${subject} — be honest, nobody from the school sees individual answers.` : `Think about ${subject}.`}
            stem={isSE ? undefined : "How true is each of these?"}
            items={block.map((i) => ({ id: i.id, text: i.text }))}
            points={points}
          />
        </LearnerShell>
      );
    }

    case "career_update": {
      const cu = questionBank.grade11_only.CAREER_UPDATE;
      return <LearnerShell at="The trench"><CareerUpdate cu2Options={cu.find((q) => q.id === "CU2")!.options!} cu3Options={cu.find((q) => q.id === "CU3")!.options!} /></LearnerShell>;
    }

    case "guide_notice": {
      const profile = await loadProfile(session.id);
      const prog = progressOf(session);
      const offerRetake = isG9 && profile?.quality.status === "invalid" && (prog.retakes ?? 0) === 0 && !prog.retake_offered;
      return <LearnerShell at="The floor"><GuideNotice offerRetake={!!offerRetake} /></LearnerShell>;
    }

    case "conversation": {
      const chat = await loadChat(session, learner);
      return <LearnerShell at="The floor"><GuideChat initial={chat} /></LearnerShell>;
    }

    case "processing": case "report":
      redirect("/learn/report");
  }
}

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-5 py-10">
      <h1 className="text-3xl">{title}</h1>
      {children}
    </main>
  );
}
