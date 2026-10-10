import "server-only";
import { z } from "zod";

/**
 * Server-only environment. Importing this module from a Client Component fails the build
 * (`server-only`), fails lint (eslint.config.mjs), and throws at runtime in a browser.
 * The service-role key and the Anthropic key must never reach the browser (spec 10).
 */
if (typeof window !== "undefined") {
  throw new Error("env.server was loaded in the browser. Secrets must stay on the server.");
}

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  ANTHROPIC_API_KEY: z.string().min(10).optional(),
  AI_MODEL_FAST: z.string().default("claude-haiku-5-5"),
  AI_MODEL_STRONG: z.string().default("claude-opus-5-5"),
  REVIEW_FIRST_N_REPORTS: z.coerce.number().int().min(0).default(200),
  RESEND_API_KEY: z.string().optional(),
  SAFEGUARDING_FROM_EMAIL: z.string().default("safeguarding@theexcavation.co.za"),
  SMS_PROVIDER_URL: z.string().optional(),
  SMS_PROVIDER_TOKEN: z.string().optional(),
  EXCAVATION_SAFEGUARDING_LEAD_EMAIL: z.string().optional(),
  EXCAVATION_SAFEGUARDING_LEAD_PHONE: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${missing}. See .env.example.`);
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("NEXT_PUBLIC_") && v && (v === parsed.data.SUPABASE_SERVICE_ROLE_KEY || v === parsed.data.ANTHROPIC_API_KEY)) {
      throw new Error(`${k} contains a server secret. Public env vars are shipped to the browser.`);
    }
  }
  cached = parsed.data;
  return cached;
}

export function requireAnthropicKey(): string {
  const key = serverEnv().ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}
