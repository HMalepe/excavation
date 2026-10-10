/**
 * Row-level security, tested on the REAL migrations in Postgres 16 (npm run test:db).
 * Each check runs as the `authenticated` role with a JWT `sub`, exactly as Supabase does.
 * Covers the spec's Definition of Done: "Teacher cannot see any report the learner didn't share".
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";

const db = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
const U = {
  learnerA: "00000000-0000-0000-0000-00000000000a",
  learnerB: "00000000-0000-0000-0000-00000000000b",
  teacher: "00000000-0000-0000-0000-0000000000c1",
  otherTeacher: "00000000-0000-0000-0000-0000000000c2",
  admin: "00000000-0000-0000-0000-0000000000d1",
  safe: "00000000-0000-0000-0000-0000000000e1",
  safeOther: "00000000-0000-0000-0000-0000000000e2",
};
const ids = {} as Record<"s1" | "s2" | "la" | "lb" | "sa" | "sb" | "aLearner" | "aTeacher" | "bLearner" | "bTeacher", string>;

/** Run `sql` as an authenticated user; returns rows (or affected rowCount for writes). */
async function as<T = Record<string, unknown>>(sub: string, sql: string, params: unknown[] = []) {
  await db.query("begin");
  try {
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub, role: "authenticated" })]);
    const r = await db.query(sql, params);
    return { rows: r.rows as T[], count: r.rowCount ?? 0 };
  } finally {
    await db.query("rollback");
  }
}

beforeAll(async () => {
  await db.connect();
  const q = async (sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows;
  for (const id of Object.values(U)) await q("insert into auth.users(id) values ($1)", [id]);
  const [s1] = await q("insert into schools(name, province) values ('School One','Gauteng') returning id");
  const [s2] = await q("insert into schools(name, province) values ('School Two','Gauteng') returning id");
  ids.s1 = s1.id; ids.s2 = s2.id;
  const prof = (id: string, role: string, school: string) => q("insert into profiles(id, role, school_id, first_name) values ($1,$2,$3,'x')", [id, role, school]);
  await prof(U.learnerA, "learner", ids.s1); await prof(U.learnerB, "learner", ids.s1);
  await prof(U.teacher, "teacher", ids.s1); await prof(U.otherTeacher, "teacher", ids.s1);
  await prof(U.admin, "school_admin", ids.s1); await prof(U.safe, "safeguarding_contact", ids.s1); await prof(U.safeOther, "safeguarding_contact", ids.s2);
  const [la] = await q("insert into learners(profile_id, school_id, first_name, last_name, current_grade, login_code) values ($1,$2,'Lerato','M',9,'A1') returning id", [U.learnerA, ids.s1]);
  const [lb] = await q("insert into learners(profile_id, school_id, first_name, last_name, current_grade, login_code) values ($1,$2,'Sipho','K',9,'B1') returning id", [U.learnerB, ids.s1]);
  ids.la = la.id; ids.lb = lb.id;
  // teacher teaches BOTH learners; otherTeacher teaches only B
  await q("insert into teacher_classes values ($1,$2),($1,$3),($4,$3)", [U.teacher, ids.la, ids.lb, U.otherTeacher]);
  const [sa] = await q("insert into sessions(learner_id, touchpoint, instrument_version, status) values ($1,'G9_FOUNDATION','1.0.0','complete') returning id", [ids.la]);
  const [sb] = await q("insert into sessions(learner_id, touchpoint, instrument_version, status) values ($1,'G9_FOUNDATION','1.0.0','complete') returning id", [ids.lb]);
  ids.sa = sa.id; ids.sb = sb.id;
  const rep = async (session: string, kind: string, status: string) => (await q("insert into reports(session_id, kind, status, content, model) values ($1,$2,$3,'{}','m') returning id", [session, kind, status]))[0].id;
  ids.aLearner = await rep(ids.sa, "learner", "released");
  ids.aTeacher = await rep(ids.sa, "teacher", "released");
  ids.bLearner = await rep(ids.sb, "learner", "needs_review");
  ids.bTeacher = await rep(ids.sb, "teacher", "released");
  // A shared their teacher summary; B did NOT share theirs.
  await q("insert into share_grants(report_id, learner_id, audience) values ($1,$2,'teacher')", [ids.aTeacher, ids.la]);
  await q("insert into score_profiles(session_id, norm_state, quality_status, profile, engine_version) values ($1,'pre_norm','ok','{}','1')", [ids.sa]);
  const [m] = await q("insert into conversation_messages(session_id, role, content) values ($1,'learner','private words') returning id", [ids.sa]);
  await q("insert into signals(session_id, payload, model) values ($1,'{}','m')", [ids.sa]);
  await q("insert into item_responses(session_id, item_id, value) values ($1,'PO1',4)", [ids.sa]);
  await q("insert into safeguarding_events(session_id, learner_id, level, trigger_source, trigger_message_id) values ($1,$2,'hard','conversation',$3)", [ids.sa, ids.la, m.id]);
  await q("insert into school_settings(school_id, safeguarding_contact_name, safeguarding_contact_phone, safeguarding_contact_email, safeguarding_backup_name, safeguarding_backup_phone, partnership_agreement_signed) values ($1,'a','1','a@x','b','2','2026-01-01')", [ids.s1]);
});
afterAll(() => db.end());

describe("teachers", () => {
  it("CAN read a teacher summary the learner shared (fails under the spec's original policy)", async () => {
    const r = await as(U.teacher, "select id from reports where id = $1", [ids.aTeacher]);
    expect(r.rows).toHaveLength(1);
  });
  it("CANNOT read a summary the learner did not share", async () => {
    expect((await as(U.teacher, "select id from reports where id = $1", [ids.bTeacher])).rows).toHaveLength(0);
  });
  it("CANNOT read a shared summary once the learner revokes it", async () => {
    await db.query("update share_grants set revoked_at = now() where report_id = $1", [ids.aTeacher]);
    expect((await as(U.teacher, "select id from reports where id = $1", [ids.aTeacher])).rows).toHaveLength(0);
    await db.query("update share_grants set revoked_at = null where report_id = $1", [ids.aTeacher]);
  });
  it("CANNOT read a shared summary of a learner outside their classes", async () => {
    expect((await as(U.otherTeacher, "select id from reports where id = $1", [ids.aTeacher])).rows).toHaveLength(0);
  });
  it("CANNOT read full learner reports, scores, signals, answers or conversations", async () => {
    expect((await as(U.teacher, "select id from reports where kind = 'learner'")).rows).toHaveLength(0);
    for (const t of ["score_profiles", "signals", "item_responses", "conversation_messages", "safeguarding_events", "verdicts"]) {
      expect((await as(U.teacher, `select * from ${t}`)).rows, t).toHaveLength(0);
    }
  });
  it("sees names and completion status of learners in their classes only", async () => {
    expect((await as(U.otherTeacher, "select id from learners")).rows.map((r) => r.id)).toEqual([ids.lb]);
    expect((await as(U.otherTeacher, "select learner_id, status from sessions")).rows).toHaveLength(1);
  });
});

describe("learners", () => {
  it("read their own released report only", async () => {
    expect((await as(U.learnerA, "select id from reports where kind='learner'")).rows.map((r) => r.id)).toEqual([ids.aLearner]);
    expect((await as(U.learnerB, "select id from reports where kind='learner'")).rows).toHaveLength(0); // B's is still in review
  });
  it("cannot read another learner's data", async () => {
    expect((await as(U.learnerB, "select * from conversation_messages")).rows).toHaveLength(0);
    expect((await as(U.learnerB, "select * from score_profiles")).rows).toHaveLength(0);
  });
  it("CANNOT delete their session (which would cascade-delete the safeguarding record)", async () => {
    expect((await as(U.learnerA, "delete from sessions where id = $1", [ids.sa])).count).toBe(0);
    expect((await db.query("select count(*)::int as n from safeguarding_events")).rows[0].n).toBe(1);
  });
  it("CANNOT create share grants directly (e.g. for someone else's report)", async () => {
    await expect(as(U.learnerA, "insert into share_grants(report_id, learner_id, audience) values ($1,$2,'teacher')", [ids.bTeacher, ids.la])).rejects.toThrow(/row-level security/);
  });
  it("CANNOT change their own answers or scores through the API", async () => {
    expect((await as(U.learnerA, "update item_responses set value = 1")).count).toBe(0);
    expect((await as(U.learnerA, "update score_profiles set quality_status = 'ok'")).count).toBe(0);
  });
});

describe("school roles", () => {
  it("school admins see settings, never reports, scores or messages", async () => {
    expect((await as(U.admin, "select school_id from school_settings")).rows).toHaveLength(1);
    for (const t of ["reports", "score_profiles", "conversation_messages", "item_responses", "signals"]) {
      expect((await as(U.admin, `select * from ${t}`)).rows, t).toHaveLength(0);
    }
  });
  it("safeguarding contacts see events for their own school only (fails under the spec's original policy)", async () => {
    expect((await as(U.safe, "select id from safeguarding_events")).rows).toHaveLength(1);
    expect((await as(U.safeOther, "select id from safeguarding_events")).rows).toHaveLength(0);
  });
  it("norms and login attempts are service-only", async () => {
    expect((await as(U.admin, "select * from norms")).rows).toHaveLength(0);
    expect((await as(U.admin, "select * from login_attempts")).rows).toHaveLength(0);
  });
});
