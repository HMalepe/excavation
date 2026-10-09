import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env.server";

let admin: SupabaseClient | null = null;

/**
 * Service-role client: bypasses RLS. Use ONLY in server code after the caller's identity and
 * permissions have been checked (see lib/auth/guards.ts). Every staff read of identifiable
 * learner data must also write to audit_log (spec schema comment).
 */
export function adminDb(): SupabaseClient {
  if (admin) return admin;
  const env = serverEnv();
  admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
