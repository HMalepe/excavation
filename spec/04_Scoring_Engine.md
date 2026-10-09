# 04 — Scoring Engine
## Deterministic rules · no AI in this layer · v1.0.0

---

## 0. Principle

Scores are computed by fixed, transparent arithmetic. **The same answers always produce the same scores, for every learner.** That's what makes Grade 9 → Grade 11 comparisons fair and what lets the product say "unbiased" honestly: bias enters through interpretation, so the arithmetic stays simple and rule-based, and the AI only writes *about* scores it never changes.

Inputs: `config/question_bank.json`, `config/subject_map.json`, learner responses, marks, school overrides.
Outputs: a `ScoreProfile` object (schema at the end) stored in `scale_scores` and handed to the report writer.

---

## 1. Item scoring

```ts
// raw: 1..5 (agree5 / enjoy5 / true5)
const itemValue = (raw: number, reverse: boolean) => reverse ? 6 - raw : raw;

// scale score on 0..100
const scaleScore = (values: number[]) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(((mean - 1) / 4) * 100);
};
```

**Missing items:** a scale is scored if at least 5 of 6 items (or 80% for other lengths) are answered; the mean uses only answered items. Otherwise the scale is `null` and the report omits it.

---

## 2. Personality (P_O, P_C, P_E, P_A, P_N)

- Score each domain 0–100 (§1).
- **Pre-norm bands:** Low < 35 · Middle 35–65 · High > 65.
- **After norming:** convert to percentile within the SA Grade 9 (or Grade 11) norm group; bands become bottom 30% / middle 40% / top 30%.
- P_N is always reported to learners as **Stress Sensitivity**, never "neuroticism". High stress sensitivity is framed as "you feel pressure strongly — plan for it", never as a problem.

---

## 3. Interests (RIASEC)

```ts
const types = ["R","I","A","S","E","C"];
const riasec = Object.fromEntries(types.map(t => [t, scaleScore(itemsOf(`I_${t}`))]));

// Holland code = top 3 types, highest first.
// Tie-break 1: more "5 = Love" responses in that type. Tie-break 2: RIASEC order.
const code = rankTypes(riasec).slice(0, 3).join("");   // e.g. "IAS"
```

**Profile quality indicators** (shown to the AI, used in report wording):

| Indicator | Rule | Meaning |
|---|---|---|
| Elevation | highest type score | < 60 → "no strong pull yet" (common at 15; say so) |
| Differentiation | highest − lowest | < 20 → **flat profile**; recommendations weighted more on readiness + conversation |
| Consistency | position of top 2 on the hexagon R–I–A–S–E–C–R | adjacent = high · one apart = medium · opposite (R–S, I–E, A–C) = low ("you have two quite different sides") |

---

## 4. Values card sort

```ts
// rank1 = 3 pts, rank2 = 2, rank3 = 1, each bottom card = -1, others 0
const higherOrder = {
  openness_to_change: ["V_SD","V_ST","V_HE"],
  self_enhancement:   ["V_AC","V_PO"],
  conservation:       ["V_SE","V_CO","V_TR"],
  self_transcendence: ["V_BE","V_UN"],
};
```
Store `top3` (ordered), `bottom2`, and the four higher-order sums. The report uses the top value by name and the dominant higher-order cluster in plain words (e.g. "freedom and new experiences pull you more than stability does").

---

## 5. Motivation — Relative Autonomy Index

```ts
// subscale means on 1..5
const rai = 2*intrinsic + identified - introjected - 2*external;   // range -12..+12
const motivationScore = Math.round(((rai + 12) / 24) * 100);        // 0..100
```

| Score | Label (learner-facing) |
|---|---|
| ≥ 65 | **Self-driven** — "you mostly work because it matters to you" |
| 40–64 | **Mixed** — "some of it is yours, some is pressure" |
| < 40 | **Pressure-driven** — "right now most of your effort is powered by outside pressure. That works short-term and burns out long-term." |

---

## 6. Mindset, Study habits, Identity status

**Mindset** (0–100): Low < 40 · Moderate 40–64 · Growth ≥ 65.
**Study habits** (0–100): same bands. Low study habits + adequate ability is the most fixable problem in the whole system, and the Rescue verdict depends on it.

**Identity status:**
```ts
const exploration = scaleScore(ID1..ID5);
const commitment  = scaleScore(ID6..ID10);   // ID10 reverse-keyed
const CUT = normState === "pre_norm" ? 50 : normMedian;   // per grade

status =
  exploration >= CUT && commitment >= CUT ? "achievement" :
  exploration >= CUT && commitment <  CUT ? "moratorium"  :
  exploration <  CUT && commitment >= CUT ? "foreclosure" :
                                            "diffusion";
```

**Direction source** (DS1–DS3, raw 1–5): any item ≥ 4 sets a flag:
`parent_led` (DS1) · `peer_led` (DS2) · `status_led` (DS3).
`foreclosure + parent_led` is the classic Grade 9 risk: committed to someone else's plan without exploring. The report handles it with care: **never blame the parent**; frame it as "now make it yours, or find out it isn't."

Learner-facing names for statuses:

| Status | Learner-facing name | One-line meaning |
|---|---|---|
| Achievement | **Clear Path** | You've looked around and chosen |
| Moratorium | **Explorer** | You're actively searching — that's healthy |
| Foreclosure | **Early Commitment** | You've chosen, but haven't tested it yet |
| Diffusion | **Open Field** | No direction yet — completely normal at 15 |

---

## 7. Response quality checks

| Check | Rule | Effect |
|---|---|---|
| Attention | AC1 ≠ 4 or AC2 ≠ 2 | 1 failure → `quality = caution`; 2 failures → `quality = invalid` → offer to retake the scored layer before the conversation |
| Straight-lining | ≥ 80% identical answers in a section of ≥ 6 items | Flag that section; exclude it from recommendations if it is an interest section |
| Speeding | median item time < 1.2 s | `quality = caution` |
| Contradiction pairs | Both items in a forward/reverse pair answered 5 (the five pairs: PO1 & PO5, PC2 & PC5, PE1 & PE6, PA4 & PA6, PN1 & PN5) | ≥ 3 pairs → `quality = caution` |

When `quality = caution`, the report writer softens confidence language and the teacher summary carries: *"Some answers may have been rushed; treat these results as a starting point."* No learner is ever told they "failed" a check.

---

## 8. Grade 9 subject-combination engine

### 8.1 Interest fit (0–100)
```ts
// learner and combination vectors, both mean-centred so we compare SHAPE not level
const L = types.map(t => riasec[t] / 100);
const Lc = L.map(x => x - mean(L));
const Vc = comboVec.map(x => x - mean(comboVec));
const cos = dot(Lc, Vc) / (norm(Lc) * norm(Vc));      // -1..1
const interestFit = Math.round(((cos + 1) / 2) * 100);
```
If the profile is flat (differentiation < 20), multiply the interest weight in §8.4 by 0.5 and give the difference to readiness.

### 8.2 Readiness (0–100), from Grade 9 marks
For each subject in the combination (including Maths or Maths Lit), look up `readiness_rules_grade9` (school overrides win):
```ts
subjectReadiness = min over each required mark of:
   mark >= threshold        ? 100
 : mark >= threshold - 10   ?  60     // "possible with support"
 :                              20     // "high risk"
// missing mark -> 60 and flag marks_incomplete
comboReadiness = weightedMean(subjectReadiness, { Mathematics: 1.5, others: 1 });
```

### 8.3 Trait fit (0–100)
Small personality adjustments per combination family:

| Combination | Traits that help (each pulls the score toward the learner's level) |
|---|---|
| HEALTH_SCI, SCI_IT, GEO_ENV, AGRI | Curiosity (O), Follow-through (C) |
| ENG_TECH, TECHNICAL | Follow-through (C), Curiosity (O) |
| COMMERCE | Follow-through (C), Social Energy (E) |
| BUSINESS_PRACTICAL | Social Energy (E), Follow-through (C) |
| HUMANITIES | Curiosity (O), Warmth (A) |
| VISUAL_CREATIVE, DIGITAL_MEDIA | Curiosity (O) |
| PERFORMING | Social Energy (E), Curiosity (O) |
| SERVICE | Warmth (A), Social Energy (E) |

```ts
traitFit = clamp(50 + 0.5 * mean(relevantTraits.map(t => P[t] - 50)), 0, 100);
```

### 8.4 Combination score
```ts
comboScore = 0.45 * interestFit + 0.35 * readiness + 0.20 * traitFit
           + (unpressuredMatch ? 5 : 0)      // Q20 subjects: ≥2 of the combo's electives
           - (containsCompetenceTrap ? 5 : 0); // subject flagged in conversation Q12
```
The conversation adjustments come from the structured signals object (file 03 §6). They are capped at ±5 each and logged with the reason.

### 8.5 Selecting what the learner sees
1. Filter to combinations **the school actually offers** (school upload). If the school has not uploaded, use all and label the report "check which of these your school offers".
2. **Top 3 fits** by `comboScore`, applying in order:
   - (a) **No near-duplicates:** skip a combination whose RIASEC vector is > 0.95 cosine-similar to one already chosen.
   - (b) **Max 2 per family.** Families: STEM = HEALTH_SCI, ENG_TECH, SCI_IT, TECHNICAL, AGRI, GEO_ENV · BUSINESS = COMMERCE, BUSINESS_PRACTICAL, SERVICE · ARTS = VISUAL_CREATIVE, PERFORMING, DIGITAL_MEDIA · HUMANITIES = HUMANITIES.
   - (c) **Doors-open safeguard:** if no STEM combination made the top 3, the learner has Grade 9 Maths ≥ 50 and Natural Sciences ≥ 50, and the best STEM combination scores within 10 points of pick #3, it replaces pick #3 and is labelled *"keeps the most doors open"*. Science subjects close the most doors when dropped, so a capable learner should always see one science option.
   - **Ties:** more Q20 subjects in the combination → higher interest fit → higher readiness → order in `subject_map.json`.
3. **Up to two cautions:**
   - **Competence trap:** first, a combination containing the subject the learner named in Q12 (good at it, doesn't enjoy it). Otherwise, the combination with `interestFit < 40` and the largest gap between readiness and interest fit. Wording: "you could do well here, but it's likely to drain you."
   - **Stretch:** the highest-`interestFit` combination with `readiness < 50`. Wording: "this fits who you are; your current marks make it a stretch. Possible with a plan." **Never** written as "you can't".
   - If nothing qualifies, show fewer cautions. **Never invent one.**

### 8.6 The Maths gate (shown on every report)
| Grade 9 Maths | Mindset ≥ 60 AND Study ≥ 50? | Recommendation |
|---|---|---|
| ≥ 50% | any | **Mathematics** |
| 40–49% | yes | **Mathematics with a support plan** (the report includes the plan) |
| 40–49% | no | Show both options side by side, with the doors each one opens or closes |
| < 40% | any | **Mathematical Literacy is the safer choice**, followed by an explicit list of the doors it closes (from `pathway_families.closed_by_maths_lit`) |

The learner and family decide. The report gives honest consequences either way.

### 8.7 Doors kept open
For each recommended combination, compare its subjects against `pathway_families[].typical_requires` and return `open`, `partly_open` (some institutions) or `closed`. Always followed by: *"Requirements differ between universities and change yearly — check the prospectus."*

---

## 9. Grade 11 deltas (Grade 9 → Grade 11)

Until test–retest reliability is measured in the pilot, use fixed thresholds:

| Measure | "Stayed the same" | "Moved" |
|---|---|---|
| Each Big Five domain | \|Δ\| < 15 | \|Δ\| ≥ 15 (report direction) |
| Each RIASEC type | \|Δ\| < 15 | \|Δ\| ≥ 15 |
| Holland code | same first letter | first letter changed (headline-worthy) |
| Code overlap | count of shared letters in top 3 (0–3) | 0–1 shared = "your interests have shifted a lot" |
| Identity status | same | any change; label the transition (below) |
| Values | ≥ 2 of top 3 shared | ≤ 1 shared |
| Motivation, Mindset, Study | \|Δ\| < 15 | \|Δ\| ≥ 15 |

**Identity transitions:**

| From → To | Report framing |
|---|---|
| Foreclosure → Achievement | "You tested the plan and chose it for yourself." |
| Foreclosure → Moratorium | "You started questioning a plan you'd accepted. That's growth, even if it feels messy." |
| Diffusion → Moratorium | "You've started searching. Good." |
| Moratorium → Achievement | "You searched and landed." |
| Achievement → Moratorium | "You were sure, now you're reconsidering. Find out why before you change anything." |
| Any → Diffusion | Gentle check-in; may signal disengagement. Pair with study/wellbeing context. |
| Unchanged Foreclosure | "Your plan hasn't been tested yet. Grade 11 is the last cheap moment to test it." |

**After the pilot:** replace the thresholds with a Reliable Change Index:
`RCI = Δ / (SD × √(2 × (1 − r_retest)))`, where |RCI| ≥ 1.96 = reliable change.

---

## 10. Norming plan

| State | Condition | What changes |
|---|---|---|
| `pre_norm` | < 300 completed learners in that grade | Raw 0–100 + fixed bands. Reports say "compared with what these questions are designed to measure". |
| `emerging_norm` | 300–999 | Percentiles within the SA norm group for that grade. Reports say "compared with other South African Grade 9s who've taken this". |
| `established_norm` | ≥ 1000 **and** every scale has internal consistency (α or ω) ≥ 0.70 | Full percentile reporting. Scales below 0.70 are rewritten in the next item version. |

Norm by **grade only**. Do not create norms by race, and do not report results by race. Province norms may be added later for research, never for individual reports.

---

## 11. `ScoreProfile` output schema

```json
{
  "learner_id": "uuid",
  "touchpoint": "G9_FOUNDATION | G11_CONFIRMATION",
  "instrument_version": "1.0.0",
  "norm_state": "pre_norm",
  "quality": { "status": "ok | caution | invalid", "flags": ["speeding"] },
  "personality": { "O": 72, "C": 48, "E": 35, "A": 66, "N": 61,
                   "bands": { "O": "high", "C": "middle", "E": "middle", "A": "high", "N": "middle" } },
  "interests": { "scores": { "R": 30, "I": 78, "A": 64, "S": 70, "E": 25, "C": 33 },
                 "code": "ISA", "elevation": 78, "differentiation": 53, "consistency": "medium" },
  "values": { "top3": ["V_BE", "V_SD", "V_AC"], "bottom2": ["V_PO", "V_CO"],
              "higher_order": { "openness_to_change": 2, "self_enhancement": 1, "conservation": -1, "self_transcendence": 3 } },
  "motivation": { "rai": 5.5, "score": 73, "label": "self_driven" },
  "mindset": { "score": 67, "band": "growth" },
  "study": { "score": 44, "band": "moderate" },
  "identity": { "exploration": 38, "commitment": 70, "status": "foreclosure",
                "direction_flags": ["parent_led"] },
  "context": { "quiet_place": "sometimes", "data_access": "yes", "home_responsibilities": "no" },
  "marks": { "source": "school_import", "Mathematics": 58, "Natural Sciences": 71 },
  "combinations": [
    { "id": "HUMANITIES", "interest_fit": 87, "readiness": 100, "trait_fit": 60, "score": 91.2,
      "role": "fit_1", "adjustments": ["+5 unpressured_match"],
      "doors": { "HUMANITIES": "open", "LAW": "open", "MED_HEALTH": "closed" } },
    { "id": "HEALTH_SCI", "interest_fit": 73, "readiness": 100, "trait_fit": 55, "score": 78.8,
      "role": "fit_3", "label": "keeps_most_doors_open",
      "doors": { "MED_HEALTH": "open", "ENGINEERING": "open", "SCIENCES": "open" } },
    { "id": "COMMERCE", "interest_fit": 25, "readiness": 100, "trait_fit": 46, "score": 50.5,
      "role": "caution", "caution_type": "competence_trap", "adjustments": ["-5 competence_trap (Q12: Accounting)"] }
  ],
  "maths_gate": { "recommendation": "mathematics", "reason": "G9 Maths 58%" },
  "deltas": null
}
```
