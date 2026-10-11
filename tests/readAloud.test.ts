import { describe, it, expect } from "vitest";
import { speakable } from "@/components/client/readAloud";

describe("read-aloud text", () => {
  it("says maths symbols as words", () => {
    expect(speakable("Work out: −3 + 4 × (−2)")).toContain("minus 3 plus 4 times (minus 2)");
    expect(speakable("Simplify: 2³ × 2⁴")).toContain("2 cubed times 2 to the power of 4");
    expect(speakable("Factorise fully: x² − 9")).toContain("x squared minus 9");
    expect(speakable("Solve for x: 5x − 7 = 2x + 8")).toContain("equals");
    expect(speakable("a ≥ 8")).toContain("is greater than or equal to");
  });
  it("says Rand, units and South African decimals correctly", () => {
    expect(speakable("Thandi and Pule share R600 in the ratio 2 : 3.")).toContain("600 rand");
    expect(speakable("R9 300 tied up")).toContain("9300 rand");
    expect(speakable("200 ÷ 6 = 33,3")).toContain("33 point 3");
    expect(speakable("A 5 m ladder, foot 3 m from the wall")).toContain("5 metres ladder");
    expect(speakable("Density: 60 g and 20 cm³")).toContain("60 grams and 20 cubic centimetres");
    expect(speakable("80 °C at 8 min")).toContain("80 degrees Celsius");
    expect(speakable("2 m/s and 30 km/h")).toContain("metres per second");
    expect(speakable("39 °C")).toContain("39 degrees Celsius");
  });
  it("spells out initialisms and never leaves symbols behind", () => {
    expect(speakable("Ask your LO teacher about the AI Guide")).toBe("Ask your L O teacher about the A I Guide");
    expect(speakable("Time (min) → temperature (°C)")).not.toMatch(/→|°/);
  });
});
