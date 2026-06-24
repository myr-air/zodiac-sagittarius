import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  composeServiceBlock,
  envFileValue,
  frontendRoot,
  repoRoot,
} from "../../project/contracts/project-contract.helpers";

describe("Sagittarius production release contracts", () => {
  it("splits runtime env examples from release signoff evidence", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");
    const dockerCompose = readFileSync(join(repoRoot, "docker-compose.yml"), "utf8");
    const frontendDockerfile = readFileSync(join(repoRoot, "frontend/Dockerfile"), "utf8");
    const localEnvExample = readFileSync(join(repoRoot, ".env.local.example"), "utf8");
    const productionEnvExample = readFileSync(join(repoRoot, ".env.production.example"), "utf8");
    const releaseSignoffEnvExample = readFileSync(join(repoRoot, ".env.release-signoff.example"), "utf8");
    const gitignore = readFileSync(join(repoRoot, ".gitignore"), "utf8");
    const apiServiceBlock = composeServiceBlock(dockerCompose, "sagittarius-server");
    const webServiceBlock = composeServiceBlock(dockerCompose, "sagittarius-web");
    const databaseHost = new URL(envFileValue(productionEnvExample, "DATABASE_URL")).hostname;
    const internalApiHost = new URL(
      envFileValue(productionEnvExample, "SAGITTARIUS_INTERNAL_API_BASE_URL"),
    ).hostname;

    expect(makefile).toContain("PRODUCTION_COMPOSE_FILE ?= docker-compose.yml");
    expect(makefile).not.toContain("docker-compose.production.yml");
    expect(makefile).toContain("SIGNOFF_ENV_FILE ?= .env.release-signoff");
    expect(makefile).toContain(
      'SIGNOFF_ENV_SOURCE := $(if $(filter /%,$(SIGNOFF_ENV_FILE)),$(SIGNOFF_ENV_FILE),./$(SIGNOFF_ENV_FILE))',
    );
    expect(makefile).toContain("release-signoff-check:");
    expect(makefile).toContain("staging-signoff-check: release-signoff-check");
    expect(makefile).toContain("production-deploy-gate: production-env-file-check release-signoff-check");
    expect(makefile).toContain(
      'set -a; . "$(SIGNOFF_ENV_SOURCE)"; set +a; cd $(FRONTEND_DIR) && bun run test:release-signoff',
    );

    for (const localDefault of [
      "DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius",
      "TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test",
      "PGADMIN_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres",
      "SAGITTARIUS_BIND_ADDR=127.0.0.1:5181",
      "SAGITTARIUS_ENV=development",
      "SAGITTARIUS_SEED_SAMPLE_DATA=1",
      "NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=http://127.0.0.1:5181",
      "RUST_LOG=info,tower_http=info,sagittarius_api=info",
    ]) {
      expect(localEnvExample).toContain(localDefault);
    }

    for (const runtimeName of [
      "DATABASE_URL",
      "SAGITTARIUS_ENV",
      "SAGITTARIUS_SEED_SAMPLE_DATA",
      "SAGITTARIUS_ALLOWED_ORIGINS",
      "PASSKEY_ALLOWED_ORIGINS",
      "NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL",
      "SAGITTARIUS_INTERNAL_API_BASE_URL",
      "EMAIL_DELIVERY",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USERNAME",
      "SMTP_PASSWORD",
      "EMAIL_FROM",
      "SENDMAIL_COMMAND",
      "RUST_LOG",
    ]) {
      expect(productionEnvExample).toContain(`${runtimeName}=`);
    }

    for (const signoffName of [
      "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED",
      "SAGITTARIUS_SIGNOFF_API_BASE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_PASSED",
      "SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED",
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
      "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
      "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_NO_P1_P2",
      "SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED",
      "SAGITTARIUS_ALERT_RUNBOOK_URL",
      "SAGITTARIUS_ALERT_SINK_NAME",
      "SAGITTARIUS_FEATURE_OWNER",
      "SAGITTARIUS_ROLLBACK_OWNER",
    ]) {
      expect(releaseSignoffEnvExample).toContain(`${signoffName}=`);
    }

    expect(releaseSignoffEnvExample).not.toContain("SAGITTARIUS_STAGING_");
    expect(apiServiceBlock).toContain("context: .");
    expect(apiServiceBlock).toContain("dockerfile: backend/Dockerfile");
    expect(webServiceBlock).toContain("context: .");
    expect(webServiceBlock).toContain("dockerfile: frontend/Dockerfile");
    expect(frontendDockerfile).toContain("COPY --chown=bun:bun --from=builder /app/frontend/.next ./.next");
    expect(internalApiHost).toBe("sagittarius-api");
    expect(apiServiceBlock).toMatch(/aliases:\n\s+- sagittarius-api/);
    expect(databaseHost).toBe("zodiac-postgres");
    expect(dockerCompose).toMatch(/ophiuchus:\n\s+external: true\n\s+name: ophiuchus-network/);
    expect(apiServiceBlock).toContain("ophiuchus:");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain(".env.local");
    expect(gitignore).toContain(".env.production");
    expect(gitignore).toContain(".env.release-signoff");
  });

  it("keeps production-readiness gates repeatable from the root Makefile", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const apiMod = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/api/mod.rs"), "utf8");
    const apiMain = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/main.rs"), "utf8");
    const productionEnvCheck = readFileSync(join(frontendRoot, "scripts/check-production-env.ts"), "utf8");
    const productionEnvExample = readFileSync(join(repoRoot, ".env.production.example"), "utf8");
    const authBrowserE2e = readFileSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"), "utf8");
    const workflow = readFileSync(join(repoRoot, ".github/workflows/production-readiness.yml"), "utf8");

    expect(existsSync(join(repoRoot, ".dockerignore"))).toBe(true);
    expect(existsSync(join(repoRoot, "backend/Dockerfile"))).toBe(true);
    expect(existsSync(join(repoRoot, "frontend/Dockerfile"))).toBe(true);
    expect(makefile).toContain("production-readiness-fast: staging-preflight verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke db-rollback-stop-notes-test");
    expect(makefile).toContain("production-readiness-local: production-readiness-fast perf-smoke");
    expect(makefile).toContain("container-build:");
    expect(makefile).toContain("staging-preflight: db-init-test");
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
    expect(apiMain).toContain("SAGITTARIUS_SEED_SAMPLE_DATA");
    expect(apiMain).toContain("TASK_ESIM_ID");
    expect(apiMain).toContain("EXPENSE_ID");
    expect(apiMain).not.toContain("gen_random_uuid()");
    expect(productionEnvCheck).toContain("EMAIL_DELIVERY");
    expect(productionEnvCheck).toContain("PASSKEY_ALLOWED_ORIGINS");
    expect(productionEnvCheck).toContain("SMTP_PASSWORD");
    expect(productionEnvCheck).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL");
    expect(productionEnvCheck).not.toMatch(/\bstaging\b/i);
    expect(productionEnvExample).not.toMatch(/\bstaging\b/i);
    for (const signoffOnlyName of [
      "SAGITTARIUS_ALERT_RUNBOOK_URL",
      "SAGITTARIUS_ALERT_SINK_NAME",
      "SAGITTARIUS_FEATURE_OWNER",
      "SAGITTARIUS_ROLLBACK_OWNER",
      "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED",
      "SAGITTARIUS_SIGNOFF_API_BASE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_PASSED",
      "SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED",
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
      "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
      "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_NO_P1_P2",
      "SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED",
      "SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED",
      "SAGITTARIUS_STAGING_API_BASE_URL",
      "SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_BROWSER_SIGNOFF",
      "SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED",
      "SAGITTARIUS_STAGING_ENVIRONMENT",
      "SAGITTARIUS_STAGING_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_FRONTEND_URL",
      "SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_NO_P1_P2",
      "SAGITTARIUS_STAGING_PREFLIGHT_PASSED",
      "SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_ROLLBACK_VERIFIED",
    ]) {
      expect(productionEnvCheck).not.toContain(signoffOnlyName);
      expect(productionEnvExample).not.toContain(signoffOnlyName);
    }
    expect(productionEnvCheck).toContain("must not use placeholder domain");
    const stagingPreflight = readFileSync(join(frontendRoot, "scripts/check-staging-preflight.ts"), "utf8");
    const productionBrowserQa = readFileSync(join(frontendRoot, "scripts/run-local-production-browser-qa.ts"), "utf8");
    expect(productionBrowserQa).toContain('EMAIL_DELIVERY: "log"');
    expect(productionBrowserQa).toContain("Set password and continue");
    expect(productionBrowserQa).toContain("Verify email");
    expect(productionBrowserQa).not.toContain('name: /^Continue$/');
    expect(productionBrowserQa).not.toContain('name: /^Use password$/');
    expect(productionBrowserQa).not.toContain('name: /^Create my trip space$/');
    expect(productionBrowserQa).toContain("appRoutes.tripItinerary(tripId)");
    expect(productionBrowserQa).toContain("appRoutes.tripMembers(tripId)");
    expect(productionBrowserQa).not.toContain('a[href="/trips/${tripId}/itinerary"]');
    expect(productionBrowserQa).not.toContain('a[href="/trips/${tripId}/members"]');
    expect(stagingPreflight).toContain("SAGITTARIUS_REQUIRE_PREFLIGHT_API_CHECK");
    expect(stagingPreflight).toContain("/api/v1/health");
    expect(stagingPreflight).toContain("/api/v1/readiness");
    expect(authBrowserE2e).toContain('EMAIL_DELIVERY: "log"');
    expect(authBrowserE2e).toContain('SAGITTARIUS_ENV: "development"');
    expect(authBrowserE2e).toContain('SAGITTARIUS_ALLOW_LOCAL_CORS: "1"');
    expect(authBrowserE2e).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL: apiBaseUrl");
    expect(packageJson.scripts?.start).toContain("${HOSTNAME:-127.0.0.1}");
    expect(workflow).toContain("postgres:17-alpine");
    expect(workflow).toContain("bun install --frozen-lockfile");
    expect(workflow).toContain("bunx playwright install --with-deps chromium");
    expect(workflow).toContain('SAGITTARIUS_PERF_SMOKE_MAX_P95_MS: "3000"');
    expect(workflow).toContain("make production-readiness-fast PSQL=psql");
    expect(workflow).toContain("name: Production container image build");
    expect(workflow).toContain("make container-build");
    expect(workflow).toContain(
      "make container-production-build PRODUCTION_ENV_FILE=.env.production.example",
    );
    expect(workflow).toContain("name: Release safety script checks");
    expect(workflow).toContain("bun run test:release-signoff");
    expect(workflow).toContain("bun run test:production-env");
  });
});
