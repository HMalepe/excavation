import { describe, it, expect } from "vitest";
import { keywordFloor, maxRisk, type Risk } from "@/lib/safeguarding/keywords";
import { CORPUS, type Level } from "./corpus";

const RANK: Record<Level, number> = { none: 0, soft: 1, hard: 2 };

describe("keyword floor against the labelled corpus", () => {
  for (const c of CORPUS) {
    const name = `[${c.label}${c.lang ? "/" + c.lang : ""}] ${c.text.slice(0, 70) || "(empty)"}`;
    it(name, () => {
      const got = keywordFloor(c.text) as Level;
      if (c.floor === "miss") expect(RANK[got], "listed as a known miss: if the floor now catches it, delete the marker").toBeLessThan(RANK[c.label]);
      else if (c.floor === "high") expect(RANK[got]).toBeGreaterThan(RANK[c.label]);
      else expect(got).toBe(c.label);
    });
  }

  it("never lowers the model's answer", () => {
    const levels: Risk[] = ["none", "soft", "hard"];
    for (const a of levels) for (const b of levels) expect(RANK[maxRisk(a, b)]).toBe(Math.max(RANK[a], RANK[b]));
  });

  it("the corpus is balanced enough to mean something", () => {
    const n = (l: Level) => CORPUS.filter((c) => c.label === l).length;
    expect(n("hard")).toBeGreaterThanOrEqual(40);
    expect(n("soft")).toBeGreaterThanOrEqual(15);
    expect(n("none")).toBeGreaterThanOrEqual(25);
    expect(new Set(CORPUS.filter((c) => c.lang).map((c) => c.lang)).size).toBeGreaterThanOrEqual(4);
  });

  it("states how much the floor alone covers (the gap the model must close)", () => {
    const hard = CORPUS.filter((c) => c.label === "hard");
    const caught = hard.filter((c) => keywordFloor(c.text) === "hard").length;
    // A regression guard, not a target: the floor is a net under the model, not the screen itself.
    expect(caught / hard.length).toBeGreaterThanOrEqual(0.6);
  });
});
