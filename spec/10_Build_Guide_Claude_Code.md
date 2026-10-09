# 10 — Build Guide: Copy-Paste Prompts for Claude Code / Cursor

Each step below is one prompt. Paste it into Claude Code (or Cursor's agent) from the root of a new project folder that contains this whole spec pack. Finish and test each step before starting the next.

---

## Before you start

1. **Create a new, dedicated Supabase project** for the school edition. Don't reuse an existing project: the earlier Excavation tables were created inside the `expirydesk` project, which belongs to a different app. Choose the region with your attorney (file 09 §1, risk 4).
2. **Keep the Anthropic API key on the server only.** The earlier prototype (`excavation-full.jsx`) called the Anthropic API directly from the browser, which exposes the key to anyone who opens developer tools. Every AI call must go through a server route.
3. Put this spec pack in a folder called `spec/` inside your project.

**Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres + Auth + Storage) · Anthropic API (server routes) · Zod (schema validation) · Vitest (tests) · Resend (email) + an SMS provider for safeguarding alerts · Vercel (hosting).

---

## Step 1 — Scaffold and database

```
Read spec/00_README.md, spec/01_Product_Architecture.md and spec/database/schema.sql.

Create a Next.js 14+ App Router project with TypeScript, Tailwind, Supabase (@supabase/ssr) and Zod.
Apply spec/database/schema.sql as the first Supabase migration (supabase/migrations/0001_init.sql).
Generate TypeScript types from the schema.
Set up environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY. The service role key and Anthropic key must only be
used in server code; add a lint rule or runtime check that fails if they're imported client-side.
Create seed data: one school with school_settings (all fields filled, deadlines in the future),
one teacher, one safeguarding contact, and three learners with login codes.
Show me how to run it locally.
```

## Step 2 — Scoring engine (pure TypeScript, no AI)

```
Read spec/02_Scored_Instrument.md, spec/04_Scoring_Engine.md, spec/config/question_bank.json
and spec/config/subject_map.json.

Build lib/scoring/ as a pure TypeScript module with NO database or network access:
- itemValue, scaleScore (with missing-item rule)
- personality, interests (code, elevation, differentiation, consistency), values card sort,
  motivation RAI, mindset, study, identity status + direction flags
- quality checks (attention, straight-lining, speeding, the five contradiction pairs)
- the Grade 9 combination engine (interest fit with mean-centred cosine, readiness with school
  overrides, trait fit, combo score with Q20 and competence-trap adjustments, top-3 selection with
  the near-duplicate rule, max-2-per-family rule and doors-open safeguard, tie-breaks, cautions,
  maths gate, doors open/closed)
- the ScoreProfile output exactly as in file 04 §11.

Write Vitest tests. Include the "Lerato" fixture from spec/08_Report_Templates_and_Samples.md
Part 1: interests R30 I78 A64 S70 E25 C33; personality O72 C48 E35 A66 N61; marks HL66 FAL63
Maths58 NS71 SS62 EMS64 Tech55 CA74; Q20 = Life Sciences, History, Visual Arts; Q12 competence
trap = Accounting. Expected: fits = HUMANITIES (≈91.2), VISUAL_CREATIVE (≈81.9), HEALTH_SCI
(≈78.8, label keeps_most_doors_open); caution = COMMERCE competence_trap; no stretch caution;
maths gate = mathematics. All tests must pass.
```

## Step 3 — Scored-layer UI

```
Read spec/02_Scored_Instrument.md §3 (administration rules).

Build the learner flow: login with school code → consent check (block if no valid guardian
consent) → assent screen (spec/09 §3.3) → intake (3 questions) → scored layer.
Rules: section order as specified; randomise within sections and store the order shown;
one item per screen on mobile, up to 6 on desktop; attention checks placed randomly in each
half; log response_ms and change_count; save every answer immediately; pause/resume.
Progress is the five-stage descent (Surface → Wading in → Deep water → The trench → The floor),
no percentages. Exactly two micro-moments (after interests, after the values sort).
Values card sort: drag top 3 in order, then pick bottom 2; must work by tap on phones.
Then the academic snapshot screen (school import if marks exist, otherwise self-report with an
"estimate" tick box).
Design: dark warm palette (charcoal #0f0d0a, amber #c8973a, cream #f0e8da), serif headings,
large tap targets, Grade 7 reading level, works on a cheap Android phone on slow data.
On completion, call the scoring engine server-side and save score_profiles.
```

## Step 4 — The Guide (conversation) with safety screen

```
Read spec/03_Grade9_Conversation_Layer.md and spec/07_AI_Prompts.md (3A, 3B).

Build a server route that runs the Grade 9 conversation:
1. Before the conversation starts, show the AI disclosure notice from spec/03 §3.
2. Every learner message first goes through the safety screen (prompt 3A, fast model, JSON).
3. Then the conversation call (prompt 3B, strong model) with score context built from the
   ScoreProfile (spec/07 §2, including contradiction_watch rules), the question script, and the
   safety flag. Stream the reply. Use prompt caching for the system prompt.
4. Save every message to conversation_messages with question_ref and safety_risk.
5. Detect <<SESSION_COMPLETE>> and <<SAFETY_STOP>> markers; never display them.
6. Hard safety → create safeguarding_events row and call the notification function from Step 7.
Voice input: add a microphone button using the browser's speech recognition where available.
Pause button always visible; resuming continues from the last question.
```

## Step 5 — Signals, report generation, review queue

```
Read spec/07_AI_Prompts.md (3C, 3D, §4, §5) and spec/08_Report_Templates_and_Samples.md.

After SESSION_COMPLETE:
1. Run the signals extractor (3C) → validate with Zod against spec/07 §4 → save to signals.
2. Recompute the combination scores with the conversation adjustments (Q20, competence trap,
   contradiction resolutions; each capped at ±5 and logged).
3. Run the Grade 9 report writer (3D) → validate against spec/07 §5 → retry once on failure →
   otherwise mark needs_review.
4. Reports go to status needs_review for the first 200 (configurable), then released
   automatically except when quality=caution or any safeguarding event exists.
Build a staff review screen: side-by-side ScoreProfile, signals and report; approve, edit, or
regenerate. Every staff view writes to audit_log.
Include the Lerato Grade 9 report from spec/08 Part 2 as a few-shot example in the prompt.
```

## Step 6 — Report display and PDF

```
Read spec/08 Part 7 (visual layout notes).

Build the learner report page: headline alone first (1.5 s), then the RIASEC hexagon drawn on
(SVG animation, friendly names), then each section. Subject option cards with doors open/closed
strips. Closing line is the last element; nothing after it.
Add PDF export (server-side render). After reading, show two optional toggles:
"Share a summary with my LO teacher" and "Share a summary with my parent/guardian" → creates
share_grants and generates the teacher/parent summaries (prompts 3G, 3H).
```

## Step 7 — School side: teacher view, cohort dashboard, safeguarding alerts

```
Teacher view: list of their learners with completion status; only shared teacher summaries
are viewable (RLS already enforces this; also enforce in the API).
School admin: upload offered combinations, readiness overrides, subject-change deadlines and
safeguarding contacts; cohort dashboard computed server-side with a hard minimum group size of
10 (suppress smaller groups): completion rate, interest code distribution, identity status
distribution, top recommended combinations vs offered combinations, maths gate distribution.
Safeguarding: a notify function that sends SMS + email to the school's designated contact and
backup with ONLY learner name, grade, time, level and the trigger message; records
school_notified_at; a confirmation link records school_confirmed_at; if not confirmed in 4
school hours, alert the Excavation safeguarding lead.
```

## Step 8 — Grade 11 Confirmation and verdict engine

```
Read spec/05_Grade11_Confirmation.md and spec/06_Verdict_Engine.md.

Add lib/verdict/ as a pure TypeScript module: per-subject fit and performance bands, borderline
resolution, failure cause, combination verdict rules 1–5 in order, switch window, career check,
NSC pass-type projection and generic APS, rescue plan actions. Unit-test every worked example in
spec/06 §8 (learners A–G) and the Lerato Grade 11 case in spec/08 Part 3 (expected: RESCUE on
Physical Sciences, Bachelor's pass projection, generic APS 28).
Then build the Grade 11 flow: "two years ago" screen, identical scored layer, Subject Experience
per subject, Failure Cause for subjects <50%, Career Update, marks, the 15-question conversation
(prompt 3E with g9_callbacks), deltas (spec/04 §9), and the Grade 11 report (prompt 3F).
```

## Step 9 — Norming job

```
Add a scheduled job that, per grade, counts completed sessions and computes: percentile tables
for every scale, sample medians for identity status cut-offs, and internal consistency
(Cronbach's alpha) per scale. Store results in a norms table with version and date. Switch
norm_state automatically (pre_norm < 300 ≤ emerging_norm < 1000 ≤ established_norm, and
established only if every scale alpha ≥ 0.70). Only use sessions from learners whose guardian
gave research consent. Output a CSV report of item-level statistics for review.
```

---

## Definition of done for the pilot

- [ ] All Vitest suites pass, including the Lerato fixtures and verdict examples A–G
- [ ] A learner can complete Grade 9 on a phone over a slow connection in under 90 minutes
- [ ] No AI key or service key reachable from the browser
- [ ] Safety screen tested on 200 sample messages with the clinical advisor
- [ ] Safeguarding alert reaches a test phone within 60 seconds
- [ ] Teacher cannot see any report the learner didn't share (tested with RLS)
- [ ] Cohort dashboard suppresses groups smaller than 10
- [ ] Every item in the file 09 §7 checklist is ticked
