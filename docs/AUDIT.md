# Audit and readiness checklist: The Excavation × Know Thy Self, School Edition

Date: 11 October 2026. Scope: the whole product as a platform that processes **children's personal information** and
**mental-health-adjacent disclosures** in South African schools, using an **AI model**. Method: code and configuration review,
live Supabase advisors, automated tests, and a gap analysis against what a pilot with real schools requires.

**Legend:** ✅ done (verified in this repo) · 🔧 fixed in this audit · 🧑 needs a human or an outside party · 🛣 roadmap (not blocking a small supervised pilot)

## Verdict

The engineering is in good shape for a **supervised pilot**: security controls, privacy tooling, safeguarding flow and tests are in place.
It is **not ready for an unsupervised or paid roll-out** until the 🧑 items marked **BLOCKER** are done. Almost all of those are legal,
clinical or operational, not code.

Evidence at the time of writing: 331 unit tests, 17 row-level-security tests on a real Postgres 16, 25 browser tests (security headers,
access control, WCAG A/AA in light and dark on every public page), typecheck and lint clean, a production-bundle secret scan, CI on every push.

## 1. Security

| # | Item | Status |
|---|---|---|
| 1.1 | Secrets server-only; build fails if a server module is imported client-side; canary scan of the browser bundle | ✅ |
| 1.2 | Row-level security on every table; tested against a real database, including the holes the spec schema had | ✅ |
| 1.3 | Brute-force protection on staff login (per address and per account, hashed keys) | 🔧 |
| 1.4 | Cost/abuse limits on the Guide (per session, per minute, daily kill switch) | 🔧 |
| 1.5 | Security-definer helper functions moved out of the exposed API schema; initplan-safe policies; FK indexes (migration 0004) | 🔧 |
| 1.6 | Content-Security-Policy, HSTS, frame/embedding denial, referrer and permissions policy, no `X-Powered-By`; verified with zero violations | 🔧 |
| 1.7 | Two-step sign-in (authenticator app) for every staff role; required in production; throttled; audited | 🔧 |
| 1.8 | **Smoke-test two-step sign-in with a real authenticator on production and confirm TOTP is enabled in Supabase Auth settings** | 🧑 BLOCKER |
| 1.9 | Apply migration `0006_catch_up_drops.sql` in the Supabase SQL editor (the tooling used here holds DROP statements for human confirmation) | 🧑 |
| 1.10 | Enable leaked-password protection in Supabase Auth (plan-dependent) | 🧑 |
| 1.11 | Dependency scanning: Dependabot weekly, `npm audit` for production dependencies gating CI (0 findings now) | 🔧 |
| 1.12 | Five known high advisories sit in development-only tooling (`eslint-config-next` chain); not shipped | ✅ accepted, tracked |
| 1.13 | CSP still allows inline scripts (a Next.js limitation without nonces); move to nonce-based CSP | 🛣 |
| 1.14 | Require MFA level in the database policies as well as the app layer (defence in depth) | 🛣 |
| 1.15 | Independent penetration test before any large roll-out | 🧑 |
| 1.16 | Vercel Firewall / bot protection rules; rate limits at the edge | 🧑 |

## 2. Privacy and legal (POPIA; children's information)

| # | Item | Status |
|---|---|---|
| 2.1 | Guardian consent register, printable consent form per learner, CSV import of signed forms, login blocked without consent | 🔧 |
| 2.2 | Learner assent captured and stored separately | ✅ |
| 2.3 | Data-subject rights tooling: export, erase, withdraw consent; safeguarding records protected from casual erasure; everything audited | 🔧 |
| 2.4 | Retention schedule and daily sweep; anonymisation for research-consented learners (reports only until `RETENTION_ENABLED=true`) | 🔧 |
| 2.5 | Privacy notice, terms and cookie notice pages (clearly marked DRAFT) | 🔧 |
| 2.6 | **Attorney review and sign-off of the consent form, privacy notice, terms**; then set `CONSENT_FORM_APPROVED` and `LEGAL_APPROVED` | 🧑 BLOCKER |
| 2.7 | **School agreement** defining who is the responsible party and who is the operator | 🧑 BLOCKER |
| 2.8 | Operator/data-processing agreements with Supabase, Vercel, Anthropic and Resend; confirm each provider's data-retention terms (for the AI provider, ask about zero retention) | 🧑 BLOCKER |
| 2.9 | Cross-border transfer analysis (database in Ireland, AI in the United States) and wording in the notice | 🧑 BLOCKER |
| 2.10 | Information Officer named and registered with the Information Regulator | 🧑 |
| 2.11 | Data-protection impact assessment for processing children's information with AI | 🧑 |
| 2.12 | Breach response plan drafted (`docs/BREACH_PLAN.md`); roles still to be filled and rehearsed | 🔧 / 🧑 |
| 2.13 | Cookie use is strictly necessary only (session); confirm no analytics are added without consent | ✅ |

## 3. Safeguarding and AI safety

| # | Item | Status |
|---|---|---|
| 3.1 | Every learner message screened before the Guide sees it; fails closed; model result can only be raised by the keyword floor | ✅ |
| 3.2 | Escalation: school confirmation required, auto-escalation to the Excavation lead after 4 school hours (15-minute cron) | ✅ |
| 3.3 | Labelled test corpus (hard/soft/none; six languages; idioms; injection attempts) and floor regression tests | 🔧 |
| 3.4 | Floor extended with first-person phrases in isiZulu, isiXhosa, Afrikaans, Sesotho, Setswana (draft) and tense/phrasing fixes found by the corpus | 🔧 |
| 3.5 | Live evaluation harness with a release gate (`npm run eval:safety`); **not yet run, needs an API key** | 🔧 / 🧑 |
| 3.6 | **Clinical advisor reviews the screen prompt, floor and corpus; first-language speakers review each language** | 🧑 BLOCKER |
| 3.7 | **Test the alert path end to end with each school's safeguarding contact before go-live** | 🧑 BLOCKER |
| 3.8 | Helpline numbers verified monthly (`config/safeguarding_resources.json`) | 🧑 |
| 3.9 | Human review of the first N reports before release (default 200) | ✅ |
| 3.10 | Scheduled monthly safety evaluation in CI with a stored key | 🛣 |

## 4. Quality engineering

| # | Item | Status |
|---|---|---|
| 4.1 | Unit tests for scoring, verdicts, flow, Guide, PDFs, cohort, norming, privacy, consent, throttling, safety, MFA | ✅ / 🔧 |
| 4.2 | CI: typecheck, lint, tests, secret scan, dependency audit, RLS tests, browser tests, on every push and PR | 🔧 |
| 4.3 | Browser accessibility tests (axe, WCAG A/AA, light and dark, phone width) on all public pages | 🔧 |
| 4.4 | **End-to-end learner journey test** (login → questions → report) against a seeded test database | 🛣 |
| 4.5 | Accessibility tests on signed-in pages; manual screen-reader pass with a real user | 🛣 / 🧑 |
| 4.6 | Load test at class scale (for example 40 learners at once in a school with weak Wi-Fi) | 🛣 |
| 4.7 | Staging environment with its own Supabase project | 🛣 |
| 4.8 | Branch protection on `main` requiring green CI | 🧑 |

## 5. Operations

| # | Item | Status |
|---|---|---|
| 5.1 | Public health endpoint and a protected deep check | 🔧 |
| 5.2 | Runbook, pilot playbook, teacher guide | 🔧 |
| 5.3 | **External uptime monitor and alerting on `/api/health` and the deep check** | 🧑 BLOCKER |
| 5.4 | **Error monitoring** (browser errors currently go to logs only); add a service and alert routing | 🧑 / 🛣 |
| 5.5 | **Backups confirmed; point-in-time recovery decision; restore drill with a recorded time** | 🧑 BLOCKER |
| 5.6 | Vercel Pro (or an external scheduler) so the 15-minute safeguarding escalation actually runs | 🧑 BLOCKER |
| 5.7 | Log drain and retention for audit and security investigation | 🛣 |
| 5.8 | Support process: who answers a teacher at 08:00 on session day; target response times | 🧑 |
| 5.9 | Secret rotation schedule and access review | 🧑 |

## 6. Product, content and science

| # | Item | Status |
|---|---|---|
| 6.1 | Instrument items frozen; scoring covered by fixtures (including the worked example) | ✅ |
| 6.2 | **Readiness checks and taster tasks are DRAFT**; need review by subject teachers and an assessment specialist | 🧑 BLOCKER |
| 6.3 | Norm tables need real South African sample sizes; until then do not present percentile claims | 🧑 |
| 6.4 | Predictive-validity study (do checks predict Grade 10/11 marks beyond Grade 9?) has tooling (`npm run validity`) but no data | 🧑 |
| 6.5 | The interface is English only; learners in the pilot may need isiZulu, isiXhosa, Afrikaans, Sesotho, Setswana | 🛣 |
| 6.6 | Low-data and offline resilience (data costs matter in schools and homes) | 🛣 |
| 6.7 | Read-aloud (on-device voices; nothing sent anywhere), illustrated questions, plain-language report with charts and PDF | ✅ |
| 6.8 | Bias review of scoring and AI narrative across language, gender and school type | 🧑 |
| 6.9 | Learner-facing statement of limits: this is a conversation starter, not a diagnosis or a prediction | ✅ in copy / 🧑 review |

## 7. Business readiness

| # | Item | Status |
|---|---|---|
| 7.1 | Licence/IP position for the "Know Thy Self" instrument and brand | 🧑 |
| 7.2 | Pricing, unit economics (AI cost per learner is measurable; see the cost kill switch) and pilot terms | 🧑 |
| 7.3 | Insurance: cyber and professional indemnity | 🧑 |
| 7.4 | Provincial education department approval path for schools | 🧑 |
| 7.5 | Success metrics agreed for the pilot (playbook section 4) | 🧑 |

## Order of work from here

1. Attorney: consent form, privacy notice, terms, school agreement, provider agreements, cross-border (2.6 to 2.9).
2. Clinical advisor and language reviewers: safety screen, floor, corpus (3.6); run `npm run eval:safety` (3.5).
3. Operations: uptime monitor, backups and restore drill, Vercel Pro, MFA smoke test, apply 0006 (5.3, 5.5, 5.6, 1.8, 1.9).
4. Content: teacher/assessment-specialist review of checks and tasters (6.2).
5. Pilot with one school, one grade, one class, supervised, following `docs/PILOT_PLAYBOOK.md`.
6. Then the roadmap: end-to-end journey tests, nonce-based CSP, translations, low-data mode, staging, monitoring.
