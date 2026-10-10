import { describe, it, expect } from "vitest";
import { MarkerFilter, stripMarkers } from "@/lib/guide/markers";
import { keywordFloor, maxRisk } from "@/lib/safeguarding/keywords";
import { fillQ13, fillQ14, fillQ15, g9Script, g11Script } from "@/lib/guide/script";
import { buildScoreContext, interestsPlain } from "@/lib/guide/scoreContext";
import { buildScoreProfile } from "@/lib/scoring/profile";
import type { ScoreProfile } from "@/lib/scoring/types";
import { varied } from "../fixtures/responses";
import { LERATO_MARKS_G9 } from "../fixtures/lerato";

function streamThrough(chunks: string[]) {
  const f = new MarkerFilter();
  let shown = "";
  for (const c of chunks) shown += f.feed(c);
  shown += f.end();
  return { f, shown };
}

describe("MarkerFilter", () => {
  it("strips a leading question tag and end markers, even split across chunks", () => {
    const { f, shown } = streamThrough(["<<Q", ":7>>\nThat's the second time ", "building came up. Who taught you? <", "<SESSION_COMP", "LETE>>"]);
    expect(shown).not.toContain("<");
    expect(f.text).toBe("That's the second time building came up. Who taught you?");
    expect(f.questionRef).toBe("Q7");
    expect(f.has("SESSION_COMPLETE")).toBe(true);
  });
  it("maps checkpoint and follow-up tags", () => {
    expect(streamThrough(["<<CHECKPOINT:2>> text"]).f.questionRef).toBe("checkpoint-2");
    expect(streamThrough(["<<Q:7-followup>> text"]).f.questionRef).toBe("Q7-followup");
    expect(streamThrough(["<<SAFETY>> I'm glad you told me. <<SAFETY_STOP>>"]).f.has("SAFETY_STOP")).toBe(true);
  });
  it("never swallows ordinary text containing angle brackets", () => {
    const { shown } = streamThrough(["I scored <50 in maths and 3 << 4 is true"]);
    expect(shown).toBe("I scored <50 in maths and 3 << 4 is true");
  });
  it("stripMarkers cleans stored text", () => {
    expect(stripMarkers("<<Q:1>> Hello <<SESSION_COMPLETE>>")).toBe("Hello");
  });
});

describe("safety keyword floor", () => {
  it("raises clear present-tense risk to hard", () => {
    for (const t of ["I want to kill myself", "sometimes I think about suicide", "I'm cutting myself again", "my uncle hits me", "I don't want to wake up tomorrow"]) {
      expect(keywordFloor(t), t).toBe("hard");
    }
  });
  it("treats past self-harm and hopelessness as soft", () => {
    expect(keywordFloor("I used to cut myself in grade 7")).toBe("soft");
    expect(keywordFloor("honestly it all feels hopeless")).toBe("soft");
    expect(keywordFloor("I feel like a burden to my mom")).toBe("soft");
  });
  it("leaves dark humour about schoolwork alone", () => {
    for (const t of ["this maths is killing me", "accounting makes me want to scream", "I died laughing", "I need to end my essay properly", "that test destroyed me"]) {
      expect(keywordFloor(t), t).toBe("none");
    }
  });
  it("only ever raises", () => {
    expect(maxRisk("soft", "none")).toBe("soft");
    expect(maxRisk("none", "hard")).toBe("hard");
  });
});

describe("question script + score context", () => {
  const p = buildScoreProfile({
    learnerId: "x", touchpoint: "G9_FOUNDATION", likert: varied(3),
    values: { top3: ["V_BE", "V_SD", "V_AC"], bottom2: ["V_PO", "V_CO"] },
    marks: { source: "school_import", subjects: LERATO_MARKS_G9 },
  });
  it("fills Q13–Q15 deterministically from scores", () => {
    expect(fillQ15(p)).toContain('"Looking after the people close to me"');
    expect(fillQ14({ ...p, identity: { ...p.identity, status: "foreclosure" } })).toMatch(/Whose idea was it first/);
    const flat = { ...p, interests: { ...p.interests, scores: { R: 50, I: 55, A: 40, S: 60, E: 30, C: 45 } } } as ScoreProfile;
    expect(fillQ13(flat)).toMatch(/Nothing stood out strongly/);
    const thinker = { ...p, interests: { ...p.interests, code: "ISA", scores: { R: 30, I: 78, A: 64, S: 70, E: 25, C: 33 } } } as ScoreProfile;
    expect(fillQ13(thinker)).toMatch(/figuring-things-out/);
    expect(interestsPlain(thinker)).toBe("loves figuring things out, helping people and making things; not drawn to building and fixing things or leading and selling"); // bottom two: R 30, E 25
    const script = g9Script(p);
    for (let q = 1; q <= 20; q++) expect(script).toContain(`Q${q}:`);
    expect(script.match(/CHECKPOINT/g)).toHaveLength(3);
  });
  it("Grade 11 script uses both callbacks and skips Q6 when nothing is below 50%", () => {
    const s = g11Script({ q2_most_myself: "making magazines", q19_future_tuesday: "a clinic", headline: null }, false, []);
    expect(s).toContain('"making magazines"');
    expect(s).toContain('"a clinic"');
    expect(s).toMatch(/Q6: SKIP SILENTLY/);
    expect(g11Script({ q2_most_myself: null, q19_future_tuesday: null, headline: null }, true, ["Physical Sciences"])).toMatch(/Tell me the story of Physical Sciences/);
  });
  it("builds the spec 07 §2 shape without numbers in plain fields", () => {
    const c = buildScoreContext(p, "Lerato", 9, { world: "Soshanguve" });
    expect(Object.keys(c)).toEqual(expect.arrayContaining(["first_name", "interests", "personality_plain", "values_top3", "identity_status", "contradiction_watch", "top_combination_ids"]));
    expect(c.values_top3[0]).toBe("Looking after the people close to me");
    expect(c.top_combination_ids).toHaveLength(3);
    expect(c.personality_plain.join(" ")).not.toMatch(/\d/);
  });
});
