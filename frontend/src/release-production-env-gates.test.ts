import { describe, expect, it } from "vitest";
import {
  outputOf,
  runGate,
  toLegacyStagingSignoffEnv,
  validProductionRuntimeEnv,
  validReleaseSignoffEnv,
} from "./release-gates.test-support";

describe("production runtime env release gates", () => {
  it("accepts the approved canonical same-origin production runtime env", () => {
    const result = runGate(
      "scripts/check-production-env.ts",
      validProductionRuntimeEnv,
    );

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("accepts the approved joii same-origin production runtime env", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://joii.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS:
        "https://joii.13thx.com,https://sagittarius.13thx.com",
      PASSKEY_ALLOWED_ORIGINS:
        "https://joii.13thx.com,https://sagittarius.13thx.com",
    });

    expect(result.status).toBe(0);
    expect(outputOf(result)).toContain("production env check ok");
  });

  it("rejects unsupported runtime API base hosts", () => {
    const result = runGate("scripts/check-production-env.ts", {
      ...validProductionRuntimeEnv,
      NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL: "https://legacy.13thx.com",
      SAGITTARIUS_ALLOWED_ORIGINS: "https://legacy.13thx.com",
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
    const env: Record<string, string> = { ...validProductionRuntimeEnv };
    delete env.SAGITTARIUS_INTERNAL_API_BASE_URL;
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
