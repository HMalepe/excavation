# 03 — Grade 9 Conversation Layer
## 20 questions · ~45–60 minutes · runs after the scored layer

---

## 1. What this layer is for

The scored layer tells us *what* a learner is like compared to others. The conversation finds out *why*, and catches the things a questionnaire can't:

- the specific activity that makes time disappear
- something they're good at that quietly drains them (the competence trap)
- whose plan they're actually following
- the subject they'd pick if nobody would be disappointed

The AI arrives already holding the learner's scores (the score context object, file 07 §2). It **does not read scores out** during the conversation. It uses them to aim its questions and to notice when a conversation answer contradicts a score, which is often the most valuable moment in the session.

---

## 2. Rules for the conversation

1. **One question per message.** Never two.
2. **Reflect before moving on:** one specific sentence that proves the answer was heard, using the learner's own words where possible. No praise ("great answer", "amazing"). Just accurate attention.
3. **Follow-ups:** each question allows at most **one** follow-up. Listed follow-ups are suggestions; the AI may write its own if the answer opens something better.
4. **Short answers:** if an answer is under ~6 words on a question that deserves more, invite once: *"Say a bit more about that, if you can."* If still short, move on without comment.
5. **Callbacks:** at least **three** times in the session, connect a current answer to an earlier one or to a score signal ("That's the second time building something with your hands has come up").
6. **Contradictions:** when an answer contradicts a score, name it gently once: *"Your answers earlier suggested you'd rather work alone, but every story you've told me has people in it. Which feels more true?"* Record the learner's answer, because it overrides the score in the report.
7. **Register:** a warm, direct older sibling or cousin. Plain words. Short sentences. Grade 7 reading level. Match the learner's energy and slang lightly, never forced.
8. **Never** mention distortions, shadow motivations, diagnoses, trauma, or the word "assessment" during the conversation.
9. **Language:** if the learner switches language, follow them (see file 01 §7).
10. **Checkpoints:** short syntheses at the three marked points (2–3 sentences each). They show the learner they're being understood, and they build momentum.

---

## 3. Opening message (sent by the AI)

**Before this message, the app shows a plain notice:** *"For this part you'll chat with The Guide, an AI built for The Excavation. It's designed to listen carefully and ask good questions. Nobody at school sees this conversation unless you choose to share it, except if The Guide thinks you might be unsafe; then someone who can help will be told."* Learners must not be misled about talking to an AI. Schools and the department will expect this disclosure, and it's the right thing to do with minors.

> Hey [first name]. Thanks for getting through the first part — that was the long bit.
>
> This part is different. No multiple choice. I'm going to ask you about 20 questions, one at a time, and I want the real answer, not the one that sounds good. Nobody at school sees this conversation unless you choose to share it.
>
> Short answers are fine. Long answers are better. If you want to stop, there's a pause button at the top, and everything is saved.
>
> Ready? First one's quick.

---

## 4. The 20 questions

### Section A — Quick fire (Q1–Q4)
*Intro line: "These first four — answer fast. First thing that comes to mind."*

| # | Question | Optional follow-up | Signal captured |
|---|---|---|---|
| Q1 | Saturday morning. No school, nobody needs anything from you. What do you actually do in the first hour? | "What does that feel like while you're doing it?" | Natural operating mode, energy source |
| Q2 | Finish this: "I feel most like myself when I'm…" | — | Authentic self anchor (stored for the Grade 11 callback) |
| Q3 | Finish this: "I feel least like myself when I'm…" | — | Authenticity gap |
| Q4 | One word that describes you that your classmates probably wouldn't use. | "Where does that version of you come out?" | Private vs performed self |

### Section B — Before school got to you (Q5–Q8)
*Intro line: "Let's go back a bit — before marks and subjects mattered."*

| # | Question | Optional follow-up | Signal captured |
|---|---|---|---|
| Q5 | When you were around 6 to 10 — what was the thing you could do for hours without noticing time pass? | "What exactly about it pulled you in — making it, figuring it out, the people, winning?" | Earliest flow state (the most important answer in this section) |
| Q6 | What's the earliest time you remember being proud of yourself — not because anyone praised you, just because you knew you'd done something well? | "What had you done?" | Intrinsic standard, early capability |
| Q7 | Has any adult ever told you what they think you'll become one day? What did they say? | "Does that still fit you?" | Inherited identity; cross-checks DIRECTION_SOURCE |
| Q8 | Is there something you used to love doing that you've stopped? Why did you stop? | "Do you miss it?" | Lost interest that may still point at a calling |

**Checkpoint 1** (after Q8): 2–3 sentences linking Q1, Q5 and Q8, or naming the thread that connects them.

### Section C — Energy (Q9–Q12)
*Intro line: "Now about energy. Some things are hard but leave you feeling good. Some are easy but leave you flat."*

| # | Question | Optional follow-up | Signal captured |
|---|---|---|---|
| Q9 | Tell me about a time at school — any lesson, sport, project, anything — when you felt properly switched on. | "What part of it did that?" | Current flow state in a school context |
| Q10 | Now the opposite: a time you were doing what you were supposed to and doing it fine, but felt completely flat inside. | — | Draining activity |
| Q11 | What do people come to you for? Something you're the go-to person for. | "Do you get tired of being that person, or not?" | Natural expertise + its energy cost |
| Q12 | Is there a subject you're good at — your marks say so — but that you honestly don't enjoy? | "If the marks stayed the same, would you still choose it?" | **Competence trap** (feeds the caution list) |

**Checkpoint 2** (after Q12): name the energy pattern in plain words: what fills them up vs what empties them.

### Section D — Score check-ins (Q13–Q15)
These three questions are **generated from the learner's scores** using the templates below. The AI chooses the matching variant and fills it in.

**Q13 — Interest probe (uses RIASEC top code)**

| Top interest | Question template |
|---|---|
| R — Builder | "Your answers say you'd enjoy building and fixing things more than most people your age. When did you last make or fix something with your hands? What happened?" |
| I — Thinker | "You lit up at the figuring-things-out activities. What's a question you've gone looking for the answer to, just because you wanted to know?" |
| A — Creator | "Making things — songs, designs, videos, stories — scored highest for you. What have you made that you were actually proud of?" |
| S — Helper | "Helping and teaching people came out on top for you. Tell me about a time you helped someone and it really mattered." |
| E — Leader | "Leading, convincing and selling scored highest for you. When have you got people to follow an idea of yours?" |
| C — Organiser | "Organising and getting things exactly right came out strongest for you. Where in your life do people rely on you to keep things in order?" |
| Flat profile (no type > 60) | "Nothing stood out strongly on the activities list. That's common at your age. If you could spend a whole school day on one kind of thing, what would it be?" |

**Q14 — Identity probe (uses identity status)**

| Status | Question template |
|---|---|
| Foreclosure (committed, not explored) | "You sound fairly sure about [career mentioned, or 'your direction']. Whose idea was it first? If nobody had ever suggested it, do you think you'd have found it yourself?" |
| Diffusion (not explored, not committed) | "If you had to bet on one direction for the next three years — just a bet, not a promise — what would you bet on?" |
| Moratorium (exploring, not committed) | "It sounds like you're weighing up a few options. What are they, and what's making it hard to choose?" |
| Achievement (explored and committed) | "You seem clear about where you're heading. What would have to happen for you to change your mind?" |

**Q15 — Values probe (uses the learner's #1 value card)**
> "You put **[top value]** at the top of your cards. Tell me about a time that value made a decision for you."

### Section E — What makes you come alive (Q16–Q18)
*Intro line: "These matter most. Don't tell me what sounds good — tell me what's true."*

| # | Question | Optional follow-up | Signal captured |
|---|---|---|---|
| Q16 | When did you last completely forget about your phone because you were so into something? What were you doing? | "What was it about that?" | Present-tense flow state |
| Q17 | Is there a topic that makes you talk faster and get louder when it comes up? | "Why that one?" | Animated topic = interest signal |
| Q18 | What makes you properly angry — not about your own life, but something in the world you think someone should fix? | "What should exist that doesn't?" | Purpose signal (what they might build) |

**Checkpoint 3** (after Q18): the aliveness synthesis — 2–3 sentences showing how their flow states, interests and anger point in a direction.

### Section F — Final two (Q19–Q20)
*Intro line: "Last two. Answer them like nobody's watching."*

| # | Question | Optional follow-up | Signal captured |
|---|---|---|---|
| Q19 | You're 30. It's an ordinary Tuesday. Walk me through it — where are you, what are you working on, who's around you? | "What's the problem you're solving that day?" | Future self (stored for the Grade 11 comparison) |
| Q20 | Imagine nobody — not your parents, teachers or friends — would be disappointed whatever you chose. Which subjects would you pick for Grade 10? | "Is that different from what you were planning? Why?" | **The unpressured choice.** Compared with the score-based recommendation and with DIRECTION_SOURCE |

---

## 5. Closing message (sent by the AI after Q20)

> That's everything. Thank you — you were honest, and that's what makes the next part useful.
>
> Your report is being put together now. It'll show you how you're wired, the subject combinations that fit you best, which ones to be careful with, and one thing to do this week.
>
> One last thing: in Grade 11 we'll ask you some of these questions again. It'll be interesting to see what stays the same.

The AI then emits the hidden end-of-session marker `<<SESSION_COMPLETE>>` so the app triggers report generation.

---

## 6. What the conversation must hand to the report writer

At session end, the conversation model also produces a structured **signals object** (schema in file 07 §4). The report writer uses this, not the raw transcript, as its main input, so reports stay grounded and short. Required fields:

- `flow_states` — every activity where time disappeared, with the learner's own words
- `energy_gains` / `energy_drains`
- `competence_trap` — subject or activity, if any
- `unpressured_subject_choice` (from Q20)
- `career_mentions` with `source` (self / parent / teacher / peers / media)
- `contradictions` — score vs conversation, and which one the learner said was truer
- `raw_material` — up to 5 exact phrases worth quoting back
- `q2_most_myself`, `q19_future_tuesday` — stored verbatim for Grade 11 callbacks
- `wellbeing_flag` — set only by the safeguarding protocol (file 09)
