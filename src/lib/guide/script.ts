/**
 * The Guide's question scripts (spec 03 §3–5, spec 05 §4), rendered as text for the prompt.
 * Q13–Q15 (Grade 9) are score-driven templates; we fill them deterministically here instead of
 * asking the model to, so the same scores always produce the same questions.
 */
import { valueCards } from "@/lib/config/questionBank";
import type { ScoreProfile } from "@/lib/scoring/types";

export const G9_OPENING = (first: string) =>
  `Hey ${first}. Thanks for getting through the first part — that was the long bit.

This part is different. No multiple choice. I'm going to ask you about 20 questions, one at a time, and I want the real answer, not the one that sounds good. Nobody at school sees this conversation unless you choose to share it.

Short answers are fine. Long answers are better. If you want to stop, there's a pause button at the top, and everything is saved.

Ready? First one's quick.`;

export const G9_CLOSING = `That's everything. Thank you — you were honest, and that's what makes the next part useful.

Your report is being put together now. It'll show you how you're wired, the subject combinations that fit you best, which ones to be careful with, and one thing to do this week.

One last thing: in Grade 11 we'll ask you some of these questions again. It'll be interesting to see what stays the same.`;

export const G11_OPENING = (first: string) =>
  `Hey ${first}. Two years ago you sat down and told us who you were. Today's about checking that against two years of real life.

Same deal as last time: one question at a time, real answers over good-sounding ones, and nobody at school sees this unless you share it.

Let's start with how things have actually been.`;

export const G11_CLOSING = `That's it. Thank you for being straight with me.

Your report will show what's stayed the same since Grade 9, what's moved, an honest read on each subject, and a clear recommendation, with dates.

Whatever it says, you're deciding with real information now. Most people never get that.`;

const Q13: Record<string, string> = {
  R: "Your answers say you'd enjoy building and fixing things more than most people your age. When did you last make or fix something with your hands? What happened?",
  I: "You lit up at the figuring-things-out activities. What's a question you've gone looking for the answer to, just because you wanted to know?",
  A: "Making things — songs, designs, videos, stories — scored highest for you. What have you made that you were actually proud of?",
  S: "Helping and teaching people came out on top for you. Tell me about a time you helped someone and it really mattered.",
  E: "Leading, convincing and selling scored highest for you. When have you got people to follow an idea of yours?",
  C: "Organising and getting things exactly right came out strongest for you. Where in your life do people rely on you to keep things in order?",
  flat: "Nothing stood out strongly on the activities list. That's common at your age. If you could spend a whole school day on one kind of thing, what would it be?",
};
const Q14: Record<string, string> = {
  foreclosure: "You sound fairly sure about [the career they've mentioned, or 'your direction']. Whose idea was it first? If nobody had ever suggested it, do you think you'd have found it yourself?",
  diffusion: "If you had to bet on one direction for the next three years — just a bet, not a promise — what would you bet on?",
  moratorium: "It sounds like you're weighing up a few options. What are they, and what's making it hard to choose?",
  achievement: "You seem clear about where you're heading. What would have to happen for you to change your mind?",
};

/** spec 03 §4 Section D — "Flat profile (no type > 60)". */
export function fillQ13(p: ScoreProfile): string {
  const scores = Object.values(p.interests.scores).filter((v): v is number => typeof v === "number");
  if (!scores.length || Math.max(...scores) <= 60) return Q13.flat!;
  return Q13[p.interests.code[0]!] ?? Q13.flat!;
}
export const fillQ14 = (p: ScoreProfile) => Q14[p.identity.status ?? "diffusion"]!;
export function fillQ15(p: ScoreProfile): string {
  const top = valueCards.find((c) => c.id === p.values?.top3[0]);
  return top
    ? `You put "${top.text}" at the top of your cards. Tell me about a time that value made a decision for you.`
    : "Think about what matters most to you. Tell me about a time that made a decision for you.";
}

export function g9Script(p: ScoreProfile): string {
  return `SECTION A — Quick fire (Q1–Q4). Intro line: "These first four — answer fast. First thing that comes to mind."
Q1: Saturday morning. No school, nobody needs anything from you. What do you actually do in the first hour?  (follow-up: "What does that feel like while you're doing it?")
Q2: Finish this: "I feel most like myself when I'm…"  (no follow-up; their exact words are stored for Grade 11)
Q3: Finish this: "I feel least like myself when I'm…"
Q4: One word that describes you that your classmates probably wouldn't use.  (follow-up: "Where does that version of you come out?")

SECTION B — Before school got to you (Q5–Q8). Intro line: "Let's go back a bit — before marks and subjects mattered."
Q5: When you were around 6 to 10 — what was the thing you could do for hours without noticing time pass?  (follow-up: "What exactly about it pulled you in — making it, figuring it out, the people, winning?")  ← most important answer in this section
Q6: What's the earliest time you remember being proud of yourself — not because anyone praised you, just because you knew you'd done something well?  (follow-up: "What had you done?")
Q7: Has any adult ever told you what they think you'll become one day? What did they say?  (follow-up: "Does that still fit you?")
Q8: Is there something you used to love doing that you've stopped? Why did you stop?  (follow-up: "Do you miss it?")
CHECKPOINT 1 (after Q8): 2–3 sentences linking Q1, Q5 and Q8, or naming the thread that connects them.

SECTION C — Energy (Q9–Q12). Intro line: "Now about energy. Some things are hard but leave you feeling good. Some are easy but leave you flat."
Q9: Tell me about a time at school — any lesson, sport, project, anything — when you felt properly switched on.  (follow-up: "What part of it did that?")
Q10: Now the opposite: a time you were doing what you were supposed to and doing it fine, but felt completely flat inside.
Q11: What do people come to you for? Something you're the go-to person for.  (follow-up: "Do you get tired of being that person, or not?")
Q12: Is there a subject you're good at — your marks say so — but that you honestly don't enjoy?  (follow-up: "If the marks stayed the same, would you still choose it?")  ← competence trap
CHECKPOINT 2 (after Q12): name the energy pattern in plain words: what fills them up vs what empties them.

SECTION D — Score check-ins (Q13–Q15). Already filled from their answers; you may refer to their answers in plain words from here.
Q13: ${fillQ13(p)}
Q14: ${fillQ14(p)}
Q15: ${fillQ15(p)}

SECTION E — What makes you come alive (Q16–Q18). Intro line: "These matter most. Don't tell me what sounds good — tell me what's true."
Q16: When did you last completely forget about your phone because you were so into something? What were you doing?  (follow-up: "What was it about that?")
Q17: Is there a topic that makes you talk faster and get louder when it comes up?  (follow-up: "Why that one?")
Q18: What makes you properly angry — not about your own life, but something in the world you think someone should fix?  (follow-up: "What should exist that doesn't?")
CHECKPOINT 3 (after Q18): the aliveness synthesis — 2–3 sentences showing how their flow states, interests and anger point in a direction.

SECTION F — Final two (Q19–Q20). Intro line: "Last two. Answer them like nobody's watching."
Q19: You're 30. It's an ordinary Tuesday. Walk me through it — where are you, what are you working on, who's around you?  (follow-up: "What's the problem you're solving that day?")
Q20: Imagine nobody — not your parents, teachers or friends — would be disappointed whatever you chose. Which subjects would you pick for Grade 10?  (follow-up: "Is that different from what you were planning? Why?")  ← the unpressured choice`;
}

export interface G9Callbacks { q2_most_myself: string | null; q19_future_tuesday: string | null; headline: string | null }

export function g11Script(cb: G9Callbacks, anyBelow50: boolean, failing: string[]): string {
  const q2 = cb.q2_most_myself ? `In Grade 9 you said you feel most like yourself when you're "${cb.q2_most_myself}". Still true?` : `In Grade 9 we asked when you feel most like yourself. What would you say now?`;
  const q13 = cb.q19_future_tuesday ? `In Grade 9 you described an ordinary Tuesday at 30 like this: "${cb.q19_future_tuesday}". Read it. What would you change?` : `Picture an ordinary Tuesday when you're 30. Walk me through it — and what's changed in that picture since Grade 9?`;
  return `SECTION A — Check-in (Q1–Q3)
Q1: What's one thing about you that's genuinely different from Grade 9?  (follow-up: "When did you notice it?")
Q2: ${q2}  (follow-up: "What would you say now?")  ← callback, must be used
Q3: Which subject surprised you most — better or worse than you expected?  (follow-up: "What made the difference?")

SECTION B — Subject reality (Q4–Q8). At Q4–Q6 help them separate the subject itself, how it's taught/the class, and how it's going (marks). Ask, don't assume.
Q4: Which subject do you actually look forward to? What is it about that one?  (follow-up: "Is it the subject itself or the class / teacher?")
Q5: Which subject do you dread? Same question: is it the subject, or how it's going?
Q6: ${anyBelow50 ? `Tell me the story of ${failing.join(" / ")}. When did it start going wrong?  (follow-up: "What have you tried so far?")` : "SKIP SILENTLY — no subject is below 50%."}
Q7: In the last six months, when did time disappear for you — in or out of school?  (follow-up: "What exactly were you doing?")
Q8: Is there something you're good at right now that drains you?  (follow-up: "If the marks stayed the same, would you drop it?")

SECTION C — Direction (Q9–Q12)
Q9: Where are you heading after matric, as of today? How did you land there?
Q10: Whose voice is loudest in your plan right now — yours, family, friends, money, something else?  (follow-up: "If that voice went quiet, would the plan change?")
Q11: What have you actually done to test that direction — people you've spoken to, things you've tried?  (follow-up: "What's one thing you could do before the June holidays?")
Q12: If your marks were guaranteed, what would you study after school?  (follow-up: "What's stopping that from being the plan?")

SECTION D — Final three (Q13–Q15)
Q13: ${q13}  ← callback, must be used
Q14: What are you afraid will happen if you change direction? And if you don't?
Q15: What's one decision you need to make before the end of Grade 11?  (follow-up: "When will you make it?" — the decision MUST have a "by when"; ask once if missing)`;
}
