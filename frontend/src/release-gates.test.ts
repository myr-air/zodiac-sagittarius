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

const validProductionEnv = {
  DATABASE_URL: "postgres://sagittarius:secret-prod-password@postgres.13thx.com:5432/sagittarius",
  EMAIL_DELIVERY: "smtp",
  EMAIL_FROM: "Sagittarius <no-reply@13thx.com>",
  NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://joii.13thx.com",
  PASSKEY_ALLOWED_ORIGINS:
    "https://joii.13thx.com,https://sagittarius.13thx.com",
  RUST_LOG: "info,tower_http=info,sagittarius_api=info",
  SAGITTARIUS_ALERT_RUNBOOK_URL:
    "https://runbooks.13thx.com/sagittarius/write-route-alerts",
  SAGITTARIUS_ALERT_SINK_NAME: "sagittarius-write-route-alerts",
  SAGITTARIUS_ALLOWED_ORIGINS:
    "https://joii.13thx.com,https://sagittarius.13thx.com",
  SAGITTARIUS_ENV: "production",
  SAGITTARIUS_FEATURE_OWNER: "Aom Owner",
  SAGITTARIUS_INTERNAL_API_BASE_URL: "http://sagittarius-api:5181",
  SAGITTARIUS_ROLLBACK_OWNER: "Beam Owner",
  SAGITTARIUS_SEED_SAMPLE_DATA: "0",
  SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/browser",
  SAGITTARIUS_STAGING_BROWSER_SIGNOFF: "1",
  SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED: "1",
  SAGITTARIUS_STAGING_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123",
  SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL:
    "https://issues.13thx.com/sagittarius?severity=P1,P2",
  SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/migration",
  SAGITTARIUS_STAGING_NO_P1_P2: "1",
  SAGITTARIUS_STAGING_PREFLIGHT_PASSED: "1",
  SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL:
    "https://ci.13thx.com/sagittarius/runs/123/rollback",
  SAGITTARIUS_STAGING_ROLLBACK_VERIFIED: "1",
  SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED: "1",
  SMTP_HOST: "smtp.13thx.com",
  SMTP_PASSWORD: "secret-smtp-password",
  SMTP_PORT: "587",
  SMTP_USERNAME: "sagittarius-smtp",
};

describe("release evidence gates", () => {
  it("accepts the approved joii same-origin production deployment", () => {
    const result = runGate("scripts/check-production-env.ts", validProductionEnv);

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("accepts the approved sagittarius same-origin production deployment", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://sagittarius.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://sagittarius.13thx.com",
    });

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("rejects approved same-origin production domains with explicit ports", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://joii.13thx.com:444",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://joii.13thx.com:444",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_ALLOWED_ORIGINS should contain frontend origins, not the API base URL",
    );
  });

  it("rejects accidental same-origin API base URLs outside the approved production domains", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://travel.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://travel.13thx.com",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_ALLOWED_ORIGINS should contain frontend origins, not the API base URL",
    );
  });

  it("rejects missing internal API targets for the runtime proxy", () => {
    const { SAGITTARIUS_INTERNAL_API_BASE_URL, ...env } = validProductionEnv;
    const result = runGate("scripts/check-production-env.ts", env);

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_INTERNAL_API_BASE_URL is required",
    );
  });

  it("rejects internal API targets that include the public API path", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionEnv,
      SAGITTARIUS_INTERNAL_API_BASE_URL:
        "http://sagittarius-api:5181/api/v1",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain(
      "SAGITTARIUS_INTERNAL_API_BASE_URL must point at the service root, not /api/v1",
    );
  });

  it("rejects placeholder staging evidence URLs", () => {
    const result = runGate("scripts/check-staging-signoff.ts", {
      SAGITTARIUS_FEATURE_OWNER: "Aom Owner",
      SAGITTARIUS_ROLLBACK_OWNER: "Beam Owner",
      SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL: "https://alerts.example.test/incidents/sagittarius-write-routes",
      SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED: "1",
      SAGITTARIUS_STAGING_API_BASE_URL: "https://api.staging.example.test",
      SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL: "https://ci.example.test/runs/123/browser",
      SAGITTARIUS_STAGING_BROWSER_SIGNOFF: "1",
      SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED: "1",
      SAGITTARIUS_STAGING_ENVIRONMENT: "staging",
      SAGITTARIUS_STAGING_EVIDENCE_URL: "https://ci.example.test/runs/123",
      SAGITTARIUS_STAGING_FRONTEND_URL: "https://staging.example.test",
      SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL: "https://issues.example.test/sagittarius?severity=P1,P2",
      SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL: "https://ci.example.test/runs/123/migration",
      SAGITTARIUS_STAGING_NO_P1_P2: "1",
      SAGITTARIUS_STAGING_PREFLIGHT_PASSED: "1",
      SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL: "https://ci.example.test/runs/123/rollback",
      SAGITTARIUS_STAGING_ROLLBACK_VERIFIED: "1",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("must not use placeholder domain");
  });

  it("rejects placeholder production URLs and evidence", () => {
    const result = runGate("scripts/check-production-env.ts", {
      DATABASE_URL: "postgres://user:pass@db.example.test:5432/sagittarius",
      EMAIL_DELIVERY: "smtp",
      EMAIL_FROM: "Sagittarius <no-reply@example.test>",
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://api.example.test",
      PASSKEY_ALLOWED_ORIGINS: "https://app.example.test",
      RUST_LOG: "info,tower_http=info,sagittarius_api=info",
      SAGITTARIUS_ALERT_RUNBOOK_URL: "https://runbooks.example.test/sagittarius/write-route-alerts",
      SAGITTARIUS_ALERT_SINK_NAME: "sagittarius-write-route-alerts",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://app.example.test",
      SAGITTARIUS_INTERNAL_API_BASE_URL: "http://sagittarius-api:5181",
      SAGITTARIUS_FEATURE_OWNER: "Aom Owner",
      SAGITTARIUS_ROLLBACK_OWNER: "Beam Owner",
      SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL: "https://ci.example.test/runs/123/browser",
      SAGITTARIUS_STAGING_BROWSER_SIGNOFF: "1",
      SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED: "1",
      SAGITTARIUS_STAGING_EVIDENCE_URL: "https://ci.example.test/runs/123",
      SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL: "https://issues.example.test/sagittarius?severity=P1,P2",
      SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL: "https://ci.example.test/runs/123/migration",
      SAGITTARIUS_STAGING_NO_P1_P2: "1",
      SAGITTARIUS_STAGING_PREFLIGHT_PASSED: "1",
      SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL: "https://ci.example.test/runs/123/rollback",
      SAGITTARIUS_STAGING_ROLLBACK_VERIFIED: "1",
      SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED: "1",
      SMTP_HOST: "smtp.example.test",
      SMTP_PASSWORD: "smtp-password",
      SMTP_PORT: "587",
      SMTP_USERNAME: "smtp-user",
    });

    expect(result.status).not.toBe(0);
    expect(outputOf(result)).toContain("must not use placeholder domain");
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
