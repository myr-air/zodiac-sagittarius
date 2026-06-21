import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project-contract.helpers";
import { readWorkspaceBoundarySources } from "../../workspace/contracts/workspace-source-boundaries.sources";

describe("Sagittarius account source boundaries", () => {
  it("keeps account access, email login, portal, and trip join code split by responsibility", () => {
    const {
      accountAccessPanel,
      accountAccessPanelContent,
      accountAccessChrome,
      accountAccessShellClasses,
      accountAccessPortalHandlers,
      accountAccessPortalContent,
      accountAccessModes,
      accountPortalNavItems,
      accountPortalDataCache,
      accountPortalDashboardClassNames,
      accountTripDates,
      accountTripForm,
      accountTripWizardSupport,
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
      accountAuthSupport,
      emailLoginStepContent,
      tripJoinGate,
      tripJoinGateChrome,
      tripJoinGateVisual,
      tripJoinRoomForm,
      tripJoinParticipantAuthForm,
      tripJoinParticipantStep,
      tripJoinParticipantStatus,
      tripJoinResponseMapper,
      tripJoinErrorMessage,
      tripJoinGateStyles,
      tripWizardFormSections,
      accountAccessStory,
      accountAccessStorySupport,
      accountAccessFixtures,
      accountAccessTestClients,
      accountAccessPasskeyTestUtils,
      accountSettingsEditor,
      accountSettingsEditorState,
      emailLoginState,
      emailLoginEntryActions,
      emailLoginAuthActions,
      emailLoginFormState,
      emailLoginChallengeState,
      emailLoginSubmitActions,
      emailLoginCodeRequestActions,
      emailLoginSignInActions,
      emailLoginRegistrationActions,
      emailLoginResendCooldown,
      emailLoginPanel,
      emailLoginStepStage,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(accountAccessPanel).toContain("AccountAccessChrome");
    expect(accountAccessPanel).toContain("accountAccessPanelPageClassName");
    expect(accountAccessPanel).toContain("accountAccessPanelShellClassName");
    expect(accountAccessPanel).not.toContain("accountHeroClassName");
    expect(accountAccessPanel).not.toContain("accountModeTabsClassName");
    expect(accountAccessPanel).not.toContain("accountEntryPageClassName");
    expect(accountAccessPanel).not.toContain("appRoutes.home()");
    expect(accountAccessShellClasses).toContain("export function accountAccessPanelPageClassName");
    expect(accountAccessShellClasses).toContain("accountEntryPageClassName");
    expect(accountAccessPanelContent).toContain("./portal/account-access-panel-portal-content");
    expect(accountAccessPanelContent).not.toContain("accountClient.logout(accountSession.sessionToken)");
    expect(accountAccessPortalContent).toContain("AccountPortalDashboard");
    expect(accountAccessPortalContent).toContain("buildAccountPortalDashboardHandlers");
    expect(accountAccessPortalContent).not.toContain("accountClient.logout(accountSession.sessionToken)");
    expect(accountAccessPortalHandlers).toContain("export function buildAccountPortalDashboardHandlers");
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
    expect(accountPortalDashboardClassNames).toContain("export const accountPortalDashboardClassNames");
    expect(accountPortalDashboardClassNames).toContain("accountStepSummaryClassName");
    expect(accountAccessStory).toContain("./account-access-panel.stories.support");
    expect(accountAccessStory).not.toContain("AccountApiClient");
    expect(accountAccessStory).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).toContain("./account-access-panel.stories.clients");
    expect(accountAccessStorySupport).toContain("accountStoryClient");
    expect(accountAccessStorySupport).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).not.toContain("AccountSettingsUpdateRequest");
    expect(accountAccessStorySupport).toContain("export const accountLoginStoryArgs");
    expect(accountAccessStorySupport).toContain("export const portalDashboardStoryArgs");
    expect(accountAccessFixtures).toContain("export const accountSettings");
    expect(accountAccessFixtures).toContain("export const accountTrip");
    expect(accountAccessTestClients).toContain("../fixtures/account-access-panel-fixtures");
    expect(accountAccessTestClients).toContain("export function createAccountClient");
    expect(accountAccessTestClients).not.toContain("export const accountSettings");
    expect(accountAccessTestClients).not.toContain("export const accountTrip");
    expect(accountAccessTestClients).not.toContain("navigator.credentials");
    expect(accountAccessTestClients).not.toContain("export function stubCredentials");
    expect(accountAccessPasskeyTestUtils).toContain("export function stubCredentials");
    expect(accountAccessPasskeyTestUtils).toContain('navigator, "credentials"');

    expect(accountTripWizardSupport).toContain("@/src/routes/invite-links");
    expect(accountTripWizardSupport).toContain("./account-trip-credentials");
    expect(accountTripWizardSupport).not.toContain("@/src/trip/trip-destinations");
    expect(accountTripWizardSupport).not.toContain("./account-trip-dates");
    expect(accountTripWizardSupport).not.toContain("./account-trip-form");
    expect(accountTripWizardSupport).not.toContain("function buildInviteLink");
    expect(accountTripWizardSupport).not.toContain("function buildInviteEmailHref");
    expect(accountTripWizardSupport).not.toContain("function routeCalendarDays");
    expect(accountTripWizardSupport).not.toContain("function tripNightCount");
    expect(accountTripWizardSupport).not.toContain("function applyTripCalendarDate");
    expect(accountTripWizardSupport).not.toContain("function normalizedTripForm");
    expect(accountTripWizardSupport).not.toContain("function applyTripDestinationCities");
    expect(accountTripWizardSupport).not.toContain("const tripCountryOptions");
    expect(accountTripWizardSupport).not.toContain("const tripCityOptions");
    expect(accountTripWizardSupport).not.toContain("function tripDestinationCards");
    expect(accountTripWizardSupport).not.toContain("function destinationRouteCode");
    expect(accountTripWizardSupport).not.toContain("function generateJoinIdForTrip");
    expect(accountTripWizardSupport).not.toContain("function generateJoinPassword");
    expect(accountTripWizardSupport).not.toContain("function randomToken");
    expect(accountTripWizardSupport).not.toContain("const tripWizardSteps");
    expect(accountTripWizardSupport).not.toContain("function tripStepComplete");
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

    expect(accountSettingsEditor).toContain("useAccountSettingsEditorState");
    expect(accountSettingsEditor).not.toContain("profileToForm");
    expect(accountSettingsEditor).not.toContain("function submitSettings");
    expect(accountSettingsEditorState).toContain("export function useAccountSettingsEditorState");
    expect(accountSettingsEditorState).toContain("profileToForm");
    expect(accountSettingsEditorState).toContain("function submitSettings");
    expect(accountAuthSupport).toContain("./account-access-error-codes");
    expect(accountAuthSupport).toContain("./account-passkey-support");
    expect(accountAuthSupport).toContain("buildPasskeyLoginFinishInput");
    expect(accountAuthSupport).not.toContain("accountLoadFailed:");
    expect(accountAuthSupport).not.toContain("function createPasskeyCredential");
    expect(accountAuthSupport).not.toContain("function getPasskeyCredential");
    expect(accountAuthSupport).not.toContain("function base64UrlToArrayBuffer");
    expect(accountAuthSupport).not.toContain("function arrayBufferToBase64Url");

    expect(emailLoginState).toContain("./use-email-login-form-state");
    expect(emailLoginState).toContain("./use-email-login-challenge-state");
    expect(emailLoginState).toContain("./use-email-login-entry-actions");
    expect(emailLoginState).toContain("../submit/use-email-login-submit-actions");
    expect(emailLoginState).not.toContain("./submit/email-login-auth-actions");
    expect(emailLoginState).not.toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginState).not.toContain("finishPasswordLogin({");
    expect(emailLoginState).not.toContain("finishEmailLogin({");
    expect(emailLoginState).not.toContain("finishEmailCodeLogin");
    expect(emailLoginState).not.toContain("finishEmailPasswordLogin");
    expect(emailLoginState).not.toContain("finishEmailRegistrationSetup");
    expect(emailLoginState).not.toContain("signInWithEmailPasskey");
    expect(emailLoginState).not.toContain("window.setInterval");
    expect(emailLoginState).not.toContain("window.history.replaceState");
    expect(emailLoginState).not.toContain("appRoutes.register()");
    expect(emailLoginState).not.toContain("replace(/\\D/g");
    expect(emailLoginEntryActions).toContain("export function useEmailLoginEntryActions");
    expect(emailLoginEntryActions).toContain("window.history.replaceState");
    expect(emailLoginEntryActions).toContain("appRoutes.register()");
    expect(emailLoginAuthActions).toContain("export async function finishEmailCodeLogin");
    expect(emailLoginAuthActions).toContain("export async function finishEmailPasswordLogin");
    expect(emailLoginAuthActions).toContain("export async function signInWithEmailPasskey");
    expect(emailLoginAuthActions).toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginAuthActions).not.toContain("arrayBufferToBase64Url");
    expect(emailLoginFormState).toContain("export function useEmailLoginFormState");
    expect(emailLoginFormState).toContain("function updateCode");
    expect(emailLoginChallengeState).toContain("useEmailLoginResendCooldown");
    expect(emailLoginChallengeState).toContain("export function useEmailLoginChallengeState");
    expect(emailLoginSubmitActions).toContain("export function useEmailLoginSubmitActions");
    expect(emailLoginSubmitActions).toContain("useEmailLoginCodeRequestActions");
    expect(emailLoginSubmitActions).toContain("useEmailLoginRegistrationActions");
    expect(emailLoginSubmitActions).toContain("useEmailLoginSignInActions");
    expect(emailLoginSubmitActions).not.toContain("./email-login-auth-actions");
    expect(emailLoginSubmitActions).not.toContain("./email-login-submit-errors");
    expect(emailLoginSubmitActions).not.toContain("passwordLoginErrorMessage");
    expect(emailLoginSubmitActions).not.toContain("finishEmailCodeLogin");
    expect(emailLoginCodeRequestActions).toContain("emailLoginStartError");
    expect(emailLoginSignInActions).toContain("finishEmailPasswordLogin");
    expect(emailLoginSignInActions).toContain("signInWithEmailPasskey");
    expect(emailLoginRegistrationActions).toContain("finishEmailCodeLogin");
    expect(emailLoginRegistrationActions).toContain("finishEmailRegistrationSetup");
    expect(emailLoginResendCooldown).toContain("export function useEmailLoginResendCooldown");
    expect(emailLoginResendCooldown).toContain("window.setInterval");
    expect(emailLoginStepContent).toContain("./account-email-login-credentials-step");
    expect(emailLoginStepContent).toContain("./account-email-login-methods-step");
    expect(emailLoginStepContent).toContain("./account-email-login-otp-step");
    expect(emailLoginStepContent).toContain("./account-email-login-password-step");
    expect(emailLoginStepContent).toContain("./account-email-login-setup-step");
    expect(emailLoginStepContent).not.toContain("interface EmailLoginCredentialsStepProps");
    expect(emailLoginStepContent).not.toContain("function EmailLoginCredentialsStep");
    expect(emailLoginPanel).toContain("EmailLoginStepStage");
    expect(emailLoginPanel).not.toContain("EmailLoginCredentialsStep");
    expect(emailLoginStepStage).toContain("export function EmailLoginStepStage");
    expect(emailLoginStepStage).toContain("EmailLoginStepContent");
    expect(emailLoginStepStage).not.toContain("EmailLoginCredentialsStep");
    expect(emailLoginStepContent).toContain("EmailLoginCredentialsStep");
    expect(emailLoginStepContent).not.toContain("function EmailLoginOtpStep");
    expect(emailLoginStepContent).not.toContain("function EmailLoginPasswordStep");

    expect(tripJoinGate).toContain("./model/trip-join-response-mapper");
    expect(tripJoinGate).toContain("composition/TripJoinGateChrome");
    expect(tripJoinGate).not.toContain("TripJoinGateVisual");
    expect(tripJoinGate).toContain("TripJoinRoomForm");
    expect(tripJoinGate).toContain("composition/TripJoinParticipantStep");
    expect(tripJoinGate).not.toContain("joinFormClassName");
    expect(tripJoinGate).not.toContain("participantGridClassName");
    expect(tripJoinGate).not.toContain("joinHeroClassName");
    expect(tripJoinGate).not.toContain("tripAccessRightColumnClassName");
    expect(tripJoinGateChrome).toContain("export function TripJoinGateChrome");
    expect(tripJoinGateChrome).toContain("TripJoinGateVisual");
    expect(tripJoinGateChrome).toContain("joinHeroClassName");
    expect(tripJoinGateChrome).toContain("tripAccessRightColumnClassName");
    expect(tripJoinRoomForm).toContain("export function TripJoinRoomForm");
    expect(tripJoinRoomForm).toContain("joinFormClassName");
    expect(tripJoinParticipantStep).toContain("export function TripJoinParticipantStep");
    expect(tripJoinParticipantStep).toContain("TripJoinParticipantAuthForm");
    expect(tripJoinParticipantStep).toContain("../model/trip-join-participant-status");
    expect(tripJoinParticipantStep).toContain("participantGridClassName");
    expect(tripJoinParticipantStep).not.toContain("passwordInputRowClassName");
    expect(tripJoinParticipantAuthForm).toContain(
      "export function TripJoinParticipantAuthForm",
    );
    expect(tripJoinParticipantAuthForm).toContain("passwordInputRowClassName");
    expect(tripJoinGate).not.toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateVisual).toContain("export function TripJoinGateVisual");
    expect(tripJoinGateVisual).toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateStyles).toContain("tripAccessRightColumnClassName");
    expect(tripJoinGate).not.toContain("function tripFromJoinResponse");
    expect(tripJoinGate).not.toContain("function friendlyErrorText");
    expect(tripJoinGate).not.toContain("assertMainPlanPointerAliasesMatch");
    expect(tripJoinParticipantStatus).toContain("export function participantStatusLabel");
    expect(tripJoinResponseMapper).toContain("export function tripFromJoinResponse");
    expect(tripJoinResponseMapper).toContain("assertMainPlanPointerAliasesMatch");
    expect(tripJoinErrorMessage).toContain("export function errorMessage");
    expect(tripJoinErrorMessage).toContain("function friendlyErrorText");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-invite-review");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-dates-step");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-destination-step");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDestinationStepProps");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDatesStepProps");
    expect(tripWizardFormSections).not.toContain("function TripWizardInviteStep");
    expect(tripWizardFormSections).not.toContain("function TripWizardReviewSummary");
  });
});
