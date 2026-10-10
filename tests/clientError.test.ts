import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/client-error/route";
import { IGNORED } from "@/lib/clientErrors";

const req = (body: unknown, ip = "1.1.1.1") =>
  new Request("http://x/api/client-error", { method: "POST", headers: { "x-forwarded-for": ip, "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const good = { kind: "boundary", message: "boom", stack: "Error: boom\n at x", path: "/learn", ua: "TestBrowser/1" };

describe("/api/client-error", () => {
  let log: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { log = vi.spyOn(console, "error").mockImplementation(() => {}); });

  it("logs one structured line and answers 204", async () => {
    const r = await POST(req(good, "2.2.2.2"));
    expect(r.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]![0]).toBe("[client-error]");
    expect(JSON.parse(log.mock.calls[0]![1] as string)).toMatchObject({ kind: "boundary", message: "boom", path: "/learn" });
  });
  it("a newline in the message can't forge a second log line (it is JSON-encoded)", async () => {
    await POST(req({ ...good, message: "a\n[client-error] {\"fake\":true}" }, "3.3.3.3"));
    expect(String(log.mock.calls[0]![1])).not.toContain("\n");
  });
  it("ignores malformed or oversized bodies silently", async () => {
    expect((await POST(req("not json", "4.4.4.4"))).status).toBe(204);
    expect((await POST(req({ ...good, message: "x".repeat(5000) }, "4.4.4.4"))).status).toBe(204);
    expect((await POST(req({ ...good, kind: "weird" }, "4.4.4.4"))).status).toBe(204);
    expect(log).not.toHaveBeenCalled();
  });
  it("throttles a flood from one address", async () => {
    for (let i = 0; i < 40; i++) await POST(req(good, "5.5.5.5"));
    expect(log.mock.calls.length).toBeLessThanOrEqual(20);
  });
});

describe("browser noise filter", () => {
  it("ignores harmless browser noise but not real errors", () => {
    expect(IGNORED.test("ResizeObserver loop completed with undelivered notifications.")).toBe(true);
    expect(IGNORED.test("Failed to fetch")).toBe(true);
    expect(IGNORED.test("TypeError: Cannot read properties of undefined (reading 'map')")).toBe(false);
  });
});
