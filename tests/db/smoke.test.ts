import { describe, it, expect } from "vitest";
import pg from "pg";

describe("migrations", () => {
  it("apply cleanly and create every table", async () => {
    const c = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    await c.connect();
    const { rows } = await c.query(
      "select count(*)::int as n from information_schema.tables where table_schema='public'",
    );
    await c.end();
    expect(rows[0].n).toBe(21); // 19 spec tables + login_attempts + norms
  });
});
