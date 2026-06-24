import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "../../workspace/contracts/workspace-source-boundaries.sources";

describe("Sagittarius account trip wizard source boundaries", () => {
  it("keeps trip creation form, credentials, wizard state, and shell split by responsibility", () => {
    const {
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
    } = readWorkspaceBoundarySources(frontendRoot);

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
    expect(portalTripWizardModelActions).toContain(
      "export function applyPortalTripWizardCredentials",
    );
    expect(portalTripWizardDestinationState).toContain("applyTripDestinationCities");
    expect(portalTripWizardDestinationState).toContain("customTripCity");
    expect(portalTripWizardDestinationState).toContain("tripCityFromOption");
    expect(portalTripWizardDateActions).toContain("applyTripCalendarDate");
    expect(portalTripWizardDateActions).toContain(
      "nextTripWizardDateSelectionStep",
    );
    expect(portalTripWizardAccessActions).toContain(
      "applyRegeneratedPortalTripWizardCredentials",
    );
    expect(portalTripWizardCredentialSync).toContain(
      "applyPortalTripWizardCredentials",
    );
    expect(portalTripWizardMobileState).toContain(
      "export function usePortalTripWizardMobileState",
    );
    expect(portalTripWizardMobileState).toContain("scrollIntoView");
    expect(portalTripWizardMobileState).toContain("tripStepSectionClassName");
    expect(portalTripWizardDerivedState).toContain(
      "export function buildPortalTripWizardDerivedState",
    );
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

    expect(portalTripWizardMainPanel).toContain(
      "../steps/portal-trip-wizard-dates-step",
    );
    expect(portalTripWizardMainPanel).toContain(
      "../steps/portal-trip-wizard-destination-step",
    );
    expect(portalTripWizardMainPanel).toContain(
      "../steps/portal-trip-wizard-invite-review",
    );
    expect(portalTripWizardMainPanel).toContain(
      "../steps/portal-trip-wizard-review-summary",
    );
    expect(portalTripWizardMainPanel).toContain(
      "../steps/portal-trip-wizard-trip-step",
    );
    expect(portalTripWizardMainPanel).not.toContain(
      "../steps/portal-trip-wizard-form-sections",
    );
  });
});
