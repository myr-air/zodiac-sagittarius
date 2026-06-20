import { thAccountPortalDashboardMessages } from "./th.account-portal.dashboard";
import { thAccountPortalPortalMessages } from "./th.account-portal.portal";
import { thAccountPortalSettingsMessages } from "./th.account-portal.settings";

export const thAccountPortalMessages = {
  portal: thAccountPortalPortalMessages,
  dashboard: thAccountPortalDashboardMessages,
  settings: thAccountPortalSettingsMessages,
} as const;
