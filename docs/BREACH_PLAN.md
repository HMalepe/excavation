# Personal-information breach plan (POPIA section 22)

Learners are children. Treat every suspected breach as serious until shown otherwise. This is a working draft for the
Information Officer and the attorney to adopt; it is not legal advice.

## Roles (fill in names and phones before the pilot)

| Role | Name | Phone |
|---|---|---|
| Information Officer (decides, signs off notifications) | _to be named_ | |
| Technical lead (contain, investigate) | _to be named_ | |
| Safeguarding lead (child-welfare impact) | _to be named_ | |
| Attorney | _to be named_ | |

## The first hour

1. **Write down the time you found out** and who told you. Start a private incident log (a document; times in SAST).
2. **Contain.** Stop the bleeding before you investigate:
   - Suspected key exposure → rotate it (service-role, Anthropic, Resend, `CRON_SECRET`; see runbook).
   - Suspected account takeover → remove the user's sessions in Supabase, reset the password, remove their MFA factor.
   - Bad deployment exposing data → *Promote* the previous Vercel deployment.
   - Do **not** delete logs or data. Preserve evidence.
3. **Tell the Information Officer** immediately, by phone.

## Assess (same day)

- What data? (names, login codes, answers, Guide conversations, marks, safeguarding flags, consent records)
- Whose, and how many? Which schools? Which are minors (all learners are)?
- Was it read, copied, altered or only exposed? Is it encrypted or otherwise unusable to the person who saw it?
- Query the audit log (`audit_log`) and Vercel/Supabase logs for the time window.
- Could any learner now be at risk (for example, a safeguarding flag or a disclosure became visible)? If yes, loop in the safeguarding lead and the school's safeguarding contact **first**.

## Notify

POPIA requires notice to the **Information Regulator** and to **affected data subjects** "as soon as reasonably possible"
after discovering a compromise, unless a public body requires delay for a criminal investigation. For learners under 18,
notify the **parent or guardian**, and the **school** (the responsible party relationship is set out in the school agreement).

| Who | By when | How | Content |
|---|---|---|---|
| Information Officer + attorney | Same day | Phone | Facts so far |
| School principal | Within 24 h of confirming | Phone, then email | What happened, what data, what we have done, who to call |
| Information Regulator | As soon as reasonably possible after the Officer signs off | The Regulator's published breach-reporting channel (check the current address and form on inforegulator.org.za) | Description, categories and number of data subjects, likely consequences, measures taken |
| Parents/guardians | As soon as reasonably possible, via the school | Letter or SMS drafted by the attorney | Plain language: what, when, what we did, what they can do, who to contact |

Notification must be enough to let people protect themselves: what happened, what information, what to watch for, and a
real contact. Do not minimise. Do not blame learners.

## After

- Root cause and fix, with a test that would have caught it (add to the CI suites).
- Update the data-processing records, this plan and the runbook.
- Brief the schools on what changed.
- Keep the incident file for at least 5 years.

## Known data flows to bear in mind

- Database, auth: Supabase, Ireland (eu-west-1).
- AI processing: Anthropic, United States. What goes to the AI: the learner's first name, grade, scores, intake answers and the Guide conversation. No surname, school name, ID or contact details. Check `src/lib/guide/scoreContext.ts` and the privacy notice. Cross-border transfer is disclosed in `/privacy`.
- Email: Resend, urgent safeguarding alerts only.
- Reports/PDFs are generated on demand and not stored.
