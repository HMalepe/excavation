-- =====================================================================
-- 0002_app_extensions.sql
-- Additions and RLS fixes on top of the spec schema (0001_init.sql).
-- Every change here is explained, so reviewers can trace it back to the spec.
-- =====================================================================

-- ---------- SCHOOLS: learner login ----------
-- Learners log in with a school code + their personal login code (spec 10, Step 3).
alter table schools add column school_code text unique;

-- ---------- SCHOOL SETTINGS: fields the spec requires but the schema lacks ----------
alter table school_settings
  -- Step 7: "SMS + email to the school's designated contact AND backup".
  add column safeguarding_backup_email text,
  -- Step 7: escalation after 4 *school* hours needs the school day and timezone.
  add column school_day_start time not null default '07:30',
  add column school_day_end   time not null default '14:30',
  add column timezone         text not null default 'Africa/Johannesburg',
  -- Spec 06 §3: switchWindowOpen() needs school.offers(subject) and timetableAllows(subject).
  add column offered_subjects_fet text[] not null default '{}',
  add column timetable_allows     jsonb  not null default '{}',   -- {"Mathematical Literacy": true}
  -- Spec 06 §1: "School overrides may raise thresholds" for performance bands.
  add column performance_overrides jsonb not null default '{}';   -- {"Physical Sciences": 60}

-- ---------- LEARNERS: FET subjects actually taken (Grade 10–12) ----------
alter table learners add column fet_subjects text[] not null default '{}';

-- ---------- SESSIONS: explicit step pointer for pause/resume ----------
alter table sessions
  add column stage     text  not null default 'consent',
  add column progress  jsonb not null default '{}',
  -- Spec 09 §5.1 hard path: "Session locked until reviewed."
  add column locked_at timestamptz;

-- ---------- REPORTS: generation log + learner-side state (plan tick boxes) ----------
alter table reports
  add column meta         jsonb not null default '{}',
  add column learner_state jsonb not null default '{}';

-- ---------- SAFEGUARDING: notification audit + confirmation link ----------
alter table safeguarding_events
  add column confirm_token_hash text,
  add column notification_log   jsonb not null default '[]',
  add column lead_notified_at   timestamptz,
  add column reviewed_by        uuid references profiles(id),
  add column reviewed_at        timestamptz;

-- ---------- LOGIN THROTTLING ----------
create table login_attempts (
  id         bigint generated always as identity primary key,
  key        text not null,                  -- hashed ip or school code
  succeeded  boolean not null,
  at         timestamptz not null default now()
);
create index on login_attempts (key, at);
alter table login_attempts enable row level security;   -- service role only

-- ---------- NORMS (Step 9) ----------
create table norms (
  id                uuid primary key default gen_random_uuid(),
  grade             smallint not null check (grade in (9, 11)),
  version           integer  not null,
  norm_state        text not null check (norm_state in ('pre_norm','emerging_norm','established_norm')),
  n_sessions        integer not null,
  percentiles       jsonb not null,           -- {"P_O": [p0..p100 cut points], ...}
  identity_medians  jsonb not null,           -- {"exploration": 52, "commitment": 55}
  alphas            jsonb not null,           -- {"P_O": 0.74, ...}
  item_stats_csv    text  not null,
  computed_at       timestamptz not null default now(),
  unique (grade, version)
);
alter table norms enable row level security;               -- service role only

-- =====================================================================
-- RLS FIXES
-- =====================================================================

-- (1) Learners were allowed `for all` on sessions and item_responses. With their own JWT a
--     learner could DELETE their session through the REST API, and safeguarding_events
--     cascades from sessions — i.e. a learner could erase a safeguarding record. All learner
--     writes go through validated server routes (service role), so learners only need SELECT.
drop policy learner_own_sessions on sessions;
create policy learner_read_own_sessions on sessions
  for select using (learner_id = my_learner_id());

drop policy learner_own_responses on item_responses;
create policy learner_read_own_responses on item_responses
  for select using (session_id in (select id from sessions where learner_id = my_learner_id()));

-- (2) share_grants `for all` did not check that report_id belongs to the learner, so a learner
--     could create a grant for someone else's report. Grants are created server-side; learners read.
drop policy learner_manage_shares on share_grants;
create policy learner_read_own_shares on share_grants
  for select using (learner_id = my_learner_id());

-- (3) Policy sub-queries are themselves filtered by RLS. The spec's teacher policy joins
--     share_grants, sessions and teacher_classes — none readable by teachers — so it could
--     never match. Same for the safeguarding policy reading learners. SECURITY DEFINER
--     helpers evaluate the relationship without widening what the caller can read.
create or replace function teacher_can_read_report(p_report_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from reports r
    join sessions s        on s.id = r.session_id
    join share_grants g    on g.report_id = r.id and g.audience = 'teacher' and g.revoked_at is null
    join teacher_classes tc on tc.learner_id = s.learner_id and tc.teacher_profile_id = auth.uid()
    where r.id = p_report_id
  )
$$;

drop policy teacher_shared_summaries on reports;
create policy teacher_shared_summaries on reports
  for select using (
    my_role() = 'teacher'
    and kind = 'teacher' and status = 'released'
    and teacher_can_read_report(id)
  );

create or replace function learner_in_my_school(p_learner_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from learners l where l.id = p_learner_id and l.school_id = my_school())
$$;

drop policy safeguarding_events_school on safeguarding_events;
create policy safeguarding_events_school on safeguarding_events
  for select using (my_role() = 'safeguarding_contact' and learner_in_my_school(learner_id));

-- =====================================================================
-- READ POLICIES the app needs (all SELECT; nothing here grants writes)
-- =====================================================================

create policy profile_read_self on profiles
  for select using (id = auth.uid());

create policy school_read_member on schools
  for select using (id = my_school());

create policy learner_read_self on learners
  for select using (profile_id = auth.uid());

-- Teachers see the names and completion status of learners in their classes — not content.
create policy teacher_read_class on teacher_classes
  for select using (teacher_profile_id = auth.uid());

create or replace function teacher_has_learner(p_learner_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from teacher_classes tc
                 where tc.learner_id = p_learner_id and tc.teacher_profile_id = auth.uid())
$$;

create policy teacher_read_class_learners on learners
  for select using (my_role() = 'teacher' and teacher_has_learner(id));

create policy teacher_read_class_sessions on sessions
  for select using (my_role() = 'teacher' and teacher_has_learner(learner_id));

-- Learners can read their own scores and verdict (the report explains them in plain language).
create policy learner_read_own_scores on score_profiles
  for select using (session_id in (select id from sessions where learner_id = my_learner_id()));
create policy learner_read_own_verdicts on verdicts
  for select using (session_id in (select id from sessions where learner_id = my_learner_id()));

-- Teachers must NEVER read item_responses, score_profiles, signals, verdicts or messages.
-- No policies are created for them on those tables, and RLS denies by default.

create index on safeguarding_events (school_notified_at) where school_confirmed_at is null;
create index on reports (status, created_at);
