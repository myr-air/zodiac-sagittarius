import type {
  AccountSession,
  AccountSettings,
  AccountTripStats,
} from "@/src/account/api-client";
import {
  accountPortalProfileDisplayName,
  buildAccountPortalProfileDisplay,
  type AccountPortalProfileDisplay,
} from "../profile/account-portal-profile-display";

interface AccountPortalDashboardLabels {
  fallbackName: string;
  noEmail: string;
  sessionKinds: {
    temporary: string;
    trusted: string;
  };
  stats: {
    active: string;
    claims: string;
    owned: string;
    trips: string;
  };
}

export type AccountPortalDashboardProfile = AccountPortalProfileDisplay;

export interface AccountPortalDashboardSessionBadge {
  label: string;
  tone: "success" | "warning";
}

export interface AccountPortalDashboardStatRow {
  label: string;
  value: number;
}

export function buildAccountPortalDashboardProfile(
  settings: AccountSettings | null,
  labels: Pick<AccountPortalDashboardLabels, "fallbackName" | "noEmail">,
): AccountPortalDashboardProfile {
  const displayName = accountPortalProfileDisplayName(settings?.profile.displayName, labels.fallbackName);
  return buildAccountPortalProfileDisplay({
    avatarColor: settings?.profile.avatarColor,
    displayName,
    email: settings?.profile.primaryEmail,
    noEmail: labels.noEmail,
  });
}

export function buildAccountPortalDashboardSessionBadge(
  accountSession: Pick<AccountSession, "kind">,
  labels: Pick<AccountPortalDashboardLabels, "sessionKinds">,
): AccountPortalDashboardSessionBadge {
  const isTrusted = accountSession.kind === "trusted";
  return {
    label: isTrusted ? labels.sessionKinds.trusted : labels.sessionKinds.temporary,
    tone: isTrusted ? "success" : "warning",
  };
}

export function buildAccountPortalDashboardStatRows(
  stats: AccountTripStats | null,
  labels: Pick<AccountPortalDashboardLabels, "stats">,
): AccountPortalDashboardStatRow[] {
  return [
    { label: labels.stats.trips, value: stats?.tripsTotal ?? 0 },
    { label: labels.stats.owned, value: stats?.tripsOwned ?? 0 },
    { label: labels.stats.active, value: stats?.activeTrips ?? 0 },
    { label: labels.stats.claims, value: stats?.tempClaimsCompleted ?? 0 },
  ];
}
