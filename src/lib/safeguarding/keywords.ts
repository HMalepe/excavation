/**
 * A deterministic floor under the AI safety screen (spec 07 3A). The model decides; this can only
 * RAISE its answer, never lower it ("when unsure between two levels, choose the higher one",
 * spec 09 §5.2.6: false positives are acceptable). Phrases are deliberately specific so ordinary
 * dark humour about schoolwork ("this maths is killing me") stays "none".
 * Review this list with the clinical advisor (spec 09 §7) — it is a starting point, not a standard.
 */
export type Risk = "none" | "soft" | "hard";

const HARD: RegExp[] = [
  // Present tense only: past self-harm ("I used to cut myself") is "soft" per spec 07 3A.
  /(?<!used\s+to\s+)(?<!used\s+to\s+\w+\s+)\b(kill(s|ed|ing)?|hurt(s|ing)?|harm(s|ed|ing)?|cut(s|ting)?)\s+my\s*self\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend\s+(it\s+all|my\s+life)\b/i,
  /\b(want\s+to|wanna|going\s+to)\s+die\b/i,
  /\bwant(ed)?\s+to\s+not\s+(be\s+alive|exist|wake\s+up)\b/i,
  /\b(don'?t|do\s+not)\s+want\s+to\s+(live|be\s+alive|wake\s+up)\b/i,
  /\bself[-\s]?harm(ing)?\b/i,
  /\b(he|she|they|my\s+[\w']+(\s+[\w']+)?)\s+(hits?|beats?(?!\s+me\s+at\b)|touch(es)?|rapes?d?)\s+me\b/i,
  /\b(and|but)\s+(hits?|beats?|rapes?)\s+me\b/i,
  /\b(raped|molested|abused)\b/i,
  /\b(kill|hurt|shoot|stab)\s+(him|her|them|someone|people|everyone)\b/i,
  /\bnot\s+safe\s+at\s+home\b/i,
  // Other South African languages: a DRAFT list of the clearest first-person phrases ("I want to die",
  // "I no longer want to live", "kill myself"). Needs review by a first-language speaker per language.
  /\b(ngifuna|ndifuna)\s+ukufa\b/i, /\b(angisafuni|andisafuni)\s+ukuphila\b/i, /\bukuzibulala\b/i, // isiZulu / isiXhosa
  /\bek\s+wil\s+(myself\s+)?(doodmaak|doodgaan|sterf)\b/i, /\bek\s+wil\s+nie\s+meer\s+(lewe|leef)\b/i, // Afrikaans
  /\bke\s+batla\s+(ho\s+(shwa|ipolaya)|go\s+(swa|ipolaya))\b/i, // Sesotho / Setswana
];

const SOFT: RegExp[] = [
  /\b(hopeless|worthless|no\s+point|pointless\s+living)\b/i,
  /\b(a\s+)?burden\s+(to|on)\b/i,
  /\b(can'?t|cannot)\s+(cope|take\s+it|do\s+this\s+anymore)\b/i,
  /\bused\s+to\s+(cut|hurt|harm)\b/i,
  /\bnobody\s+(cares|would\s+(care|notice))\b/i,
  /\b(panic\s+attacks?|can'?t\s+sleep|crying\s+every)\b/i,
];

export function keywordFloor(text: string): Risk {
  if (HARD.some((r) => r.test(text))) return "hard";
  if (SOFT.some((r) => r.test(text))) return "soft";
  return "none";
}

const RANK: Record<Risk, number> = { none: 0, soft: 1, hard: 2 };
export const maxRisk = (a: Risk, b: Risk): Risk => (RANK[a] >= RANK[b] ? a : b);
