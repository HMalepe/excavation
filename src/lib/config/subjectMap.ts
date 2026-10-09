import { z } from "zod";
import raw from "@spec/config/subject_map.json";

export const RIASEC = ["R", "I", "A", "S", "E", "C"] as const;
export type RiasecType = (typeof RIASEC)[number];
const vec = z.object({ R: z.number(), I: z.number(), A: z.number(), S: z.number(), E: z.number(), C: z.number() });
export type RiasecVector = z.infer<typeof vec>;

const combination = z.object({
  id: z.string(),
  name: z.string(),
  maths: z.enum(["Mathematics", "Either", "Mathematical Literacy"]),
  core_electives: z.array(z.string()),
  third_elective_options: z.array(z.string()).min(1),
  riasec_vector: vec,
});
export type Combination = z.infer<typeof combination>;

const pathway = z.object({
  id: z.string(),
  name: z.string(),
  typical_requires: z.array(z.string()),
  helpful: z.array(z.string()).optional(),
  closed_by_maths_lit: z.union([z.boolean(), z.literal("partial")]),
});
export type PathwayFamily = z.infer<typeof pathway>;

const readinessRule = z.object({ needs: z.record(z.string(), z.number()), also: z.string().optional() });

const mapSchema = z.object({
  version: z.string(),
  subjects: z.array(z.object({ name: z.string(), riasec_vector: vec })),
  combinations: z.array(combination),
  readiness_rules_grade9: z.record(z.string(), z.unknown()),
  pathway_families: z.array(pathway),
  nsc_pass_types: z.record(z.string(), z.unknown()),
  aps: z.object({ levels: z.array(z.tuple([z.number(), z.number(), z.number()])) }),
});

export const subjectMap = mapSchema.parse(raw);
export type SubjectMap = typeof subjectMap;

export type ReadinessRules = Record<string, { needs: Record<string, number>; also?: string }>;
export const readinessRules: ReadinessRules = Object.fromEntries(
  Object.entries(subjectMap.readiness_rules_grade9)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => [k, readinessRule.parse(v)]),
);

export const subjectVectors = new Map(subjectMap.subjects.map((s) => [s.name, s.riasec_vector]));
export const combinationById = new Map(subjectMap.combinations.map((c) => [c.id, c]));
export const pathwayById = new Map(subjectMap.pathway_families.map((p) => [p.id, p]));

/** Families for the max-2-per-family rule (spec 04 §8.5 b). */
export const COMBINATION_FAMILY: Record<string, "STEM" | "BUSINESS" | "ARTS" | "HUMANITIES"> = {
  HEALTH_SCI: "STEM", ENG_TECH: "STEM", SCI_IT: "STEM", TECHNICAL: "STEM", AGRI: "STEM", GEO_ENV: "STEM",
  COMMERCE: "BUSINESS", BUSINESS_PRACTICAL: "BUSINESS", SERVICE: "BUSINESS",
  VISUAL_CREATIVE: "ARTS", PERFORMING: "ARTS", DIGITAL_MEDIA: "ARTS",
  HUMANITIES: "HUMANITIES",
};

export const LANGUAGE_SUBJECTS = ["Home Language", "First Additional Language", "Second Additional Language"];
export const isLanguage = (s: string) => LANGUAGE_SUBJECTS.some((l) => s === l || s.startsWith(`${l}`)) || /\b(English|Afrikaans|isiZulu|isiXhosa|Sesotho|Setswana|Sepedi|Xitsonga|Tshivenda|siSwati|isiNdebele)\b/.test(s);
export const isMaths = (s: string) => s === "Mathematics" || s === "Mathematical Literacy";
export const LIFE_ORIENTATION = "Life Orientation";
