import { describe, expect, it } from "vitest";
import {
  outputOf,
  placeholderReleaseSignoffUrlCases,
  runGate,
  toLegacyStagingSignoffEnv,
  validReleaseSignoffEnv,
} from "./release-gates.test-support";

describe("release signoff evidence gates", () => {
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
});
