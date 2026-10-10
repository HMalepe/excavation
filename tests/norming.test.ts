import { describe, it, expect } from "vitest";
import { cronbachAlpha, percentileCuts, median, decideNormState, computeNorms, NORM_SCALES } from "@/lib/norming/stats";
import { percentileOf } from "@/lib/scoring/scales";
import { seededRng } from "@/lib/flow/itemPlan";
import { questionBank } from "@/lib/config/questionBank";
import type { LikertResponses } from "@/lib/scoring/types";

describe("norming statistics", () => {
  it("Cronbach's alpha matches a hand-computed value", () => {
    // 4 respondents × 3 items. Item variances 1, 1, 2/3 → Σ = 8/3; totals 3,6,8,13 → var = 52/3 · 1/... computed below
    const rows = [[1, 1, 1], [2, 2, 2], [3, 3, 2], [4, 5, 4]];
    const k = 3;
    const v = (xs: number[]) => { const m = xs.reduce((a, b) => a + b) / xs.length; return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1); };
    const expected = (k / (k - 1)) * (1 - [0, 1, 2].map((j) => v(rows.map((r) => r[j]!))).reduce((a, b) => a + b) / v(rows.map((r) => r[0]! + r[1]! + r[2]!)));
    expect(cronbachAlpha(rows)).toBeCloseTo(expected, 10);
    expect(cronbachAlpha(rows)!).toBeGreaterThan(0.9);
    expect(cronbachAlpha([[1, 2]])).toBeNull();
  });
  it("percentile cuts round-trip through percentileOf", () => {
    const cuts = percentileCuts(Array.from({ length: 1000 }, (_, i) => i / 10));
    expect(cuts).toHaveLength(101);
    expect(percentileOf(50, cuts)).toBe(50);
    expect(percentileOf(-1, cuts)).toBe(0);
    expect(median([5, 1, 3, 2])).toBe(2.5);
  });
  it("switches norm_state at 300 and 1000, and needs alpha ≥ 0.70 for established", () => {
    const good = Object.fromEntries(NORM_SCALES.map((s) => [s.id, 0.8]));
    expect(decideNormState(299, good)).toBe("pre_norm");
    expect(decideNormState(300, good)).toBe("emerging_norm");
    expect(decideNormState(1000, good)).toBe("established_norm");
    expect(decideNormState(5000, { ...good, P_N: 0.69 })).toBe("emerging_norm");
    expect(decideNormState(5000, { ...good, MOTIVATION_external: 0.4 })).toBe("established_norm"); // 2-item RAI subscales don't gate
  });
  it("computes norms and an item-level CSV from simulated respondents", () => {
    const rng = seededRng(11);
    const items = questionBank.scales.flatMap((s) => s.items ?? []);
    const sessions: LikertResponses[] = Array.from({ length: 320 }, () => {
      const trait = rng(); // a shared latent level gives the scales internal consistency
      const r: LikertResponses = {};
      for (const it of items) {
        const base = it.reverse ? 1 - trait : trait;
        r[it.id] = Math.max(1, Math.min(5, Math.round(1 + base * 4 + (rng() - 0.5) * 1.5)));
      }
      return r;
    });
    const n = computeNorms(sessions);
    expect(n.n).toBe(320);
    expect(n.norm_state).toBe("emerging_norm");
    expect(n.alphas.P_O!).toBeGreaterThan(0.7);
    expect(n.percentiles.I_R).toHaveLength(101);
    expect(n.identity_medians).not.toBeNull();
    const lines = n.item_stats_csv.split("\n");
    expect(lines[0]).toBe("scale,item,n,mean,sd,corrected_item_total_r,alpha_if_deleted");
    expect(lines.length).toBe(1 + NORM_SCALES.reduce((a, s) => a + s.items.length, 0));
  });
});
