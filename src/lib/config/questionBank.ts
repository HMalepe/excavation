import { z } from "zod";
import raw from "@spec/config/question_bank.json";

/**
 * Typed, validated access to spec/config/question_bank.json — the single source of truth
 * for items (spec 00). Validation runs once at import; a malformed bank fails loudly.
 */
const point = z.tuple([z.number().int(), z.string()]);
const likert5 = z.object({ id: z.enum(["agree5", "enjoy5", "true5"]), points: z.array(point).length(5) });
const ynSometimes = z.object({ id: z.literal("ynsometimes"), points: z.array(point).length(3) });
const responseFormat = z.discriminatedUnion("id", [likert5, ynSometimes]);
export type ResponseFormat = z.infer<typeof responseFormat>;
export type ResponseFormatId = ResponseFormat["id"];

const likertItem = z.object({
  id: z.string(),
  text: z.string(),
  response: responseFormat,
  reverse: z.boolean().optional().default(false),
  subscale: z.string().optional(),
});
export type Item = z.infer<typeof likertItem>;

const card = z.object({ id: z.string(), text: z.string(), construct: z.string() });

const scale = z.object({
  scale_id: z.string(),
  family: z.string(),
  name: z.string(),
  construct: z.string(),
  stem: z.string().optional(),
  format: z.string().optional(),
  instructions: z.string().optional(),
  optional: z.boolean().optional(),
  items: z.array(likertItem).optional(),
  cards: z.array(card).optional(),
});
export type Scale = z.infer<typeof scale>;

const attentionCheck = z.object({ id: z.string(), text: z.string(), response: likert5, expected: z.number().int() });

const bankSchema = z.object({
  version: z.string(),
  response_formats: z.array(likert5),
  touchpoints: z.object({
    G9_FOUNDATION: z.object({ scales: z.array(z.string()), attention_checks: z.array(z.string()) }),
    G11_CONFIRMATION: z.object({ scales: z.array(z.string()), attention_checks: z.array(z.string()) }),
  }),
  scales: z.array(scale),
  attention_checks: z.array(attentionCheck),
  grade11_only: z.object({
    SUBJECT_EXPERIENCE: z.object({ items: z.array(likertItem.extend({ dimension: z.enum(["fit", "competence"]) })) }),
    FAILURE_CAUSE: z.object({ stem: z.string(), items: z.array(likertItem.extend({ cause: z.string() })) }),
    CAREER_UPDATE: z.array(
      z.object({ id: z.string(), type: z.string(), text: z.string(), options: z.array(z.string()).optional() }),
    ),
  }),
  academic_snapshot: z.object({
    ACADEMIC_SNAPSHOT_G9: z.object({ subjects: z.array(z.string()) }),
  }),
});

export const questionBank = bankSchema.parse(raw);
export type QuestionBank = typeof questionBank;
export const INSTRUMENT_VERSION = questionBank.version;

export const scaleById = new Map(questionBank.scales.map((s) => [s.scale_id, s]));
export const itemById = new Map<string, Item & { scale_id: string }>();
for (const s of questionBank.scales) for (const it of s.items ?? []) itemById.set(it.id, { ...it, scale_id: s.scale_id });

export function itemsOf(scaleId: string): Item[] {
  const s = scaleById.get(scaleId);
  if (!s?.items) throw new Error(`Unknown or non-item scale: ${scaleId}`);
  return s.items;
}

export const valueCards = scaleById.get("VALUES")!.cards!;
export const G9_SNAPSHOT_SUBJECTS = questionBank.academic_snapshot.ACADEMIC_SNAPSHOT_G9.subjects;
