/**
 * spec 06 §4, §7 — plan actions. The actions come from these tables; the AI only personalises
 * the wording (spec 07 3F rule 6). Every action has a "who" and a "by when".
 */
import type { Cause, Plan, PlanAction, SubjectResult, VerdictCode } from "./types";

const a = (text: string, who: PlanAction["who"], by_when: string): PlanAction => ({ text, who, by_when });

export function rescuePlan(subject: string, cause: Cause | null): Plan {
  const S = subject;
  const actions: Record<Cause, PlanAction[]> = {
    foundation_gap: [
      a(`List the 3 Grade 10 ${S} topics that feel shakiest and show the list to your ${S} teacher.`, "you + subject teacher", "This week"),
      a(`Two 30-minute catch-up sessions a week on those topics, using free resources (e.g. Siyavula for Maths and Science, Khan Academy).`, "you", "Every week until the June exams"),
      a(`Write one full ${S} past paper under test conditions.`, "you", "Before the June exams"),
    ],
    study_method: [
      a(`Swap re-reading for self-testing in ${S}: close the book, write what you remember, then check it.`, "you", "Starting this week"),
      a(`Three fixed 30-minute ${S} slots a week, same time and place.`, "you", "Every week until the June exams"),
      a(`One past-paper question per slot, marked against the memo.`, "you", "Every slot"),
    ],
    teaching_environment: [
      a(`Find one alternative explanation source for ${S}: a video series, a study group or an older learner.`, "you", "This week"),
      a(`Ask your ${S} teacher one specific question each week, in person or by note.`, "you + subject teacher", "Every week this term"),
      a(`Join or start a ${S} study group of 3–4 people.`, "you", "Before the end of this term"),
    ],
    circumstances: [
      a(`Find a study space at school for ${S}: the library, a classroom after hours, or a homework club.`, "you", "This week"),
      a(`If home responsibilities are heavy, consider telling your LO teacher; schools can sometimes help.`, "you + LO teacher", "When you're ready"),
      a(`Plan ${S} study around the times that are actually free, even if they're short.`, "you", "Every week"),
    ],
    fit: [
      a(`Check whether the career you're aiming for actually needs ${S}.`, "you + LO teacher", "This week"),
      a(`If it doesn't and a switch is allowed, follow the one-subject change steps with your LO teacher.`, "you + LO teacher", "Before the school's change deadline"),
      a(`If it does, write down why ${S} matters for the future you described, and go back to it when motivation drops.`, "you", "This week"),
    ],
    wellbeing: [
      a(`Talk to one adult you trust this week: your LO teacher, a counsellor or family.`, "you", "This week"),
      a(`Keep the support numbers somewhere you can find them (shown at the end of this report).`, "you", "Today"),
      a(`Your ${S} study plan is paused until that conversation has happened. Marks matter less than you do.`, "you", "Until you've spoken to someone"),
    ],
  };
  return { kind: "rescue", subject, cause: cause ?? "not_measured", actions: actions[cause ?? "study_method"] };
}

export function verdictPlan(verdict: VerdictCode, subjects: SubjectResult[], deadline: string | null, switchKnown: boolean): Plan | null {
  const due = deadline ? `Before ${deadline}` : "This week";
  const ask = switchKnown ? null : a("Ask your LO teacher or subject advisor whether a subject change is still allowed.", "you + LO teacher", "This week");
  const off = subjects.filter((s) => s.quadrant === "REDIRECT").map((s) => s.subject);
  switch (verdict) {
    case "CONFIRM":
      return { kind: "confirm", actions: [
        a("Pick your target programme and write down its minimum APS and subject marks.", "you", "Before the end of Term 1"),
        a("Choose the one subject where 5–10 more percent would raise your APS most, and add one extra 30-minute slot a week for it.", "you", "Every week until the Grade 11 finals"),
        a("Put the application opening dates for your target institutions in your calendar.", "you", "Before the June holidays"),
      ] };
    case "RETHINK":
      return { kind: "rethink", actions: [
        a("Keep your current subjects. Write down three careers that use them and don't drain you.", "you", "This week"),
        a("Talk to one person working in each of those careers about their actual week.", "you + LO teacher", "Before the June holidays"),
        a("Use the Grade 11 holidays for one job-shadow day or short course in your strongest option.", "you", "Grade 11 holidays"),
      ] };
    case "ADJUST_ONE":
      return { kind: "adjust_one", actions: [
        ...(ask ? [ask] : []),
        a(`Ask your LO teacher what replacing ${off.join(", ") || "the subject"} would involve: options, timetable and catch-up work.`, "you + LO teacher", due),
        a("Talk it through with your family before you decide.", "family", due),
        a("If you switch: get the Grade 10 notes for the new subject and plan catch-up sessions.", "you + subject teacher", "First two weeks after switching"),
      ] };
    case "REDIRECT":
      return { kind: "redirect", actions: [
        ...(ask ? [ask] : []),
        a(`Book a meeting with your LO teacher or subject advisor about changing ${off.join(" and ")}.`, "you + LO teacher", due),
        a("Compare the doors your current and new subjects open, using this report, with your family.", "family", due),
        a("If you change: agree a catch-up plan for each new subject with its teacher.", "you + subject teacher", "First two weeks after switching"),
      ] };
    case "REDIRECT_AFTER_MATRIC":
      return { kind: "redirect_after_matric", actions: [
        a("Changing subjects isn't possible now. Set a pass target of at least 50% for every subject you're keeping.", "you", "This week"),
        a("Research the route after matric: upgrading subjects, bridging programmes or TVET.", "you + LO teacher", "Before the June holidays"),
        a("Choose one post-matric route and write down its first step and date.", "you", "Before the end of Grade 11"),
      ] };
    case "RESCUE":
      return null; // rescue plans are per subject
  }
}
