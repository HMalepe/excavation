import { describe, it, expect } from "vitest";
import { itemIndex } from "@/lib/skills/content";
import { planSkills, scoreSkills, servedItems } from "@/lib/skills/engine";
import { DX, DXS, TT, isSkillRow, skillsInputFromRows, type SkillRow } from "@/lib/skills/fromRows";
import { skillsLines, skillsPlain } from "@/lib/skills/plain";
import { checkItemStatsCsv, pearson, r2Two, validity, MIN_N } from "@/lib/skills/validity";
import { seededRng } from "@/lib/flow/itemPlan";
import { G9_STAGES, nextStage } from "@/lib/flow/stages";
import type { SkillsResult } from "@/lib/skills/types";

const plan = planSkills(seededRng(7));

describe("storage mapping", () => {
  it("skill rows are recognised and never look like questionnaire items", () => {
    expect(isSkillRow(DX("M1a"))).toBe(true);
    expect(isSkillRow(DXS("maths"))).toBe(true);
    expect(isSkillRow(TT("HEALTH"))).toBe(true);
    expect(isSkillRow("PO3")).toBe(false);
    expect(isSkillRow("SE1:Physical Sciences")).toBe(false);
    for (const id of [DX("M1a"), DXS("maths"), TT("HEALTH")]) expect(id).toContain(":"); // norming skips ":" ids
  });
  it("rebuilds SkillsInput from item_responses rows", () => {
    const served = servedItems(plan, "maths");
    const rows: SkillRow[] = [
      ...served.slice(0, 4).map((id) => ({ item_id: DX(id), value: itemIndex.get(id)!.item.answer, value_json: null, response_ms: 15_000 })),
      { item_id: DXS("maths"), value: null, value_json: { skipped_at_item: 4 }, response_ms: null },
      { item_id: DXS("science"), value: null, value_json: { skipped_at_item: 0 }, response_ms: null },
      { item_id: TT("CODE"), value: 5, value_json: { skipped: false, before: 2, after: 5, steps: [0, 0, 0], ms: 1, bonus: { steps: [0, 0], after: 5 } }, response_ms: 1 },
    ];
    const input = skillsInputFromRows(plan, rows);
    expect(Object.keys(input.checks.maths!.answers)).toHaveLength(4);
    expect(input.checks.maths!.skipped).toBe(true);
    expect(input.checks.science).toMatchObject({ skipped: true, answers: {} });
    expect(input.checks.reading).toBeUndefined();
    expect(input.tasters.CODE?.after).toBe(5);

    const s = scoreSkills(input, { Mathematics: 40 });
    expect(s.checks.maths).toMatchObject({ status: "partial", reliable: false, score: 40 }); // 4 of 10, too few answered
    expect(s.checks.science).toMatchObject({ status: "skipped" });
    expect(s.tasters.CODE).toMatchObject({ signal: "pull", surprise: "up" });
  });
});

describe("plain language (what models, the report and the teacher see)", () => {
  const input = {
    checks: {
      maths: { served: servedItems(plan, "maths"), skipped: false, answers: Object.fromEntries(servedItems(plan, "maths").map((id) => [id, { choice: itemIndex.get(id)!.item.answer, ms: 20_000 }])) },
    },
    tasters: { BUSINESS: { skipped: false, before: 4, after: 1, steps: [0, 1, 0], ms: 1, bonus: null } },
  };
  const s: SkillsResult = { ...scoreSkills(input, { Mathematics: 45 }), gate_lift: null };

  it("never contains a percentage or a raw count", () => {
    const text = JSON.stringify(skillsPlain(s, { Mathematics: 45 }));
    expect(text).not.toMatch(/\d+\s*%/);
    expect(text).not.toMatch(/\b10\b/);
    expect(text).toMatch(/strong, well above the school Mathematics mark/);
    expect(text).toMatch(/left them cold — much less than they expected/);
  });
  it("addresses the learner as 'you' on the report", () => {
    const l = skillsLines(s, { Mathematics: 45 });
    expect(l.checks[0]!.you).toMatch(/your school Mathematics mark/);
    expect(l.tasters[0]!.you).toBe("it didn't grab you (far less than you expected)");
  });
  it("null when the learner had no Part 1 tasks", () => {
    expect(skillsPlain(null, {})).toBeNull();
  });
});

describe("validity statistics", () => {
  it("pearson and two-predictor R²", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
    expect(r2Two(0.5, 0.5, 1)).toBeCloseTo(0.25); // collinear → no gain
    expect(r2Two(0.5, 0.5, 0)).toBeCloseTo(0.5);  // independent → additive
  });
  it("needs a minimum sample before judging", () => {
    expect(validity([{ mark9: 50, check: 60, outcome: 55 }]).verdict).toMatch(/not enough data/);
  });
  it("detects a check that adds beyond marks", () => {
    const rng = seededRng(3);
    const rows = Array.from({ length: 200 }, () => {
      const ability = rng() * 100, schooling = rng() * 100;
      const mark9 = 0.5 * ability + 0.5 * schooling;   // marks mix ability and school quality
      const check = ability;                            // the check sees ability only
      return { mark9, check, outcome: ability + (rng() - 0.5) * 20 };
    });
    const v = validity(rows);
    expect(v.n).toBe(200);
    expect(v.delta_r2!).toBeGreaterThan(0.05);
    expect(v.verdict).toMatch(/adds clearly/);
  });
  it("item CSV flags low samples", () => {
    const csv = checkItemStatsCsv([{ M1a: true, M2a: false }, { M1a: false, M2a: null }]);
    expect(csv.split("\n")[0]).toBe("item_id,check,topic,n,p_correct,p_not_sure,discrimination,flag");
    expect(csv).toMatch(/^M1a,maths,"Integers and order of operations",2,0\.50,0\.00,.*,low_n$/m);
    expect(MIN_N).toBe(30);
  });
});

describe("flow", () => {
  it("Grade 9 runs snapshot → checks → tasters → break → guide notice", () => {
    expect(nextStage("G9_FOUNDATION", "snapshot")).toBe("checks");
    expect(nextStage("G9_FOUNDATION", "checks")).toBe("tasters");
    expect(nextStage("G9_FOUNDATION", "tasters")).toBe("break");
    expect(nextStage("G9_FOUNDATION", "break")).toBe("guide_notice");
    expect(G9_STAGES.indexOf("break")).toBeLessThan(G9_STAGES.indexOf("conversation"));
  });
});
