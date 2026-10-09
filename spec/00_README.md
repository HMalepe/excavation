# The Excavation × Know Thy Self — School Edition
## Spec pack v1.0 · Grade 9 Foundation + Grade 11 Confirmation

**Know Thy Self measures. The Excavation interprets.** A scored questionnaire built on established psychology, followed by a guided AI conversation, delivered twice: in Grade 9 to choose subjects, and in Grade 11 to confirm, rescue, rethink or redirect.

---

## What's in this pack

| File | What it is | Who uses it |
|---|---|---|
| `01_Product_Architecture.md` | The blend, which Know Thy Self doors are kept or excluded for minors, both touchpoints, who sees what, pricing | You, investors, partners |
| `02_Scored_Instrument.md` | All 116 original items with keys, response formats and administration rules | Developer, clinical advisor |
| `03_Grade9_Conversation_Layer.md` | The 20 Grade 9 conversation questions, rules, opening/closing, signals handed to the report | Developer, clinical advisor |
| `04_Scoring_Engine.md` | Every scoring formula: scales, RIASEC code, identity status, quality checks, subject-combination engine, Maths gate, Grade 9→11 deltas, norming | Developer |
| `05_Grade11_Confirmation.md` | Grade 11 flow, Subject Experience, Failure Cause, Career Update, the 15 Grade 11 questions | Developer, clinical advisor |
| `06_Verdict_Engine.md` | Fit × Performance verdict rules, switch window, career check, pass-type & APS projection, rescue plans, worked examples | Developer |
| `07_AI_Prompts.md` | All 8 AI prompts (safety screen, conversations, signals extractor, report writers, teacher/parent summaries) + JSON schemas | Developer |
| `08_Report_Templates_and_Samples.md` | One fictional learner, Lerato, followed from Grade 9 to Grade 11: full reports, teacher and parent summaries | You (demo), developer (gold standard) |
| `09_Safeguarding_POPIA_Minors.md` | Consent model, guardian form draft, data rules, safeguarding protocol, crisis resources, pre-pilot checklist | Attorney, clinical advisor, schools |
| `10_Build_Guide_Claude_Code.md` | 9 copy-paste prompts to build it step by step, with tests and a definition of done | You + Claude Code / Cursor |
| `11_Department_Pilot_Proposal.md` | One-page proposal, 2027 pilot design, and the questions to ask Thando on Sunday | You |
| `config/question_bank.json` | Machine-readable item bank (single source of truth for items) | App |
| `config/subject_map.json` | FET subjects, 13 combinations with interest profiles, readiness rules, pathway families, NSC pass types, APS levels | App |
| `database/schema.sql` | Postgres/Supabase schema: 19 tables, row-level security, roles. Tested on Postgres 16 | Developer |

---

## How the pieces connect

```
Learner answers ──► 02 items ──► 04 scoring engine ──► ScoreProfile
                                                         │
                         03/05 conversation (07 prompts) ◄┘ (score context)
                                   │
                         signals extractor (07 §3C)
                                   │
      Grade 9:  04 §8 combinations ─┤
      Grade 11: 06 verdict engine ──┤
                                   ▼
                     report writer (07) ──► 08 report ──► learner
                                                      ├─► teacher summary (if shared)
                                                      └─► parent summary (if shared)
          09 safeguarding runs across every step
```

**Design rule that holds everything together:** scores and verdicts are calculated by fixed rules. The AI asks the questions and explains the results; it never changes a score, a recommendation or a verdict. That's what makes the product defensible to schools, parents and the department.

---

## Start here

1. **Sunday:** read file 11 Part C, and have file 08 open on your phone.
2. **This month:** book the attorney and find a clinical advisor (file 09 §7). The psychological-test question (file 09 §1, risk 2) is the most important open item.
3. **Then build:** file 10, step by step.

---

## What's confirmed vs what needs checking

| Status | Items |
|---|---|
| **Built and tested** | Question bank and subject map JSON generated from one source and validated; database schema runs on Postgres 16; Lerato's sample numbers come from the actual scoring rules |
| **Needs your professionals** | Every **[VERIFY]** in file 09: consent, parental access, cross-border data, Children's Act duties, psychological test classification |
| **Needs checking every year** | University requirements and APS methods, NSC pass rules, crisis line numbers, each school's subject-change deadline |
| **Needs pilot data** | Item reliability (all items are original and unvalidated, so report as reflective insights until norming), score thresholds, the change thresholds between Grade 9 and 11 |
