import type { AccountPortalDashboardClassNames } from "./account-portal-dashboard.types";

export function accountPortalDashboardSectionClassNames(classNames: AccountPortalDashboardClassNames) {
  return {
    avatar: classNames.avatar,
    profileRow: classNames.profileRow,
    section: classNames.profileCard,
    statGrid: classNames.statGrid,
  };
}

export function accountPortalTripsSectionClassNames(classNames: AccountPortalDashboardClassNames) {
  return {
    section: classNames.historyCard,
    topline: classNames.sectionTopline,
  };
}

export function accountPortalNewTripSectionClassNames(classNames: AccountPortalDashboardClassNames) {
  return {
    card: classNames.newTripCard,
    historyCard: classNames.historyCard,
    topbar: classNames.tripBuilderTopbar,
  };
}

export function accountPortalExplorerSectionClassNames(classNames: AccountPortalDashboardClassNames) {
  return {
    section: classNames.featureCard,
    settingsGrid: classNames.settingsGrid,
    stepSummary: classNames.stepSummary,
  };
}

export function accountPortalVaultSectionClassNames(classNames: AccountPortalDashboardClassNames) {
  return {
    empty: classNames.empty,
    form: classNames.settingsForm,
    section: classNames.featureCard,
    twoCol: classNames.twoCol,
  };
}

export function accountPortalSettingsSectionClassNames(classNames: AccountPortalDashboardClassNames) {
  return {
    avatar: classNames.avatar,
    deviceList: classNames.deviceList,
    deviceRow: classNames.deviceRow,
    empty: classNames.empty,
    profilePreview: classNames.settingsProfilePreview,
    section: classNames.settingsCard,
    settingsForm: classNames.settingsForm,
    settingsGrid: classNames.settingsGrid,
    twoCol: classNames.twoCol,
  };
}
