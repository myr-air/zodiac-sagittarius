import { enAccountPortalDashboardMessages } from "./en.account-portal.dashboard";
import { enAccountPortalPortalMessages } from "./en.account-portal.portal";
import { enAccountPortalSettingsMessages } from "./en.account-portal.settings";

export const enAccountPortalMessages = {
  portal: enAccountPortalPortalMessages,
  dashboard: enAccountPortalDashboardMessages,
  settings: enAccountPortalSettingsMessages,
} as const;
