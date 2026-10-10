#!/usr/bin/env node
/**
 * Definition of done: "No AI key or service key reachable from the browser".
 * Builds with CANARY secret values, then scans every file shipped to the browser (.next/static)
 * for the canaries and for the secret env names. Any hit fails the check.
 *   npm run check:secrets
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const CANARY = {
  SUPABASE_SERVICE_ROLE_KEY: "canary-service-role-7f3a9c1e5b2d",
  ANTHROPIC_API_KEY: "canary-anthropic-key-4e8b2a6d0c9f",
  RESEND_API_KEY: "canary-resend-key-1a2b3c4d",
  SMS_PROVIDER_TOKEN: "canary-sms-token-9z8y7x",
  CRON_SECRET: "canary-cron-secret-0123456789abcdef",
};
const env = {
  ...process.env, ...CANARY, NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-ok-to-ship", NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

if (!process.argv.includes("--no-build")) execSync("npx next build", { stdio: "inherit", env });

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(".next/static");
const needles = [...Object.values(CANARY), ...Object.keys(CANARY)];
const hits = [];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const n of needles) if (text.includes(n)) hits.push(`${f}: ${n}`);
}
if (hits.length) {
  console.error("✖ Server secrets found in browser bundle:\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`✔ Scanned ${files.length} browser files: no server secrets or secret env names.`);
