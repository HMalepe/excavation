# 05 — Grade 11 Confirmation
## Instrument additions + 15-question conversation · ~75 minutes

---

## 1. What Grade 11 is for

Two years after choosing subjects, the learner has real evidence: two years of marks, two years of sitting in those classes, and two years of growing up. Grade 11 Confirmation answers four questions:

1. **What's changed about you?** (scored deltas, file 04 §9)
2. **How do your subjects actually feel?** (Subject Experience)
3. **Why are you struggling, if you are?** (Failure-cause check)
4. **So: keep going, fix it, rethink the career, or switch?** (verdict, file 06)

**Timing:** Term 1 of Grade 11, ideally weeks 3–6.
- Early enough that a subject change may still be possible. **Each school's deadline must be uploaded before sessions open**, because the Redirect verdict depends on it.
- Early enough to fix marks before the Grade 11 finals, which most universities use for provisional offers.

**Learners with no Grade 9 baseline** (new to the school, or the school joined late) take the full scored layer as a first baseline. The report skips the "what moved" section and says so.

---

## 2. Flow

| Step | Content | Notes |
|---|---|---|
| 0 | Consent refresh | Guardian consent on file is checked; learner re-agrees on screen |
| 1 | **"Two years ago" screen** | Shows the learner their Grade 9 headline and top 3 recommended combinations, and which one they actually took (from marks import). One question: *"Reading this now — what still fits, and what doesn't?"* (free text, feeds the conversation) |
| 2 | Scored layer | **Identical items** to Grade 9 (file 02). Same order rules. |
| 3 | Subject Experience | 6 items × each FET subject (not LO) |
| 4 | Failure-cause check | Only subjects with latest mark < 50% |
| 5 | Career update | 3 items |
| 6 | Marks | Grade 10 final + Grade 11 latest term, per subject (school import preferred) |
| 7 | Conversation | 15 questions (§4) |
| 8 | Report | Verdict + plan (files 06, 07, 08) |

---

## 3. Grade 11 instrument additions

Response scales are the same as Grade 9 (agree5 / true5). Full machine-readable versions are in `config/question_bank.json` → `grade11_only`.

### SUBJECT_EXPERIENCE — asked once per FET subject (not LO)
Screen header per subject: *"[Subject name] — be honest, nobody from the school sees individual answers."*

| ID | Item | Dimension |
|---|---|---|
| SE1 | I look forward to this subject. | fit |
| SE2 | I feel energised, not drained, after this subject. | fit |
| SE3 | I would choose this subject again if I could start Grade 10 over. | fit |
| SE4 | This subject connects to the future I want. | fit |
| SE5 | I understand the work when it is explained to me. | competence |
| SE6 | I feel I can get better at this subject. | competence |

### FAILURE_CAUSE — only for subjects below 50%
Stem: *"Think about [subject]. How true is each of these?"* (true5)

| ID | Item | Cause measured |
|---|---|---|
| FC1 | I fell behind in an earlier grade and never caught up. | foundation_gap |
| FC2 | I don't study this subject regularly, only before tests. | study_method |
| FC3 | The way this subject is taught at my school does not work for me. | teaching_environment |
| FC4 | Things at home make it hard to study for this subject. | circumstances |
| FC5 | I honestly don't care about this subject. | fit |
| FC6 | I feel too stressed or tired to focus on this subject. | wellbeing |

FC3 results are **never** shown to the school at individual level, and are only aggregated across ≥ 10 learners per subject. It is about fit with the teaching approach, not a teacher rating.
FC6 ≥ 4 combined with Stress Sensitivity ≥ 70 triggers the soft wellbeing check in file 09.

### CAREER_UPDATE

| ID | Type | Question | Options |
|---|---|---|---|
| CU1 | free text | What career or field are you leaning towards right now? (It's fine to say "not sure".) | — |
| CU2 | single choice | Compared to Grade 9, your direction is... | The same as before · Similar but clearer · Different · I still don't know |
| CU3 | multi choice | What have you done to explore careers since Grade 9? | Spoke to someone in a job I'm interested in · Job shadowing or a visit · Online research · Holiday or part-time work · Open day or career expo · Nothing yet |

---

## 4. The Grade 11 conversation — 15 questions

Same rules as Grade 9 (file 03 §2): one question at a time, reflect before moving on, at most one follow-up, three callbacks, name contradictions once, warm and plain.

**Grade 11 adds two callback sources:** the learner's Grade 9 Q2 ("most like myself when…") and Q19 ("ordinary Tuesday at 30"). These must be used at least once each.

### Opening message
> Hey [first name]. Two years ago you sat down and told us who you were. Today's about checking that against two years of real life.
>
> Same deal as last time: one question at a time, real answers over good-sounding ones, and nobody at school sees this unless you share it.
>
> Let's start with how things have actually been.

### Section A — Check-in (Q1–Q3)

| # | Question | Optional follow-up | Purpose |
|---|---|---|---|
| Q1 | What's one thing about you that's genuinely different from Grade 9? | "When did you notice it?" | Self-perceived change |
| Q2 | In Grade 9 you said you feel most like yourself when you're **"[G9 Q2 answer]"**. Still true? | "What would you say now?" | Callback; stability of authentic self |
| Q3 | Which subject surprised you most — better or worse than you expected? | "What made the difference?" | Expectation vs reality |

### Section B — Subject reality (Q4–Q8)

| # | Question | Optional follow-up | Purpose |
|---|---|---|---|
| Q4 | Which subject do you actually look forward to? What is it about that one? | "Is it the subject itself or the class / teacher?" | Separate subject fit from environment |
| Q5 | Which subject do you dread? Same question: is it the subject, or how it's going? | — | Separate fit from performance |
| Q6 | *(only if any subject < 50%)* Tell me the story of **[subject]**. When did it start going wrong? | "What have you tried so far?" | Failure narrative; cross-checks FAILURE_CAUSE |
| Q7 | In the last six months, when did time disappear for you — in or out of school? | "What exactly were you doing?" | Current flow state (compare to G9 flow states) |
| Q8 | Is there something you're good at right now that drains you? | "If the marks stayed the same, would you drop it?" | Competence trap, Grade 11 version |

### Section C — Direction (Q9–Q12)

| # | Question | Optional follow-up | Purpose |
|---|---|---|---|
| Q9 | Where are you heading after matric, as of today? How did you land there? | — | Current direction + its origin |
| Q10 | Whose voice is loudest in your plan right now — yours, family, friends, money, something else? | "If that voice went quiet, would the plan change?" | Direction source, conversational version |
| Q11 | What have you actually done to test that direction — people you've spoken to, things you've tried? | "What's one thing you could do before the June holidays?" | Exploration evidence |
| Q12 | If your marks were guaranteed, what would you study after school? | "What's stopping that from being the plan?" | Unpressured direction |

### Section D — Final three (Q13–Q15)

| # | Question | Optional follow-up | Purpose |
|---|---|---|---|
| Q13 | In Grade 9 you described an ordinary Tuesday at 30 like this: **"[G9 Q19 summary]"**. Read it. What would you change? | — | Future self, compared |
| Q14 | What are you afraid will happen if you change direction? And if you don't? | — | Fear on both sides; surfaces sunk-cost thinking |
| Q15 | What's one decision you need to make before the end of Grade 11? | "When will you make it?" | Commits to an action (becomes the report's first move) |

### Closing message
> That's it. Thank you for being straight with me.
>
> Your report will show what's stayed the same since Grade 9, what's moved, an honest read on each subject, and a clear recommendation, with dates.
>
> Whatever it says, you're deciding with real information now. Most people never get that.

Emit `<<SESSION_COMPLETE>>`.

---

## 5. Signals object — Grade 11 additions

Everything from the Grade 9 signals object (file 03 §6), plus:

- `self_reported_change` (Q1)
- `g9_most_myself_still_true`: yes / partly / no + new phrasing
- `subject_attributions`: per subject → `subject_itself | teacher_class | performance | mixed`
- `failure_story`: per failing subject → onset (grade / term), tried so far, learner's own explanation
- `current_direction` + `direction_source`
- `exploration_evidence` (things actually done)
- `unpressured_direction` (Q12)
- `future_tuesday_changes` (Q13)
- `fear_of_change` / `fear_of_staying` (Q14)
- `committed_decision` + `by_when` (Q15)
