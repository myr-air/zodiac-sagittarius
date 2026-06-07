import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");
const repoRoot = resolve(frontendRoot, "..");

describe("Sagittarius project scaffold", () => {
  it("separates frontend and backend services behind a root Makefile", () => {
    expect(existsSync(join(frontendRoot, "package.json"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/app/SagittariusApp.tsx"))).toBe(true);
    expect(existsSync(join(repoRoot, "backend/Cargo.toml"))).toBe(true);
    expect(existsSync(join(repoRoot, "package.json"))).toBe(false);

    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    [
      "frontend-dev:",
      "frontend-build:",
      "frontend-test:",
      "frontend-storybook:",
      "frontend-verify:",
      "backend-test:",
      "verify:",
    ].forEach((target) => expect(makefile).toContain(target));
  });

  it("uses Bun scripts and Storybook for frontend development", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      packageManager?: string;
      scripts?: Record<string, string>;
    };

    expect(packageJson.packageManager).toMatch(/^bun@/);
    expect(packageJson.scripts?.storybook).toContain("storybook dev");
    expect(packageJson.scripts?.["build-storybook"]).toContain("storybook build");
    expect(readFileSync(join(frontendRoot, ".storybook/main.ts"), "utf8")).toContain("@storybook/nextjs-vite");
  });

  it("uses Next App Router with trip-scoped production routes", () => {
    expect(readFileSync(join(frontendRoot, "app/page.tsx"), "utf8")).toContain("HomeLanding");
    expect(readFileSync(join(frontendRoot, "src/components/HomeLanding.tsx"), "utf8")).toContain("LanguageSwitch");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages.ts"), "utf8")).toContain("Plan trips with friends");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages.ts"), "utf8")).toContain("วางแผนทริปกับเพื่อน");
    expect(existsSync(join(frontendRoot, "app/access/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/login/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/register/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/portal/page.tsx"))).toBe(true);
    [
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
    ].forEach((routeFile) => expect(existsSync(join(frontendRoot, routeFile))).toBe(true));
    expect(readFileSync(join(frontendRoot, "app/access/page.tsx"), "utf8")).toContain("appRoutes.portal()");
    expect(readFileSync(join(frontendRoot, "app/login/page.tsx"), "utf8")).toContain("redirect(appRoutes.login())");
    expect(readFileSync(join(frontendRoot, "app/register/page.tsx"), "utf8")).toContain("redirect(appRoutes.register())");
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/itinerary/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/map/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/timeline/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/members/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/demo/page.tsx"))).toBe(false);
    expect(readFileSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"), "utf8")).toContain("initialJoinCode={decodedJoinCode}");
    expect(readFileSync(join(frontendRoot, "app/layout.tsx"), "utf8")).toContain("Joii");
  });

  it("keeps account and trip access separated on production page routes", () => {
    expect(readFileSync(join(frontendRoot, "app/trips/new/page.tsx"), "utf8")).toContain('accessMode="account-login"');

    [
      "app/trips/page.tsx",
      "app/portal/page.tsx",
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
    ].forEach((routeFile) => {
      expect(readFileSync(join(frontendRoot, routeFile), "utf8")).toContain('accessMode="account-portal"');
    });

    [
      "app/join/page.tsx",
      "app/join/[joinCode]/page.tsx",
      "app/trips/[tripId]/page.tsx",
      "app/trips/[tripId]/itinerary/page.tsx",
      "app/trips/[tripId]/map/page.tsx",
      "app/trips/[tripId]/timeline/page.tsx",
      "app/trips/[tripId]/members/page.tsx",
    ].forEach((routeFile) => {
      expect(readFileSync(join(frontendRoot, routeFile), "utf8")).toContain('accessMode="trip-access"');
    });
  });

  it("keeps the Calm Travel Ops design tokens in globals", () => {
    const css = readFileSync(join(frontendRoot, "app/globals.css"), "utf8");

    expect(css).toContain("--color-primary: #0f766e");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).toContain("--color-warning: #f97316");
  });

  it("documents the Rust/PostgreSQL API data contract", () => {
    const spec = readFileSync(join(repoRoot, "docs/api-data-spec.md"), "utf8");

    expect(spec).toContain("CREATE TABLE trips");
    expect(spec).toContain("CREATE TABLE itinerary_items");
    expect(spec).toContain("GET /api/v1/trips/:tripId");
    expect(spec).toContain("POST /api/v1/trip-join-sessions");
    expect(spec).toContain("CREATE TABLE trip_member_sessions");
    expect(spec).toContain("CREATE TABLE trip_join_sessions");
    expect(spec).toContain("PATCH /api/v1/trips/:tripId/itinerary-items/:itemId");
    expect(spec).toContain("wss://api.sagittarius.local/api/v1/trips/:tripId/events/stream");
    expect(spec).toContain("itinerary_item.updated");
    expect(spec).toContain("clientMutationId");
  });

  it("documents the backend vertical slice verification command", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(makefile).toContain("TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test");
    expect(makefile).toContain('DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST)');
  });

  it("keeps incremental database migrations independent in db-init targets", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(makefile).toContain("backend/migrations/0004_account_password_auth.sql");
    expect(makefile).toContain("backend/migrations/0005_account_portal.sql");
    expect(makefile).toContain("backend/migrations/0006_trip_countries.sql");
    expect(makefile).toContain("backend/migrations/0010_itinerary_activity_paths.sql");
    expect(makefile).toContain("backend/migrations/0011_expense_reminders.sql");
    expect(makefile).toContain("table_name='account_vault_items'");
    expect(makefile).toContain("table_name='trips' AND column_name='countries'");
    expect(makefile).toContain("table_name='itinerary_items' AND column_name='path_id'");
    expect(makefile).toContain("table_name='expense_reminders'");
    expect(makefile).not.toMatch(/elif ! \$\(PSQL\)[\s\S]*account_vault_items/);
  });

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
    expect(packageJson.scripts?.["test:staging-preflight"]).toBe("bun run scripts/check-staging-preflight.ts");
    expect(packageJson.scripts?.["test:staging-signoff"]).toBe("bun run scripts/check-staging-signoff.ts");
    expect(existsSync(join(frontendRoot, "scripts/run-local-real-api-e2e.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-api-trace-smoke.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-perf-smoke.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-production-env.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-staging-preflight.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-staging-signoff.ts"))).toBe(true);
    const authBrowserE2e = readFileSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"), "utf8");
    expect(authBrowserE2e).toContain('run("bun", ["run", "build"]');
    expect(authBrowserE2e).toContain('spawnLogged("frontend", "bun", ["run", "start"]');
    expect(authBrowserE2e).not.toContain('["run", "next", "dev"');
    const stagingSignoff = readFileSync(join(frontendRoot, "scripts/check-staging-signoff.ts"), "utf8");
    expect(stagingSignoff).toContain("checkPublicHttpsUrl");
    expect(stagingSignoff).toContain("must not point at localhost");
    expect(stagingSignoff).toContain("must not use placeholder domain");
    expect(stagingSignoff).toContain("must be a real owner, not TBD");
    expect(stagingSignoff).toContain("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
    expect(stagingSignoff).toContain("SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL");
    expect(stagingSignoff).toContain("SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL");
    expect(stagingSignoff).toContain("SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL");
    expect(stagingSignoff).toContain("SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL");
    const seedE2e = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/bin/seed_e2e.rs"), "utf8");
    expect(seedE2e).toContain("0005_account_portal.sql");
    expect(seedE2e).toContain("0006_trip_countries.sql");
    expect(seedE2e).toContain("0010_itinerary_activity_paths.sql");
    expect(seedE2e).toContain("0011_expense_reminders.sql");
    expect(seedE2e).toContain("0012_expense_exchange_rates.sql");
    expect(seedE2e).toContain("0013_expense_receipts_itemization.sql");
    expect(seedE2e).toContain("0014_expense_notes.sql");
    expect(seedE2e).toContain("0015_expense_comments.sql");
    expect(makefile).toContain("frontend-e2e-local:");
    expect(makefile).toContain("frontend-e2e-local: db-init-test");
    expect(makefile).toContain("bun run test:e2e:local");
    expect(makefile).toContain("frontend-e2e-auth-browser: db-init-test");
    expect(makefile).toContain("bun run test:e2e:auth-browser");
  });

  it("keeps production-readiness gates repeatable from the root Makefile", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const apiMod = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/api/mod.rs"), "utf8");
    const apiMain = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/main.rs"), "utf8");
    const productionEnvCheck = readFileSync(join(frontendRoot, "scripts/check-production-env.ts"), "utf8");
    const workflow = readFileSync(join(repoRoot, ".github/workflows/production-readiness.yml"), "utf8");

    expect(existsSync(join(repoRoot, ".dockerignore"))).toBe(true);
    expect(existsSync(join(repoRoot, "backend/Dockerfile"))).toBe(true);
    expect(existsSync(join(repoRoot, "frontend/Dockerfile"))).toBe(true);
    expect(makefile).toContain("production-readiness-local: staging-preflight verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke perf-smoke db-rollback-stop-notes-test");
    expect(makefile).toContain("container-build:");
    expect(makefile).toContain("staging-preflight: db-ensure-psql");
    expect(makefile).toContain("staging-signoff-check:");
    expect(makefile).toContain("production-env-check:");
    expect(makefile).toContain("api-trace-smoke: db-init-test");
    expect(makefile).toContain("perf-smoke: db-init-test");
    expect(makefile).toContain("db-rollback-stop-notes-test:");
    expect(makefile).toContain("ROLLBACK_TEST_DATABASE_NAME ?= sagittarius_rollback_test");
    expect(makefile).toContain("DROP TABLE IF EXISTS stop_notes");
    expect(apiMod).toContain(".route(\"/health\", get(health::liveness))");
    expect(apiMod).toContain(".route(\"/readiness\", get(health::readiness))");
    expect(apiMod).toContain("DefaultOnRequest::new().level(Level::INFO)");
    expect(apiMod).toContain("DefaultOnResponse::new().level(Level::INFO)");
    expect(apiMod).toContain("SAGITTARIUS_ALLOWED_ORIGINS");
    expect(apiMod).not.toContain("AllowOrigin::mirror_request()");
    expect(apiMain).toContain("EnvFilter::try_from_default_env()");
    expect(productionEnvCheck).toContain("EMAIL_DELIVERY");
    expect(productionEnvCheck).toContain("PASSKEY_ALLOWED_ORIGINS");
    expect(productionEnvCheck).toContain("SMTP_PASSWORD");
    expect(productionEnvCheck).toContain("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
    expect(productionEnvCheck).toContain("SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL");
    expect(productionEnvCheck).toContain("SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL");
    expect(productionEnvCheck).toContain("SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL");
    expect(productionEnvCheck).toContain("SAGITTARIUS_ALERT_SINK_NAME");
    expect(productionEnvCheck).toContain("SAGITTARIUS_ALERT_RUNBOOK_URL");
    expect(productionEnvCheck).toContain("must not use placeholder domain");
    const stagingPreflight = readFileSync(join(frontendRoot, "scripts/check-staging-preflight.ts"), "utf8");
    const productionBrowserQa = readFileSync(join(frontendRoot, "scripts/run-local-production-browser-qa.ts"), "utf8");
    expect(productionBrowserQa).toContain("appRoutes.tripItinerary(tripId)");
    expect(productionBrowserQa).toContain("appRoutes.tripMembers(tripId)");
    expect(productionBrowserQa).not.toContain('a[href="/trips/${tripId}/itinerary"]');
    expect(productionBrowserQa).not.toContain('a[href="/trips/${tripId}/members"]');
    expect(stagingPreflight).toContain("SAGITTARIUS_REQUIRE_PREFLIGHT_API_CHECK");
    expect(stagingPreflight).toContain("/api/v1/health");
    expect(stagingPreflight).toContain("/api/v1/readiness");
    expect(packageJson.scripts?.start).toContain("${HOSTNAME:-127.0.0.1}");
    expect(workflow).toContain("postgres:17-alpine");
    expect(workflow).toContain("bun install --frozen-lockfile");
    expect(workflow).toContain("bunx playwright install --with-deps chromium");
    expect(workflow).toContain('SAGITTARIUS_PERF_SMOKE_MAX_P95_MS: "3000"');
    expect(workflow).toContain("make production-readiness-local PSQL=psql");
    expect(workflow).toContain("name: Production container image build");
    expect(workflow).toContain("make container-build");
    expect(workflow).toContain("name: Release safety script checks");
    expect(workflow).toContain("bun run test:staging-signoff");
    expect(workflow).toContain("bun run test:production-env");
  });

  it("keeps production source free of unimplemented runtime placeholders", () => {
    const sourceRoots = [
      join(frontendRoot, "app"),
      join(frontendRoot, "src"),
      join(repoRoot, "backend/crates/sagittarius-api/src"),
    ];
    const blocked = /\b(?:unimplemented!|todo!)\s*\(|not implemented|coming soon/i;
    const offenders = sourceRoots
      .flatMap((root) => collectSourceFiles(root))
      .filter((filePath) => filePath !== fileURLToPath(import.meta.url))
      .filter((filePath) => blocked.test(readFileSync(filePath, "utf8")))
      .map((filePath) => filePath.replace(`${repoRoot}/`, ""));

    expect(offenders).toEqual([]);
  });
});

function collectSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const filePath = join(root, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      if ([".next", "coverage", "node_modules", "target"].includes(entry)) return [];
      return collectSourceFiles(filePath);
    }
    return /\.(css|rs|ts|tsx)$/.test(entry) ? [filePath] : [];
  });
}
