import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace app test source boundaries", () => {
  it("keeps app test support split into API, fixture, storage, and render helpers", () => {
    const {
      sagittariusAppTestAccountApi,
      sagittariusAppTestBriefingFixtures,
      sagittariusAppTestFixtures,
      sagittariusAppTestPlanFixtures,
      sagittariusAppTestStorage,
      sagittariusAppTestSupport,
      sagittariusAppUiTest,
      sagittariusAppAccessTest,
      sagittariusAppAccountTripAccessTest,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagittariusAppTestSupport).toContain("./testing/support/sagittarius-app-account-api");
    expect(sagittariusAppTestSupport).toContain("./sagittarius-app.test-fixtures");
    expect(sagittariusAppTestSupport).toContain("./testing/support/sagittarius-app-storage");
    expect(sagittariusAppTestSupport).toContain("export function resetSagittariusAppTestEnvironment");
    expect(sagittariusAppTestSupport).toContain("window.history.pushState(null, \"\", appRoutes.home())");
    expect(sagittariusAppTestSupport).toContain("export function mockWindowLocation");
    expect(sagittariusAppTestSupport).toContain(".spyOn(window, \"location\", \"get\")");
    expect(sagittariusAppTestSupport).toContain("export async function renderApiSagittariusApp");
    expect(sagittariusAppTestSupport).toContain("export function renderApiTripAccessSagittariusApp");
    expect(sagittariusAppTestSupport).toContain("dataSource=\"api\"");
    expect(sagittariusAppTestSupport).toContain("await loginApiTrip(user)");
    [
      sagittariusAppUiTest,
      sagittariusAppAccessTest,
      sagittariusAppAccountTripAccessTest,
    ].forEach((testSource) => {
      expect(testSource).toContain("renderApiTripAccessSagittariusApp");
      expect(testSource).not.toContain('accessMode="trip-access"');
    });
    expect(sagittariusAppTestSupport).not.toContain("function dailyBriefingFixture");
    expect(sagittariusAppTestSupport).not.toContain("vi.spyOn(globalThis, \"fetch\")");
    expect(sagittariusAppTestSupport).not.toContain("Object.defineProperty(window, \"localStorage\"");
    expect(sagittariusAppTestSupport).not.toContain("createMemoryStorage");
    expect(sagittariusAppTestAccountApi).toContain("export function mockAccountPortalApiFetch");
    expect(sagittariusAppTestAccountApi).toContain("export function mockAccountTripMemberSessionFetch");
    expect(sagittariusAppTestAccountApi).toContain("accountApiRoutes.accountTripMemberSessions");
    expect(sagittariusAppTestFixtures).toContain("./testing/fixtures/sagittarius-app-briefing-fixtures");
    expect(
      sagittariusAppTestFixtures.match(/dailyBriefingFixture/g) ?? [],
    ).toHaveLength(1);
    expect(sagittariusAppTestBriefingFixtures).toContain("export function dailyBriefingFixture");
    expect(sagittariusAppTestFixtures).toContain("./testing/fixtures/sagittarius-app-plan-fixtures");
    expect(sagittariusAppTestFixtures).not.toContain("function dailyBriefingFixture");
    expect(sagittariusAppTestFixtures).not.toContain("function tripWithPlans");
    expect(sagittariusAppTestPlanFixtures).toContain("export function apiSeedTrip");
    expect(sagittariusAppTestPlanFixtures).toContain("export function apiTripWithPlans");
    expect(sagittariusAppTestPlanFixtures).toContain("export function tripWithPlans");
    expect(sagittariusAppTestPlanFixtures).toContain("export function tripWithPlansAndPlanScopedRecords");
    expect(sagittariusAppTestStorage).toContain("installLocalStorageStub");
    expect(sagittariusAppTestStorage).toContain("installSessionStorageStub");
    expect(sagittariusAppTestStorage).toContain("export function loadPersistedTripDraft");
    expect(sagittariusAppTestStorage).toContain("export function persistAccountSession");
    expect(sagittariusAppTestStorage).toContain("export function persistTripDraft");
    expect(sagittariusAppTestStorage).toContain("export function persistTripParticipantSession");
    expect(sagittariusAppTestStorage).toContain("export function persistTrustedAccountSession");
    expect(sagittariusAppTestStorage).toContain("@/src/testing/browser-storage");
    expect(sagittariusAppTestStorage).not.toContain("Object.defineProperty(window");
    expect(sagittariusAppTestStorage).not.toContain("createMemoryStorage");
  });
});
