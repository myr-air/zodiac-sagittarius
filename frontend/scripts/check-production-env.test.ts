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
    SAGITTARIUS_INTERNAL_API_BASE_URL: "http://sagittarius-api:5181",
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
