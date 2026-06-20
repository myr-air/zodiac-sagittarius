import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot, repoRoot } from "./project-contract.helpers";

describe("Sagittarius production e2e contracts", () => {
  it("keeps the real API e2e runnable from a seeded local backend", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(packageJson.scripts?.["test:e2e:local"]).toBe("bun run scripts/run-local-real-api-e2e.ts");
    expect(packageJson.scripts?.["test:e2e:auth-browser"]).toBe("bun run scripts/run-local-real-browser-auth-e2e.ts");
    expect(packageJson.scripts?.["test:api-trace-smoke"]).toBe("bun run scripts/run-local-api-trace-smoke.ts");
    expect(packageJson.scripts?.["test:perf-smoke"]).toBe("bun run scripts/run-local-perf-smoke.ts");
    expect(packageJson.scripts?.["test:production-env"]).toBe("bun run scripts/check-production-env.ts");
    expect(packageJson.scripts?.["test:release-signoff"]).toBe("bun run scripts/check-release-signoff.ts");
    expect(packageJson.scripts?.["test:staging-preflight"]).toBe("bun run scripts/check-staging-preflight.ts");
    expect(packageJson.scripts?.["test:staging-signoff"]).toBe("bun run scripts/check-staging-signoff.ts");
    expect(existsSync(join(frontendRoot, "scripts/run-local-real-api-e2e.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-api-trace-smoke.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-perf-smoke.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-production-env.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-release-signoff.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-staging-preflight.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-staging-signoff.ts"))).toBe(true);
    const authBrowserE2e = readFileSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"), "utf8");
    expect(authBrowserE2e).toContain('run("bun", ["run", "build"]');
    expect(authBrowserE2e).toContain('spawnLogged("frontend", "bun", ["run", "start"]');
    expect(authBrowserE2e).toContain('EMAIL_DELIVERY: "log"');
    expect(authBrowserE2e).toContain("Set password and continue");
    expect(authBrowserE2e).toContain("Verify email");
    expect(authBrowserE2e).not.toContain('name: /^Continue$/');
    expect(authBrowserE2e).not.toContain('name: /^Use password$/');
    expect(authBrowserE2e).not.toContain('name: /^Create my trip space$/');
    expect(authBrowserE2e).not.toContain('["run", "next", "dev"');
    const releaseSignoff = readFileSync(join(frontendRoot, "scripts/check-release-signoff.ts"), "utf8");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_API_BASE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_FRONTEND_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_BROWSER_PASSED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_NO_P1_P2");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_API_BASE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_FRONTEND_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_BROWSER_SIGNOFF");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_PREFLIGHT_PASSED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ROLLBACK_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_NO_P1_P2");
    expect(releaseSignoff).toContain("must not point at localhost");
    expect(releaseSignoff).toContain("must not use placeholder domain");
    expect(releaseSignoff).toContain("must be a real owner, not TBD");
    const seedE2e = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/bin/seed_e2e.rs"), "utf8");
    expect(seedE2e).toContain('const RESET_CONFIRMATION_ENV: &str = "SAGITTARIUS_ALLOW_E2E_DB_RESET"');
    expect(seedE2e).toContain('const TEST_DATABASE_NAME: &str = "sagittarius_test"');
    expect(seedE2e).toContain("database_name_from_url");
    expect(seedE2e).toContain("0005_account_portal.sql");
    expect(seedE2e).toContain("0006_trip_countries.sql");
    expect(seedE2e).toContain("0010_itinerary_activity_paths.sql");
    expect(seedE2e).toContain("0011_expense_reminders.sql");
    expect(seedE2e).toContain("0012_expense_exchange_rates.sql");
    expect(seedE2e).toContain("0013_expense_receipts_itemization.sql");
    expect(seedE2e).toContain("0014_expense_notes.sql");
    expect(seedE2e).toContain("0015_expense_comments.sql");
    expect(seedE2e).toContain("0025_trip_plan_compatibility.sql");
    expect(seedE2e).toContain("0026_plan_scoped_records.sql");
    expect(seedE2e).toContain("0027_itinerary_hierarchy_time_windows.sql");
    expect(seedE2e).toContain("0028_plan_check_trip_plan_scope.sql");
    expect(seedE2e).toContain("0029_expense_reminder_trip_plan_scope.sql");
    expect(seedE2e).toContain("0031_itinerary_activity_type_default.sql");
    for (const script of [
      "scripts/run-local-real-api-e2e.ts",
      "scripts/run-local-real-browser-auth-e2e.ts",
      "scripts/run-local-api-trace-smoke.ts",
      "scripts/run-local-perf-smoke.ts",
      "scripts/run-local-production-browser-qa.ts",
    ]) {
      expect(readFileSync(join(frontendRoot, script), "utf8")).toContain('SAGITTARIUS_ALLOW_E2E_DB_RESET: "1"');
    }
    expect(makefile).toContain("frontend-e2e-local:");
    expect(makefile).toContain("frontend-e2e-local: db-init-test");
    expect(makefile).toContain("bun run test:e2e:local");
    expect(makefile).toContain("frontend-e2e-auth-browser: db-init-test");
    expect(makefile).toContain("bun run test:e2e:auth-browser");
  });


});