import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "../../workspace/contracts/workspace-source-boundaries.sources";

describe("Sagittarius account source boundaries", () => {
  it("keeps account access, email login, portal, and trip join code split by responsibility", () => {
    const {
      accountAccessPanel,
      accountAccessPanelContent,
      accountEmailLoginPanelContent,
      accountAccessChrome,
      accountAccessShellClasses,
      accountAccessPortalHandlers,
      accountAccessPortalContent,
      accountAccessModes,
      accountPortalNavItems,
      accountPortalDataCache,
      accountPortalDataLoaders,
      accountPortalExplorerSection,
      accountPortalExplorerModel,
      accountPortalMessagesEn,
      accountPortalMessagesTh,
      accountPortalDashboardClassNames,
      accountPortalNewTripSection,
      accountPortalNewTripActions,
      accountPortalNewTripState,
      accountPortalVaultSection,
      accountPortalVaultActions,
      accountPortalVaultState,
      accountTripDates,
      accountTripCredentials,
      accountTripForm,
      accountTripWizardSteps,
      portalTripWizard,
      portalTripWizardMainPanel,
      portalTripWizardModel,
      portalTripWizardModelActions,
      portalTripWizardDestinationState,
      portalTripWizardMobileState,
      portalTripWizardDerivedState,
      portalTripWizardActions,
      portalTripWizardDateActions,
      portalTripWizardAccessActions,
      portalTripWizardCredentialSync,
      accountAccessStory,
      accountAccessStoryClients,
      accountAccessStorySupport,
      accountAccessBaseFixtures,
      accountAccessApiFixtures,
      accountAccessRenderTestUtils,
      accountAccessTestClients,
      accountAccessPasskeyTestUtils,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(accountAccessPanel).toContain("AccountAccessChrome");
    expect(accountAccessPanel).toContain("export interface AccountAccessPanelProps");
    expect(accountAccessPanel).toContain("accountAccessPanelPageClassName");
    expect(accountAccessPanel).toContain("accountAccessPanelShellClassName");
    expect(accountAccessPanel).not.toContain("accountHeroClassName");
    expect(accountAccessPanel).not.toContain("accountModeTabsClassName");
    expect(accountAccessPanel).not.toContain("accountEntryPageClassName");
    expect(accountAccessPanel).not.toContain("appRoutes.home()");
    expect(accountAccessShellClasses).toContain("export function accountAccessPanelPageClassName");
    expect(accountAccessShellClasses).toContain("accountEntryPageClassName");
    expect(accountAccessPanelContent).toContain("../portal/entry/account-access-panel-portal-content");
    expect(accountAccessPanelContent).toContain("../portal/dashboard/account-portal-loading-frame");
    expect(accountAccessPanelContent).not.toContain('from "../portal"');
    expect(accountAccessPanelContent).toContain("AccountAccessPanelPortalContent");
    expect(accountAccessPanelContent).toContain("AccountPortalLoadingFrame");
    expect(accountAccessPanelContent).toContain("./account-email-login-panel-content");
    expect(accountAccessPanelContent).not.toContain('from "../email-login"');
    expect(accountEmailLoginPanelContent).toContain("../email-login/account-email-login-panel");
    expect(accountEmailLoginPanelContent).not.toContain('from "../email-login"');
    expect(accountEmailLoginPanelContent).toContain("accountAuthCardClassName");
    expect(accountEmailLoginPanelContent).toContain("export function AccountEmailLoginPanelContent");
    expect(accountAccessPanelContent).not.toContain("accountClient.logout(accountSession.sessionToken)");
    expect(accountAccessPortalContent).toContain("AccountPortalDashboard");
    expect(accountAccessPortalContent).toContain("buildAccountPortalDashboardHandlers");
    expect(accountAccessPortalContent).not.toContain("accountClient.logout(accountSession.sessionToken)");
    expect(accountAccessPortalHandlers).toContain("export function buildAccountPortalDashboardHandlers");
    expect(accountAccessPortalHandlers).toContain("export interface BuildAccountPortalDashboardHandlersOptions");
    expect(accountAccessPortalHandlers).toContain("accountClient.logout(accountSession.sessionToken)");
    expect(accountAccessChrome).toContain("export function AccountAccessChrome");
    expect(accountAccessChrome).toContain("accountHeroClassName");
    expect(accountAccessChrome).toContain("accountModeTabsClassName");
    expect(accountAccessChrome).toContain("appRoutes.home()");
    expect(accountAccessModes).toContain("export const accountAccessModeValues");
    expect(accountAccessModes).toContain("export function mainLabel");
    expect(accountPortalNavItems).toContain("export function getPortalNavItems");
    expect(accountPortalNavItems).toContain("appRoutes.portal()");
    expect(accountPortalDataCache).toContain("export function cacheAccountPortalData");
    expect(accountPortalDataCache).toContain("export function getLatestAccountPortalDataCache");
    expect(accountPortalDataLoaders).toContain("export async function loadAccountPortalData");
    expect(accountPortalDataLoaders).toContain("export function mergeAccountPortalDataResults");
    expect(accountPortalDataLoaders).toContain("Promise.allSettled");
    expect(accountPortalExplorerSection).toContain("t.access.portal.explorerSearch");
    expect(accountPortalExplorerSection).not.toContain("Search city, trip, or role");
    expect(accountPortalExplorerSection).not.toContain("Find shared trips from people in your system.");
    expect(accountPortalExplorerModel).toContain("export function buildAccountPortalExplorerTrips");
    expect(accountPortalExplorerModel).toContain("export function accountPortalExplorerPinStyle");
    expect(accountPortalMessagesEn).toContain("explorerSearch");
    expect(accountPortalMessagesEn).toContain("Search city, trip, or role");
    expect(accountPortalMessagesTh).toContain("explorerSearch");
    expect(accountPortalMessagesTh).toContain("ค้นหา city, trip หรือ role");
    expect(accountPortalDashboardClassNames).toContain("export const accountPortalDashboardClassNames");
    expect(accountPortalDashboardClassNames).toContain("accountStepSummaryClassName");
    expect(accountPortalNewTripSection).toContain("usePortalNewTripSectionActions");
    expect(accountPortalNewTripSection).not.toContain("async function submitTrip");
    expect(accountPortalNewTripActions).toContain("export function usePortalNewTripSectionActions");
    expect(accountPortalNewTripActions).toContain("async function submitTrip");
    expect(accountPortalNewTripActions).toContain("buildPortalCreatedTripShare");
    expect(accountPortalNewTripState).toContain("export function buildPortalCreatedTripShare");
    expect(accountPortalVaultSection).toContain("usePortalVaultSectionActions");
    expect(accountPortalVaultSection).not.toContain("async function submitVaultItem");
    expect(accountPortalVaultActions).toContain("export function usePortalVaultSectionActions");
    expect(accountPortalVaultActions).toContain("async function submitVaultItem");
    expect(accountPortalVaultActions).toContain("buildPortalVaultCreateRequest");
    expect(accountPortalVaultState).toContain("export function buildPortalVaultCreateRequest");
    expect(accountAccessStory).toContain("./account-access-panel.stories.support");
    expect(accountAccessStory).not.toContain("AccountApiClient");
    expect(accountAccessStory).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).toContain("./account-access-panel.stories.clients");
    expect(accountAccessStorySupport).toContain("accountStoryClient");
    expect(accountAccessStorySupport).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).not.toContain("AccountSettingsUpdateRequest");
    expect(accountAccessStorySupport).toContain("AccountAccessPanelProps");
    expect(accountAccessStorySupport).not.toContain("Parameters<typeof AccountAccessPanel>");
    expect(accountAccessStorySupport).toContain("export const accountLoginStoryArgs");
    expect(accountAccessStorySupport).toContain("export const portalDashboardStoryArgs");
    expect(accountAccessBaseFixtures).toContain("export const accountSettings");
    expect(accountAccessBaseFixtures).toContain("export const accountTrip");
    expect(accountAccessBaseFixtures).toContain("export const accountTrips");
    expect(accountAccessBaseFixtures).not.toContain("./account-access-panel-api-fixtures");
    expect(accountAccessApiFixtures).toContain("./account-access-panel-base-fixtures");
    expect(accountAccessApiFixtures).toContain("export function createTrustedAccountSession");
    expect(accountAccessApiFixtures).toContain("export const accountExplorerSummary");
    expect(accountAccessApiFixtures).toContain("export const accountTodos");
    expect(accountAccessApiFixtures).toContain("export const accountVaultItems");
    expect(accountAccessApiFixtures).toContain("export function createAccountTripCreateResponse");
    expect(accountAccessStoryClients).toContain("../fixtures/account-access-panel-api-fixtures");
    expect(accountAccessStoryClients).toContain("../fixtures/account-access-panel-base-fixtures");
    expect(accountAccessStoryClients).toContain("createTrustedAccountSession");
    expect(accountAccessStoryClients).toContain("accountExplorerSummary");
    expect(accountAccessStoryClients).not.toContain('challengeId: "passkey-challenge"');
    expect(accountAccessStoryClients).not.toContain('id: "vault-1"');
    expect(accountAccessRenderTestUtils).toContain("../AccountAccessPanel");
    expect(accountAccessRenderTestUtils).toContain("export function renderAccountAccessPanel");
    expect(accountAccessRenderTestUtils).toContain("export function renderTripBuilder");
    expect(accountAccessRenderTestUtils).toContain("./account-access-panel-test-clients");
    expect(accountAccessTestClients).toContain("../fixtures/account-access-panel-api-fixtures");
    expect(accountAccessTestClients).toContain("../fixtures/account-access-panel-base-fixtures");
    expect(accountAccessTestClients).toContain("export function createAccountClient");
    expect(accountAccessTestClients).toContain("accountExplorerSummary");
    expect(accountAccessTestClients).toContain("createAccountTripCreateResponse");
    expect(accountAccessTestClients).not.toContain("export const accountSettings");
    expect(accountAccessTestClients).not.toContain("export const accountTrip");
    expect(accountAccessTestClients).not.toContain('id: "vault-1"');
    expect(accountAccessTestClients).not.toContain('challengeId: "passkey-challenge"');
    expect(accountAccessTestClients).not.toContain("navigator.credentials");
    expect(accountAccessTestClients).not.toContain("export function stubCredentials");
    expect(accountAccessPasskeyTestUtils).toContain("export function stubCredentials");
    expect(accountAccessPasskeyTestUtils).toContain('navigator, "credentials"');

    expect(accountTripCredentials).toContain("@/src/trip/auth");
    expect(accountTripCredentials).toContain("@/src/trip/metadata");
    expect(accountTripCredentials).toContain("export function generateJoinIdForTrip");
    expect(accountTripCredentials).not.toContain("@/src/routes/invite-links");
    expect(accountTripCredentials).not.toContain("./account-trip-dates");
    expect(accountTripCredentials).not.toContain("./account-trip-form");
    expect(accountTripCredentials).not.toContain("function buildInviteLink");
    expect(accountTripCredentials).not.toContain("function buildInviteEmailHref");
    expect(accountTripCredentials).not.toContain("function routeCalendarDays");
    expect(accountTripCredentials).not.toContain("function tripNightCount");
    expect(accountTripCredentials).not.toContain("function applyTripCalendarDate");
    expect(accountTripCredentials).not.toContain("function normalizedTripForm");
    expect(accountTripCredentials).not.toContain("function applyTripDestinationCities");
    expect(accountTripCredentials).not.toContain("const tripCountryOptions");
    expect(accountTripCredentials).not.toContain("const tripCityOptions");
    expect(accountTripCredentials).not.toContain("const tripWizardSteps");
    expect(accountTripCredentials).not.toContain("function tripStepComplete");
    expect(accountTripForm).toContain("export const defaultTripForm");
    expect(accountTripForm).toContain("export function normalizedTripForm");
    expect(accountTripForm).toContain("export function applyTripDestinationCities");
    expect(accountTripDates).toContain("export function applyTripCalendarDate");
    expect(accountTripDates).toContain("export function nextTripWizardDateSelectionStep");
    expect(accountTripWizardSteps).toContain("export const tripWizardSteps");
    expect(accountTripWizardSteps).toContain("export function tripStepComplete");
    expect(portalTripWizardModel).toContain("usePortalTripWizardDateActions");
    expect(portalTripWizardModel).toContain("usePortalTripWizardAccessActions");
    expect(portalTripWizardModel).toContain("usePortalTripWizardCredentialSync");
    expect(portalTripWizardModel).not.toContain("buildPortalTripWizardCredentials");
    expect(portalTripWizardModel).not.toContain("applyPortalTripWizardCredentials");
    expect(portalTripWizardModel).toContain("buildPortalTripWizardDerivedState");
    expect(portalTripWizardModel).toContain("usePortalTripWizardDestinationState");
    expect(portalTripWizardModel).toContain("usePortalTripWizardMobileState");
    expect(portalTripWizardModel).not.toContain("scrollIntoView");
    expect(portalTripWizardModel).not.toContain("tripStepSectionClassName");
    expect(portalTripWizardModel).not.toContain("function tripStepComplete");
    expect(portalTripWizardModelActions).toContain("buildPortalTripWizardCredentials");
    expect(portalTripWizardModelActions).toContain("export function applyPortalTripWizardCredentials");
    expect(portalTripWizardDestinationState).toContain("applyTripDestinationCities");
    expect(portalTripWizardDestinationState).toContain("customTripCity");
    expect(portalTripWizardDestinationState).toContain("tripCityFromOption");
    expect(portalTripWizardDateActions).toContain("applyTripCalendarDate");
    expect(portalTripWizardDateActions).toContain("nextTripWizardDateSelectionStep");
    expect(portalTripWizardAccessActions).toContain("applyRegeneratedPortalTripWizardCredentials");
    expect(portalTripWizardCredentialSync).toContain("applyPortalTripWizardCredentials");
    expect(portalTripWizardMobileState).toContain("export function usePortalTripWizardMobileState");
    expect(portalTripWizardMobileState).toContain("scrollIntoView");
    expect(portalTripWizardMobileState).toContain("tripStepSectionClassName");
    expect(portalTripWizardDerivedState).toContain("export function buildPortalTripWizardDerivedState");
    expect(portalTripWizardDerivedState).toContain("tripStepComplete");
    expect(portalTripWizardDerivedState).toContain("routeCalendarDays");
    expect(portalTripWizard).toContain("PortalTripWizardActions");
    expect(portalTripWizard).toContain("PortalTripWizardMainPanel");
    expect(portalTripWizard).not.toContain("TripWizardDestinationStep");
    expect(portalTripWizardMainPanel).toContain("TripWizardDestinationStep");
    expect(portalTripWizardMainPanel).toContain("TripWizardReviewSummary");
    expect(portalTripWizard).not.toContain("Date.parse(`${date}T00:00:00`)");
    expect(portalTripWizard).not.toContain("appRoutes.portalMyTrips()");
    expect(portalTripWizard).not.toContain("tripWizardActionsClassName");
    expect(portalTripWizardActions).toContain("export function PortalTripWizardActions");
    expect(portalTripWizardActions).toContain("appRoutes.portalMyTrips()");
    expect(portalTripWizardActions).toContain("tripWizardActionsClassName");

    expect(portalTripWizardMainPanel).toContain("../steps/portal-trip-wizard-dates-step");
    expect(portalTripWizardMainPanel).toContain("../steps/portal-trip-wizard-destination-step");
    expect(portalTripWizardMainPanel).toContain("../steps/portal-trip-wizard-invite-review");
    expect(portalTripWizardMainPanel).toContain("../steps/portal-trip-wizard-review-summary");
    expect(portalTripWizardMainPanel).toContain("../steps/portal-trip-wizard-trip-step");
    expect(portalTripWizardMainPanel).not.toContain("../steps/portal-trip-wizard-form-sections");
  });
});
