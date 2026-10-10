/**
 * Seed data for local development (spec 10 Step 1):
 * one school with complete school_settings (deadlines in the future), one teacher, one school admin,
 * one safeguarding contact, one Excavation staff reviewer, and learners with login codes.
 *
 *   npm run seed          (reads .env.local; needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *
 * Idempotent: re-running updates the same rows. Never run against production.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
if (/supabase\.co/.test(url) && process.env.SEED_ALLOW_REMOTE !== "yes") {
  throw new Error("Refusing to seed a hosted Supabase project. Set SEED_ALLOW_REMOTE=yes if this really is a dev project.");
}
const db = createClient(url, key, { auth: { persistSession: false } });

const PASSWORD = process.env.SEED_STAFF_PASSWORD ?? `Dev-${randomBytes(6).toString("hex")}`;
const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function staffUser(email: string, role: string, first: string, last: string, schoolId: string | null) {
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    if (error) throw new Error(`create ${email}: ${error.message}`);
    user = data.user!;
  } else {
    await db.auth.admin.updateUserById(user.id, { password: PASSWORD });
  }
  await must(db.from("profiles").upsert({ id: user.id, role, school_id: schoolId, first_name: first, last_name: last }), `profile ${email}`);
  return user.id;
}

async function main() {
  const school = await must(
    db.from("schools").upsert({ name: "Excavation Pilot Secondary", emis_number: "700000001", province: "Gauteng", district: "Tshwane North", school_code: "PILOT1" }, { onConflict: "emis_number" }).select().single(),
    "school",
  ) as { id: string };

  await must(db.from("school_settings").upsert({
    school_id: school.id,
    offered_combination_ids: ["HEALTH_SCI", "SCI_IT", "COMMERCE", "HUMANITIES", "VISUAL_CREATIVE", "BUSINESS_PRACTICAL", "GEO_ENV"],
    readiness_overrides: { "Physical Sciences": { needs: { "Natural Sciences": 55, Mathematics: 50 } } },
    subject_change_deadline_g10: days(60),
    subject_change_deadline_g11: days(120),
    safeguarding_contact_name: "Ms N. Dlamini (Deputy Principal)",
    safeguarding_contact_phone: "+27000000001",
    safeguarding_contact_email: "safeguard@pilot.test",
    safeguarding_backup_name: "Mr T. Mokoena (LO Head)",
    safeguarding_backup_phone: "+27000000002",
    safeguarding_backup_email: "lo-head@pilot.test",
    partnership_agreement_signed: days(-30),
    offered_subjects_fet: ["Mathematics", "Mathematical Literacy", "Physical Sciences", "Life Sciences", "Geography", "History", "Accounting", "Economics", "Business Studies", "Information Technology", "Visual Arts", "Design", "Tourism"],
    timetable_allows: { "Mathematical Literacy": true, Geography: true, History: true, "Business Studies": true },
  }), "school_settings");

  const teacher = await staffUser("teacher@pilot.test", "teacher", "Grace", "Nkosi", school.id);
  await staffUser("admin@pilot.test", "school_admin", "Peter", "van Wyk", school.id);
  await staffUser("safeguard@pilot.test", "safeguarding_contact", "Nomsa", "Dlamini", school.id);
  await staffUser("staff@excavation.test", "excavation_staff", "Review", "Team", null);

  const learners = [
    { first_name: "Lerato", last_name: "M.", current_grade: 9, class_label: "9A", login_code: "LER-0901", consent: true },
    { first_name: "Sipho", last_name: "K.", current_grade: 9, class_label: "9A", login_code: "SIP-0902", consent: true },
    { first_name: "Ayanda", last_name: "Z.", current_grade: 11, class_label: "11B", login_code: "AYA-1101", consent: true,
      fet_subjects: ["Home Language", "First Additional Language", "Mathematics", "Physical Sciences", "Life Sciences", "Geography", "Life Orientation"] },
    { first_name: "Thabo", last_name: "N.", current_grade: 9, class_label: "9B", login_code: "THA-0903", consent: false },
  ];

  for (const l of learners) {
    const { consent, ...row } = l;
    const learner = await must(db.from("learners").upsert({ ...row, school_id: school.id }, { onConflict: "login_code" }).select().single(), `learner ${l.first_name}`) as { id: string };
    await must(db.from("teacher_classes").upsert({ teacher_profile_id: teacher, learner_id: learner.id }), "teacher_classes");
    await db.from("guardian_consents").delete().eq("learner_id", learner.id);
    if (consent) {
      await must(db.from("guardian_consents").insert({
        learner_id: learner.id, guardian_name: `Guardian of ${l.first_name}`, relationship: "Parent", method: "paper_upload",
        evidence_ref: "seed/consent.pdf", consent_service: true, consent_ai_crossborder: true, consent_wellbeing: true,
        consent_research: l.first_name !== "Sipho", form_version: "2026-10-v1",
      }), "consent");
    }
    if (l.first_name === "Lerato") {
      const marks = { "Home Language": 66, "First Additional Language": 63, Mathematics: 58, "Natural Sciences": 71, "Social Sciences": 62, "Economic and Management Sciences": 64, Technology: 55, "Creative Arts": 74, "Life Orientation": 70 };
      for (const [subject, percentage] of Object.entries(marks)) {
        await must(db.from("marks").upsert({ learner_id: learner.id, grade: 9, term_label: "T2", subject, percentage, source: "school_import" }, { onConflict: "learner_id,grade,term_label,subject" }), "marks");
      }
    }
    if (l.first_name === "Ayanda") {
      const g10 = { "Home Language": 68, "First Additional Language": 64, Mathematics: 58, "Physical Sciences": 52, "Life Sciences": 70, Geography: 60, "Life Orientation": 75 };
      const g11 = { "Home Language": 68, "First Additional Language": 64, Mathematics: 55, "Physical Sciences": 41, "Life Sciences": 74, Geography: 61, "Life Orientation": 78 };
      for (const [subject, percentage] of Object.entries(g10)) await must(db.from("marks").upsert({ learner_id: learner.id, grade: 10, term_label: "G10-final", subject, percentage, source: "school_import" }, { onConflict: "learner_id,grade,term_label,subject" }), "g10");
      for (const [subject, percentage] of Object.entries(g11)) await must(db.from("marks").upsert({ learner_id: learner.id, grade: 11, term_label: "T1", subject, percentage, source: "school_import" }, { onConflict: "learner_id,grade,term_label,subject" }), "g11");
    }
  }

  console.log("\nSeeded. Learner login (school code PILOT1):");
  for (const l of learners) console.log(`  ${l.first_name.padEnd(8)} grade ${l.current_grade}  code ${l.login_code}${l.consent ? "" : "  (no guardian consent — shows the block screen)"}`);
  console.log(`\nStaff logins (password: ${PASSWORD}):`);
  console.log("  teacher@pilot.test · admin@pilot.test · safeguard@pilot.test · staff@excavation.test\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
