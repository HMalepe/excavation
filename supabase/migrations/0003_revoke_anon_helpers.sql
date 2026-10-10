-- 0003: Supabase security advisor (lint 0028). The RLS helper functions are SECURITY DEFINER and
-- were callable by anonymous visitors via /rest/v1/rpc. They only ever describe the caller, but
-- anonymous users have no reason to call them. Signed-in users keep EXECUTE: RLS policies run
-- these functions as the querying user.
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.my_school() from public, anon;
revoke execute on function public.my_learner_id() from public, anon;
revoke execute on function public.teacher_can_read_report(uuid) from public, anon;
revoke execute on function public.learner_in_my_school(uuid) from public, anon;
revoke execute on function public.teacher_has_learner(uuid) from public, anon;
grant execute on function public.my_role() to authenticated, service_role;
grant execute on function public.my_school() to authenticated, service_role;
grant execute on function public.my_learner_id() to authenticated, service_role;
grant execute on function public.teacher_can_read_report(uuid) to authenticated, service_role;
grant execute on function public.learner_in_my_school(uuid) to authenticated, service_role;
grant execute on function public.teacher_has_learner(uuid) to authenticated, service_role;
