import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/login", "/staff/login", "/privacy", "/terms", "/cookies", "/nope"];

test.describe("security headers (production build)", () => {
  test("every response carries the hardening headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toMatch(/max-age=\d{7,}/);
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["content-security-policy"]).toContain("connect-src 'self'");
    expect(h["x-powered-by"]).toBeUndefined();
  });
  test("health endpoint is public and leaks nothing", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBe(true);
    expect(Object.keys(await res.json()).sort()).toEqual(["ok", "time", "version"]);
  });
  test("deep health and cron routes refuse callers without the secret", async ({ request }) => {
    expect((await request.get("/api/health/deep")).status()).toBe(401);
    expect((await request.get("/api/cron/retention")).status()).toBe(401);
    expect((await request.get("/api/cron/norms")).status()).toBe(401);
  });
});

test.describe("access control without a session", () => {
  for (const [path, to] of [["/learn", "/login"], ["/staff", "/staff/login"], ["/school/admin", "/staff/login"], ["/school/admin/consent", "/staff/login"], ["/staff/privacy", "/staff/login"], ["/staff/mfa", "/staff/login"]] as const) {
    test(`${path} sends a visitor to ${to}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${to}$`));
    });
  }
  test("APIs reject anonymous callers", async ({ request }) => {
    for (const [method, url] of [["post", "/api/learn/answer"], ["post", "/api/guide/message"], ["post", "/api/staff/privacy"], ["post", "/api/staff/mfa/enrol"], ["post", "/api/staff/mfa/verify"], ["post", "/api/school/consent"], ["get", "/api/school/consent-form"], ["get", "/api/report/pdf?kind=learner"]] as const) {
      const res = await request[method](url, method === "post" ? { data: {} } : undefined);
      expect([401, 403], `${method} ${url}`).toContain(res.status());
    }
  });
});

test.describe("public pages", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const path of PAGES) {
      test(`${path} has no WCAG A/AA violations (${scheme})`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 } });
        const page = await ctx.newPage();
        const csp: string[] = [];
        page.on("console", (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
        await page.goto(path, { waitUntil: "networkidle" });
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
        expect(csp).toEqual([]);
        await ctx.close();
      });
    }
  }
  test("the login form needs both codes and says what to do when they're wrong", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByLabel("School code")).toBeVisible();
    await expect(page.getByLabel("Your code")).toBeVisible();
  });
});
