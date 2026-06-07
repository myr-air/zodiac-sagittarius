import { describe, expect, it } from "vitest";
import { checkProductionEnv } from "./check-production-env";

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
    SAGITTARIUS_STAGING_EVIDENCE_URL:
      "https://audit.prod-sagittarius.internal/preflight",
    SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL:
      "https://audit.prod-sagittarius.internal/browser",
    SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL:
      "https://audit.prod-sagittarius.internal/migration",
    SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL:
      "https://audit.prod-sagittarius.internal/rollback",
    SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL:
      "https://audit.prod-sagittarius.internal/issues",
    SAGITTARIUS_ALERT_SINK_NAME: "pagerduty-prod",
    SAGITTARIUS_ALERT_RUNBOOK_URL:
      "https://audit.prod-sagittarius.internal/runbook",
    SAGITTARIUS_FEATURE_OWNER: "release-owner",
    SAGITTARIUS_ROLLBACK_OWNER: "rollback-owner",
    SAGITTARIUS_STAGING_PREFLIGHT_PASSED: "1",
    SAGITTARIUS_STAGING_BROWSER_SIGNOFF: "1",
    SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED: "1",
    SAGITTARIUS_STAGING_ROLLBACK_VERIFIED: "1",
    SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED: "1",
    SAGITTARIUS_STAGING_NO_P1_P2: "1",
    ...overrides,
  };
}

describe("checkProductionEnv", () => {
  it("rejects staging backend mode and sample seeding for production", () => {
    const result = checkProductionEnv(
      validProductionEnv({
        SAGITTARIUS_ENV: "staging",
        SAGITTARIUS_SEED_SAMPLE_DATA: "1",
      }),
    );

    expect(result).toContain(
      "SAGITTARIUS_ENV=production is required before production deploy",
    );
    expect(result).toContain(
      "SAGITTARIUS_SEED_SAMPLE_DATA must be unset or false for production deploy",
    );
  });

  it("accepts a hardened production env", () => {
    expect(checkProductionEnv(validProductionEnv())).toEqual([]);
  });
});
