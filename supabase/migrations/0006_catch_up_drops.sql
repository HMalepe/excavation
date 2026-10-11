-- Catch-up for the live project: statements from 0004 that the Supabase MCP could not apply because it holds
-- every DROP for human confirmation, plus one duplicate index. Safe to run anywhere: every statement is idempotent.
-- Apply by pasting into the Supabase SQL editor (production), then re-run the advisors.

-- Dead policies superseded by the per-role ones (advisor: multiple_permissive_policies).
drop policy if exists learner_own_responses on public.item_responses;
drop policy if exists learner_own_sessions on public.sessions;
drop policy if exists learner_manage_shares on public.share_grants;

-- Identical to conversation_messages_session_id_created_at_idx (advisor: duplicate_index).
drop index if exists public.conversation_messages_session_idx;
