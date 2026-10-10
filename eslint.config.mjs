import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const serverOnlyModules = [
  "@/lib/env.server",
  "@/lib/db/admin",
  "@/lib/ai/*",
  "@/lib/safeguarding/notify",
  "@/lib/pipeline/*",
];

const config = [
  { ignores: [".next/**", "node_modules/**", "spec/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Client components must never import modules that hold the service-role key or the
    // Anthropic key. `server-only` already fails the build; this rule fails lint earlier.
    files: ["src/components/client/**/*.{ts,tsx}", "src/**/*.client.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: serverOnlyModules.map((group) => ({ group: [group], message: "Server-only module imported from client code." })) },
      ],
      "no-restricted-properties": [
        "error",
        { object: "process", property: "env", message: "Read configuration through props, not process.env, in client code." },
      ],
    },
  },
];

export default config;
