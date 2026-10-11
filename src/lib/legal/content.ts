/**
 * Plain-language legal pages. DRAFTS: they describe what the system actually does today and must be reviewed by the
 * attorney before the pilot (spec 09 §7). Set LEGAL_APPROVED=true after sign-off to remove the draft banner.
 */
export const legalApproved = () => process.env.LEGAL_APPROVED === "true";
export const LEGAL_UPDATED = "11 October 2026";

export interface Section { heading: string; body: string[] }
export interface LegalDoc { title: string; intro: string; sections: Section[] }

export const PRIVACY: LegalDoc = {
  title: "Privacy notice",
  intro: "This explains what The Excavation does with information about learners and the adults who use it. We wrote it in plain language. If anything is unclear, ask us.",
  sections: [
    { heading: "Who we are", body: [
      "The Excavation × Know Thy Self, School Edition, is a tool that helps Grade 9 and Grade 11 learners think about subjects and careers.",
      "Information Officer: Holiday Malepe. Contact: privacy@theexcavation.co.za.",
    ] },
    { heading: "What we collect", body: [
      "From learners: answers to the questions, checks and tasks; what they write to The Guide (the AI chat); school marks (from the school, or typed in by the learner); first name, surname, grade, class and school.",
      "From schools: the class list, marks exports, and the contact details of the staff member who looks after safeguarding.",
      "From staff: name, work email and a password (stored scrambled, never readable).",
      "We do not collect ID numbers, medical information, home addresses or family finances. Learners log in with a code, not an email address.",
    ] },
    { heading: "Why, and on what basis", body: [
      "We only process a learner's information after a parent or guardian has signed a consent form and the learner has agreed on screen. The purpose is to give the learner their report and help them choose subjects.",
      "Anonymised data (no names) may be used to improve the tool and for research, only if the parent or guardian agreed. Saying no changes nothing for the learner.",
    ] },
    { heading: "Who sees it", body: [
      "The learner sees their own report first. A trained reviewer at The Excavation reads each report before the learner does, while the service is new.",
      "A teacher sees a one-page summary only if the learner chooses to share it. A parent or guardian sees a summary only if the learner chooses to share it, through a private link the learner controls.",
      "A school's admin sees group statistics only, never an individual's answers, scores or chat. Any group smaller than 10 learners is hidden.",
      "The one exception: if what a learner writes suggests they may be unsafe, we show them where to get help and we tell the school's designated safeguarding contact, so an adult can help.",
    ] },
    { heading: "Companies that help us run it", body: [
      "These companies process information for us under written agreements: a database and login provider (Supabase, data stored in Ireland), a hosting provider (Vercel, Ireland), an AI provider (Anthropic, United States) that reads learners' answers to write the chat replies and reports, and an email provider (Resend) that sends safeguarding alerts to schools.",
      "Because some of these are outside South Africa, learners' information may leave the country. The AI provider is not allowed to use it to train its systems. Guardians agree to this on the consent form.",
    ] },
    { heading: "How long we keep it", body: [
      "Until one year after the learner finishes Grade 12. Then we delete it. If a guardian agreed, we keep anonymised data without names for research.",
      "Records about a safeguarding concern follow legal advice and may be kept longer.",
    ] },
    { heading: "How we protect it", body: [
      "Access is limited by role and enforced in the database itself. Everything is encrypted in transit. The AI chat is checked for safety before it is answered. Every time staff look at identifiable information, we write it down. Anyone with access to identifiable learner data signs a confidentiality agreement.",
      "If there is a breach, we tell the Information Regulator and the affected guardians as soon as reasonably possible.",
    ] },
    { heading: "Your rights", body: [
      "A parent or guardian can ask to see, correct or delete their child's information, withdraw consent, or take a copy. Write to privacy@theexcavation.co.za or ask the school. We will confirm who you are first.",
      "If you are unhappy with how we handled something, you can complain to the Information Regulator of South Africa: inforegulator.org.za.",
    ] },
  ],
};

export const TERMS: LegalDoc = {
  title: "Terms of use",
  intro: "These are the ground rules for using The Excavation. They are short on purpose.",
  sections: [
    { heading: "What it is, and what it isn't", body: [
      "The Excavation gives reflective insights to help a learner think about subjects and careers. It is not a diagnosis, not a psychological test result, not a guarantee of a place at any university, and not a replacement for advice from a teacher, a counsellor or a doctor.",
      "University and college requirements differ and change every year. Always check the prospectus before you decide.",
    ] },
    { heading: "Learners", body: [
      "Answer honestly. There are no right answers. Nothing here is marked.",
      "You can pause or stop at any time. If you ever feel unsafe, tell an adult you trust. Numbers for free help are shown in the app.",
      "The Guide is an AI, not a person. Don't type other people's private details into it.",
    ] },
    { heading: "Schools and staff", body: [
      "Use your login only for your own role and your own school. Never share your password. Never copy, forward or screenshot a learner's personal information outside the tool.",
      "Safeguarding alerts must be confirmed on the day you receive them.",
    ] },
    { heading: "Our promises", body: [
      "We will protect learners' information as described in the privacy notice, and we will not sell it or use it for advertising.",
      "We will tell schools if something changes in a way that affects them.",
    ] },
    { heading: "Limits", body: [
      "We work hard to keep the service available and accurate, but we cannot promise it will never be interrupted or contain mistakes. To the extent the law allows, we are not responsible for decisions made using a report.",
    ] },
  ],
};

export const COOKIES: LegalDoc = {
  title: "Cookies and stored settings",
  intro: "The Excavation uses only what it needs to work. There are no advertising or tracking cookies, and no analytics that follow people around.",
  sections: [
    { heading: "What is stored on your device", body: [
      "A login cookie keeps you signed in. It is required, and it is removed when you log out.",
      "Your screen choices are stored in your browser: light or dark theme, and whether you want read-aloud slowed down. These stay on your device.",
    ] },
    { heading: "What is not", body: [
      "We do not use advertising cookies, social-media trackers or third-party analytics. If a page fails to load, the app sends us a short error note (the page and the error, never your answers).",
    ] },
    { heading: "Read-aloud and voice", body: [
      "Read-aloud uses your phone's own voice and nothing is sent anywhere. Voice input (the microphone button) uses your browser's speech service, which may send audio to your browser provider. It is optional: you can type instead.",
    ] },
  ],
};
