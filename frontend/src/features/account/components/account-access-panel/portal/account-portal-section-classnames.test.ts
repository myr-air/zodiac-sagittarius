import { describe, expect, it } from "vitest";
import type { AccountPortalDashboardClassNames } from "./account-portal-dashboard.types";
import {
  accountPortalDashboardSectionClassNames,
  accountPortalExplorerSectionClassNames,
  accountPortalNewTripSectionClassNames,
  accountPortalSettingsSectionClassNames,
  accountPortalTripsSectionClassNames,
  accountPortalVaultSectionClassNames,
} from "./account-portal-section-classnames";

const classNames = {
  avatar: "avatar",
  dashboard: "dashboard",
  deviceList: "device-list",
  deviceRow: "device-row",
  empty: "empty",
  featureCard: "feature-card",
  historyCard: "history-card",
  newTripCard: "new-trip-card",
  portalContent: "portal-content",
  profileCard: "profile-card",
  profileRow: "profile-row",
  sectionTopline: "section-topline",
  settingsCard: "settings-card",
  settingsForm: "settings-form",
  settingsGrid: "settings-grid",
  settingsProfilePreview: "settings-profile-preview",
  statGrid: "stat-grid",
  stepSummary: "step-summary",
  tripBuilderTopbar: "trip-builder-topbar",
  twoCol: "two-col",
} satisfies AccountPortalDashboardClassNames;

describe("account portal section classNames", () => {
  it("maps dashboard section classes from the dashboard shell", () => {
    expect(accountPortalDashboardSectionClassNames(classNames)).toEqual({
      avatar: "avatar",
      profileRow: "profile-row",
      section: "profile-card",
      statGrid: "stat-grid",
    });
  });

  it("maps trips and new-trip section classes from their shared shell tokens", () => {
    expect(accountPortalTripsSectionClassNames(classNames)).toEqual({
      section: "history-card",
      topline: "section-topline",
    });
    expect(accountPortalNewTripSectionClassNames(classNames)).toEqual({
      card: "new-trip-card",
      historyCard: "history-card",
      topbar: "trip-builder-topbar",
    });
  });

  it("maps explorer, vault, and settings feature section classes", () => {
    expect(accountPortalExplorerSectionClassNames(classNames)).toEqual({
      section: "feature-card",
      settingsGrid: "settings-grid",
      stepSummary: "step-summary",
    });
    expect(accountPortalVaultSectionClassNames(classNames)).toEqual({
      empty: "empty",
      form: "settings-form",
      section: "feature-card",
      twoCol: "two-col",
    });
    expect(accountPortalSettingsSectionClassNames(classNames)).toEqual({
      avatar: "avatar",
      deviceList: "device-list",
      deviceRow: "device-row",
      empty: "empty",
      profilePreview: "settings-profile-preview",
      section: "settings-card",
      settingsForm: "settings-form",
      settingsGrid: "settings-grid",
      twoCol: "two-col",
    });
  });
});
