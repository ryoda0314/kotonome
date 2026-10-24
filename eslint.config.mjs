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
    // Generation scratch.
    "scripts/work/**",
    // The films: their own Remotion projects (film/package.json: 爆速ハングル; promo/package.json: the app's promo).
    "film/**",
    "promo/**",
  ]),
]);

export default eslintConfig;
