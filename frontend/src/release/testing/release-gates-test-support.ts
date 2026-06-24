import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "../../..");
const baseEnv = {
  HOME: process.env.HOME ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "test",
  PATH: process.env.PATH ?? "",
  TMPDIR: process.env.TMPDIR ?? "",
};

export const validProductionRuntimeEnv = {
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

export const validReleaseSignoffEnv = {
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

export const placeholderReleaseSignoffUrlCases = [
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

export function runGate(script: string, env: Record<string, string>) {
  return spawnSync("bun", ["run", script], {
    cwd: frontendRoot,
    encoding: "utf8",
    env: {
      ...baseEnv,
      ...env,
    },
  });
}

export function outputOf(result: ReturnType<typeof runGate>): string {
  return `${result.stdout}\n${result.stderr}`;
}

export function toLegacyStagingSignoffEnv(env: Record<string, string>) {
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
