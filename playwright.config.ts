import { defineConfig } from "@playwright/test";

/**
 * Smoke and accessibility tests against a PRODUCTION build (so the real security headers apply). They need no
 * database: the pages under test are public, and the server starts with throwaway environment values.
 * Locally: npm run build && npm run test:e2e   (set CHROMIUM_PATH if your browser isn't Playwright's own).
 */
const PORT = 3123;
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9", NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key-not-real", SUPABASE_SERVICE_ROLE_KEY: "e2e-service-key-not-real",
      CRON_SECRET: "e2e-cron-secret-not-real-0123456789", NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
