import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";

describe("Sagittarius account architecture contracts", () => {
  it("keeps portal trip wizard model logic out of the render component", () => {
    const portalTripWizard = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard.tsx"), "utf8");
    const portalTripWizardMainPanel = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-main-panel.tsx"), "utf8");
    const portalTripWizardModel = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/use-portal-trip-wizard-model.ts"), "utf8");
    const portalTripWizardMobileState = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/use-portal-trip-wizard-mobile-state.ts"), "utf8");
    const portalTripWizardSummary = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-summary.ts"), "utf8");

    expect(portalTripWizard).toContain("./use-portal-trip-wizard-model");
    expect(portalTripWizard).toContain("./portal-trip-wizard-main-panel");
    expect(portalTripWizard).not.toContain("TripWizardDestinationStep");
    expect(portalTripWizard).not.toContain("const [countryQuery");
    expect(portalTripWizard).not.toContain("function regenerateCredentials");
    expect(portalTripWizardMainPanel).toContain("TripWizardDestinationStep");
    expect(portalTripWizardMainPanel).toContain("TripWizardReviewSummary");
    expect(portalTripWizardModel).toContain("export function usePortalTripWizardModel");
    expect(portalTripWizardModel).toContain("buildPortalTripWizardSummary");
    expect(portalTripWizardModel).toContain("usePortalTripWizardMobileState");
    expect(portalTripWizardModel).not.toContain("scrollIntoView");
    expect(portalTripWizardModel).not.toContain("wizard.status.required");
    expect(portalTripWizardModel).toContain("function regenerateCredentials");
    expect(portalTripWizardMobileState).toContain("scrollIntoView");
    expect(portalTripWizardSummary).toContain("export function buildPortalTripWizardSummary");
    expect(portalTripWizardSummary).toContain("wizard.status.required");
  });

  it("keeps trip join gate authentication state split from render composition", () => {
    const tripJoinGate = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGate.tsx"), "utf8");
    const tripJoinGateState = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/state/use-trip-join-gate-state.ts"), "utf8");
    const tripJoinGateFormState = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/state/use-trip-join-gate-form-state.ts"), "utf8");
    const tripJoinGateSubmitActions = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/submit/use-trip-join-gate-submit-actions.ts"), "utf8");

    expect(tripJoinGate).toContain("./state/use-trip-join-gate-state");
    expect(tripJoinGate).not.toContain("useState");
    expect(tripJoinGate).not.toContain("useEffect");
    expect(tripJoinGate).not.toContain("verifyTripCredentials");
    expect(tripJoinGate).not.toContain("function submitParticipant");
    expect(tripJoinGateState).toContain("export function useTripJoinGateState");
    expect(tripJoinGateState).toContain("useTripJoinGateFormState");
    expect(tripJoinGateState).toContain("useTripJoinGateSubmitActions");
    expect(tripJoinGateState).not.toContain("const [joinId");
    expect(tripJoinGateState).not.toContain("verifyTripCredentials");
    expect(tripJoinGateState).not.toContain("async function submitParticipant");
    expect(tripJoinGateFormState).toContain("export function useTripJoinGateFormState");
    expect(tripJoinGateSubmitActions).toContain("verifyTripCredentials");
    expect(tripJoinGateSubmitActions).toContain("async function submitParticipant");
  });

  it("keeps account access panel state split from render composition", () => {
    const accountPanel = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/AccountAccessPanel.tsx"), "utf8");
    const accountPanelContent = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel-content.tsx"), "utf8");
    const accountPanelState = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/use-account-access-panel-state.ts"), "utf8");

    expect(accountPanel).toContain("./use-account-access-panel-state");
    expect(accountPanel).toContain("./account-access-panel-content");
    expect(accountPanel).not.toContain("useState");
    expect(accountPanel).not.toContain("useEffect");
    expect(accountPanel).not.toContain("useAccountPortalData");
    expect(accountPanel).not.toContain("clearAccountPortalDataCache");
    expect(accountPanel).not.toContain("./EmailLoginPanel");
    expect(accountPanel).not.toContain("../trip-join-gate/TripJoinGate");
    expect(accountPanelContent).toContain("./email-login");
    expect(accountPanelContent).toContain("@/src/features/account/components/trip-join-gate");
    expect(accountPanelContent).toContain("./portal");
    expect(accountPanelState).toContain("export function useAccountAccessPanelState");
    expect(accountPanelState).toContain("useAccountPortalData");
    expect(accountPanelState).toContain("clearAccountPortalDataCache");
  });

  it("keeps account email login step navigation split from style constants", () => {
    const panelState = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/state/use-email-login-panel-state.ts"), "utf8");
    const stepNavigation = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/state/use-email-login-step-navigation.ts"), "utf8");
    const styles = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-styles.ts"), "utf8");

    expect(panelState).toContain("./use-email-login-step-navigation");
    expect(panelState).not.toContain("useState<EmailLoginAuthStep>");
    expect(stepNavigation).toContain("export function useEmailLoginStepNavigation");
    expect(stepNavigation).toContain("export type AuthTransitionDirection");
    expect(styles).toContain("./state/use-email-login-step-navigation");
    expect(styles).not.toContain('= "forward" | "back" | "mode"');
  });

});
