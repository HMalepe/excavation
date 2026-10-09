# 02 — The Scored Instrument (Grade 9 Foundation & Grade 11 re-test)
## Original items, v1.0.0

---

## 1. Status of these items

Every item below is **original wording**, written for South African teenagers. The constructs come from established public research (Big Five, Holland's RIASEC, Schwartz's values, Self-Determination Theory, Dweck's mindset research, Marcia's identity statuses, self-regulated learning). No item is copied or paraphrased from a proprietary instrument (MBTI, CliftonStrengths, Insights, Strong, DISC, 16PF).

**Until pilot data proves the items are reliable, every score is reported as a reflective insight, not a measurement.** The scoring engine (file 04) tracks this with `norm_state = pre_norm`, and the report writer changes its wording automatically once reliability is confirmed.

If you want a faster route to validated items for the personality section, the free public-domain IPIP item pool (ipip.ori.org) can replace or supplement the P_ items. Keep the same scale IDs so nothing downstream changes.

---

## 2. Overview

| Section | Scale IDs | Items | Format | Learner-facing title |
|---|---|---|---|---|
| Personality | P_O, P_C, P_E, P_A, P_N | 30 | agree5 | "How you're wired" |
| Career interests | I_R, I_I, I_A, I_S, I_E, I_C | 36 | enjoy5 | "What you'd love doing" |
| Values | VALUES | 10 cards | card sort | "What matters most" |
| Motivation | MOTIVATION | 8 | true5 | "Why you do schoolwork" |
| Mindset | MINDSET | 6 | agree5 | "How you see your brain" |
| Identity status | IDENTITY | 10 | agree5 | "Where you are with your future" |
| Whose plan | DIRECTION_SOURCE | 3 | true5 | "Whose plan is it?" |
| Study habits | STUDY | 8 | agree5 | "How you study" |
| Context (optional) | CONTEXT | 3 | yes/sometimes/no | "Your study situation" |
| Attention checks | AC1, AC2 | 2 | — | (hidden among the others) |
| **Total** | | **116** | | about 20–25 minutes |

### Response formats

| ID | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| agree5 | Not like me at all | Not really like me | Sometimes like me | Mostly like me | Exactly like me |
| enjoy5 | Really dislike | Dislike | Not sure | Like | Love |
| true5 | Not true for me | A little true | Somewhat true | Mostly true | Very true |

---

## 3. Administration rules

1. **Order:** Intake → Interests → Personality → Values card sort → Motivation → Mindset → Identity → Whose plan → Study → Context. Interests come first because teens enjoy them most, which builds momentum.
2. **Within each section, randomise item order** per learner (store the order shown). Never randomise across sections.
3. **One item per screen on phones; up to 6 per screen on computers.**
4. Place AC1 randomly in the first half and AC2 randomly in the second half.
5. **No "back" button within a section** after an answer is locked in, but allow changing the current answer. Log every change (`answer_change_count`).
6. Log response time per item. Used for quality checks (file 04 §7), never shown to anyone.
7. **Progress display:** the five-stage descent: *Surface → Wading in → Deep water → The trench → The floor*. No percentage numbers.
8. **Micro-moments:** after the interests section and after the values sort, show one line generated from the answers so far (e.g. "You lit up most at the building and fixing activities. Hold that thought."). Exactly two micro-moments, always in the same places. No random rewards.
9. **Optional Context items** are introduced with: "These three help us suggest practical support. They don't affect your results. Skip any you like."
10. Learners can pause at any time; progress is saved per item.

### Wording note shown before the personality section

> There are no right answers here, and no good or bad personalities. Answer for how you actually are most of the time, not how you'd like to be or how your parents see you.

---

## 4. The items

### P_O — Curiosity & Imagination
*Construct:* Openness  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| PO1 | I get curious about how things work and go looking for answers. | agree5 |  |  |
| PO2 | I enjoy ideas that most people my age find boring. | agree5 |  |  |
| PO3 | I like trying new ways of doing things, even when the old way works. | agree5 |  |  |
| PO4 | I daydream about inventing, designing or creating something. | agree5 |  |  |
| PO5 | I prefer to stick to what I already know rather than try something unfamiliar. | agree5 | Yes |  |
| PO6 | Talking about big questions, like why people do what they do, bores me. | agree5 | Yes |  |

### P_C — Organisation & Follow-through
*Construct:* Conscientiousness  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| PC1 | When I start something, I finish it. | agree5 |  |  |
| PC2 | I plan my homework or tasks before I start. | agree5 |  |  |
| PC3 | I keep my things organised so I can find them. | agree5 |  |  |
| PC4 | I do what I said I would do, even when nobody is checking. | agree5 |  |  |
| PC5 | I leave schoolwork until the last minute. | agree5 | Yes |  |
| PC6 | I get distracted easily and lose track of what I was doing. | agree5 | Yes |  |

### P_E — Social Energy
*Construct:* Extraversion  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| PE1 | Being around lots of people gives me energy. | agree5 |  |  |
| PE2 | I am comfortable speaking up in front of the class. | agree5 |  |  |
| PE3 | I am usually the one who starts conversations. | agree5 |  |  |
| PE4 | I enjoy being the centre of attention sometimes. | agree5 |  |  |
| PE5 | After a busy day with people, I need time alone to recharge. | agree5 | Yes |  |
| PE6 | I would rather work quietly on my own than in a busy group. | agree5 | Yes |  |

### P_A — Warmth & Cooperation
*Construct:* Agreeableness  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| PA1 | I notice when someone is left out and try to include them. | agree5 |  |  |
| PA2 | I would rather find a solution everyone agrees with than win an argument. | agree5 |  |  |
| PA3 | I trust people until they give me a reason not to. | agree5 |  |  |
| PA4 | I go out of my way to help classmates who are struggling. | agree5 |  |  |
| PA5 | I can be harsh with people when I am annoyed. | agree5 | Yes |  |
| PA6 | Other people's problems are not really my business. | agree5 | Yes |  |

### P_N — Stress Sensitivity
*Construct:* Neuroticism (reported as Stress Sensitivity)  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| PN1 | I worry a lot about things that might go wrong. | agree5 |  |  |
| PN2 | My mood can change quickly during the day. | agree5 |  |  |
| PN3 | Tests and deadlines make me very anxious. | agree5 |  |  |
| PN4 | Small criticism can stay with me for days. | agree5 |  |  |
| PN5 | I stay calm when things go wrong. | agree5 | Yes |  |
| PN6 | I bounce back quickly after a bad day. | agree5 | Yes |  |

### I_R — Builder
*Construct:* Realistic  
*Stem shown to learner:* "How much would you enjoy doing this?"  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| IR1 | Fixing a broken bicycle, appliance or phone. | enjoy5 |  |  |
| IR2 | Building something with tools or your hands. | enjoy5 |  |  |
| IR3 | Working outdoors with plants, animals or the land. | enjoy5 |  |  |
| IR4 | Operating machines or driving vehicles. | enjoy5 |  |  |
| IR5 | Assembling furniture or electronics from instructions. | enjoy5 |  |  |
| IR6 | Repairing things around the house. | enjoy5 |  |  |

### I_I — Thinker
*Construct:* Investigative  
*Stem shown to learner:* "How much would you enjoy doing this?"  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| II1 | Doing a science experiment to test an idea. | enjoy5 |  |  |
| II2 | Figuring out why a disease spreads. | enjoy5 |  |  |
| II3 | Solving a hard maths or logic puzzle. | enjoy5 |  |  |
| II4 | Researching how the brain or body works. | enjoy5 |  |  |
| II5 | Analysing data to find a pattern. | enjoy5 |  |  |
| II6 | Investigating why something went wrong. | enjoy5 |  |  |

### I_A — Creator
*Construct:* Artistic  
*Stem shown to learner:* "How much would you enjoy doing this?"  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| IA1 | Writing a song, poem, story or rap. | enjoy5 |  |  |
| IA2 | Designing clothes, a logo or a poster. | enjoy5 |  |  |
| IA3 | Acting, dancing or performing on stage. | enjoy5 |  |  |
| IA4 | Drawing, painting or making digital art. | enjoy5 |  |  |
| IA5 | Filming or editing a video. | enjoy5 |  |  |
| IA6 | Coming up with a completely original idea for a project. | enjoy5 |  |  |

### I_S — Helper
*Construct:* Social  
*Stem shown to learner:* "How much would you enjoy doing this?"  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| IS1 | Helping a younger learner understand their homework. | enjoy5 |  |  |
| IS2 | Listening to a friend and helping them through a hard time. | enjoy5 |  |  |
| IS3 | Caring for people who are sick or injured. | enjoy5 |  |  |
| IS4 | Organising a community clean-up or charity drive. | enjoy5 |  |  |
| IS5 | Teaching a skill to a group of people. | enjoy5 |  |  |
| IS6 | Coaching a sports team or club. | enjoy5 |  |  |

### I_E — Leader
*Construct:* Enterprising  
*Stem shown to learner:* "How much would you enjoy doing this?"  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| IE1 | Starting your own small business. | enjoy5 |  |  |
| IE2 | Convincing people to support your idea. | enjoy5 |  |  |
| IE3 | Leading a team to win a competition. | enjoy5 |  |  |
| IE4 | Selling something and making a profit. | enjoy5 |  |  |
| IE5 | Running for class representative or learner council. | enjoy5 |  |  |
| IE6 | Negotiating a deal. | enjoy5 |  |  |

### I_C — Organiser
*Construct:* Conventional  
*Stem shown to learner:* "How much would you enjoy doing this?"  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| IC1 | Keeping track of money and budgets. | enjoy5 |  |  |
| IC2 | Organising files, records or a schedule. | enjoy5 |  |  |
| IC3 | Checking work carefully for mistakes. | enjoy5 |  |  |
| IC4 | Working with spreadsheets and numbers. | enjoy5 |  |  |
| IC5 | Following a clear system or procedure. | enjoy5 |  |  |
| IC6 | Planning an event step by step. | enjoy5 |  |  |

### VALUES — What Matters Most
*Construct:* Basic human values (Schwartz-inspired card sort)  

*Instructions:* Drag the 3 cards that matter MOST to you into order (1 = most). Then pick the 2 that matter LEAST.

| Card ID | Card text | Construct |
|---|---|---|
| V_SD | Freedom to choose my own path | Self-direction |
| V_ST | Excitement and new experiences | Stimulation |
| V_HE | Enjoying life and having fun | Hedonism |
| V_AC | Being successful and achieving goals | Achievement |
| V_PO | Having status and influence | Power |
| V_SE | Safety and stability for me and my family | Security |
| V_CO | Doing what is expected and fitting in | Conformity |
| V_TR | Respecting my family, faith and culture | Tradition |
| V_BE | Looking after the people close to me | Benevolence |
| V_UN | Fairness and a better world for everyone | Universalism |

### MOTIVATION — Why I Do Schoolwork
*Construct:* Self-Determination Theory regulation types (Relative Autonomy Index)  
*Stem shown to learner:* "When I do my schoolwork, I do it..."  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| M1 | Because I enjoy learning new things. | true5 |  | intrinsic |
| M2 | Because some of it is genuinely interesting to me. | true5 |  | intrinsic |
| M3 | Because it matters for the future I want. | true5 |  | identified |
| M4 | Because I can see why it is important. | true5 |  | identified |
| M5 | Because I would feel guilty or ashamed if I didn't. | true5 |  | introjected |
| M6 | Because I want people to think I am clever. | true5 |  | introjected |
| M7 | Because I will get into trouble if I don't. | true5 |  | external |
| M8 | Because adults expect me to and I have no choice. | true5 |  | external |

### MINDSET — Growth Mindset
*Construct:* Implicit theories of intelligence (growth vs fixed)  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| G1 | If I work hard enough, I can get better at any subject. | agree5 |  |  |
| G2 | Mistakes show me what I need to practise. | agree5 |  |  |
| G3 | Struggling with something means my brain is learning. | agree5 |  |  |
| G4 | Some people are just born good at maths and others are not. | agree5 | Yes |  |
| G5 | If I have to try hard at something, I am probably not good at it. | agree5 | Yes |  |
| G6 | My intelligence is something I cannot really change. | agree5 | Yes |  |

### IDENTITY — Where I Am With My Future
*Construct:* Identity status (exploration x commitment), Marcia-inspired  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| ID1 | I have spent time looking into different careers I might like. | agree5 |  | exploration |
| ID2 | I have talked to adults about what their jobs are actually like. | agree5 |  | exploration |
| ID3 | I have thought seriously about which subjects suit me, not just which ones my friends are taking. | agree5 |  | exploration |
| ID4 | I have tried activities outside school to find out what I am good at. | agree5 |  | exploration |
| ID5 | I have questioned whether the plan other people have for me fits who I am. | agree5 |  | exploration |
| ID6 | I know what kind of work I want to do one day. | agree5 |  | commitment |
| ID7 | I feel sure about the direction I am heading. | agree5 |  | commitment |
| ID8 | My plans for the future feel like they belong to me. | agree5 |  | commitment |
| ID9 | If someone asked, I could explain why I want the career I want. | agree5 |  | commitment |
| ID10 | I have no idea what I want to do after school. | agree5 | Yes | commitment |

### DIRECTION_SOURCE — Whose Plan Is It
*Construct:* External pressure on subject/career choice  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| DS1 | My career plan mostly comes from what my parents or family want for me. | true5 |  |  |
| DS2 | I am choosing subjects mainly because my friends are taking them. | true5 |  |  |
| DS3 | I am choosing based on what sounds impressive or pays well, not what I enjoy. | true5 |  |  |

### STUDY — How I Study
*Construct:* Self-regulated learning habits  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| SR1 | I have a regular time and place to study. | agree5 |  |  |
| SR2 | When I don't understand something, I ask a teacher or classmate. | agree5 |  |  |
| SR3 | I test myself instead of just reading over my notes. | agree5 |  |  |
| SR4 | I keep going with hard work instead of giving up. | agree5 |  |  |
| SR5 | I know which subjects I need to spend more time on. | agree5 |  |  |
| SR6 | I only study the night before a test. | agree5 | Yes |  |
| SR7 | I avoid asking for help even when I am stuck. | agree5 | Yes |  |
| SR8 | My phone distracts me most of the time when I study. | agree5 | Yes |  |

### CONTEXT — My Study Situation
*Construct:* Practical barriers (not scored into any profile; used only for support planning)  
*Optional — never scored into the profile.*  

| ID | Item | Response | Reverse | Subscale |
|---|---|---|---|---|
| CX1 | Do you have a quiet place to study at home? | ynsometimes |  |  |
| CX2 | Do you have enough data or internet access for schoolwork? | ynsometimes |  |  |
| CX3 | Do responsibilities at home (like caring for siblings or working) take up a lot of your study time? | ynsometimes |  |  |

### Attention checks (randomly placed, one in each half)
| ID | Item | Expected |
|---|---|---|
| AC1 | To show you are reading carefully, choose 'Mostly like me' for this one. | 4 |
| AC2 | Choose 'Dislike' for this one so we know you are still with us. | 2 |

---

## 5. Grade 9 academic snapshot

Collected after the scored layer. School import from SA-SAMS (CSV) is preferred; learner self-report is the fallback and is flagged `marks_source = self_report` so the report hedges accordingly.

| Subject (Senior Phase) | Field |
|---|---|
| Home Language | latest term % |
| First Additional Language | latest term % |
| Mathematics | latest term % |
| Natural Sciences | latest term % |
| Social Sciences | latest term % |
| Economic and Management Sciences | latest term % |
| Technology | latest term % |
| Creative Arts | latest term % |
| Life Orientation | latest term % (not used in readiness rules) |

Self-report screen copy: *"Type your latest term mark for each subject. If you're not sure, give your best guess and tick 'estimate'. Honest marks give you honest advice."*

The Grade 11 additions (subject experience, failure causes, career update) are listed in file 05.
