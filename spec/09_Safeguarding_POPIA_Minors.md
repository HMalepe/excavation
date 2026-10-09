# 09 — Safeguarding, POPIA & Working With Minors

> **This is a working framework, not legal advice.** Before any learner uses the product, have it reviewed by (1) an attorney who works with POPIA and education, and (2) an HPCSA-registered psychologist (educational or counselling) as clinical advisor. Every item marked **[VERIFY]** needs their sign-off.

---

## 1. The five risks that matter most

| # | Risk | Why it matters | What resolves it |
|---|---|---|---|
| 1 | **Processing children's personal information** | POPIA treats children's information as specially protected (s34–35). Without proper guardian consent, processing is unlawful. | Guardian consent flow (§3) before any data is collected |
| 2 | **"Psychological test" classification** | In South Africa, using psychological tests to assess people can be a regulated act under the Health Professions Act, and psychometric tests can require classification by the HPCSA's Professional Board for Psychology. Career-assessment tools used in schools can fall in this area. **[VERIFY — highest priority]** | Clinical advisor + attorney opinion before the pilot. Position the product as self-reflection and career exploration, not psychological assessment. Have a registered psychologist on the advisory board. Ask whether the scored layer should eventually be submitted for classification. |
| 3 | **A learner discloses harm or risk** | Children's Act s110 places reporting duties on teachers and others. A tool that hears a disclosure and does nothing fails the child. | Safeguarding protocol (§5) with a named school contact in every partnership agreement **[VERIFY]** |
| 4 | **Data leaving South Africa** | The current Supabase project is in the EU (eu-west-1) and the AI provider processes data abroad. POPIA s72 restricts cross-border transfers. | Consent wording that covers it, operator agreements, and consider a South African or adequately-protected region **[VERIFY]** |
| 5 | **Automated decisions about a child** | POPIA s71 limits decisions based solely on automated processing that substantially affect a person. | The report is a recommendation; the learner, family and school decide. A human reviews reports at launch (file 07 §1). |

---

## 2. What the school edition never does

- Never assesses trauma, abuse history, adverse childhood experiences, Dark Triad traits, attachment style, sexuality, religion (beyond a values card), or political views.
- Never diagnoses, labels a condition, or uses clinical words (depression, anxiety disorder, ADHD, autism, trauma) in any learner, teacher or parent output.
- Never ranks learners against each other in anything a school can see at individual level.
- Never shows conversation content to a school, teacher or parent without the learner's explicit consent (except §5 hard triggers).
- Never sells, shares or uses learner data for advertising.
- Never uses learner conversations to train any third-party AI model. Confirm the AI provider's current API data terms in writing. **[VERIFY]**
- Never reports results by race, and never builds norms by race.

---

## 3. Consent model

### 3.1 Who consents to what

| Consent | Given by | When | Required? |
|---|---|---|---|
| Processing personal information for the service | **Parent/guardian** | Before the session (via school, digitally or on paper) | **Yes** |
| Learner agreement (assent) | Learner, on screen | Start of each session | **Yes** |
| AI processing and cross-border transfer | Parent/guardian (in the same form, plain language) | Before the session | **Yes** |
| Wellbeing detection ("we may notice if you seem to be struggling and offer support") | Parent/guardian + learner | Before the session | **Yes** |
| Share teacher summary with LO teacher | **Learner**, per report | After reading their report | Optional |
| Share parent summary | **Learner** | Any time | Optional |
| Anonymised data used for research and norms | Parent/guardian | Before the session | Optional — a "no" must not block the service |
| Follow-up at Grade 11 (keep the baseline) | Parent/guardian | Grade 9 consent covers it; refreshed at Grade 11 | Yes, for the bundle |

**Open legal question [VERIFY]:** whether a parent of a minor can demand to see their child's full report or transcript. Decide the policy with the attorney before launch, and state it plainly in the consent form so learners aren't promised privacy they don't have.

### 3.2 Guardian consent form — plain-language core (draft)

> **The Excavation — consent for [learner name], Grade [9/11], [School]**
>
> Your child's school is offering The Excavation, a self-discovery tool that helps learners choose subjects and think about careers. Your child will answer questions about their interests, how they think, what matters to them and how they study, then chat with an AI guide about their experiences. They receive a personal report.
>
> **What we collect:** answers to questions, a written conversation, school marks (from the school or typed by your child), name, grade and school.
> **What we don't collect:** ID numbers, medical information, family finances.
> **Who sees it:** your child. The school sees a short summary only if your child agrees. You see a summary if your child chooses to share it. *[Policy on parental access — VERIFY]*
> **AI:** answers are processed by an AI service that may be located outside South Africa. It is not allowed to use your child's information to train its systems. *[VERIFY]*
> **Safety:** if your child's answers suggest they may be unsafe, we will show them support resources and inform the school's designated staff member so an adult can help.
> **How long we keep it:** until one year after your child finishes Grade 12, unless they choose to keep their account as an adult. Anonymised data may be kept longer for research if you agree below.
> **Your rights:** you can ask to see, correct or delete your child's information at any time: privacy@theexcavation.co.za. Information Officer: Holiday Malepe.
>
> ☐ I consent to my child taking part (required)
> ☐ I consent to anonymised data being used to improve the tool and for research (optional)
>
> Name · Relationship to learner · Signature/OTP · Date

### 3.3 Learner assent screen

> Before you start:
> - This isn't a test. There are no wrong answers.
> - You'll chat with **The Guide**, an AI. It's built to listen properly.
> - Your report is yours. Teachers only see a summary if you say yes.
> - If something you write makes us think you might be unsafe, we'll make sure an adult at school who can help knows. That's the only exception.
> - You can pause or stop any time.
>
> [ I understand — let's start ] [ I have a question ] [ Not today ]

"Not today" must work with no penalty and no message sent to the school beyond "not completed".

---

## 4. Data handling rules

| Area | Rule |
|---|---|
| Minimisation | No ID numbers, no addresses, no health data fields. Date of birth not needed; grade is enough. |
| Separation | Conversation transcripts stored separately from scores, with stricter access (learner + safeguarding role only). |
| Access control | Row-level security on every table (file 10). Teachers see only consented summaries. School admins see aggregates. |
| Aggregates | Minimum group size **10** for any school-facing statistic. Smaller groups are suppressed. |
| Retention | Account active until 1 year after Grade 12. Then delete, or anonymise if research consent was given. Safeguarding records follow the attorney's guidance. **[VERIFY]** |
| Breach | POPIA s22: notify the Information Regulator and affected guardians as soon as reasonably possible. Keep a breach response plan ready. |
| Information Officer | Register with the Information Regulator before the pilot. |
| Operators | Written operator agreements with the hosting provider, the AI provider and the email provider (POPIA s20–21). |
| People | Anyone with access to identifiable learner data signs a confidentiality agreement and is screened in line with the Children's Act requirements for people working with children (e.g. National Child Protection Register / National Register for Sex Offenders checks). **[VERIFY]** |

---

## 5. Safeguarding protocol

### 5.1 Three levels

| Level | Trigger | What the learner sees | What the system does |
|---|---|---|---|
| **Soft (scored layer)** | Two of: Stress Sensitivity ≥ 80; FC6 = 5 for any subject; 4+ consecutive maximum-distress answers; extreme hesitation (> 4× median time) on several items; restart within the session | A calm interstitial: *"Some of these questions can land heavier on some days. You can keep going, take a break, or come back another time. If talking to someone would help, there are people available now."* + expandable resources + [Continue] [Take a break], visually equal | Logs a flag (no content). The report adds a gentle support line. Teacher summary unchanged. |
| **Soft (conversation)** | Safety screen returns `soft` (file 07, 3A) | The Guide pauses, acknowledges, checks in, offers SADAG, asks whether to continue | Logs flag + message ID. Report includes a support line. |
| **Hard** | Safety screen returns `hard`: current suicidal thoughts, self-harm, intent to harm someone, or disclosure of abuse or being unsafe | The Guide stops the questions, responds with care, gives resources, tells the learner honestly that a designated adult at school will be told, asks if someone is with them now | **Immediately notifies the school's designated safeguarding contact** (SMS + email): learner name, grade, time, level "urgent", and the message that triggered it. **No other session content.** Notifies the Excavation safeguarding lead. Session locked until reviewed. |

### 5.2 Rules for the hard path
1. **Results are never withheld as punishment.** If the session ends early, the learner can complete it later, and the report is delivered when it's appropriate.
2. **The designated contact is named in every school partnership agreement** (usually the principal, deputy or LO head), with a backup. No school goes live without one.
3. **Response time:** the school confirms receipt within 1 school day; for "urgent", same day. If there's no confirmation within 4 hours during school hours, the Excavation safeguarding lead phones the school.
4. **Outside school hours:** the learner sees resources immediately; the school is notified for the next morning; the Excavation safeguarding lead monitors. **[VERIFY whether out-of-hours escalation is needed]**
5. **Logged and reviewed:** every hard trigger is logged (who was notified, when, confirmation received) and reviewed quarterly with the clinical advisor.
6. **False positives are acceptable.** It is better to over-notify on a genuine ambiguity than to miss a child at risk. The safety screen deliberately chooses the higher level when unsure.

### 5.3 Resources shown to learners [VERIFY numbers before every release; store in config, not code]

| Service | Contact | Hours |
|---|---|---|
| Childline South Africa | **116** (free) | 24 hours |
| SADAG (Depression & Anxiety Group) | **0800 456 789** · SMS **31393** | 24 hours |
| Suicide Crisis Line | **0800 567 567** | 24 hours |
| Lifeline South Africa | **0861 322 322** | 24 hours |
| GBV Command Centre | **0800 428 428** | 24 hours |

Tap-to-call on phones. The screen closes only when the learner closes it.

---

## 6. Language rules for all outputs

| Use | Avoid |
|---|---|
| "feels pressure strongly" | "anxious", "neurotic" |
| "this subject is a struggle right now" | "failing", "weak learner" |
| "worth talking to someone you trust" | "you need help", "you should see a psychologist" |
| "the plan came from people who care about you" | "your parents are pushing you" |
| "possible with a plan" | "you can't", "not suitable for you" |
| "reflective insight" (before norming) | "scientifically proven", "accurate assessment" |

---

## 7. Pre-pilot checklist

- [ ] Attorney opinion: POPIA children's data, consent form, parental access policy, cross-border transfer, Children's Act reporting, retention
- [ ] Clinical advisor appointed (HPCSA-registered) and has reviewed: items, conversation scripts, safeguarding protocol, banned-word lists
- [ ] Opinion on psychological test classification **(do not skip)**
- [ ] Information Officer registered with the Information Regulator
- [ ] Operator agreements signed (hosting, AI, email)
- [ ] Each pilot school: partnership agreement + named safeguarding contact + backup + subject-change deadline uploaded
- [ ] Crisis numbers verified this month
- [ ] Safety screen tested against a set of 200 sample messages (including slang and dark humour about schoolwork) with the clinical advisor
- [ ] Human review rota for the first 200 reports
