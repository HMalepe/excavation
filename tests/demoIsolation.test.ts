import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * The public demo must never reach an AI service (it would spend real API credit for anyone who opens a link).
 * This walks every import reachable from the demo's pages, components and API route and fails if it can reach
 * the Anthropic SDK, the AI client, the safety screen or the Guide.
 */
const root = resolve(__dirname, "..");
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const ENTRIES = [
  ...walk(join(root, "src/app/demo")), ...walk(join(root, "src/app/api/demo")), ...walk(join(root, "src/lib/demo")),
  join(root, "src/components/client/DemoPart1.tsx"), join(root, "src/components/client/DemoPart2.tsx"), join(root, "src/components/ui/DemoBar.tsx"),
];

function closure() {
  const files = new Set<string>(), pkgs = new Set<string>();
  const resolveMod = (from: string, spec: string): string | null => {
    let base: string;
    if (spec.startsWith("@/")) base = join(root, "src", spec.slice(2));
    else if (spec.startsWith("@config/")) base = join(root, "config", spec.slice(8));
    else if (spec.startsWith("@spec/")) base = join(root, "spec", spec.slice(6));
    else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
    else { pkgs.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!); return null; }
    for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(c) && statSync(c).isFile()) return c;
    return null;
  };
  const visit = (f: string) => {
    if (files.has(f) || !/\.(ts|tsx)$/.test(f)) return;
    files.add(f);
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)\s+(type\s+)?[^;'"]*?from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
      if (m[1]) continue; // `import type` is erased at build time
      const r = resolveMod(f, (m[2] ?? m[3] ?? m[4])!);
      if (r) visit(r);
    }
  };
  ENTRIES.forEach(visit);
  return { files: [...files].map((f) => f.slice(root.length + 1)), pkgs };
}

describe("the demo is isolated from the AI", () => {
  const { files, pkgs } = closure();
  it("finds the demo's files (guards against the walker silently seeing nothing)", () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files).toContain("src/lib/demo/sample.ts");
    expect(files).toContain("src/components/report/ReportViews.tsx");
  });
  it("cannot reach the Anthropic SDK", () => {
    expect([...pkgs].filter((p) => /anthropic/i.test(p))).toEqual([]);
  });
  it("cannot reach the AI client, safety screen, prompts or Guide logic", () => {
    const bad = files.filter((f) => /^src\/lib\/ai\/(client|safety|prompts)\.ts$/.test(f) || /^src\/lib\/guide\/(turn|state|limits)\.ts$/.test(f) || /^src\/lib\/pipeline\//.test(f) || /^src\/app\/api\/(guide|learn)\//.test(f));
    expect(bad).toEqual([]);
  });
  it("never mentions the API key", () => {
    const hits = files.filter((f) => /requireAnthropicKey|ANTHROPIC_API_KEY|anthropic\(\)/.test(readFileSync(join(root, f), "utf8")) && f !== "src/lib/env.server.ts");
    expect(hits).toEqual([]);
  });
  it("the only server route the demo has is the sample PDF", () => {
    expect(walk(join(root, "src/app/api/demo")).map((f) => f.slice(root.length + 1))).toEqual(["src/app/api/demo/pdf/route.tsx"]);
  });
});
