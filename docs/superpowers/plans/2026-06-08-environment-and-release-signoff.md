# Environment And Release Signoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split production runtime environment validation from release signoff evidence so `.env.production` is runtime-only and `.env.release-signoff` owns proof/accountability before public production opens.

**Architecture:** Keep `check-production-env.ts` focused on runtime production values and move release proof checks into a new `check-release-signoff.ts`. Keep `check-staging-signoff.ts` as a temporary compatibility alias, and support old `SAGITTARIUS_STAGING_*` variables as deprecated aliases inside the release signoff script. Makefile targets load production runtime and signoff files separately.

**Tech Stack:** Bun, TypeScript release gate scripts, Vitest unit/contract tests, Makefile, Docker Compose env files, Markdown runbooks.

---

## File Structure

- Modify: `frontend/scripts/check-production-env.ts`
  - Runtime production validation only: DB, public/internal API URLs, origins, email delivery, `RUST_LOG`, production mode, seed disabled.
- Create: `frontend/scripts/check-release-signoff.ts`
  - Release evidence validation: browser/preflight/migration/rollback/alert/no-P1-P2 flags, evidence URLs, owners, alert sink/runbook.
  - Prefer `SAGITTARIUS_SIGNOFF_*`; fall back to deprecated `SAGITTARIUS_STAGING_*`.
- Modify: `frontend/scripts/check-staging-signoff.ts`
  - Compatibility alias that executes `check-release-signoff.ts`.
- Modify: `frontend/package.json`
  - Add `test:release-signoff`; keep `test:staging-signoff`.
- Modify: `frontend/src/release-gates.test.ts`
  - Separate production runtime fixtures from release signoff fixtures.
- Modify: `frontend/scripts/check-production-env.test.ts`
  - Remove signoff variables from the valid production runtime fixture.
- Modify: `frontend/src/project-contract.test.ts`
  - Update project contract assertions for the split scripts and Makefile targets.
- Modify: `Makefile`
  - Add `SIGNOFF_ENV_FILE`, `SIGNOFF_ENV_SOURCE`, `release-signoff-check`, and `production-deploy-gate`.
  - Keep `staging-signoff-check` as a compatibility wrapper.
- Modify: `.gitignore`
  - Ignore `.env.local` and `.env.release-signoff`.
- Create: `.env.local.example`
  - Document local/dev values matching Makefile defaults.
- Modify: `.env.production.example`
  - Remove release signoff values so it is runtime-only.
- Create: `.env.release-signoff.example`
  - Document release signoff values with `SAGITTARIUS_SIGNOFF_*`.
- Modify: `.github/workflows/production-readiness.yml`
  - Use new `SAGITTARIUS_SIGNOFF_*` names and run `test:release-signoff`.
- Modify docs:
  - `docs/production-freeze-checklist.md`
  - `docs/test-staging-verification-runbook.md`
  - `docs/production-docker-cloudflare.md`

## Task 1: Write Failing Release Gate Tests

**Files:**
- Modify: `frontend/src/release-gates.test.ts`
- Modify: `frontend/scripts/check-production-env.test.ts`
- Modify: `frontend/src/project-contract.test.ts`

- [ ] **Step 1: Split release gate fixtures in `frontend/src/release-gates.test.ts`**

Replace the single `validProductionEnv` fixture with two fixtures:

```ts
const validProductionRuntimeEnv = {
  DATABASE_URL:
    "postgres://sagittarius:secret-prod-password@postgres.13thx.com:5432/sagittarius",
  EMAIL_DELIVERY: "smtp",
  EMAIL_FROM: "Sagittarius <no-reply@13thx.com>",
  NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://joii.13thx.com",
  PASSKEY_ALLOWED_ORIGINS:
    "https://joii.13thx.com,https://sagittarius.13thx.com",
  RUST_LOG: "info,tower_http=info,sagittarius_api=info",
  SAGITTARIUS_ALLOWED_ORIGINS:
    "https://joii.13thx.com,https://sagittarius.13thx.com",
  SAGITTARIUS_ENV: "production",
  SAGITTARIUS_INTERNAL_API_BASE_URL: "http://sagittarius-api:5181",
  SAGITTARIUS_SEED_SAMPLE_DATA: "0",
  SMTP_HOST: "smtp.13thx.com",
  SMTP_PASSWORD: "secret-smtp-password",
  SMTP_PORT: "587",
  SMTP_USERNAME: "sagittarius-smtp",
};

const validReleaseSignoffEnv = {
  SAGITTARIUS_ALERT_RUNBOOK_URL:
    "https://runbooks.13thx.com/sagittarius/write-route-alerts",
  SAGITTARIUS_ALERT_SINK_NAME: "sagittarius-write-route-alerts",
  SAGITTARIUS_FEATURE_OWNER: "Aom Owner",
  SAGITTARIUS_ROLLBACK_OWNER: "Beam Owner",
  SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL:
    "https://alerts.13thx.com/incidents/sagittarius-write-routes",
  SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED: "1",
  SAGITTARIUS_SIGNOFF_API_BASE_URL: "https://joii.13thx.com",
  SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/browser",
  SAGITTARIUS_SIGNOFF_BROWSER_PASSED: "1",
  SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED: "1",
  SAGITTARIUS_SIGNOFF_ENVIRONMENT: "production-preflight",
  SAGITTARIUS_SIGNOFF_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123",
  SAGITTARIUS_SIGNOFF_FRONTEND_URL: "https://joii.13thx.com",
  SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL:
    "https://issues.13thx.com/sagittarius?severity=P1,P2",
  SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/migration",
  SAGITTARIUS_SIGNOFF_NO_P1_P2: "1",
  SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED: "1",
  SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/rollback",
  SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED: "1",
};
```

- [ ] **Step 2: Update production runtime tests in `frontend/src/release-gates.test.ts`**

Replace production env tests so they use `validProductionRuntimeEnv` and no longer depend on signoff variables:

```ts
it("accepts the approved joii same-origin production runtime env", () => {
  const result = runGate(
    "scripts/check-production-env.ts",
    validProductionRuntimeEnv,
  );

  expect(result.status).toBe(0);
  expect(outputOf(result)).toContain("production env check ok");
});

it("accepts the approved sagittarius same-origin production runtime env", () => {
  const result = runGate("scripts/check-production-env.ts", {
    ...validProductionRuntimeEnv,
    NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://sagittarius.13thx.com",
    SAGITTARIUS_ALLOWED_ORIGINS: "https://sagittarius.13thx.com",
  });

  expect(result.status).toBe(0);
  expect(outputOf(result)).toContain("production env check ok");
});
```

- [ ] **Step 3: Add release signoff success and alias tests**

Add these tests to `frontend/src/release-gates.test.ts`:

```ts
it("accepts release signoff evidence with the new neutral variable names", () => {
  const result = runGate(
    "scripts/check-release-signoff.ts",
    validReleaseSignoffEnv,
  );

  expect(result.status).toBe(0);
  expect(outputOf(result)).toContain("release signoff ok");
});

it("keeps staging signoff as a compatibility alias", () => {
  const result = runGate(
    "scripts/check-staging-signoff.ts",
    toLegacyStagingSignoffEnv(validReleaseSignoffEnv),
  );

  expect(result.status).toBe(0);
  expect(outputOf(result)).toContain("release signoff ok");
});

it("prefers new signoff variables over deprecated staging aliases", () => {
  const result = runGate("scripts/check-release-signoff.ts", {
    ...toLegacyStagingSignoffEnv(validReleaseSignoffEnv),
    ...validReleaseSignoffEnv,
    SAGITTARIUS_STAGING_EVIDENCE_URL: "https://ci.example.test/runs/bad",
  });

  expect(result.status).toBe(0);
  expect(outputOf(result)).toContain("release signoff ok");
});
```

Add this helper below `outputOf`:

```ts
function toLegacyStagingSignoffEnv(env: Record<string, string>) {
  return {
    SAGITTARIUS_ALERT_RUNBOOK_URL: env.SAGITTARIUS_ALERT_RUNBOOK_URL,
    SAGITTARIUS_ALERT_SINK_NAME: env.SAGITTARIUS_ALERT_SINK_NAME,
    SAGITTARIUS_FEATURE_OWNER: env.SAGITTARIUS_FEATURE_OWNER,
    SAGITTARIUS_ROLLBACK_OWNER: env.SAGITTARIUS_ROLLBACK_OWNER,
    SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL,
    SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED:
      env.SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED,
    SAGITTARIUS_STAGING_API_BASE_URL:
      env.SAGITTARIUS_SIGNOFF_API_BASE_URL,
    SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL,
    SAGITTARIUS_STAGING_BROWSER_SIGNOFF:
      env.SAGITTARIUS_SIGNOFF_BROWSER_PASSED,
    SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED:
      env.SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED,
    SAGITTARIUS_STAGING_ENVIRONMENT:
      env.SAGITTARIUS_SIGNOFF_ENVIRONMENT,
    SAGITTARIUS_STAGING_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_EVIDENCE_URL,
    SAGITTARIUS_STAGING_FRONTEND_URL:
      env.SAGITTARIUS_SIGNOFF_FRONTEND_URL,
    SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL,
    SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL,
    SAGITTARIUS_STAGING_NO_P1_P2: env.SAGITTARIUS_SIGNOFF_NO_P1_P2,
    SAGITTARIUS_STAGING_PREFLIGHT_PASSED:
      env.SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED,
    SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL,
    SAGITTARIUS_STAGING_ROLLBACK_VERIFIED:
      env.SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED,
  };
}
```

- [ ] **Step 4: Move placeholder signoff tests to the release signoff script**

Update the placeholder signoff test to call `scripts/check-release-signoff.ts` and use `SAGITTARIUS_SIGNOFF_*` names:

```ts
it("rejects placeholder release signoff evidence URLs", () => {
  const result = runGate("scripts/check-release-signoff.ts", {
    ...validReleaseSignoffEnv,
    SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL:
      "https://alerts.example.test/incidents/sagittarius-write-routes",
    SAGITTARIUS_SIGNOFF_API_BASE_URL: "https://api.staging.example.test",
    SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL:
      "https://ci.example.test/runs/123/browser",
    SAGITTARIUS_SIGNOFF_EVIDENCE_URL: "https://ci.example.test/runs/123",
    SAGITTARIUS_SIGNOFF_FRONTEND_URL: "https://staging.example.test",
    SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL:
      "https://issues.example.test/sagittarius?severity=P1,P2",
    SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL:
      "https://ci.example.test/runs/123/migration",
    SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL:
      "https://ci.example.test/runs/123/rollback",
  });

  expect(result.status).not.toBe(0);
  expect(outputOf(result)).toContain("must not use placeholder domain");
});
```

- [ ] **Step 5: Update `frontend/scripts/check-production-env.test.ts` fixture**

Remove all `SAGITTARIUS_STAGING_*`, `SAGITTARIUS_ALERT_*`, owner, and rollback owner values from `validProductionEnv`. The fixture should be:

```ts
function validProductionEnv(overrides: Record<string, string> = {}) {
  return {
    DATABASE_URL:
      "postgres://prod_user:prod_pass@db.prod-sagittarius.internal/sagittarius_prod",
    NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL:
      "https://api.prod-sagittarius.internal",
    SAGITTARIUS_ALLOWED_ORIGINS: "https://app.prod-sagittarius.internal",
    PASSKEY_ALLOWED_ORIGINS: "https://app.prod-sagittarius.internal",
    EMAIL_DELIVERY: "smtp",
    SMTP_HOST: "smtp.prod-sagittarius.internal",
    SMTP_USERNAME: "mailer",
    SMTP_PASSWORD: "secret-prod-password",
    EMAIL_FROM: "noreply@prod-sagittarius.internal",
    RUST_LOG: "sagittarius_api=info,tower_http=info",
    SAGITTARIUS_ENV: "production",
    SAGITTARIUS_INTERNAL_API_BASE_URL: "http://sagittarius-api:5181",
    ...overrides,
  };
}
```

- [ ] **Step 6: Update project contract expectations**

In `frontend/src/project-contract.test.ts`, update script assertions:

```ts
expect(packageJson.scripts?.["test:production-env"]).toBe(
  "bun run scripts/check-production-env.ts",
);
expect(packageJson.scripts?.["test:release-signoff"]).toBe(
  "bun run scripts/check-release-signoff.ts",
);
expect(packageJson.scripts?.["test:staging-signoff"]).toBe(
  "bun run scripts/check-staging-signoff.ts",
);
expect(existsSync(join(frontendRoot, "scripts/check-release-signoff.ts"))).toBe(
  true,
);
```

Replace staging signoff source assertions with release signoff assertions:

```ts
const releaseSignoff = readFileSync(
  join(frontendRoot, "scripts/check-release-signoff.ts"),
  "utf8",
);
expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL");
expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
expect(releaseSignoff).toContain("must not point at localhost");
expect(releaseSignoff).toContain("must not use placeholder domain");
expect(releaseSignoff).toContain("must be a real owner, not TBD");
```

Replace production env check signoff assertions:

```ts
expect(productionEnvCheck).toContain("EMAIL_DELIVERY");
expect(productionEnvCheck).toContain("PASSKEY_ALLOWED_ORIGINS");
expect(productionEnvCheck).toContain("SMTP_PASSWORD");
expect(productionEnvCheck).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL");
expect(productionEnvCheck).not.toContain("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
expect(productionEnvCheck).not.toContain("SAGITTARIUS_ALERT_SINK_NAME");
expect(productionEnvCheck).not.toContain("SAGITTARIUS_FEATURE_OWNER");
expect(productionEnvCheck).toContain("must not use placeholder domain");
```

- [ ] **Step 7: Run tests to verify failures before implementation**

Run:

```bash
cd frontend && rtk bun run test src/release-gates.test.ts scripts/check-production-env.test.ts src/project-contract.test.ts
```

Expected: FAIL because `scripts/check-release-signoff.ts` and `test:release-signoff` do not exist, `check-production-env.ts` still requires signoff values, and project contract still reflects old wiring.

## Task 2: Make Production Env Runtime-Only

**Files:**
- Modify: `frontend/scripts/check-production-env.ts`
- Test: `frontend/scripts/check-production-env.test.ts`
- Test: `frontend/src/release-gates.test.ts`

- [ ] **Step 1: Remove signoff requirements from `check-production-env.ts`**

In `checkProductionEnv`, remove these required env reads:

```ts
const evidenceUrl = requiredEnv("SAGITTARIUS_STAGING_EVIDENCE_URL");
const browserEvidenceUrl = requiredEnv(
  "SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL",
);
const migrationEvidenceUrl = requiredEnv(
  "SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL",
);
const rollbackEvidenceUrl = requiredEnv(
  "SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL",
);
const issueEvidenceUrl = requiredEnv(
  "SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL",
);
const alertSinkName = requiredEnv("SAGITTARIUS_ALERT_SINK_NAME");
const alertRunbookUrl = requiredEnv("SAGITTARIUS_ALERT_RUNBOOK_URL");
const featureOwner = requiredEnv("SAGITTARIUS_FEATURE_OWNER");
const rollbackOwner = requiredEnv("SAGITTARIUS_ROLLBACK_OWNER");
```

Also remove the matching `checkEvidence`, `checkAlertSink`, `checkOwner`, and staging boolean loop from `checkProductionEnv`.

- [ ] **Step 2: Delete unused helper functions from `check-production-env.ts`**

After removing signoff validation, delete these helpers if no longer referenced in the file:

```ts
function checkEvidence(name: string, value: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol))
      failures.push(`${name} must be an http(s) URL`);
    checkNoPlaceholderUrl(name, url);
  } catch {
    failures.push(`${name} must be a valid evidence URL`);
  }
}

function checkAlertSink(value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(
      "SAGITTARIUS_ALERT_SINK_NAME must name a real alert sink, not TBD",
    );
  }
}

function checkOwner(name: string, value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(`${name} must be a real owner, not TBD`);
  }
}
```

- [ ] **Step 3: Run focused production env tests**

Run:

```bash
cd frontend && rtk bun run test scripts/check-production-env.test.ts src/release-gates.test.ts -t "production env|production runtime"
```

Expected: PASS for runtime-only production env tests.

- [ ] **Step 4: Commit runtime-only production env change**

```bash
rtk git add frontend/scripts/check-production-env.ts frontend/scripts/check-production-env.test.ts frontend/src/release-gates.test.ts
rtk git commit -m "test: split production runtime env gate"
```

## Task 3: Add Release Signoff Checker With Deprecated Staging Aliases

**Files:**
- Create: `frontend/scripts/check-release-signoff.ts`
- Modify: `frontend/scripts/check-staging-signoff.ts`
- Modify: `frontend/package.json`
- Test: `frontend/src/release-gates.test.ts`
- Test: `frontend/src/project-contract.test.ts`

- [ ] **Step 1: Create `frontend/scripts/check-release-signoff.ts`**

Create the file with this structure:

```ts
type Env = Record<string, string | undefined>;

type RequiredCheck = {
  aliases?: string[];
  label: string;
  name: string;
};

const requiredBooleanChecks: RequiredCheck[] = [
  {
    aliases: ["SAGITTARIUS_STAGING_PREFLIGHT_PASSED"],
    label: "preflight passed",
    name: "SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_BROWSER_SIGNOFF"],
    label: "browser journeys passed",
    name: "SAGITTARIUS_SIGNOFF_BROWSER_PASSED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED"],
    label: "DB migration verified",
    name: "SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ROLLBACK_VERIFIED"],
    label: "rollback verified",
    name: "SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED"],
    label: "write-operation alerts routed",
    name: "SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_NO_P1_P2"],
    label: "no known P1/P2 regressions",
    name: "SAGITTARIUS_SIGNOFF_NO_P1_P2",
  },
];

const requiredTextChecks: RequiredCheck[] = [
  {
    aliases: ["SAGITTARIUS_STAGING_ENVIRONMENT"],
    label: "signoff environment name",
    name: "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_API_BASE_URL"],
    label: "signoff API base URL",
    name: "SAGITTARIUS_SIGNOFF_API_BASE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_FRONTEND_URL"],
    label: "signoff frontend URL",
    name: "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_EVIDENCE_URL"],
    label: "evidence or run URL",
    name: "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL"],
    label: "browser journey evidence URL",
    name: "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL"],
    label: "migration evidence URL",
    name: "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL"],
    label: "rollback evidence URL",
    name: "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL"],
    label: "alert routing evidence URL",
    name: "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
  },
  {
    aliases: ["SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL"],
    label: "no P1/P2 issue evidence URL",
    name: "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
  },
  { label: "alert sink name", name: "SAGITTARIUS_ALERT_SINK_NAME" },
  { label: "alert runbook URL", name: "SAGITTARIUS_ALERT_RUNBOOK_URL" },
  { label: "feature owner", name: "SAGITTARIUS_FEATURE_OWNER" },
  { label: "rollback owner", name: "SAGITTARIUS_ROLLBACK_OWNER" },
];

const failures: string[] = [];
const env: Env = process.env;

for (const check of requiredBooleanChecks) {
  const value = envValue(check);
  if (value !== "1") failures.push(`${check.name}=1 is required (${check.label})`);
}

for (const check of requiredTextChecks) {
  if (!envValue(check)) failures.push(`${check.name} is required (${check.label})`);
}

checkEnvironment(envValue({ name: "SAGITTARIUS_SIGNOFF_ENVIRONMENT", aliases: ["SAGITTARIUS_STAGING_ENVIRONMENT"], label: "signoff environment name" }));
checkPublicHttpsUrl("SAGITTARIUS_SIGNOFF_API_BASE_URL", envValue({ name: "SAGITTARIUS_SIGNOFF_API_BASE_URL", aliases: ["SAGITTARIUS_STAGING_API_BASE_URL"], label: "signoff API base URL" }));
checkPublicHttpsUrl("SAGITTARIUS_SIGNOFF_FRONTEND_URL", envValue({ name: "SAGITTARIUS_SIGNOFF_FRONTEND_URL", aliases: ["SAGITTARIUS_STAGING_FRONTEND_URL"], label: "signoff frontend URL" }));

for (const name of [
  "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
  "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
  "SAGITTARIUS_ALERT_RUNBOOK_URL",
] as const) {
  const check = requiredTextChecks.find((candidate) => candidate.name === name);
  checkEvidenceUrl(name, check ? envValue(check) : "");
}

checkOwner("SAGITTARIUS_FEATURE_OWNER", envValue({ name: "SAGITTARIUS_FEATURE_OWNER", label: "feature owner" }));
checkOwner("SAGITTARIUS_ROLLBACK_OWNER", envValue({ name: "SAGITTARIUS_ROLLBACK_OWNER", label: "rollback owner" }));
checkAlertSink(envValue({ name: "SAGITTARIUS_ALERT_SINK_NAME", label: "alert sink name" }));

if (failures.length) {
  throw new Error(`Release signoff failed:\n- ${failures.join("\n- ")}`);
}

console.log(summary());

function envValue(check: RequiredCheck): string {
  const primary = env[check.name]?.trim();
  if (primary) return primary;
  for (const alias of check.aliases ?? []) {
    const value = env[alias]?.trim();
    if (value) return value;
  }
  return "";
}

function summary(): string {
  const value = (name: string) =>
    envValue(requiredTextChecks.find((check) => check.name === name) ?? {
      label: name,
      name,
    });

  return [
    "# Sagittarius Release Signoff Evidence",
    "",
    `- Environment: ${value("SAGITTARIUS_SIGNOFF_ENVIRONMENT")}`,
    `- Frontend: ${value("SAGITTARIUS_SIGNOFF_FRONTEND_URL")}`,
    `- API: ${value("SAGITTARIUS_SIGNOFF_API_BASE_URL")}`,
    `- Evidence: ${value("SAGITTARIUS_SIGNOFF_EVIDENCE_URL")}`,
    `- Browser evidence: ${value("SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL")}`,
    `- Migration evidence: ${value("SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL")}`,
    `- Rollback evidence: ${value("SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL")}`,
    `- Alert evidence: ${value("SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL")}`,
    `- Issue evidence: ${value("SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL")}`,
    `- Feature owner: ${value("SAGITTARIUS_FEATURE_OWNER")}`,
    `- Rollback owner: ${value("SAGITTARIUS_ROLLBACK_OWNER")}`,
    "",
    "## Passed Gates",
    "",
    ...requiredBooleanChecks.map((check) => `- ${check.label}`),
    "",
    "release signoff ok",
  ].join("\n");
}
```

- [ ] **Step 2: Add validation helpers to `check-release-signoff.ts`**

Append these helpers:

```ts
function checkEnvironment(value: string) {
  if (!value) return;
  const lower = value.toLowerCase();
  if (["prod", "production"].includes(lower)) {
    failures.push(
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT must name staging/test/preflight evidence, not production",
    );
  }
  if (!lower.includes("staging") && !lower.includes("test") && !lower.includes("preflight")) {
    failures.push(
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT must name a staging/test/preflight environment",
    );
  }
}

function checkPublicHttpsUrl(name: string, value: string) {
  if (!value) return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failures.push(`${name} must be a valid URL`);
    return;
  }
  if (url.protocol !== "https:") failures.push(`${name} must use https://`);
  if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    failures.push(`${name} must not point at localhost`);
  }
  checkNoPlaceholderUrl(name, url);
}

function checkEvidenceUrl(name: string, value: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      failures.push(`${name} must be an http(s) URL`);
    }
    checkNoPlaceholderUrl(name, url);
  } catch {
    failures.push(`${name} must be a valid evidence URL`);
  }
}

function checkAlertSink(value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(
      "SAGITTARIUS_ALERT_SINK_NAME must name a real alert sink, not TBD",
    );
  }
}

function checkOwner(name: string, value: string) {
  if (!value) return;
  if (value.length < 3 || /^tbd$/i.test(value)) {
    failures.push(`${name} must be a real owner, not TBD`);
  }
}

function checkNoPlaceholderUrl(name: string, url: URL) {
  if (isPlaceholderHostname(url.hostname)) {
    failures.push(`${name} must not use placeholder domain: ${url.hostname}`);
  }
}

function isPlaceholderHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ["example.com", "example.net", "example.org", "example.test"].some(
    (placeholder) =>
      normalized === placeholder || normalized.endsWith(`.${placeholder}`),
  );
}

export {};
```

- [ ] **Step 3: Replace `frontend/scripts/check-staging-signoff.ts` with alias**

Replace the full file with:

```ts
import "./check-release-signoff";

export {};
```

- [ ] **Step 4: Update `frontend/package.json` scripts**

Add `test:release-signoff` and keep old alias:

```json
"test:production-env": "bun run scripts/check-production-env.ts",
"test:release-signoff": "bun run scripts/check-release-signoff.ts",
"test:staging-signoff": "bun run scripts/check-staging-signoff.ts",
```

- [ ] **Step 5: Run focused signoff tests**

Run:

```bash
cd frontend && rtk bun run test src/release-gates.test.ts src/project-contract.test.ts -t "signoff|scripts"
```

Expected: PASS.

- [ ] **Step 6: Commit signoff checker**

```bash
rtk git add frontend/scripts/check-release-signoff.ts frontend/scripts/check-staging-signoff.ts frontend/package.json frontend/src/release-gates.test.ts frontend/src/project-contract.test.ts
rtk git commit -m "feat: split release signoff gate"
```

## Task 4: Split Example Env Files And Makefile Targets

**Files:**
- Create: `.env.local.example`
- Modify: `.env.production.example`
- Create: `.env.release-signoff.example`
- Modify: `.gitignore`
- Modify: `Makefile`
- Test: `frontend/src/project-contract.test.ts`

- [ ] **Step 1: Create `.env.local.example`**

Add:

```dotenv
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius
TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test
PGADMIN_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres
SAGITTARIUS_BIND_ADDR=127.0.0.1:5181
SAGITTARIUS_ENV=development
SAGITTARIUS_SEED_SAMPLE_DATA=1
NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=http://127.0.0.1:5181
RUST_LOG=info,tower_http=info,sagittarius_api=info
```

- [ ] **Step 2: Make `.env.production.example` runtime-only**

Remove:

```dotenv
SAGITTARIUS_ALERT_SINK_NAME=...
SAGITTARIUS_ALERT_RUNBOOK_URL=...
SAGITTARIUS_FEATURE_OWNER=...
SAGITTARIUS_ROLLBACK_OWNER=...
SAGITTARIUS_STAGING_...
```

Keep only runtime values:

```dotenv
DATABASE_URL=postgres://sagittarius:secret-production-postgres-password@zodiac-postgres:5432/sagittarius

SAGITTARIUS_ENV=production
SAGITTARIUS_SEED_SAMPLE_DATA=0
SAGITTARIUS_ALLOWED_ORIGINS=https://joii.13thx.com,https://sagittarius.13thx.com
PASSKEY_ALLOWED_ORIGINS=https://joii.13thx.com,https://sagittarius.13thx.com
NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=https://joii.13thx.com
SAGITTARIUS_INTERNAL_API_BASE_URL=http://sagittarius-api:5181

EMAIL_DELIVERY=smtp
SMTP_HOST=smtp.13thx.com
SMTP_PORT=587
SMTP_USERNAME=sagittarius-production-smtp
SMTP_PASSWORD=secret-production-smtp-password
EMAIL_FROM="Sagittarius <no-reply@13thx.com>"
SENDMAIL_COMMAND=

RUST_LOG=info,tower_http=info,sagittarius_api=info
```

- [ ] **Step 3: Create `.env.release-signoff.example`**

Add:

```dotenv
SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED=1
SAGITTARIUS_SIGNOFF_BROWSER_PASSED=1
SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED=1
SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED=1
SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED=1
SAGITTARIUS_SIGNOFF_NO_P1_P2=1
SAGITTARIUS_SIGNOFF_ENVIRONMENT=production-preflight
SAGITTARIUS_SIGNOFF_API_BASE_URL=https://joii.13thx.com
SAGITTARIUS_SIGNOFF_FRONTEND_URL=https://joii.13thx.com
SAGITTARIUS_SIGNOFF_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/production-preflight
SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/production-browser
SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/production-migration
SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL=https://ci.13thx.com/sagittarius/runs/production-rollback
SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL=https://alerts.13thx.com/incidents/sagittarius-write-routes
SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL=https://issues.13thx.com/sagittarius/production-p1-p2

SAGITTARIUS_ALERT_SINK_NAME=sagittarius-write-route-alerts
SAGITTARIUS_ALERT_RUNBOOK_URL=https://runbooks.13thx.com/sagittarius/write-route-alerts
SAGITTARIUS_FEATURE_OWNER="Production Owner"
SAGITTARIUS_ROLLBACK_OWNER="Rollback Owner"
```

- [ ] **Step 4: Update `.gitignore`**

Add:

```gitignore
.env.local
.env.release-signoff
```

- [ ] **Step 5: Update Makefile env variables and targets**

Add near existing production env variables:

```make
SIGNOFF_ENV_FILE ?= .env.release-signoff
SIGNOFF_ENV_SOURCE := $(if $(filter /%,$(SIGNOFF_ENV_FILE)),$(SIGNOFF_ENV_FILE),./$(SIGNOFF_ENV_FILE))
```

Update `.PHONY` to include:

```make
release-signoff-check production-deploy-gate
```

Replace signoff targets with:

```make
release-signoff-check:
	set -a; . "$(SIGNOFF_ENV_SOURCE)"; set +a; cd $(FRONTEND_DIR) && bun run test:release-signoff

staging-signoff-check: release-signoff-check

production-deploy-gate: production-env-file-check release-signoff-check
```

Keep these production container targets loading only `PRODUCTION_ENV_FILE`:

```make
container-production-migrate: production-env-file-check
container-production-check: production-env-file-check
```

- [ ] **Step 6: Run env file and Makefile checks**

Run:

```bash
rtk make production-env-file-check PRODUCTION_ENV_FILE=.env.production.example
rtk make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff.example
rtk make production-deploy-gate PRODUCTION_ENV_FILE=.env.production.example SIGNOFF_ENV_FILE=.env.release-signoff.example
```

Expected: all PASS.

- [ ] **Step 7: Commit env file split**

```bash
rtk git add .env.local.example .env.production.example .env.release-signoff.example .gitignore Makefile frontend/src/project-contract.test.ts
rtk git commit -m "chore: split runtime and signoff env files"
```

## Task 5: Update CI And Runbooks

**Files:**
- Modify: `.github/workflows/production-readiness.yml`
- Modify: `docs/production-freeze-checklist.md`
- Modify: `docs/test-staging-verification-runbook.md`
- Modify: `docs/production-docker-cloudflare.md`

- [ ] **Step 1: Update CI release-safety env names**

In `.github/workflows/production-readiness.yml`, change the release-safety env block from `SAGITTARIUS_STAGING_*` to `SAGITTARIUS_SIGNOFF_*`:

```yaml
      SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED: "1"
      SAGITTARIUS_SIGNOFF_BROWSER_PASSED: "1"
      SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED: "1"
      SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED: "1"
      SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED: "1"
      SAGITTARIUS_SIGNOFF_NO_P1_P2: "1"
      SAGITTARIUS_SIGNOFF_ENVIRONMENT: production-preflight
      SAGITTARIUS_SIGNOFF_API_BASE_URL: https://joii.13thx.com
      SAGITTARIUS_SIGNOFF_FRONTEND_URL: https://joii.13thx.com
      SAGITTARIUS_SIGNOFF_EVIDENCE_URL: https://ci.13thx.com/sagittarius/runs/123
      SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL: https://ci.13thx.com/sagittarius/runs/123/browser
      SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL: https://ci.13thx.com/sagittarius/runs/123/migration
      SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL: https://ci.13thx.com/sagittarius/runs/123/rollback
      SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL: https://alerts.13thx.com/incidents/sagittarius-write-routes
      SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL: "https://issues.13thx.com/sagittarius?severity=P1,P2"
```

- [ ] **Step 2: Update CI command**

Change:

```yaml
      - name: Run staging signoff gate
        working-directory: frontend
        run: bun run test:staging-signoff
```

to:

```yaml
      - name: Run release signoff gate
        working-directory: frontend
        run: bun run test:release-signoff
```

- [ ] **Step 3: Update production freeze checklist**

In `docs/production-freeze-checklist.md`, change the env file guidance:

```md
Create and verify the production runtime env file:

```bash
cp .env.production.example .env.production
$EDITOR .env.production
make production-env-file-check PRODUCTION_ENV_FILE=.env.production
```

Create and verify the release signoff env file:

```bash
cp .env.release-signoff.example .env.release-signoff
$EDITOR .env.release-signoff
make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff
```

Run both gates before opening production:

```bash
make production-deploy-gate PRODUCTION_ENV_FILE=.env.production SIGNOFF_ENV_FILE=.env.release-signoff
```
```

Also replace references to `staging-signoff-check` with `release-signoff-check`, except where documenting the deprecated compatibility alias.

- [ ] **Step 4: Update staging verification runbook language**

In `docs/test-staging-verification-runbook.md`, rename the "After staging verification" signoff section to "After release verification" and use `SAGITTARIUS_SIGNOFF_*` examples. Include this note:

```md
If there is no persistent staging runtime, set
`SAGITTARIUS_SIGNOFF_ENVIRONMENT=production-preflight` and link the real
production-preflight evidence instead of inventing a `.env.staging` file.
```

- [ ] **Step 5: Update Docker/Cloudflare runbook**

In `docs/production-docker-cloudflare.md`, document:

```md
`.env.production` contains production runtime values only. Release evidence and
owner signoff live in `.env.release-signoff` and are checked with
`make release-signoff-check`.
```

- [ ] **Step 6: Run docs/contract tests**

Run:

```bash
cd frontend && rtk bun run test src/project-contract.test.ts src/release-gates.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit CI and docs update**

```bash
rtk git add .github/workflows/production-readiness.yml docs/production-freeze-checklist.md docs/test-staging-verification-runbook.md docs/production-docker-cloudflare.md frontend/src/project-contract.test.ts frontend/src/release-gates.test.ts
rtk git commit -m "docs: rename staging signoff to release signoff"
```

## Task 6: Full Verification And Final Review

**Files:**
- Verify all changed files.
- Do not modify `.env.production.x`.

- [ ] **Step 1: Run release gate focused tests**

Run:

```bash
cd frontend && rtk bun run test src/release-gates.test.ts scripts/check-production-env.test.ts src/project-contract.test.ts
```

Expected: PASS, with release gate tests covering production runtime-only env, new signoff names, old staging aliases, and placeholder rejection.

- [ ] **Step 2: Run typecheck**

Run:

```bash
cd frontend && rtk bun run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run env file gates against examples**

Run:

```bash
rtk make production-env-file-check PRODUCTION_ENV_FILE=.env.production.example
rtk make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff.example
rtk make production-deploy-gate PRODUCTION_ENV_FILE=.env.production.example SIGNOFF_ENV_FILE=.env.release-signoff.example
```

Expected: all PASS.

- [ ] **Step 4: Run full local production readiness gate**

Run:

```bash
rtk make production-readiness-local PSQL=psql
```

Expected: PASS. If local Playwright browsers are missing, run:

```bash
cd frontend && rtk bunx playwright install chromium
```

Then rerun the full gate.

- [ ] **Step 5: Run Docker compose config check**

Run:

```bash
rtk sh -lc 'set -a; . ./.env.production.example; set +a; docker compose --env-file .env.production.example -f docker-compose.production.yml config >/tmp/sagittarius-compose-config.out && wc -l /tmp/sagittarius-compose-config.out'
```

Expected: exit 0 and a nonzero line count.

- [ ] **Step 6: Inspect final diff**

Run:

```bash
rtk git status --short --branch
rtk git diff --stat origin/main...HEAD
rtk git diff --check
```

Expected:

- No whitespace errors.
- Only planned tracked files changed.
- `.env.production.x` remains untracked and untouched if still present.

- [ ] **Step 7: Final commit if any uncommitted changes remain**

If verification required minor fixes after previous commits:

```bash
rtk git add .env.local.example .env.production.example .env.release-signoff.example .github/workflows/production-readiness.yml .gitignore Makefile docs/production-freeze-checklist.md docs/production-docker-cloudflare.md docs/test-staging-verification-runbook.md frontend/package.json frontend/scripts/check-production-env.ts frontend/scripts/check-production-env.test.ts frontend/scripts/check-release-signoff.ts frontend/scripts/check-staging-signoff.ts frontend/src/project-contract.test.ts frontend/src/release-gates.test.ts
rtk git commit -m "chore: verify env signoff split"
```

- [ ] **Step 8: Update issue #11**

Post a concise GitHub issue update:

```bash
rtk gh issue comment 11 --body "Update: runtime env and release signoff config are now split. Production runtime gates no longer require signoff evidence inside .env.production; release evidence is checked by test:release-signoff / make release-signoff-check. Verification passed: bun run test src/release-gates.test.ts scripts/check-production-env.test.ts src/project-contract.test.ts; bun run typecheck; make production-env-file-check PRODUCTION_ENV_FILE=.env.production.example; make release-signoff-check SIGNOFF_ENV_FILE=.env.release-signoff.example; make production-deploy-gate PRODUCTION_ENV_FILE=.env.production.example SIGNOFF_ENV_FILE=.env.release-signoff.example; make production-readiness-local PSQL=psql. Public launch still depends on real DNS/Cloudflare/evidence reachability before closing this issue."
```

Expected: issue remains open unless public DNS/Cloudflare and real evidence are also verified.

## Self-Review

Spec coverage:

- Runtime env and signoff evidence are separate: Tasks 2, 3, 4.
- No `.env.staging` without real staging runtime: Tasks 4 and 5 docs.
- `SAGITTARIUS_SIGNOFF_*` with `SAGITTARIUS_STAGING_*` compatibility: Task 3.
- Makefile and script split: Tasks 3 and 4.
- Tests reject placeholders, localhost, `TBD`, and missing alert/runbook values: Tasks 1 and 3.
- Existing production readiness still runs: Task 6.

Placeholder scan:

- `TBD` appears only in expected rejection messages and acceptance text; there are no unresolved `TBD` placeholders.
- No `TODO`, "implement later", or "similar to" instructions remain.
- Example URLs under `13thx.com` are deliberate non-secret example values already used by project gates.

Type/name consistency:

- New names use `SAGITTARIUS_SIGNOFF_*`.
- Deprecated aliases use existing `SAGITTARIUS_STAGING_*`.
- Package script is `test:release-signoff`.
- Makefile target is `release-signoff-check`.
