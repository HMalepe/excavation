-- 0001_init.sql — copied VERBATIM from spec/database/schema.sql (v1.0).
-- Do not edit here; put changes in later migrations so the spec stays traceable.

-- =====================================================================
-- The Excavation — School Edition · Postgres / Supabase schema v1.0
-- Create this in a NEW, dedicated Supabase project (consider an
-- AF-South or adequately protected region — see file 09 §1 risk 4).
-- Run as a migration. Review every RLS policy with your developer.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
create type touchpoint      as enum ('G9_FOUNDATION', 'G11_CONFIRMATION');
create type session_status  as enum ('not_started', 'scored_layer', 'conversation', 'complete', 'safety_stop', 'abandoned');
create type app_role        as enum ('learner', 'teacher', 'school_admin', 'safeguarding_contact', 'excavation_staff');
create type verdict_code    as enum ('CONFIRM', 'RESCUE', 'RETHINK', 'ADJUST_ONE', 'REDIRECT', 'REDIRECT_AFTER_MATRIC');
create type safety_level    as enum ('soft', 'hard');
create type report_status   as enum ('generating', 'needs_review', 'released', 'withdrawn');
create type marks_source    as enum ('school_import', 'self_report');

-- ---------- SCHOOLS ----------
create table schools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  emis_number       text unique,                      -- DBE school identifier
  province          text not null,
  district          text,
  created_at        timestamptz not null default now()
);

create table school_settings (
  school_id                     uuid primary key references schools(id) on delete cascade,
  offered_combination_ids       text[] not null default '{}',   -- from config/subject_map.json
  readiness_overrides           jsonb  not null default '{}',   -- {"Physical Sciences": {"needs": {"Natural Sciences": 60}}}
  subject_change_deadline_g10   date,
  subject_change_deadline_g11   date,
  safeguarding_contact_name     text not null,
  safeguarding_contact_phone    text not null,
  safeguarding_contact_email    text not null,
  safeguarding_backup_name      text not null,
  safeguarding_backup_phone     text not null,
  partnership_agreement_signed  date not null,
  updated_at                    timestamptz not null default now()
);

-- ---------- PEOPLE & ROLES ----------
-- Every authenticated person (learner or staff) has a profile row.
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        app_role not null,
  school_id   uuid references schools(id),
  first_name  text not null,
  last_name   text,
  created_at  timestamptz not null default now()
);

create table learners (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid unique references profiles(id) on delete set null,  -- null until first login
  school_id           uuid not null references schools(id),
  school_learner_ref  text,                    -- e.g. SA-SAMS admission number (no ID numbers)
  first_name          text not null,
  last_name           text not null,
  current_grade       smallint not null check (current_grade between 8 and 12),
  class_label         text,
  preferred_language  text default 'English',
  login_code          text unique,             -- school-issued code for learners without email
  created_at          timestamptz not null default now()
);

create table teacher_classes (                 -- which learners a teacher may see summaries for
  teacher_profile_id  uuid references profiles(id) on delete cascade,
  learner_id          uuid references learners(id) on delete cascade,
  primary key (teacher_profile_id, learner_id)
);

-- ---------- CONSENT ----------
create table guardian_consents (
  id                     uuid primary key default gen_random_uuid(),
  learner_id             uuid not null references learners(id) on delete cascade,
  guardian_name          text not null,
  relationship           text not null,
  method                 text not null check (method in ('digital_otp', 'paper_upload')),
  evidence_ref           text,                  -- storage path of signed form or OTP log id
  consent_service        boolean not null,
  consent_ai_crossborder boolean not null,
  consent_wellbeing      boolean not null,
  consent_research       boolean not null default false,
  form_version           text not null,
  given_at               timestamptz not null default now(),
  withdrawn_at           timestamptz
);

create table learner_assents (
  id           uuid primary key default gen_random_uuid(),
  learner_id   uuid not null references learners(id) on delete cascade,
  session_id   uuid,
  assented     boolean not null,
  screen_version text not null,
  at           timestamptz not null default now()
);

-- ---------- SESSIONS & RESPONSES ----------
create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  learner_id          uuid not null references learners(id) on delete cascade,
  touchpoint          touchpoint not null,
  instrument_version  text not null,            -- e.g. '1.0.0'
  status              session_status not null default 'not_started',
  item_order          jsonb,                    -- randomised order actually shown
  started_at          timestamptz,
  completed_at        timestamptz,
  unique (learner_id, touchpoint)
);

create table item_responses (
  id             bigint generated always as identity primary key,
  session_id     uuid not null references sessions(id) on delete cascade,
  item_id        text not null,                 -- e.g. 'PO3', 'IR2', 'SE1:Physical Sciences'
  value          smallint,                      -- 1..5 (null if skipped)
  value_json     jsonb,                         -- card sort / multi-choice / free text
  response_ms    integer,
  change_count   smallint not null default 0,
  answered_at    timestamptz not null default now(),
  unique (session_id, item_id)
);

create table marks (
  id             bigint generated always as identity primary key,
  learner_id     uuid not null references learners(id) on delete cascade,
  grade          smallint not null,
  term_label     text not null,                 -- 'T2-2027', 'G10-final'
  subject        text not null,
  percentage     numeric(5,2) not null check (percentage between 0 and 100),
  source         marks_source not null,
  is_estimate    boolean not null default false,
  recorded_at    timestamptz not null default now(),
  unique (learner_id, grade, term_label, subject)
);

-- ---------- SCORES, SIGNALS, VERDICTS ----------
create table score_profiles (
  session_id      uuid primary key references sessions(id) on delete cascade,
  norm_state      text not null check (norm_state in ('pre_norm','emerging_norm','established_norm')),
  quality_status  text not null check (quality_status in ('ok','caution','invalid')),
  profile         jsonb not null,               -- ScoreProfile (file 04 §11)
  computed_at     timestamptz not null default now(),
  engine_version  text not null
);

-- Transcripts are kept apart from scores, with stricter access.
create table conversation_messages (
  id           bigint generated always as identity primary key,
  session_id   uuid not null references sessions(id) on delete cascade,
  role         text not null check (role in ('learner','guide','system')),
  question_ref text,                            -- 'Q7', 'Q7-followup', 'checkpoint-1'
  content      text not null,
  safety_risk  text check (safety_risk in ('none','soft','hard')),
  created_at   timestamptz not null default now()
);

create table signals (
  session_id   uuid primary key references sessions(id) on delete cascade,
  payload      jsonb not null,                  -- file 07 §4
  extracted_at timestamptz not null default now(),
  model        text not null
);

create table verdicts (
  session_id   uuid primary key references sessions(id) on delete cascade,
  code         verdict_code not null,
  hold_redirect boolean not null default false,
  payload      jsonb not null,                  -- file 06 §9
  computed_at  timestamptz not null default now(),
  engine_version text not null
);

-- ---------- REPORTS & SHARING ----------
create table reports (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  kind          text not null check (kind in ('learner','teacher','parent')),
  status        report_status not null default 'generating',
  content       jsonb not null,                 -- validated against file 07 schemas
  model         text not null,
  reviewed_by   uuid references profiles(id),
  reviewed_at   timestamptz,
  released_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (session_id, kind)
);

create table share_grants (                      -- learner-controlled sharing
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references reports(id) on delete cascade,
  learner_id    uuid not null references learners(id) on delete cascade,
  audience      text not null check (audience in ('teacher','parent')),
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz
);

-- ---------- SAFEGUARDING ----------
create table safeguarding_events (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references sessions(id) on delete cascade,
  learner_id         uuid not null references learners(id) on delete cascade,
  level              safety_level not null,
  trigger_source     text not null check (trigger_source in ('scored_layer','conversation')),
  trigger_message_id bigint references conversation_messages(id),
  school_notified_at timestamptz,
  school_confirmed_at timestamptz,
  escalated_at       timestamptz,
  notes              text,                      -- staff only; no learner content beyond the trigger
  created_at         timestamptz not null default now()
);

-- ---------- REFERENCE DATA ----------
create table institution_rules (                 -- per-university APS & requirements; verify yearly
  id               uuid primary key default gen_random_uuid(),
  institution      text not null,
  programme        text not null,
  admissions_year  smallint not null,
  aps_method       jsonb not null,
  min_aps          smallint,
  subject_minimums jsonb not null default '{}',
  source_url       text not null,
  verified_on      date not null,
  unique (institution, programme, admissions_year)
);

create table audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references profiles(id),
  action     text not null,                     -- 'view_report', 'export_cohort', 'grant_share', ...
  target     text not null,
  at         timestamptz not null default now()
);

-- ---------- HELPER FUNCTIONS ----------
create or replace function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function my_school() returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from profiles where id = auth.uid()
$$;

create or replace function my_learner_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from learners where profile_id = auth.uid()
$$;

-- ---------- ROW LEVEL SECURITY ----------
alter table schools               enable row level security;
alter table school_settings       enable row level security;
alter table profiles              enable row level security;
alter table learners              enable row level security;
alter table teacher_classes       enable row level security;
alter table guardian_consents     enable row level security;
alter table learner_assents       enable row level security;
alter table sessions              enable row level security;
alter table item_responses        enable row level security;
alter table marks                 enable row level security;
alter table score_profiles        enable row level security;
alter table conversation_messages enable row level security;
alter table signals               enable row level security;
alter table verdicts              enable row level security;
alter table reports               enable row level security;
alter table share_grants          enable row level security;
alter table safeguarding_events   enable row level security;
alter table institution_rules     enable row level security;
alter table audit_log             enable row level security;

-- Learners: own data only
create policy learner_own_sessions on sessions
  for all using (learner_id = my_learner_id());
create policy learner_own_responses on item_responses
  for all using (session_id in (select id from sessions where learner_id = my_learner_id()));
create policy learner_own_messages on conversation_messages
  for select using (session_id in (select id from sessions where learner_id = my_learner_id()));
create policy learner_own_reports on reports
  for select using (status = 'released'
    and session_id in (select id from sessions where learner_id = my_learner_id()));
create policy learner_manage_shares on share_grants
  for all using (learner_id = my_learner_id());
create policy learner_own_marks on marks
  for select using (learner_id = my_learner_id());

-- Teachers: ONLY teacher-kind reports the learner has shared, for learners in their classes
create policy teacher_shared_summaries on reports
  for select using (
    my_role() = 'teacher'
    and kind = 'teacher' and status = 'released'
    and exists (
      select 1 from share_grants g
      join sessions s on s.id = reports.session_id
      join teacher_classes tc on tc.learner_id = s.learner_id and tc.teacher_profile_id = auth.uid()
      where g.report_id = reports.id and g.audience = 'teacher' and g.revoked_at is null)
  );

-- School admins: settings for their school; NO direct access to reports, messages or scores.
-- Cohort statistics are served by a server-side function that enforces the minimum group size of 10.
create policy admin_school_settings on school_settings
  for all using (my_role() = 'school_admin' and school_id = my_school());

-- Safeguarding contacts: events for their school only (content limited to trigger message)
create policy safeguarding_events_school on safeguarding_events
  for select using (
    my_role() = 'safeguarding_contact'
    and learner_id in (select id from learners where school_id = my_school()));

-- Reference data is readable by any authenticated user
create policy institution_rules_read on institution_rules
  for select using (auth.role() = 'authenticated');

-- Excavation staff and server-side jobs use the service role key (bypasses RLS).
-- Never expose the service role key to the browser.
-- Every staff read of identifiable learner data must write to audit_log (enforce in the API layer).

-- ---------- INDEXES ----------
create index on sessions (learner_id);
create index on item_responses (session_id);
create index on marks (learner_id, grade);
create index on conversation_messages (session_id, created_at);
create index on reports (session_id);
create index on safeguarding_events (learner_id, created_at);
create index on learners (school_id, current_grade);
