/**
 * Readiness checks + taster tasks content (config/skills/*.json), validated at load.
 *
 * ANSWER KEYS LIVE HERE. Only server code may import this module (the learner page builds
 * answer-free views; `npm run check:secrets` fails if a check answer key reaches the browser).
 * Taster tasks are different: their feedback is shown after each answer, so their keys are sent.
 */
import { z } from "zod";
import rawChecks from "@config/skills/checks.json";
import rawTasters from "@config/skills/tasters.json";

const item = z.object({
  id: z.string(),
  stem: z.string().min(5),
  options: z.array(z.string().min(1)).min(2).max(5),
  answer: z.number().int().min(0),
}).refine((i) => i.answer < i.options.length, { message: "answer out of range" })
  .refine((i) => new Set(i.options).size === i.options.length, { message: "duplicate options" });

const variant = z.object({
  id: z.string(),
  passage: z.object({ title: z.string(), text: z.string().min(200) }).optional(),
  items: z.array(item).min(1),
});

const check = z.object({
  title: z.string(),
  informs_mark: z.string(),
  minutes: z.number(),
  min_median_ms: z.number().int().positive(),
  intro: z.string(),
  units: z.array(z.object({ id: z.string(), topic: z.string(), difficulty: z.number().int().min(1).max(3), variants: z.array(variant).min(1) })).min(1),
});

export const CHECK_IDS = ["maths", "science", "reading"] as const;
export type CheckId = (typeof CHECK_IDS)[number];

const checksSchema = z.object({
  version: z.string(),
  review_status: z.string(),
  checks: z.object({ maths: check, science: check, reading: check }),
});

const step = z.object({
  id: z.string(),
  stem: z.string(),
  options: z.array(z.string()).min(2).max(5),
  answer: z.number().int().min(0).nullable(),
  feedback: z.string(),
}).refine((s) => s.answer === null || s.answer < s.options.length, { message: "answer out of range" });

export const TASTER_IDS = ["HEALTH", "CODE", "EVIDENCE", "BUSINESS", "FIELD", "DESIGN"] as const;
export type TasterId = (typeof TASTER_IDS)[number];

const taster = z.object({
  id: z.enum(TASTER_IDS),
  title: z.string(),
  work: z.string(),
  links: z.array(z.string()).min(1),
  before_prompt: z.string(),
  scene: z.string(),
  visual: z.enum(["poster_ab"]).optional(),
  steps: z.array(step).min(2),
  bonus: z.object({ title: z.string(), scene: z.string(), steps: z.array(step).min(1) }),
});

const tastersSchema = z.object({
  version: z.string(),
  review_status: z.string(),
  before_scale: z.array(z.string()).length(5),
  after_scale: z.array(z.string()).length(5),
  tasters: z.array(taster).length(TASTER_IDS.length),
});

export const checksConfig = checksSchema.parse(rawChecks);
export const tastersConfig = tastersSchema.parse(rawTasters);
export type CheckConfig = z.infer<typeof check>;
export type CheckItem = z.infer<typeof item>;
export type CheckVariant = z.infer<typeof variant>;
export type Taster = z.infer<typeof taster>;
export type TasterStep = z.infer<typeof step>;

export const SKILLS_VERSION = `${checksConfig.version}+${tastersConfig.version}`;

export const checkById = (id: CheckId): CheckConfig => checksConfig.checks[id];
export const tasterById = new Map(tastersConfig.tasters.map((t) => [t.id, t]));

/** variant id → { check, unit, variant } */
export const variantIndex = new Map<string, { check: CheckId; unitId: string; topic: string; difficulty: number; variant: CheckVariant }>();
/** item id → { check, unit topic, item } */
export const itemIndex = new Map<string, { check: CheckId; topic: string; item: CheckItem }>();
for (const c of CHECK_IDS) {
  for (const u of checksConfig.checks[c].units) {
    for (const v of u.variants) {
      if (variantIndex.has(v.id)) throw new Error(`duplicate variant id ${v.id}`);
      variantIndex.set(v.id, { check: c, unitId: u.id, topic: u.topic, difficulty: u.difficulty, variant: v });
      for (const it of v.items) {
        if (itemIndex.has(it.id)) throw new Error(`duplicate item id ${it.id}`);
        itemIndex.set(it.id, { check: c, topic: u.topic, item: it });
      }
    }
  }
}
