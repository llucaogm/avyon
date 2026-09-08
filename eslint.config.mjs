// Fast lint tier. Everything here runs without type information, which is
// what keeps it quick enough for a pre-commit hook. The rules that need the
// type checker live in eslint.typed.config.mjs and run on their own script.
//
// Runs alongside the existing `npm run lint` (oxlint) — this config only
// owns the three quality/* gates plus a small set of vanilla ESLint rules
// oxlint doesn't cover; it does not replace the oxlint script.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
      // js.configs.recommended turns on no-undef, which knows nothing about
      // the runtime this project targets -- without this, every console or
      // process reference is reported as an undefined variable. Declare what
      // the code actually uses (browser + Vite/PWA runtime).
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        RequestInit: "readonly",
        AbortController: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strict,

  // No import-x boundary block: this project's only real architecture
  // boundary (presentation must not import the Supabase client directly) is
  // already enforced below by quality/no-direct-data-access. There is no
  // second boundary (no separate schema/adapters split) that would justify
  // the two extra dependencies import-x needs.

  {
    // Registered so the project's existing
    // `// eslint-disable-next-line react-hooks/exhaustive-deps` comments
    // (written for oxlint, which enforces this rule natively) resolve to a
    // known rule id instead of erroring as undefined. The rule itself is not
    // enabled here — oxlint (npm run lint) already polices it; turning it on
    // in both linters would just police the same thing twice.
    plugins: { "react-hooks": reactHooks },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: { quality },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 18 pre-existing uses across the codebase (measured on install) --
      // born as "warn" per the toolkit's own rule: a gate that's red on
      // day one over code nobody asked to change is noise, not a gate.
      // Promote to "error" once that count reaches zero.
      "@typescript-eslint/no-non-null-assertion": "warn",
      // The size and complexity budget is all "warn" on purpose. These
      // numbers are a conversation starter about factoring, not a gate --
      // promote one to "error" once the count for it reaches zero.
      complexity: ["warn", 12],
      "max-depth": ["warn", 4],
      "max-statements": ["warn", 20],
      "max-params": ["warn", 4],
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["warn", 3],
      // 3 pre-existing offenders (measured on install) -- kept at "error" for
      // any new file, with the known debt listed explicitly instead of
      // dropping the whole rule to "warn". database.types.ts is generated
      // (supabase generate_typescript_types) and never hand-edited, so its
      // size isn't a signal at all; the other two are real files to split
      // one day (see docs/prompts/09-file-size-refactor.md upstream).
      "quality/max-lines": [
        "error",
        {
          max: 350,
          ignore: [
            "src/shared/types/database.types.ts",
            "src/modules/financeiro/components/transactions/QuickAddSheet.tsx",
            "src/modules/producao/pages/ReferenciasPage.tsx",
          ],
        },
      ],
      "quality/no-direct-console": [
        "error",
        { logger: "the logger from '@/shared/lib/logger' (or useLogger() in components)" },
      ],
      // 3 pre-existing violations (measured on install): LoginPage.tsx,
      // HubShell.tsx, AuthProvider.tsx -- all three are supabase.auth.*
      // calls (sign in/out, session listener), not data queries. Started at
      // "warn" with the baseline noted rather than "error", since the rule
      // can't currently tell an auth call from a table query and these three
      // are arguably legitimate as-is. Promote to "error" once resolved one
      // way or the other (wrap them in a hook, or decide auth calls are
      // exempt and narrow `layers`/`extensions` instead).
      "quality/no-direct-data-access": [
        "warn",
        {
          modules: ["@/shared/lib/supabaseClient"],
          bindings: ["supabase"],
          layers: ["/pages/", "/components/"],
          extensions: [".tsx"],
        },
      ],
    },
  },
  {
    // The log adapter itself -- the file that IS the console wrapper. This
    // block MUST come after the block that turns the rule on: for a file
    // matched by both, flat config applies the later block's rules last, so
    // an "off" placed earlier would be silently overridden by the "error"
    // that follows it.
    files: ["src/shared/lib/logger.ts"],
    rules: {
      "quality/no-direct-console": "off",
    },
  },
  {
    // The same file budget for test files, at "warn". Also placed after the
    // "error" block for the same ordering reason. No test runner is set up
    // in this project yet -- this block is inert today, kept so the budget
    // applies automatically the day one is added.
    files: [
      "**/*.test.{ts,tsx}",
      "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}",
    ],
    plugins: { quality },
    rules: {
      "quality/max-lines": ["warn", { includeTests: true }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
    },
  },
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".claude/**",
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "**/*.tsbuildinfo",
    "package-lock.json",
    // Deno runtime (Edge Functions) -- a different codebase/runtime than the
    // Vite/React app this config polices. npm: specifiers and Deno globals
    // would drown real findings in no-undef/no-unresolved noise.
    "supabase/functions/**",
    // Node-runtime build tooling (require/__dirname/process), not the
    // browser application this config polices.
    "scripts/**",
  ]),
]);
