/**
 * The guardian consent form (spec 09 §3.2), as data so the printed PDF, the register and the tests share one
 * source. The wording is the spec's draft in plain language. It is NOT approved for use until the attorney has
 * signed it off (spec 09 §7): set CONSENT_FORM_APPROVED=true then, and the DRAFT banner disappears from the PDF.
 */
export const CONSENT_FORM_VERSION = "2026-10-v1";
export const consentFormApproved = () => process.env.CONSENT_FORM_APPROVED === "true";

export interface FormBlock { heading: string; body: string[] }

export const CONSENT_INTRO = (a: { learner: string; grade: number; school: string }) =>
  `Consent for ${a.learner}, Grade ${a.grade}, ${a.school}`;

export const CONSENT_BLOCKS: FormBlock[] = [
  { heading: "What this is", body: [
    "Your child's school is offering The Excavation. It helps learners choose subjects and think about careers.",
    "Your child answers questions about what they enjoy, how they work, what matters to them and how they study. They try a few short tasks. Then they chat with an AI guide about their experiences. They get a personal report.",
  ] },
  { heading: "What we collect", body: [
    "Their answers, a written copy of the chat, their school marks (from the school, or typed in by your child), and their name, grade and school.",
    "We do not collect ID numbers, medical information, home addresses or family finances.",
  ] },
  { heading: "Who sees it", body: [
    "Your child sees their own report first. Their teacher sees a short summary only if your child chooses to share it. You see a summary if your child chooses to share it.",
    "The school never sees the chat. Trained reviewers at The Excavation read each report before your child does, while the service is new.",
  ] },
  { heading: "The AI", body: [
    "Your child's answers are processed by an AI service that may be run outside South Africa. It is not allowed to use your child's information to train its systems.",
    "The AI guide tells your child, in plain words, that it is an AI.",
  ] },
  { heading: "Their safety", body: [
    "If your child's answers suggest they may be unsafe, we show them where to get help, and we tell the school's designated staff member so that an adult can help. This is the only time we share anything from the chat without your child's say-so.",
  ] },
  { heading: "How long we keep it", body: [
    "Until one year after your child finishes Grade 12, then we delete it. If you agree below, anonymised data (no names) may be kept longer to improve the tool and for research.",
  ] },
  { heading: "Your rights", body: [
    "You can ask to see, correct or delete your child's information at any time, and you can withdraw this consent at any time. Write to privacy@theexcavation.co.za or ask the school. Withdrawing means your child stops, and their information is deleted if you ask.",
    "Information Officer: Holiday Malepe.",
  ] },
];

/** Required for the service to run (all three must be ticked); the fourth is optional and never blocks anything. */
export const CONSENT_CHOICES = [
  { key: "consent_service", required: true, text: "I agree to my child taking part and to their personal information being processed as described above." },
  { key: "consent_ai_crossborder", required: true, text: "I agree to their answers being processed by an AI service that may be outside South Africa." },
  { key: "consent_wellbeing", required: true, text: "I agree that if my child seems to be unsafe, the school's designated staff member may be told so an adult can help." },
  { key: "consent_research", required: false, text: "Optional: I agree to anonymised data being used to improve The Excavation and for research. Saying no changes nothing for my child." },
] as const;

export const DRAFT_BANNER = "DRAFT: not approved for use until reviewed by legal counsel. Parental-access policy and cross-border wording to be confirmed.";
