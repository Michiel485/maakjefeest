import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Werkmappen van hulpagenten: dat zijn hele kopieen van de repo, inclusief
    // gebouwde bestanden. Zonder deze regel lintte "npm run lint" er 232 van
    // mee en verdronken de echte meldingen in duizenden uit geminificeerde
    // code. Zie ook .gitignore.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
