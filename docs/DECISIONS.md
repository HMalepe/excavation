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
- **No SMS (owner's decision, 2026-10-10):** flags are monitored on the staff dashboard. Spec 09/10 asked for SMS + email.
- Hard → safeguarding event on the dashboards + email to contact **and** backup + Excavation lead *before* the reply streams;
  session locked; reply must contain the crisis numbers or a deterministic resource block is appended.
- Keyword floor (`lib/safeguarding/keywords.ts`) is a starting list. Past self-harm is "soft", per spec 07 3A.
- Alert content: name, grade, time, level, trigger message — nothing else.
- Escalation: 4 **school** hours (weekdays, school timezone), then the lead gets an escalation email to phone the school.
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

---

## E. Readiness checks + taster tasks (owner's decision, 2026-10-10) **[CHECK]**

**Why.** Marks measure performance *in a particular school*, not capability. The spec engine treats 55% at a
school with no maths teacher for two terms the same as 55% at a well-resourced school, and the maths gate can
steer a capable learner into Mathematical Literacy. Interest questions are self-report: "I want to be a doctor"
is often the parents talking. Part 1 now adds two kinds of evidence that marks and questionnaires can't give.

**What learners do** (Grade 9, after the academic snapshot; ~35 extra minutes, so the flow now has a break
between Part 1 and The Guide):

| | Content | What it feeds |
|---|---|---|
| Maths check | 10 items, CAPS Senior Phase (integers → word problems), `config/skills/checks.json` | `Mathematics` readiness + the maths gate |
| Science check | 8 items: fair tests, data, density/speed, circuits, evidence | `Natural Sciences` readiness (Physical/Life Sciences) |
| Reading check | 2 passages × 4 questions in English (narrative/information + argument) | `Social Sciences` readiness; reading-support and "language may be part of the maths story" flags |
| 6 taster tasks | Clinic, fix-the-instructions, two witnesses, vetkoek stall, rain & maize, fix the poster (+ a bonus each), `config/skills/tasters.json` | ±5 on linked combinations; `TT_*` contradiction_watch items for The Guide |

Each check unit has 1–2 parallel variants (one served at random) and options are shuffled per learner, so
learners side by side rarely see the same screen. "I'm not sure" is offered instead of forcing a guess. A whole
check can be skipped with no effect. Answer keys never leave the server (`npm run check:secrets` scans for one).

**The rules** (`src/lib/skills/engine.ts`, all logged in each combination's `adjustments`):

| Rule | Value | Reason |
|---|---|---|
| **Raise-only** | A check never lowers a mark, a readiness tier or the gate | Marks already pull down. Also neutralises cheating: the most a cheat gets is "consider it, with a plan" |
| Reliable check | ≥ 70% of items answered, median ≥ 6 s per item (reading ≥ 4 s) | Rushed or abandoned checks are not used |
| Mark lift | Check ≥ 60% and above the mark → effective = min(check, mark + 15) | Small and capped; a missing mark is never invented |
| Readiness | A lifted mark moves a need **one tier** at most (20→60, 60→100) | |
| Maths gate | One step: Maths Lit safer → both options (check ≥ 70%); 40–49% both options → Mathematics with support (check ≥ 60%) | Never straight to "Mathematics" |
| "Either" combinations | Keep the marks-based maths choice | Switching them to Mathematics would *lower* their readiness; the lifted gate opens the option, it doesn't impose it |
| Doors-open safeguard | Uses lifted marks | It exists to widen, so it may only widen |
| Taster signal | pull = enjoyed (4–5) **and** finished the bonus; warm = enjoyed; cold = 1–2 and no bonus | Asking for another one is behaviour, not self-report |
| Taster adjustment | pull +5, warm +2, neutral 0, cold −3; mean over linked tasters; capped ±5 | Same size as the Q20 bonus. Correctness carries **no** weight |
| Reading support | Reliable reading check < 50% | Report gives one reading habit; never called a weakness |

**Who sees what.** The Guide, the report writer and the teacher summary get plain words only
(`src/lib/skills/plain.ts`), never percentages. The learner's report has a deterministic "What you tried"
section (web + PDF). Teachers see only check-based flags (marks undersell, reading support, maths topics),
never taster reactions. Staff reviewers see the raw numbers.

**Validation.** `npm run validity` writes per-item difficulty/discrimination (`reports-out/check-items.csv`) and,
once Grade 10/11 marks exist, reports ΔR²: how much each check predicts later marks *beyond* Grade 9 marks.
ΔR² ≥ 0.05 → consider more weight; < 0.02 → keep raise-only or drop. It also cross-tabs taster signals against
the subjects actually taken.

**[CHECK] before learners see it:**
- Every check item reviewed by a Grade 9 maths / natural sciences / English teacher (content is marked DRAFT).
- Every taster reviewed by someone who does that work (nurse/pharmacist, developer, attorney, small-business
  owner, field scientist, designer).
- Clinical advisor + attorney: the checks are curriculum tests, not psychological tests, but add both to the
  spec 09 risk-2 opinion (psychological test classification).
- Grade 11 does not take checks or tasters yet (the verdict engine is unchanged). Candidate for v2: tasters
  before the career update, and the maths check for learners considering a switch back to Mathematics.

---

## F. Visual design: STRATA (owner's decision, 2026-10-10)

The original UI (charcoal + amber + Georgia) read as generic. The identity now comes from the product's own metaphor, a dig and a descent: **five depth layers** (sky, azure, cobalt, indigo, midnight) double as the progress gauge, section markers, icon tiles and the cover art.

| Element | Choice | Why |
|---|---|---|
| Display type | Bricolage Grotesque (variable) | Distinctive, warm, modern: not a default system look |
| Reading type | Atkinson Hyperlegible Next | Designed for legibility; suits a Grade 7 reading level and cheap screens |
| Loading | `next/font`: self-hosted at build time, latin only | No request to Google from a learner's phone; no layout shift |
| Accent | Aqua signal `#2de0c4`; on light backgrounds text accents use indigo `#2347c5` instead (aqua is too light as text) | Ink-on-aqua is 11:1; keeps the whole palette cool |
| Themes | **Limestone** (light) and **Bedrock** (dark); follows the phone, learner can override (remembered on the device, applied before first paint) | Many learners use phones in bright rooms; dark saves battery |
| Components | "Physical" buttons (ink outline, hard shadow that presses down), outlined cards, tile-style answers | Big tap targets, clear selected state without relying on colour alone |
| Art | Inline SVG only (logo mark, cover cross-section, icons, favicon) | A few KB, zero image requests on slow data |
| Report | Headline alone, then sections marked with their layer colour; subject options ranked 1-3 in layer colours; first move as a yellow call-out; verdict as one large word | Spec 08 Part 7 layout notes, designed |
| PDF | Same palette, strata rule, bold headings (built-in fonts) | Prints well in black and white |

Code: tokens and component utilities in `src/app/globals.css`; artwork in `src/components/ui/Brand.tsx`; theme switch in `ThemeToggle`. Base element styles sit in `@layer base` so utility classes can override them.

**F2. Second pass (same day):** WCAG audit of every text/background token pair in both themes (all ≥ 4.5:1) found one gap, the faint decorative border used on unselected answer tiles and form fields (1.4:1); controls now use a `--control` border (≥ 3:1 on every surface, WCAG 1.4.11). Added: an illustration per taster task (clinic vitals, instruction steps, witness statements + clock, vetkoek cost bar, rainfall/harvest chart), a sample report on the landing page (fictional learner, labelled), app-install support (manifest + PNG icons, so a learner can add it to their home screen), a share preview image, branded 404, a loading skeleton for the learner flow, scroll-in motion on report sections (respects reduced motion), and a print stylesheet (browser print always uses the light theme).

**F3. Palette change (owner's call, same day):** the first palette (cream, beige, terracotta, brown) was too recognisably the default "AI product" look. Replaced with cool neutral greys, hi-vis yellow as the single accent, and a sky-to-midnight depth scale that matches the stage names (Surface, Wading in, Deep water, The trench, The floor). No warm browns remain anywhere (UI, PDF, icons, share image). All text pairs re-audited: zero contrast failures in either theme.

**F4. No warm hues at all (owner's call):** the hi-vis yellow accent from F3 still read as orange, so the accent is now aqua and every remaining warm element (illustration colours, a quiz example that said "yellow on white") was changed. Verified by rendering 25 screens in both themes in a browser and scanning every computed colour (text, backgrounds, borders, fills, strokes, shadows) for hues between brown, orange and yellow: none found.

## F5. Clear Progress design system

Replaces the aqua/strata look. Near-white canvas, ink text, cobalt (`--accent`) marks the next action, soft teal marks completion, neutral surfaces carry the rest. Inter only. A stable navigation edge (staff sidebar, learner stage footer) beside a working field.

- Progress is ordered marks (`Stepper`: teal check = done, cobalt = here, outline = ahead) with named stages. No percentages in learner views (spec 02 §3.7).
- Learner screens: one prominent question, a small set of choices. Staff screens: repeated rows, compact figures (`Stat`), tables.
- AI interpretation stays separate from raw scores; nothing is decided without human review (unchanged: reports are reviewer-gated).
- No brown, orange or yellow anywhere. Status uses slate, cobalt tint, teal or red. Verified by a computed-colour audit (hue 12–70°) and a WCAG AA contrast audit on both themes.

## F6. Copywriting overhaul

Voice rules are in `docs/VOICE.md`. Every learner, parent and staff screen, the Guide's scripted opening and closing, check and taster text, error messages, the safeguarding alert email and the PDFs were rewritten to it. Verdict codes now show as plain labels (`src/lib/verdict/labels.ts`) instead of RESCUE / REDIRECT.

Deliberately not changed: questionnaire items and response labels (instrument 1.0.0; rewording changes what they measure and invalidates norming), the Guide's 20 and 15 scripted questions (spec 03/05), and the check and taster questions themselves. AI prompts gained a shared CRAFT block, and the report linter now rejects stock AI phrasing.

## F7. Illustrated, framed questions

Every Part 1 question is a framed card (`QuestionCard`): coloured band naming the section, big bold stem with marker highlights (numbers, money, SHOUTED words, the activity word in interest prompts), a drawing, then the answers. Each section has its own cool colour (`[data-sec]` in globals.css; no warm hues). Artwork is inline SVG in `Art.tsx` (36 activity drawings, 10 value drawings, trait and section emblems), `Figures.tsx` (diagrams and passage scenes for checks; only ones that don't reveal an answer) and `TasterArt.tsx`. Liking scales use faces, "how true" scales use rising bars; the text label always stays. Instrument wording is unchanged.

## F8. Read-aloud (Option 1: the device's own voice)

`src/components/client/readAloud.tsx`. A Listen button (and a Slower toggle) on every question card, taster scene, the values cards, the welcome and Guide-notice screens, and each Guide message. It reads the stem, then the choices; maths symbols, Rand, units and SA decimal commas are turned into words first (`speakable`, tested).

- Offered only when an English voice that runs on the device exists. Browsers' "online" voices can send text to a cloud service, so they are never used: minors' answers stay on the phone. No local voice, no button.
- Not offered on the Reading check or its passages: reading it aloud would stop it measuring reading.
- The server records only that it was used (`audit_log`, action `learner_read_aloud`, target `session:where`, no text), not in `sessions.progress`, so a late request can't overwrite the learner's place. The reviewer page shows the count per area.
- Not built: word-by-word highlighting (the card glows while it's being read instead), and pre-recorded voices (the planned next step for fixed questions).
