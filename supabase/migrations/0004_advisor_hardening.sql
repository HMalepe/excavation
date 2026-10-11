-- 0004: fixes from the live Supabase advisors (security + performance), 2026-10-11.

-- 1. The RLS helper functions are SECURITY DEFINER and were reachable by any signed-in user through
--    /rest/v1/rpc (lint 0029). They only describe the caller, but there is no reason to expose them.
--    Move them to a schema the API does not publish. Policies reference functions by OID, so every
--    existing policy keeps working; the roles that run queries keep EXECUTE and USAGE.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.my_role() set schema private;
alter function public.my_school() set schema private;
alter function public.my_learner_id() set schema private;
alter function public.teacher_can_read_report(uuid) set schema private;
alter function public.learner_in_my_school(uuid) set schema private;
alter function public.teacher_has_learner(uuid) set schema private;
-- Some helpers call each other by bare name, so their pinned search_path must now include the new schema.
alter function private.my_role() set search_path = public, private;
alter function private.my_school() set search_path = public, private;
alter function private.my_learner_id() set search_path = public, private;
alter function private.teacher_can_read_report(uuid) set search_path = public, private;
alter function private.learner_in_my_school(uuid) set search_path = public, private;
alter function private.teacher_has_learner(uuid) set search_path = public, private;

-- 2. Dead policies. 0002 neutralised these three "learner can write everything" policies by setting
--    them to false; with RLS on and no policy, the default is deny, so they can simply go. This also
--    removes the "multiple permissive policies" warnings on those tables.
drop policy if exists learner_own_responses on public.item_responses;
drop policy if exists learner_own_sessions on public.sessions;
drop policy if exists learner_manage_shares on public.share_grants;

-- 3. auth.uid() / auth.role() inside a policy is re-evaluated per row unless wrapped in a select (lint 0003).
alter policy institution_rules_read on public.institution_rules using ((select auth.role()) = 'authenticated');
alter policy profile_read_self on public.profiles using (id = (select auth.uid()));
alter policy learner_read_self on public.learners using (profile_id = (select auth.uid()));
alter policy teacher_read_class on public.teacher_classes using (teacher_profile_id = (select auth.uid()));

-- 4. Indexes for foreign keys the app joins or deletes through (lint 0001). Learner and session deletes
--    cascade through these tables, so POPIA erasure needs them.
create index if not exists audit_log_actor_idx on public.audit_log (actor);
create index if not exists guardian_consents_learner_idx on public.guardian_consents (learner_id);
create index if not exists learner_assents_learner_idx on public.learner_assents (learner_id);
create index if not exists profiles_school_idx on public.profiles (school_id);
create index if not exists reports_reviewed_by_idx on public.reports (reviewed_by);
create index if not exists safeguarding_events_reviewed_by_idx on public.safeguarding_events (reviewed_by);
create index if not exists safeguarding_events_session_idx on public.safeguarding_events (session_id);
create index if not exists safeguarding_events_trigger_msg_idx on public.safeguarding_events (trigger_message_id);
create index if not exists share_grants_learner_idx on public.share_grants (learner_id);
create index if not exists share_grants_report_idx on public.share_grants (report_id);
create index if not exists teacher_classes_learner_idx on public.teacher_classes (learner_id);
create index if not exists conversation_messages_session_idx on public.conversation_messages (session_id, created_at);
create index if not exists audit_log_action_at_idx on public.audit_log (action, at);

-- 5. Tables that are deliberately service-role only. RLS is on and there is no policy, which means
--    "deny everyone except the server". Say so in the catalogue so the advisor note is understood.
comment on table public.audit_log is 'Service role only (RLS on, no policies by design).';
comment on table public.guardian_consents is 'Service role only (RLS on, no policies by design).';
comment on table public.learner_assents is 'Service role only (RLS on, no policies by design).';
comment on table public.login_attempts is 'Service role only (RLS on, no policies by design).';
comment on table public.norms is 'Service role only (RLS on, no policies by design).';
comment on table public.signals is 'Service role only (RLS on, no policies by design).';
