import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const serverOnlyModules = [
  "@/lib/env.server",
  "@/lib/db/admin",
  "@/lib/ai/*",
  "@/lib/safeguarding/notify",
  "@/lib/pipeline/*",
];

const config = [
  { ignores: [".next/**", "node_modules/**", "spec/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next 16 enables React Compiler-era rules. Three existing patterns trip them (a theme read on
    // mount, and small row components defined inside SchoolAdmin and ShareToggles). They work today; kept as warnings
    // until they are refactored, rather than rewriting working UI inside a dependency bump.
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/static-components": "warn" },
  },
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
