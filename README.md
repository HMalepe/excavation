# The Excavation × Know Thy Self — School Edition

**Know Thy Self measures. The Excavation interprets.** A scored questionnaire built on established
psychology, then a guided AI conversation, delivered in **Grade 9** (choose subjects) and again in
**Grade 11** (confirm, rescue, rethink or redirect). The full product spec is in [`spec/`](spec/00_README.md).

> The design rule that holds everything together: **scores and verdicts are calculated by fixed rules.
> The AI asks the questions and explains the results; it never changes a score, a recommendation or a verdict.**

---

## What's built

| Spec step | Where |
|---|---|
| 1 Scaffold + database | Next.js 15 (App Router, TS), Tailwind 4, Supabase. `supabase/migrations/0001_init.sql` = spec schema verbatim; `0002` = app columns + **RLS fixes** ([why](docs/DECISIONS.md#a1-four-rls-policy-holes-in-schemasql-fixed-in-0002_app_extensionssql)) |
| 2 Scoring engine | `src/lib/scoring/` — pure TS, no I/O. Lerato fixture reproduces spec 08 |
| 3 Scored-layer UI | `/login` → consent gate → assent → intake → randomised scored layer (1 item/screen on phones, ≤6 on desktop, attention checks, descent progress, two micro-moments, tap card sort) → academic snapshot |
| + Readiness checks & tasters | Maths / science / reading checks and six taster tasks after the snapshot, then a break before The Guide. Raise-only lifts, ±5 taster adjustments, plain-language summaries for the AI, "What you tried" on the report. `src/lib/skills/`, `config/skills/` ([rules](docs/DECISIONS.md#e-readiness-checks--taster-tasks-owners-decision-2026-10-10-check)) |
| 4 The Guide | `/api/guide/message` — safety screen → streamed conversation, hidden markers, voice input, pause/resume, hard-path alerts |
| 5 Signals + reports | `src/lib/pipeline/report.ts` — signals → rescoring → report writer (Lerato few-shot) → Zod + linter → retry → release policy; review queue at `/staff` |
| 6 Report + PDF + sharing | `/learn/report` (headline reveal, RIASEC hexagon, doors strips), PDF export, teacher/parent summaries, revocable parent link |
| 7 School side | `/school/teacher` (RLS), `/school/admin` (settings, roster + SA-SAMS imports, cohort dashboard with min-10 suppression), `/school/safeguarding`, escalation cron |
| 8 Grade 11 + verdicts | `src/lib/verdict/` (pure) + G11 flow, conversation with Grade 9 callbacks, Confirmation Report |
| 9 Norming | `src/lib/norming/` + nightly cron + `npm run norms` (item-level CSV) |

Decisions, spec discrepancies and open **[CHECK]** items: **[docs/DECISIONS.md](docs/DECISIONS.md)**.

---

## Run it locally

You need Node 20+, and either the Supabase CLI with Docker **or** a dedicated hosted Supabase dev project.

```bash
npm install
cp .env.example .env.local          # fill in the values below

# Option A — local Supabase (Docker)
npx supabase init                    # once; keeps the existing supabase/migrations
npx supabase start                   # prints the URL, anon key and service_role key for .env.local
npx supabase db reset                # applies 0001 + 0002

# Option B — a NEW hosted Supabase project (never reuse the expirydesk project)
# run supabase/migrations/0001_init.sql then 0002_app_extensions.sql in the SQL editor

npm run seed                         # school PILOT1, staff logins, learners with codes (printed)
npm run dev                          # http://localhost:3000
```

Seeded logins (school code **PILOT1**): Lerato `LER-0901` (Gr 9, school-imported marks), Sipho `SIP-0902` (Gr 9),
Ayanda `AYA-1101` (Gr 11), Thabo `THA-0903` (no guardian consent → shows the block screen).
Staff: `teacher@pilot.test`, `admin@pilot.test`, `safeguard@pilot.test`, `staff@excavation.test` — the
password is printed by the seed (or set `SEED_STAFF_PASSWORD`).

### Environment

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` | Public |
| `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` | **Server only.** Importing them from client code fails the build (`server-only`), lint, and `npm run check:secrets` |
| `AI_MODEL_FAST` / `AI_MODEL_STRONG` / `AI_EFFORT_CONVERSATION` | Defaults: `claude-haiku-5-5` (safety screen), `claude-opus-5-5` (everything else), `medium` |
| `REVIEW_FIRST_N_REPORTS` | Human review for the first N reports (default 200) |
| `RESEND_API_KEY`, `SAFEGUARDING_FROM_EMAIL`, `EXCAVATION_SAFEGUARDING_LEAD_EMAIL` | Urgent safeguarding emails (every flag is always on the staff dashboard). Unset in dev = emails are logged, not sent |
| `CRON_SECRET` | Bearer token for `/api/cron/*` |

---

## Tests

```bash
npm test               # 183 unit tests: scoring, verdicts A–G, Lerato G9 + G11, checks + tasters, flow, guide, linter, PDFs, cohort, norming
npm run test:db        # 15 RLS checks on the real migrations in a throwaway Postgres 16
MIGRATION_LIMIT=1 bash scripts/test-db.sh   # same checks on the spec schema alone → 4 fail (the holes 0002 fixes)
npm run check:secrets  # production build with canary secrets, then scans every browser file for them (and for check answer keys)
npm run validity       # check item statistics + whether each check predicts Grade 10/11 marks beyond Grade 9 marks
npm run typecheck && npm run lint
```

---

## Deploy (Vercel)

1. New Supabase project in a region chosen with your attorney (spec 09 §1, risk 4); apply both migrations.
2. Set the environment variables in Vercel. Never prefix server secrets with `NEXT_PUBLIC_`.
3. `vercel.json` schedules the safeguarding escalation every 15 minutes and norming nightly.
   **15-minute crons need a Vercel Pro plan** (Hobby only allows daily) — or call
   `/api/cron/safeguarding-escalation` from any scheduler with `Authorization: Bearer $CRON_SECRET`.
4. Load `config/safeguarding_resources.json` numbers only after verifying them that month (spec 09 §5.3).

---

## Definition of done (spec 10)

| Item | Status |
|---|---|
| All Vitest suites pass, incl. Lerato fixtures and verdict examples A–G | ✅ 183 unit + 15 RLS |
| No AI key or service key reachable from the browser | ✅ `server-only` + canary bundle scan (and a probe proving a client import fails the build) |
| Teacher cannot see any report the learner didn't share (tested with RLS) | ✅ `tests/db/rls.test.ts` |
| Cohort dashboard suppresses groups smaller than 10 | ✅ incl. complementary suppression (`tests/cohort.test.ts`) |
| Grade 9 on a phone over slow data in < 90 min | ⏳ Needs a device test. Now two sittings with a break: Part 1 (questions, checks, tasters) and Part 2 (The Guide). Built for it: no web fonts, one item per screen |
| Safety screen tested on 200 sample messages with the clinical advisor | ⏳ Needs the advisor and the message set |
| Safeguarding flags visible to staff | ✅ `/staff/safeguarding` on creation; urgent ones also emailed (no SMS, by decision) |
| File 09 §7 checklist | ⏳ Legal / clinical / registration items — see spec 09 |

## Project map

```
spec/                     the spec pack (source of truth; configs are loaded + validated from here)
config/                   runtime config the spec asks to keep out of code (crisis numbers, NSC rules, career keywords, few-shot reports, skills/ check + taster content)
supabase/migrations/      0001 = spec schema verbatim · 0002 = additions + RLS fixes
src/lib/scoring/          deterministic scoring engine (spec 04)
src/lib/verdict/          deterministic Grade 11 verdict engine (spec 06)
src/lib/ai/               prompts (spec 07), Zod schemas, safety screen, report linter
src/lib/guide/            The Guide: scripts, score context, markers, streaming turn
src/lib/pipeline/         scoring, signals, reports, summaries
src/lib/safeguarding/     scored-layer soft trigger, keyword floor, alerts, escalation clock
src/lib/skills/           readiness checks + taster tasks: plan, scoring, raise-only lifts, plain summaries, validity stats
src/lib/cohort/, norming/ aggregates with suppression; norming statistics
src/app/                  learner, staff, school pages + API routes
tests/                    unit tests · tests/db = RLS on real Postgres
```
