import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectProductCopyFiles,
  frontendRoot,
  productCopySourceRoots,
  repoRoot,
} from "./project-contract.helpers";

describe("Sagittarius production and routing contracts", () => {
  it("uses Next App Router with trip-scoped production routes", () => {
    expect(readFileSync(join(frontendRoot, "app/page.tsx"), "utf8")).toContain("HomeLanding");
    const homeLanding = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.tsx"), "utf8");
    const homeLandingPreview = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLandingPreview.tsx"), "utf8");
    const homeLandingMeta = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.meta.ts"), "utf8");
    const homeLandingStyles = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.styles.ts"), "utf8");
    const languageSwitch = readFileSync(join(frontendRoot, "src/i18n/LanguageSwitch.tsx"), "utf8");
    const languageSwitchSupport = readFileSync(join(frontendRoot, "src/i18n/language-switch.support.ts"), "utf8");
    expect(homeLanding).toContain("LanguageSwitch");
    expect(homeLanding).toContain("./HomeLandingPreview");
    expect(homeLanding).toContain("./HomeLanding.meta");
    expect(homeLanding).toContain("./HomeLanding.styles");
    expect(homeLanding).not.toContain("previewDayKeys");
    expect(homeLanding).not.toContain("checkedChecklistKeys");
    expect(homeLandingPreview).toContain("export function HomeLandingPreview");
    expect(homeLandingPreview).toContain("previewDayKeys");
    expect(homeLandingPreview).toContain("checkedChecklistKeys");
    expect(homeLanding).not.toContain("const homePageClassName");
    expect(homeLanding).not.toContain("const workflowStepMeta");
    expect(homeLandingMeta).toContain("workflowStepMeta");
    expect(homeLandingMeta).toContain("previewDayKeys");
    expect(homeLandingStyles).toContain("homePageClassName");
    expect(homeLandingStyles).toContain("workflowToneClassNames");
    expect(languageSwitch).toContain("./language-switch.support");
    expect(languageSwitch).not.toContain("const triggerClassName");
    expect(languageSwitch).not.toContain("function readStoredCurrency");
    expect(languageSwitchSupport).toContain("export const triggerClassName");
    expect(languageSwitchSupport).toContain("export function readStoredCurrency");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages/en.home.ts"), "utf8")).toContain("Plan trips with friends");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages/th.home.ts"), "utf8")).toContain("วางแผนทริปกับเพื่อน");
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

  it("keeps the Calm Travel Ops design tokens in globals", () => {
    const css = readFileSync(join(frontendRoot, "app/globals.css"), "utf8");

    expect(css).toContain("--color-primary: #c24f16");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).toContain("--color-warning: #b45309");
  });

  it("uses Trip Plan language in product copy instead of rollout compatibility names", () => {
    const messagesRoot = join(frontendRoot, "src/i18n/messages");
    const messages = readdirSync(messagesRoot)
      .filter((entry) => entry.endsWith(".ts"))
      .map((entry) => readFileSync(join(messagesRoot, entry), "utf8"))
      .join("\n");

    expect(messages).toContain("Trip Plan");
    expect(messages).not.toMatch(/\bTrip Sheet\b/i);
    expect(messages).not.toMatch(/\bPlan Variant\b/i);
  });

  it("keeps production frontend copy on Trip Plan terminology", () => {
    const productCopy = productCopySourceRoots
      .flatMap((root) => collectProductCopyFiles(join(frontendRoot, root)))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(productCopy).toContain("Trip Plan");
    expect(productCopy).not.toMatch(/\bTrip Sheet\b/i);
    expect(productCopy).not.toMatch(/\bPlan Variant\b/i);
    expect(productCopy).not.toMatch(/\bplan variant\b/);
    expect(productCopy).not.toMatch(/\btrip sheet\b/i);
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
