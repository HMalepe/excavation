# Build decisions & spec findings

Everything here was found while building the spec pack (`spec/`) into code. Each item says what the
spec says, what the code does, and why. Items marked **[CHECK]** need a human decision before the pilot.

---

## A. Spec bugs found and fixed

### A1. Four RLS policy holes in `schema.sql` (fixed in `0002_app_extensions.sql`)
Proven on Postgres 16: `MIGRATION_LIMIT=1 bash scripts/test-db.sh` (spec schema only) fails these four
checks; with 0002 all 15 RLS checks pass.

| # | Problem in the spec schema | Effect | Fix |
|---|---|---|---|
| 1 | `teacher_shared_summaries` joins `share_grants`, `sessions`, `teacher_classes` — tables teachers can't read. Policy sub-queries are filtered by RLS too. | **A teacher can never see a summary, even one the learner shared.** | `SECURITY DEFINER` helper `teacher_can_read_report()` |
| 2 | `safeguarding_events_school` reads `learners`, which safeguarding contacts can't read. | **The designated contact can't see their own school's alerts.** | `learner_in_my_school()` helper |
| 3 | `learner_own_sessions` is `FOR ALL`. `safeguarding_events` cascades on session delete. | **A learner can erase their own safeguarding record** with their JWT via the REST API. | Learners get `SELECT` only; all writes go through validated server routes. |
| 4 | `learner_manage_shares` doesn't check report ownership. | A learner can create a share grant on another learner's report. | Learners get `SELECT` only on `share_grants`. |

### A2. Verdict pseudocode contradicts worked example F (spec 06)
Read literally, `switchAllowed()` in Rules 1–2 includes the date window, so example F
(window closed) never reaches Rule 4 and comes out **RESCUE**, not the expected
**REDIRECT_AFTER_MATRIC**. The code splits the check: Rules 1–2 use *structural* feasibility
(school offers the subject, timetable allows it); Rule 4 alone applies the date. All of A–G then match.

### A3. Grade 11 step order (spec 05 §2)
Failure Cause (step 4) is listed before Marks (step 6), but it only applies to subjects below 50%,
which can't be known without marks. The flow takes marks first.

### A4. Lerato's sample numbers
- The combination rules reproduce the spec exactly (HUMANITIES 91.2, VISUAL_CREATIVE 81.9, HEALTH_SCI
  ≈78.8/78.9, COMMERCE 50.5) **if** interest fit and trait fit are rounded to integers and the combo
  score to one decimal. That's what the engine does. HEALTH_SCI is exactly 78.85; we round half up (78.9).
- Pick #3 by raw score is actually **PERFORMING (79.6)**; HEALTH_SCI only appears through the
  doors-open safeguard, and ties SCI_IT on score (resolved by the tie-break chain). Both are tested.
- Some of Lerato's *scale* scores (I 78, A 64) can't come from real answers: six 1–5 items can only
  produce …71, 75, 79… The fixture therefore tests the combination engine at the scale-score level,
  as Step 2 describes it; item-level arithmetic has its own tests.
- The §11 example shows `self_enhancement: 1`; the §4 formula gives 0 (AC +1, PO bottom −1). Code follows the formula.

---

## B. Interpretations where the spec was silent

| Topic | Decision |
|---|---|
| Combination subjects | Default electives = core + first third option (matches how the config vectors were computed). If a Q20 subject is one of the third options, it's chosen instead. |
| Q20 match | count = Q20 ∩ core + (any Q20 in third options ? 1 : 0); ≥ 2 → +5. |
| Competence trap (Q12) | −5 only if the learner can't avoid the subject in that combination (core, or the only third option). Senior Phase names expand (EMS → Accounting/Economics/Business Studies). A Maths trap never adjusts combinations; it's flagged on the maths gate. |
| Contradiction resolutions | Each `contradiction_watch` rule has a stable id. If the learner says the conversation is truer, the disputed trait is set to neutral (50) in trait fit; the change is capped at ±5 and logged. |
| Cautions | Never chosen from the fits. Fallback competence trap needs readiness ≥ 60 and readiness > interest fit. |
| Straight-lined interests | Interest weight → 0, readiness 0.80, trait 0.20 ("exclude it from recommendations"). |
| Maths for "Either" combos | Follows the maths gate (Maths Lit only when the gate says "maths_lit_safer"). |
| Doors | Every `typical_requires` string has an explicit rule (`lib/scoring/doors.ts`); an unknown string throws. |
| Performance thresholds | A school override T shifts all bands: strong ≥ T+10, secure ≥ T, at risk ≥ T−10. T=50 reproduces spec 06 exactly. |
| Switch window unknown | Verdict stays as computed; `switch_window.known=false` makes the report say "ask your LO teacher", never "you can switch". |
| NSC pass + designated subjects | `config/nsc_rules.json` **[CHECK yearly with DBE regulations]**. |
| Career direction → pathway | `config/career_keywords.json`, whole-word for ≤3-letter keywords; "it"/"ai" removed (false positives in normal English). |
| Q13–Q15 | Filled deterministically from scores rather than by the model, so the same scores always give the same questions. |
| Report word limits | Not encoded in the JSON schema; a deterministic linter (`lib/ai/reportLint.ts`) checks them plus the banned-word list and feeds problems back in the single retry. Calibrated: Lerato's gold-standard reports pass it. |
| Share prompt vs. closing line | Spec 08 says the closing line is last with no share prompt after it; share/download live in a bar at the top and on `/learn/report/share`. |
| Parent access | Parents get a revocable link (token hash stored), not an account. **[CHECK with attorney: parental access policy, spec 09 §3.1]** |

---

## C. Safety design choices **[CHECK with the clinical advisor]**

- **Every learner message is screened before The Guide sees it.** Result = max(AI screen, keyword floor).
  The floor can only raise. A classifier refusal is treated as **hard** (false positives are acceptable, spec 09 §5.2.6).
  If the screen is unavailable, the message is saved but **never** passed on unscreened; the learner retries.
- Hard → safeguarding event + SMS/email to contact **and** backup + Excavation lead *before* the reply streams;
  session locked; reply must contain the crisis numbers or a deterministic resource block is appended.
- Keyword floor (`lib/safeguarding/keywords.ts`) is a starting list. Past self-harm is "soft", per spec 07 3A.
- Alert content: name, grade, time, level, trigger message — nothing else (SMS excludes the message text).
- Escalation: 4 **school** hours (weekdays, school timezone), then the lead is alerted to phone the school.
- Unlocking after review appends a system message; history is never edited.

---

## D. AI implementation notes

- Models: `AI_MODEL_FAST=claude-haiku-5-5` for the safety screen (spec: fast/cheap); `AI_MODEL_STRONG=claude-opus-5-5`
  for conversation, signals, reports, summaries. Change by env.
- Opus 5.5 thinking is always on; effort is set per call (conversation `medium`, reports `high`).
- **Refusal fallbacks are on** for strong-model calls (`fallbacks: "default"`), so a learner writing honestly about
  something hard doesn't hit a dead end on a classifier decline.
- Prompt caching: fixed system prompt + the per-learner block (frozen once per session in `sessions.progress.guide_block`)
  + conversation history. History is append-only; nothing is ever edited.
- Structured outputs (`output_config.format` + Zod) for every JSON call — no prefill.
- The conversation model never sees raw item responses — only the score context (spec 07 §2).
