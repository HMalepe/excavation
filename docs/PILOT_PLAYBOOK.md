# Pilot playbook: from "yes" to the first results

Audience: the person running the first school(s). Aim: a pilot that is safe, measurable and boring.

## 0. Gates: do not start a pilot until all are true

- [ ] Attorney has signed off the guardian consent form, privacy notice and terms (`/privacy`, `/terms`, consent PDF). Set `CONSENT_FORM_APPROVED=true`.
- [ ] A signed agreement with the school (who is the responsible party; who is the operator; roles for Information Officer and safeguarding contact).
- [ ] Consent forms signed for every participating learner and recorded in `/school/admin/consent`. **No consent, no login.**
- [ ] The school's safeguarding contact is named, has an account with two-step sign in, and has received a test alert (send one, watch it arrive, confirm it).
- [ ] Clinical advisor has reviewed the safety screen corpus and `config/safeguarding_resources.json` (numbers verified this month).
- [ ] A teacher/subject specialist has reviewed the readiness checks and taster tasks (content is still DRAFT).
- [ ] Uptime monitor and error alerts are live (runbook). Backups confirmed.
- [ ] Human review of the first reports is on (`REVIEW_FIRST_N_REPORTS`, default 200) and a reviewer is rostered.

## 1. Setup (week −2)

1. Create the school and settings (school day hours, timezone, safeguarding contacts).
2. Import the learner CSV (`/school/admin`), check codes, print the login slips.
3. Hand the LO teacher the **Teacher guide** (`docs/TEACHER_GUIDE.md`) and give a 30-minute walkthrough.
4. Dry run with 3 staff-made test learners on the actual school devices and network. Test the read-aloud feature on those devices.

## 2. Session day (week 0)

- One class at a time; a teacher present; 45–60 minutes for Part 1 (questions, values, checks, tasters), Guide conversation in a second sitting.
- Say it out loud: this is not a test and there are no marks; the Guide is software, a real person reviews the reports, and anything about safety goes to a real adult.
- Keep a log of what went wrong (frozen screens, confusing questions, learners who stopped).

## 3. After (weeks 1–2)

- Reports are reviewed by a person before release. Target: released within 5 school days.
- Teacher summaries become available once the learner agrees to share.
- Run the norming job; do **not** interpret norms until you have enough learners per group.

## 4. What to measure

| Measure | Why | Where |
|---|---|---|
| Completion rate by part | Is it too long or too hard? | Cohort dashboard |
| Drop-off point | Which question loses them? | Session events |
| Read-aloud use | Do accessibility features matter? | `learner_read_aloud` audit rows |
| Review edits per report | Is the AI output good enough to release? | Review queue |
| Safeguarding flags: count, time to school confirmation | Is the process working? | Safeguarding dashboards |
| Teacher and learner satisfaction (3 questions, short) | Is it useful? | Paper or form |
| Later: do check scores predict Grade 10/11 marks beyond Grade 9? | The scientific claim | `npm run validity` |

## 5. Stop rules

Pause the pilot and call the Information Officer if: any safeguarding alert is not confirmed in 4 school hours; any data is seen by someone it shouldn't be; a parent withdraws consent (take them out the same day, see `/staff/privacy`); the Guide says anything harmful.

## 6. Close-out

Write a one-page summary for the school and for shareholders: numbers above, what we changed, what we will not claim.
