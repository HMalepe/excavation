import { describe, it, expect } from "vitest";
import { parseCsv, parseMarksCsv, parseRosterCsv, loginCode } from "@/lib/school/csv";
import { seededRng } from "@/lib/flow/itemPlan";

describe("school CSV imports", () => {
  it("parses quotes, semicolons and BOMs", () => {
    expect(parseCsv('﻿a,b\n"x, y";"he said ""hi"""\r\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
  });
  it("validates marks rows and reports line numbers", () => {
    const csv = "learner_ref,grade,term,subject,percentage\n1001,9,T2,Mathematics,58\n1002,9,T2,Maths,40\n1003,9,T2,Mathematics,140\n";
    const r = parseMarksCsv(csv, new Set(["Mathematics"]));
    expect(r.rows).toEqual([{ learner_ref: "1001", grade: 9, term_label: "T2", subject: "Mathematics", percentage: 58 }]);
    expect(r.errors).toEqual(['line 3: unknown subject "Maths"', "line 4: percentage must be 0–100"]);
  });
  it("refuses rosters that carry ID numbers (data minimisation)", () => {
    const r = parseRosterCsv("first_name,last_name,grade,id_number\nLerato,M,9,0101015000080\n");
    expect(r.rows).toHaveLength(0);
    expect(r.errors[0]).toMatch(/ID numbers/);
  });
  it("makes easy-to-type login codes", () => {
    const rng = seededRng(1);
    const codes = Array.from({ length: 200 }, (_, i) => loginCode(rng, i % 2 ? "Olwethu" : "Lerato"));
    for (const c of codes) expect(c).toMatch(/^[A-Z]{3}-[A-HJ-KM-NP-Z2-9]{5}$/);
    expect(codes[0]!.startsWith("XEX") || codes[0]!.startsWith("LER") || codes[0]!.startsWith("XER")).toBe(true);
    expect(new Set(codes).size).toBe(200);
  });
});
