# Runbook: running The Excavation in production

Who this is for: whoever is on call. Keep it open during a pilot.

## Where things live

| What | Where |
|---|---|
| App | Vercel project, region `dub1` (Dublin). Live URL: https://excavation-virid.vercel.app |
| Database + auth | Supabase project `gbgsxzrqxsskeyhgioae`, `eu-west-1` (Ireland) |
| AI | Anthropic API, called only from server routes (data leaves the EU/SA: see `docs/BREACH_PLAN.md` and the privacy notice) |
| Email | Resend (urgent safeguarding alerts only) |
| Code | GitHub `hmalepe/excavation`; `main` deploys to production |
| Secrets | Vercel environment variables. Never in the repo. Never `NEXT_PUBLIC_` for a secret |

## Health checks

- `GET /api/health`: public, returns `{ok, time, version}`. Point an external uptime monitor at it (1-minute interval, alert by SMS).
- `GET /api/health/deep` with `Authorization: Bearer $CRON_SECRET`: checks the database and reports which integrations and approval flags are configured (AI key, email, lead email, consent form, legal pages, retention). Monitor it every 5 minutes and alert on `database != ok`.
- Browser errors are posted to `/api/client-error` and appear in Vercel runtime logs as `[client-error]`.

## Scheduled jobs (`vercel.json`)

| Job | When | If it stops |
|---|---|---|
| `/api/cron/safeguarding-escalation` | every 15 min | **Urgent.** Unconfirmed hard alerts stop escalating to the Excavation lead. Fix within the hour or phone the schools. Needs Vercel Pro (or an external scheduler calling it with the bearer token) |
| `/api/cron/norms` | 02:17 UTC | Norm tables go stale. Low urgency |
| `/api/cron/retention` | 03:33 UTC | Only reports what it would delete until `RETENTION_ENABLED=true`. Low urgency |

## Incidents

**Site down / 5xx everywhere**
1. Vercel dashboard → Deployments. If the last deploy is the cause: *Promote* the previous good deployment (instant rollback).
2. Check Supabase status page and project health. Check the Anthropic status page (the Guide fails soft: learners can finish the scored sections without it).
3. Tell the schools' LO teachers by WhatsApp/email: "learners can continue later, nothing is lost, progress is saved after every answer".

**The Guide says it's unavailable / replies fail**
- Safety screen outage fails closed on purpose: a message is never passed to the Guide unscreened. Check `[safety] screen unavailable` in logs, then the Anthropic key, billing and rate limits.
- Daily cost kill switch: `AI_DAILY_GUIDE_LIMIT` (default 20000 replies/day). If it trips legitimately, raise it in Vercel and redeploy.

**Safeguarding alert not delivered or not confirmed**
1. The flag is always on `/staff/safeguarding` and `/school/safeguarding` even if email fails. Look there first.
2. Phone the school's safeguarding contact. Do not wait for the 4-school-hour escalation.
3. Check `RESEND_API_KEY`, the sending domain's SPF/DKIM, and logs for `[notify]`.

**Staff locked out by two-step sign in (lost phone)**
- Verify who they are by phone. In Supabase → Authentication → Users → the user → remove their MFA factor. They re-enrol at next sign-in.
- Break-glass for everybody (incident only): set `STAFF_MFA=off` in Vercel, redeploy, and **turn it back on the same day**. Record it in the audit log.

**Brute-force on a login**
- Learners and staff are throttled (hashed keys in `login_attempts`). Look for many `succeeded=false` rows. To block an address, add a Vercel Firewall rule.

**Suspected data leak** → `docs/BREACH_PLAN.md`, immediately.

## Backups and recovery

- Supabase daily backups are available on paid plans; **point-in-time recovery is a paid add-on**. Decide before the pilot which you have, and write down the restore owner.
- A restore drill has **not** been done yet. Do one before the first school goes live: restore into a new project, run `npm run test:db`-style spot checks, time it. Record the time here.
- Target (proposal, to be agreed): recovery point ≤ 24 h, recovery time ≤ 4 h.

## Deploying

1. Branch → PR → CI must be green (typecheck, lint, 330+ unit tests, secret scan, RLS tests, e2e accessibility).
2. Merge to `main`; Vercel deploys. Smoke: open `/api/health`, sign in as a test teacher, load a learner report.
3. Database changes: add a numbered file in `supabase/migrations/`, apply to a Supabase **branch** first, run advisors (`get_advisors`), then apply to production.
4. Rollback: Vercel *Promote* on the previous deployment. Migrations are forward-only; write the reverse migration by hand if needed.

## Rotating secrets

Supabase service-role key, Anthropic key, Resend key and `CRON_SECRET`: rotate in the provider, update in Vercel, redeploy, then confirm `/api/health/deep` is green. Rotate at once if any may have been exposed, and every 12 months regardless.

## Routine care

| Cadence | Task |
|---|---|
| Weekly | Review Dependabot PRs; skim Vercel logs for `[route error]` |
| Monthly | `npm run eval:safety` (see `docs/SAFETY_EVALUATION.md`); verify the helpline numbers in `config/safeguarding_resources.json`; review Supabase advisors |
| Each term | Review the audit log for unusual staff access; test the safeguarding alert path with each school's contact |
| Yearly | Access review (who has Vercel/Supabase/Anthropic/Resend/GitHub access); rotate secrets; review retention and consent paperwork with the attorney |
