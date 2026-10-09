/**
 * spec 04 §8.7 — which pathway families a set of subjects keeps open.
 * Requirements in config are human text; each one has an explicit rule here. An unknown
 * requirement string throws, so a config edit can never be silently ignored.
 */
import { subjectMap, type PathwayFamily } from "@/lib/config/subjectMap";
import { ARTS_SUBJECTS } from "./subjects";
import type { DoorStatus } from "./types";

export const DOORS_DISCLAIMER = "Requirements differ between universities and change yearly — check the prospectus.";

const has = (subjects: Set<string>, s: string) => subjects.has(s);

type Rule = (subjects: Set<string>) => DoorStatus;
const REQUIREMENT_RULES: Record<string, Rule> = {
  Mathematics: (s) => (has(s, "Mathematics") ? "open" : "closed"),
  "Physical Sciences": (s) => (has(s, "Physical Sciences") ? "open" : "closed"),
  "Life Sciences": (s) => (has(s, "Life Sciences") ? "open" : "closed"),
  "Physical Sciences or Life Sciences": (s) => (has(s, "Physical Sciences") || has(s, "Life Sciences") ? "open" : "closed"),
  "Mathematics (most degrees)": (s) => (has(s, "Mathematics") ? "open" : "partly_open"),
  // Not decided by subject choice; the marks decide. Status stays open.
  "Strong Home Language / English": () => "open",
  "Depends on teaching specialisation": () => "open",
  "Portfolio or audition often required": (s) => ([...s].some((x) => ARTS_SUBJECTS.has(x)) ? "open" : "partly_open"),
  "Life Sciences often required": (s) => (has(s, "Life Sciences") ? "open" : "partly_open"),
};

const RANK: Record<DoorStatus, number> = { closed: 0, partly_open: 1, open: 2 };
const worst = (a: DoorStatus, b: DoorStatus): DoorStatus => (RANK[a] <= RANK[b] ? a : b);

export function doorStatus(p: PathwayFamily, subjects: Iterable<string>): DoorStatus {
  const set = new Set(subjects);
  let status: DoorStatus = "open";
  for (const req of p.typical_requires) {
    const rule = REQUIREMENT_RULES[req];
    if (!rule) throw new Error(`No door rule for requirement "${req}" (pathway ${p.id})`);
    status = worst(status, rule(set));
  }
  if (set.has("Mathematical Literacy") && !set.has("Mathematics")) {
    if (p.closed_by_maths_lit === true) status = "closed";
    else if (p.closed_by_maths_lit === "partial") status = worst(status, "partly_open");
  }
  return status;
}

export function doorsFor(subjects: Iterable<string>): Record<string, DoorStatus> {
  const list = [...subjects];
  return Object.fromEntries(subjectMap.pathway_families.map((p) => [p.id, doorStatus(p, list)]));
}

export const pathwayName = (id: string) => subjectMap.pathway_families.find((p) => p.id === id)?.name ?? id;
