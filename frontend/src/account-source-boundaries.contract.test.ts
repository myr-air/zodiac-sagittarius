import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius account source boundaries", () => {
  it("keeps account access, email login, portal, and trip join code split by responsibility", () => {
    const {
      accountAccessPanel,
      accountAccessChrome,
      accountTripWizardSupport,
      portalTripWizard,
      portalTripWizardMainPanel,
      portalTripWizardModel,
      portalTripWizardMobileState,
      portalTripWizardDerivedState,
      portalTripWizardActions,
      accountAuthSupport,
      emailLoginStepContent,
      tripJoinGate,
      tripJoinGateChrome,
      tripJoinGateVisual,
      tripJoinRoomForm,
      tripJoinParticipantStep,
      tripJoinGateStyles,
      tripWizardFormSections,
      accountAccessStory,
      accountAccessStorySupport,
      accountAccessTestClients,
      accountAccessTestFixtures,
      accountSettingsEditor,
      accountSettingsEditorState,
      emailLoginState,
      emailLoginAuthActions,
      emailLoginFormState,
      emailLoginSubmitActions,
      emailLoginResendCooldown,
      emailLoginPanel,
      emailLoginStepStage,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(accountAccessPanel).toContain("AccountAccessChrome");
    expect(accountAccessPanel).not.toContain("accountHeroClassName");
    expect(accountAccessPanel).not.toContain("accountModeTabsClassName");
    expect(accountAccessPanel).not.toContain("appRoutes.home()");
    expect(accountAccessChrome).toContain("export function AccountAccessChrome");
    expect(accountAccessChrome).toContain("accountHeroClassName");
    expect(accountAccessChrome).toContain("accountModeTabsClassName");
    expect(accountAccessChrome).toContain("appRoutes.home()");
    expect(accountAccessStory).toContain("./account-access-panel.stories.support");
    expect(accountAccessStory).not.toContain("AccountApiClient");
    expect(accountAccessStory).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).toContain("./account-access-panel.stories.clients");
    expect(accountAccessStorySupport).toContain("accountStoryClient");
    expect(accountAccessStorySupport).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).not.toContain("AccountSettingsUpdateRequest");
    expect(accountAccessStorySupport).toContain("export const accountLoginStoryArgs");
    expect(accountAccessStorySupport).toContain("export const portalDashboardStoryArgs");
    expect(accountAccessTestClients).toContain("./account-access-panel-test-fixtures");
    expect(accountAccessTestClients).toContain("export function createAccountClient");
    expect(accountAccessTestClients).not.toContain("export const accountSettings");
    expect(accountAccessTestClients).not.toContain("export const accountTrip");
    expect(accountAccessTestFixtures).toContain("export const accountSettings");
    expect(accountAccessTestFixtures).toContain("export const accountTrip");

    expect(accountTripWizardSupport).toContain("@/src/routes/invite-links");
    expect(accountTripWizardSupport).toContain("./account-trip-credentials");
    expect(accountTripWizardSupport).toContain("./account-trip-destinations");
    expect(accountTripWizardSupport).toContain("./account-trip-dates");
    expect(accountTripWizardSupport).not.toContain("function buildInviteLink");
    expect(accountTripWizardSupport).not.toContain("function buildInviteEmailHref");
    expect(accountTripWizardSupport).not.toContain("function routeCalendarDays");
    expect(accountTripWizardSupport).not.toContain("function tripNightCount");
    expect(accountTripWizardSupport).not.toContain("const tripCountryOptions");
    expect(accountTripWizardSupport).not.toContain("const tripCityOptions");
    expect(accountTripWizardSupport).not.toContain("function tripDestinationCards");
    expect(accountTripWizardSupport).not.toContain("function destinationRouteCode");
    expect(accountTripWizardSupport).not.toContain("function generateJoinIdForTrip");
    expect(accountTripWizardSupport).not.toContain("function generateJoinPassword");
    expect(accountTripWizardSupport).not.toContain("function randomToken");
    expect(accountTripWizardSupport).toContain("export function applyTripDestinationCities");
    expect(accountTripWizardSupport).toContain("export function applyTripCalendarDate");
    expect(portalTripWizardModel).toContain("applyTripDestinationCities");
    expect(portalTripWizardModel).toContain("applyTripCalendarDate");
    expect(portalTripWizardModel).toContain("buildPortalTripWizardDerivedState");
    expect(portalTripWizardModel).toContain("usePortalTripWizardMobileState");
    expect(portalTripWizardModel).not.toContain("scrollIntoView");
    expect(portalTripWizardModel).not.toContain("tripStepSectionClassName");
    expect(portalTripWizardModel).not.toContain("function tripStepComplete");
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
    expect(emailLoginState).toContain("./use-email-login-resend-cooldown");
    expect(emailLoginState).toContain("./use-email-login-submit-actions");
    expect(emailLoginState).not.toContain("./email-login-auth-actions");
    expect(emailLoginState).not.toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginState).not.toContain("finishPasswordLogin({");
    expect(emailLoginState).not.toContain("finishEmailLogin({");
    expect(emailLoginState).not.toContain("finishEmailCodeLogin");
    expect(emailLoginState).not.toContain("finishEmailPasswordLogin");
    expect(emailLoginState).not.toContain("finishEmailRegistrationSetup");
    expect(emailLoginState).not.toContain("signInWithEmailPasskey");
    expect(emailLoginState).not.toContain("window.setInterval");
    expect(emailLoginState).not.toContain("replace(/\\D/g");
    expect(emailLoginAuthActions).toContain("export async function finishEmailCodeLogin");
    expect(emailLoginAuthActions).toContain("export async function finishEmailPasswordLogin");
    expect(emailLoginAuthActions).toContain("export async function signInWithEmailPasskey");
    expect(emailLoginAuthActions).toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginAuthActions).not.toContain("arrayBufferToBase64Url");
    expect(emailLoginFormState).toContain("export function useEmailLoginFormState");
    expect(emailLoginFormState).toContain("function updateCode");
    expect(emailLoginSubmitActions).toContain("export function useEmailLoginSubmitActions");
    expect(emailLoginSubmitActions).toContain("./email-login-auth-actions");
    expect(emailLoginSubmitActions).toContain("finishEmailCodeLogin");
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

    expect(tripJoinGate).toContain("./trip-join-gate.support");
    expect(tripJoinGate).toContain("TripJoinGateChrome");
    expect(tripJoinGate).not.toContain("TripJoinGateVisual");
    expect(tripJoinGate).toContain("TripJoinRoomForm");
    expect(tripJoinGate).toContain("TripJoinParticipantStep");
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
    expect(tripJoinParticipantStep).toContain("participantGridClassName");
    expect(tripJoinGate).not.toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateVisual).toContain("export function TripJoinGateVisual");
    expect(tripJoinGateVisual).toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateStyles).toContain("tripAccessRightColumnClassName");
    expect(tripJoinGate).not.toContain("function tripFromJoinResponse");
    expect(tripJoinGate).not.toContain("function friendlyErrorText");
    expect(tripJoinGate).not.toContain("assertMainPlanPointerAliasesMatch");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-invite-review");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-dates-step");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-destination-step");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDestinationStepProps");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDatesStepProps");
    expect(tripWizardFormSections).not.toContain("function TripWizardInviteStep");
    expect(tripWizardFormSections).not.toContain("function TripWizardReviewSummary");
  });
});
