import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "storybook-static/**",
      ".storybook-static/**",
      "node_modules/**",
      "coverage/**",
      "scripts/run-e2e-review.ts",
      "scripts/run-login-e2e-review.ts",
      "tests/**",
      "public/mockServiceWorker.js",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default config;
