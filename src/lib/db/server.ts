import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { serverEnv } from "@/lib/env.server";

/** User-scoped client: every query runs under the caller's JWT, so RLS applies. */
export async function userDb() {
  const env = serverEnv();
  const store = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, { ...options, httpOnly: true, sameSite: "lax" });
        } catch {
          // Called from a Server Component: cookies are read-only there. Middleware refreshes them.
        }
      },
    },
  });
}
