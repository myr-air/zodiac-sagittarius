import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoRoot } from "./project-contract.helpers";

describe("Sagittarius backend data contracts", () => {
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
    expect(makefile).toContain("backend-daily-briefings-contract: db-init-test");
    expect(makefile).toContain('DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST) -p sagittarius-api --test daily_briefings_contract');
  });

  it("keeps incremental database migrations independent in db-init targets", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(makefile).toContain("backend/migrations/0004_account_password_auth.sql");
    expect(makefile).toContain("backend/migrations/0005_account_portal.sql");
    expect(makefile).toContain("backend/migrations/0006_trip_countries.sql");
    expect(makefile).toContain("backend/migrations/0010_itinerary_activity_paths.sql");
    expect(makefile).toContain("backend/migrations/0011_expense_reminders.sql");
    expect(makefile).toContain("backend/migrations/0025_trip_plan_compatibility.sql");
    expect(makefile).toContain("backend/migrations/0026_plan_scoped_records.sql");
    expect(makefile).toContain("backend/migrations/0027_itinerary_hierarchy_time_windows.sql");
    expect(makefile).toContain("backend/migrations/0028_plan_check_trip_plan_scope.sql");
    expect(makefile).toContain("backend/migrations/0029_expense_reminder_trip_plan_scope.sql");
    expect(makefile).toContain("backend/migrations/0031_itinerary_activity_type_default.sql");
    expect(makefile).toContain("table_name='account_vault_items'");
    expect(makefile).toContain("table_name='trips' AND column_name='countries'");
    expect(makefile).toContain("table_name='itinerary_items' AND column_name='path_id'");
    expect(makefile).toContain("table_name='expense_reminders'");
    expect(makefile).toContain("table_name='trip_tasks' AND column_name='trip_plan_id'");
    expect(makefile).toContain("table_name='plan_checks' AND column_name='trip_plan_id'");
    expect(makefile).toContain("table_name='expense_reminders' AND column_name='trip_plan_id'");
    expect(makefile).toContain("pg_get_constraintdef(oid) LIKE '%default%'");
    expect(makefile).not.toMatch(/elif ! \$\(PSQL\)[\s\S]*account_vault_items/);
  });
});
