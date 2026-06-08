import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");
const baseEnv = {
  HOME: process.env.HOME ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "test",
  PATH: process.env.PATH ?? "",
  TMPDIR: process.env.TMPDIR ?? "",
};

const validProductionRuntimeEnv = {
  DATABASE_URL:
    "postgres://sagittarius:secret-prod-password@postgres.13thx.com:5432/sagittarius",
  EMAIL_DELIVERY: "smtp",
  EMAIL_FROM: "Sagittarius <no-reply@13thx.com>",
  NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://sagittarius.13thx.com",
  PASSKEY_ALLOWED_ORIGINS: "https://sagittarius.13thx.com",
  RUST_LOG: "info,tower_http=info,sagittarius_api=info",
  SAGITTARIUS_ALLOWED_ORIGINS: "https://sagittarius.13thx.com",
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
  SAGITTARIUS_SIGNOFF_API_BASE_URL: "https://sagittarius.13thx.com",
  SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/browser",
  SAGITTARIUS_SIGNOFF_BROWSER_PASSED: "1",
  SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED: "1",
  SAGITTARIUS_SIGNOFF_ENVIRONMENT: "production-preflight",
  SAGITTARIUS_SIGNOFF_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123",
  SAGITTARIUS_SIGNOFF_FRONTEND_URL: "https://sagittarius.13thx.com",
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

const placeholderReleaseSignoffUrlCases = [
  {
    name: "SAGITTARIUS_SIGNOFF_API_BASE_URL",
    value: "https://api.staging.example.test",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
    value: "https://staging.example.test",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
    value: "https://ci.example.test/runs/123",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
    value: "https://ci.example.test/runs/123/browser",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
    value: "https://ci.example.test/runs/123/migration",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
    value: "https://ci.example.test/runs/123/rollback",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
    value: "https://alerts.example.test/incidents/sagittarius-write-routes",
  },
  {
    name: "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
    value: "https://issues.example.test/sagittarius?severity=P1,P2",
  },
];

describe("release evidence gates", () => {
  it("accepts the approved canonical same-origin production runtime env", () => {
    const result = runGate(
      "scripts/check-production-env.ts",
      validProductionRuntimeEnv,
    );

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("rejects joii as a runtime API base because it redirects to the canonical host", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://joii.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://joii.13thx.com",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_ALLOWED_ORIGINS should contain frontend origins, not the API base URL",
    );
  });

  it("accepts production runtime env with ambient release signoff fields outside file mode", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      ...validReleaseSignoffEnv,
    });

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("rejects approved same-origin production domains with explicit ports", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL:
        "https://sagittarius.13thx.com:444",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://sagittarius.13thx.com:444",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_ALLOWED_ORIGINS should contain frontend origins, not the API base URL",
    );
  });

  it("rejects accidental same-origin API base URLs outside the approved production domains", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://travel.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://travel.13thx.com",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_ALLOWED_ORIGINS should contain frontend origins, not the API base URL",
    );
  });

  it("rejects missing internal API targets for the runtime proxy", () => {
    const { SAGITTARIUS_INTERNAL_API_BASE_URL, ...env } =
      validProductionRuntimeEnv;
    const result = runGate("scripts/check-production-env.ts", env);

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_INTERNAL_API_BASE_URL is required",
    );
  });

  it("rejects internal API targets that include the public API path", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      SAGITTARIUS_INTERNAL_API_BASE_URL:
        "http://sagittarius-api:5181/api/v1",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must point at the service root, not /api/v1",
    );
  });

  it("accepts release signoff evidence with the new neutral variable names", () => {
    const result = runGate(
      "scripts/check-release-signoff.ts",
      validReleaseSignoffEnv,
    );

    expect(result.status).toBe(0);
    const output = outputOf(result);
    expect(output).toContain("- Alert sink: sagittarius-write-route-alerts");
    expect(output).toContain(
      "- Alert runbook: https://runbooks.13thx.com/sagittarius/write-route-alerts",
    );
    expect(output).toContain("release signoff ok");
  });

  it("accepts deprecated staging signoff aliases in the release signoff script", () => {
    const result = runGate(
      "scripts/check-release-signoff.ts",
      toLegacyStagingSignoffEnv(validReleaseSignoffEnv),
    );

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("release signoff ok");
  });

  it("keeps staging signoff as a compatibility entrypoint", () => {
    const result = runGate(
      "scripts/check-staging-signoff.ts",
      validReleaseSignoffEnv,
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

  for (const { name, value } of placeholderReleaseSignoffUrlCases) {
    it(`rejects placeholder release signoff URL for ${name}`, () => {
      const result = runGate("scripts/check-release-signoff.ts", {
        ...validReleaseSignoffEnv,
        [name]: value,
      });

      expect(result.status).not.toBe(0);
      expect(outputOf(result)).toContain(name);
      expect(outputOf(result)).toContain("must not use placeholder domain");
    });
  }

  it("rejects IPv6 localhost release signoff API URLs", () => {
    const result = runGate("scripts/check-release-signoff.ts", {
      ...validReleaseSignoffEnv,
      SAGITTARIUS_SIGNOFF_API_BASE_URL: "https://[::1]",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("SAGITTARIUS_SIGNOFF_API_BASE_URL");
    expect(outputOf(result)).toContain("must not point at localhost");
  });

  it("rejects localhost or non-HTTPS release signoff evidence URLs", () => {
    const result = runGate("scripts/check-release-signoff.ts", {
      ...validReleaseSignoffEnv,
      SAGITTARIUS_SIGNOFF_EVIDENCE_URL: "http://localhost:123/run",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("SAGITTARIUS_SIGNOFF_EVIDENCE_URL");
    expect(outputOf(result)).toContain("must use https://");
    expect(outputOf(result)).toContain("must not point at localhost");
  });

  it("rejects placeholder production runtime URLs", () => {
    const result = runGate("scripts/check-production-env.ts", {
      DATABASE_URL: "postgres://user:pass@db.example.test:5432/sagittarius",
      EMAIL_DELIVERY: "smtp",
      EMAIL_FROM: "Sagittarius <no-reply@example.test>",
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://api.example.test",
      PASSKEY_ALLOWED_ORIGINS: "https://app.example.test",
      RUST_LOG: "info,tower_http=info,sagittarius_api=info",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://app.example.test",
      SAGITTARIUS_INTERNAL_API_BASE_URL: "http://sagittarius-api:5181",
      SMTP_HOST: "smtp.example.test",
      SMTP_PASSWORD: "smtp-password",
      SMTP_PORT: "587",
      SMTP_USERNAME: "smtp-user",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("must not use placeholder domain");
  });

  it("rejects supplied release signoff fields in the production runtime env", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      ...validReleaseSignoffEnv,
      SAGITTARIUS_PRODUCTION_ENV_FILE_CHECK: "1",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("SAGITTARIUS_SIGNOFF_EVIDENCE_URL");
    expect(outputOf(result)).toContain("must not include release signoff");
  });

  it("rejects supplied deprecated staging signoff fields in the production runtime env", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      ...toLegacyStagingSignoffEnv(validReleaseSignoffEnv),
      SAGITTARIUS_PRODUCTION_ENV_FILE_CHECK: "1",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("SAGITTARIUS_STAGING_EVIDENCE_URL");
    expect(outputOf(result)).toContain("must not include release signoff");
  });
});

function runGate(script: string, env: Record<string, string>) {
  return spawnSync("bun", ["run", script], {
    cwd: frontendRoot,
    encoding: "utf8",
    env: {
      ...baseEnv,
      ...env,
    },
  });
}

function outputOf(result: ReturnType<typeof runGate>): string {
  return `${result.stdout}\n${result.stderr}`;
}

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
    SAGITTARIUS_STAGING_API_BASE_URL: env.SAGITTARIUS_SIGNOFF_API_BASE_URL,
    SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL:
      env.SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL,
    SAGITTARIUS_STAGING_BROWSER_SIGNOFF:
      env.SAGITTARIUS_SIGNOFF_BROWSER_PASSED,
    SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED:
      env.SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED,
    SAGITTARIUS_STAGING_ENVIRONMENT: env.SAGITTARIUS_SIGNOFF_ENVIRONMENT,
    SAGITTARIUS_STAGING_EVIDENCE_URL: env.SAGITTARIUS_SIGNOFF_EVIDENCE_URL,
    SAGITTARIUS_STAGING_FRONTEND_URL: env.SAGITTARIUS_SIGNOFF_FRONTEND_URL,
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
