# 06 — Grade 11 Verdict Engine
## Fit × Performance → Confirm · Rescue · Rethink · Adjust one · Redirect

---

## 0. Principle

The verdict is computed by rules, not by the AI. The AI explains the verdict; it cannot change it. A school, a parent or a department official can always ask "why did this learner get Redirect?" and get a traceable answer.

**The verdict is a recommendation to discuss, never an instruction.** Every report ends with who to speak to and by when.

---

## 1. Per-subject scores

For each FET subject the learner takes (excluding Life Orientation):

```ts
experienceFit = scaleScore([SE1, SE2, SE3, SE4]);       // 0..100
competence    = scaleScore([SE5, SE6]);                  // 0..100
profileFit    = interestFit(learnerRiasecG11, subjectVector);  // file 04 §8.1 method

subjectFit = 0.65 * experienceFit + 0.35 * profileFit;

// If the conversation attributes the dislike to the class/teacher rather than the subject itself,
// reduce the weight of experience so the subject isn't wrongly blamed.
if (attribution[subject] === "teacher_class")
  subjectFit = 0.40 * experienceFit + 0.60 * profileFit;
```

### Performance band

```ts
m11 = latest Grade 11 term mark; m10 = Grade 10 final; trend = m11 - m10;

band =
  m11 >= 60 ? "strong" :
  m11 >= 50 ? (trend <= -10 ? "at_risk_falling" : "secure") :
  m11 >= 40 ? (trend >= 10 ? "at_risk_rising" : "at_risk") :
              "failing";

performanceAdequate = band === "strong" || band === "secure";
```
School overrides may raise thresholds (e.g. a school requiring 60% for Physical Sciences). Missing m10 → trend = 0.

### Fit band

| subjectFit | Band |
|---|---|
| ≥ 60 | high |
| 45–59 | borderline |
| < 45 | low |

**Borderline resolution:** if the conversation shows a clear dislike of the subject itself (`attribution = subject_itself` and negative), treat as **low**; otherwise treat as **high**. Default to not switching: unnecessary switches cost more than they save.

### Subject quadrant

|  | Performance adequate | Performance at risk |
|---|---|---|
| **Fit high** | CONFIRM | RESCUE |
| **Fit low** | RETHINK | REDIRECT |

---

## 2. Failure cause (subjects below 50%)

```ts
cause = argmax over { foundation_gap: FC1, study_method: FC2, teaching_environment: FC3,
                      circumstances: FC4, fit: FC5, wellbeing: FC6 };
// Ties: prefer the cause the conversation's failure_story supports; else the first in this order:
// wellbeing > circumstances > foundation_gap > study_method > teaching_environment > fit
secondaryCause = second highest if its score >= 4
```
`fit` as the top cause pushes a borderline subject's fit band to **low**.
`wellbeing` as the top cause activates the soft wellbeing path (file 09 §5) and **pauses any Redirect recommendation** until the learner has spoken to an adult.

---

## 3. Combination verdict (apply rules in order)

```ts
const electives = subjects.filter(s => s !== "Life Orientation" && !isLanguage(s) && !isMaths(s));
const q = quadrantMap;   // subject -> CONFIRM | RESCUE | RETHINK | REDIRECT

// Rule 1 — Maths first (it decides the most doors)
if (isMaths(mathsSubject) && q[maths] in ["RESCUE","REDIRECT"]) {
  if (targetPathwayNeedsMaths(currentDirection)) mathsVerdict = "RESCUE_REQUIRED";   // explain the trade-off
  else if (switchAllowed("Mathematical Literacy") && q[maths] === "REDIRECT") mathsVerdict = "REDIRECT_TO_MATHS_LIT";
  else mathsVerdict = "RESCUE";
}

// Rule 2 — count electives by quadrant
const n = countBy(electives, s => q[s]);

verdict =
  n.REDIRECT >= 2                                    ? "REDIRECT" :
  n.REDIRECT === 1                                   ? (switchAllowedFor(redirectSubject) ? "ADJUST_ONE" : "RESCUE") :
  n.RESCUE >= 1                                      ? "RESCUE" :
  n.RETHINK >= 2                                     ? "RETHINK" :
                                                       "CONFIRM";

// Rule 3 — Maths verdict can escalate, never soften, the combination verdict
if (mathsVerdict === "REDIRECT_TO_MATHS_LIT")
  verdict = verdict === "CONFIRM" || verdict === "RESCUE" ? "ADJUST_ONE"
          : verdict === "ADJUST_ONE" ? "REDIRECT"     // Maths + one elective = two changes
          : verdict;
if (mathsVerdict in ["RESCUE","RESCUE_REQUIRED"] && verdict === "CONFIRM") verdict = "RESCUE";

// Rule 4 — switching window
if (["REDIRECT","ADJUST_ONE"].includes(verdict) && !switchWindowOpen(school))
  verdict = "REDIRECT_AFTER_MATRIC";   // keep current subjects, pass them, build the route afterwards

// Rule 5 — safeguarding hold
if (wellbeingFlag && ["REDIRECT","ADJUST_ONE"].includes(verdict))
  holdRedirect = true;   // report shows the verdict but leads with "talk to [named adult] first"
```

```ts
switchWindowOpen(school) =
  school.subjectChangeDeadlineG11 != null
  && today <= school.subjectChangeDeadlineG11
  && school.offers(targetSubject)
  && timetableAllows(targetSubject);   // school-confirmed; unknown -> "ask your school"
```
**If the school hasn't uploaded its deadline, the report never claims a switch is possible.** It says: *"Ask your LO teacher or subject advisor this week whether a change is still allowed."*

---

## 4. The five (+1) verdicts

| Verdict | When | What the learner hears (headline register) | Plan type |
|---|---|---|---|
| **CONFIRM** | Subjects fit; marks adequate | "Your subjects fit you. Now aim higher." | Pathway + APS target |
| **RESCUE** | Subjects fit; at least one is at risk | "Right subjects. The problem is fixable, and switching won't fix it." | Cause-specific rescue plan |
| **RETHINK** | Marks fine; subjects drain you | "You're good at this. That doesn't mean it's your future. Keep the subjects; rethink the target." | Career exploration plan |
| **ADJUST_ONE** | One subject in the wrong place; switch possible | "One change, not a restart." | Switch steps + deadline |
| **REDIRECT** | Two or more subjects don't fit and aren't working; switch possible | "This combination isn't serving you. Here's what changing would take, and what it would open." | Switch steps + deadline + doors comparison |
| **REDIRECT_AFTER_MATRIC** | Redirect needed but the window has closed | "Changing subjects isn't possible now. Changing direction still is. Pass these, then take this route." | Pass plan + post-matric route |

---

## 5. Career-target check (runs for every verdict)

Map `current_direction` (Q9 + CU1) to a pathway family (`config/subject_map.json`). Then compare its typical requirements with the learner's subjects:

| Situation | Output |
|---|---|
| Subjects meet requirements | "Your subjects keep [pathway] open." + APS gap if known |
| One required subject missing (e.g. wants engineering, takes Maths Lit) | **Pathway gap.** List honest routes: switch now if the window is open; extended or bridging programmes; upgrading a subject after matric (e.g. through the department's Second Chance Matric Programme); TVET routes into the field; related careers the current subjects do open. *Verify every route before publishing.* |
| Direction is "not sure" | Use the top 3 pathway families from the RIASEC code and the conversation. Offer three exploration actions. |
| Direction is parent-led and fit is low | Name it gently: "This plan came from someone who cares about you. It's worth one honest conversation about whether it fits you." Offer the parent summary. |

---

## 6. Pass-type and APS projection

Using **current** Grade 11 marks:

1. Determine which NSC pass type the marks would currently meet (`nsc_pass_types` in config).
2. **Gap to the next pass type:** the smallest set of subject increases that would lift them up a level, e.g. *"You're tracking towards a Diploma pass. For a Bachelor's pass, Life Sciences and Geography need to move from 46% and 48% to 50%."*
3. **APS projection:** generic method (best 6, excluding LO) plus the institution-specific rule if the learner named a university and its rule is in the `institution_rules` table.
4. Always add: *"Most universities make provisional offers on your Grade 11 final marks, so the next 9 months count."*

---

## 7. Rescue plans by cause

Each RESCUE subject gets one plan built from its top cause. The AI personalises the wording; the actions come from this table.

| Cause | Plan (3 actions, dated) |
|---|---|
| **foundation_gap** | 1) This week: list the 3 Grade 10 topics that feel shakiest and show the list to the subject teacher. 2) Two 30-minute catch-up sessions a week on those topics using free resources (e.g. Siyavula for Maths and Science, Khan Academy). 3) Before the June exams: one full past paper under test conditions. |
| **study_method** | 1) Swap re-reading for self-testing: close the book, write what you remember, check it. 2) Three fixed 30-minute slots a week, same time and place. 3) One past-paper question per slot, marked against the memo. |
| **teaching_environment** | 1) Find one alternative explanation source (video series, study group, older learner). 2) Ask the teacher one specific question per week, in person or by note. 3) Join or start a study group of 3–4. *(Never framed as blaming the teacher.)* |
| **circumstances** | 1) Find a study space at school: library, classroom after hours, homework club. 2) If home responsibilities are heavy, consider telling the LO teacher; schools can sometimes help. 3) Plan study around the times that are actually free, even if short. |
| **fit** | 1) Check whether your target pathway actually needs this subject. 2) If it doesn't and a switch is allowed: see ADJUST_ONE steps. 3) If it does: write down why it matters for the future you described, and go back to it when motivation drops. |
| **wellbeing** | 1) Talk to one adult you trust this week (LO teacher, counsellor, family). 2) Resources listed (file 09). 3) Academic plan is paused until that conversation happens; marks matter less than you do. |

---

## 8. Worked examples

| Learner | Data | Verdict | Why |
|---|---|---|---|
| A | Maths 64 (fit 72), Phys Sci 61 (fit 70), Life Sci 68 (fit 80) | **CONFIRM** | All high fit, all adequate |
| B | Maths 55 (fit 68), Phys Sci 41 (fit 66, cause = study_method), Life Sci 74 (fit 82) | **RESCUE** (Phys Sci) | Fits, but at risk; cause is fixable |
| C | Accounting 71 (fit 32), Economics 66 (fit 40), Bus Studies 69 (fit 58 → high) | **RETHINK** | Two electives low fit, all marks adequate: the competence trap |
| D | Maths 62, Phys Sci 58 (fit 70), EGD 38 (fit 30, cause = fit), window open | **ADJUST_ONE** | One subject in the REDIRECT quadrant; switch possible |
| E | Maths 34 (fit 25), Phys Sci 31 (fit 28), Life Sci 52 (fit 63), wants psychology, window open | **REDIRECT** (Maths → Maths Lit, plus Phys Sci) | Phys Sci alone gives ADJUST_ONE; the Maths redirect makes it two changes (Rule 3). Target pathway doesn't typically need Maths (verify per university) |
| F | Same as E, window closed | **REDIRECT_AFTER_MATRIC** | Pass plan now, route afterwards |
| G | Same as B but FC6 = 5, Stress Sensitivity 82 | **RESCUE**, wellbeing path first | Support before study plan |

---

## 9. Verdict output object

```json
{
  "verdict": "RESCUE",
  "hold_redirect": false,
  "subjects": [
    { "subject": "Physical Sciences", "m10": 52, "m11": 41, "trend": -11, "band": "at_risk",
      "experience_fit": 64, "profile_fit": 70, "subject_fit": 66, "fit_band": "high",
      "quadrant": "RESCUE", "cause": "study_method", "secondary_cause": null,
      "attribution": "performance" }
  ],
  "maths_verdict": "CONFIRM",
  "switch_window": { "known": true, "open": true, "deadline": "2027-02-28" },
  "career_check": { "direction": "psychology", "pathway": "HUMANITIES", "status": "open", "gap": null },
  "pass_projection": { "current": "diploma", "next": "bachelor",
                       "gaps": [{ "subject": "Physical Sciences", "from": 41, "to": 50 }] },
  "aps_projection": { "method": "generic_best6_excl_LO", "value": 27 },
  "plans": [ { "subject": "Physical Sciences", "cause": "study_method", "actions": ["...","...","..."] } ]
}
```
