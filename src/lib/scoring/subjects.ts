/**
 * Subject-name normalisation. Learners (and the signals extractor) say "Life Sci", "Physics",
 * "Art", "EMS"... The engine compares exact FET names from config/subject_map.json.
 */
import { subjectMap } from "@/lib/config/subjectMap";

const FET = new Set(subjectMap.subjects.map((s) => s.name));

const ALIASES: Record<string, string> = {
  maths: "Mathematics", math: "Mathematics", mathematics: "Mathematics", "pure maths": "Mathematics", "core maths": "Mathematics",
  "maths lit": "Mathematical Literacy", "math lit": "Mathematical Literacy", "maths literacy": "Mathematical Literacy", "mathematical literacy": "Mathematical Literacy",
  physics: "Physical Sciences", "physical science": "Physical Sciences", "physical sciences": "Physical Sciences", "phys sci": "Physical Sciences", "physical": "Physical Sciences", chemistry: "Physical Sciences",
  biology: "Life Sciences", bio: "Life Sciences", "life science": "Life Sciences", "life sciences": "Life Sciences", "life sci": "Life Sciences",
  "agricultural science": "Agricultural Sciences", "agricultural sciences": "Agricultural Sciences", agriculture: "Agricultural Sciences", "agri": "Agricultural Sciences", "ag science": "Agricultural Sciences",
  geography: "Geography", geo: "Geography",
  history: "History",
  accounting: "Accounting", accounts: "Accounting",
  "business studies": "Business Studies", business: "Business Studies",
  economics: "Economics", econ: "Economics",
  "information technology": "Information Technology", it: "Information Technology", coding: "Information Technology", "computer science": "Information Technology", programming: "Information Technology",
  "computer applications technology": "Computer Applications Technology", cat: "Computer Applications Technology", computers: "Computer Applications Technology",
  "engineering graphics and design": "Engineering Graphics and Design", egd: "Engineering Graphics and Design", "technical drawing": "Engineering Graphics and Design",
  "civil technology": "Civil Technology", "electrical technology": "Electrical Technology", "mechanical technology": "Mechanical Technology",
  "visual arts": "Visual Arts", art: "Visual Arts", arts: "Visual Arts", "visual art": "Visual Arts", drawing: "Visual Arts",
  "dramatic arts": "Dramatic Arts", drama: "Dramatic Arts", acting: "Dramatic Arts",
  music: "Music",
  design: "Design",
  tourism: "Tourism",
  "hospitality studies": "Hospitality Studies", hospitality: "Hospitality Studies",
  "consumer studies": "Consumer Studies",
  "religion studies": "Religion Studies", religion: "Religion Studies",
};

/** Senior Phase subjects expand to their FET descendants (used for Q12 traps named by GET subject). */
export const SENIOR_PHASE_DESCENDANTS: Record<string, string[]> = {
  "economic and management sciences": ["Accounting", "Economics", "Business Studies"],
  ems: ["Accounting", "Economics", "Business Studies"],
  "natural sciences": ["Physical Sciences", "Life Sciences"],
  "natural science": ["Physical Sciences", "Life Sciences"],
  ns: ["Physical Sciences", "Life Sciences"],
  "social sciences": ["History", "Geography"],
  "creative arts": ["Visual Arts", "Dramatic Arts", "Music", "Design"],
  technology: ["Engineering Graphics and Design", "Civil Technology", "Electrical Technology", "Mechanical Technology"],
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();

/** One FET subject name, or null when the text can't be mapped confidently. */
export function normaliseSubject(input: string): string | null {
  if (FET.has(input)) return input;
  const c = clean(input);
  if (ALIASES[c]) return ALIASES[c]!;
  // Phrases like "Accounting in EMS": take the first known alias that appears as a whole word.
  for (const [alias, name] of Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length)) {
    if (alias.length > 2 && new RegExp(`\\b${alias}\\b`).test(c)) return name;
  }
  return null;
}

/** FET subjects referred to by the text (Senior Phase names expand to descendants). */
export function expandSubjects(input: string): string[] {
  const one = normaliseSubject(input);
  if (one) return [one];
  return SENIOR_PHASE_DESCENDANTS[clean(input)] ?? [];
}

export function normaliseSubjectList(inputs: string[]): string[] {
  return [...new Set(inputs.map(normaliseSubject).filter((x): x is string => x !== null))];
}

export const ARTS_SUBJECTS = new Set(["Visual Arts", "Design", "Dramatic Arts", "Music"]);
