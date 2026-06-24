import { describe, expect, it } from "vitest";
import {
  accountAccessPanelPageClassName,
  accountAccessPanelShellClassName,
} from "../account-access-panel-shell-classes";
import {
  accountAuthCardClassName,
  accountFormClassName,
  accountStepSummaryClassName,
} from "../account-access-panel-layout";
import { accountSettingsFormClassName as wizardAccountSettingsFormClassName } from "../../trip-wizard/layout/portal-trip-wizard-styles";

describe("account access panel shell classes", () => {
  it("adds account-entry page and shell modifiers", () => {
    const options = {
      isAccountEntry: true,
      isPortalEntry: false,
      isTripAccessEntry: false,
      portalSection: "dashboard" as const,
    };

    expect(accountAccessPanelPageClassName(options)).toContain("account-page--entry");
    expect(accountAccessPanelShellClassName(options)).toContain("account-shell--entry");
  });

  it("adds portal and new-trip modifiers together", () => {
    const options = {
      isAccountEntry: false,
      isPortalEntry: true,
      isTripAccessEntry: false,
      portalSection: "new-trip" as const,
    };

    expect(accountAccessPanelPageClassName(options)).toContain("account-page--portal");
    expect(accountAccessPanelPageClassName(options)).toContain("account-page--portal-new-trip");
    expect(accountAccessPanelShellClassName(options)).toContain("!w-[min(100%,1488px)]");
  });

  it("adds trip-access modifiers without account-entry modifiers", () => {
    const options = {
      isAccountEntry: false,
      isPortalEntry: false,
      isTripAccessEntry: true,
      portalSection: "dashboard" as const,
    };

    expect(accountAccessPanelPageClassName(options)).toContain("account-page--trip-access");
    expect(accountAccessPanelPageClassName(options)).not.toContain("account-page--entry");
    expect(accountAccessPanelShellClassName(options)).toContain("w-[min(100%,1120px)]");
  });

  it("owns shared account card and step summary class tokens", () => {
    expect(accountAuthCardClassName).toContain("account-auth-card");
    expect(accountAuthCardClassName).toContain("account-form");
    expect(accountStepSummaryClassName).toContain("account-step-summary");
  });

  it("shares the base account form class with trip wizard forms", () => {
    expect(wizardAccountSettingsFormClassName).toContain(accountFormClassName);
    expect(wizardAccountSettingsFormClassName).toContain("account-settings-form");
  });
});
