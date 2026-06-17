import type {
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import type { Messages } from "@/src/i18n/messages";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";

export type AccountAccessMode = "combined" | "account-login" | "account-register" | "account-portal" | "trip-access";

export interface AccountPortalDataCache {
  explorer: AccountExplorerSummary | null;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}

let accountPortalDataCache: (AccountPortalDataCache & { sessionToken: string }) | null = null;

export function mainLabel(accessMode: AccountAccessMode, labels: Messages["access"]["mainLabels"]): string {
  if (accessMode === "account-login") return labels.accountLogin;
  if (accessMode === "account-register") return labels.accountRegister;
  if (accessMode === "account-portal") return labels.accountPortal;
  if (accessMode === "trip-access") return labels.tripAccess;
  return labels.combined;
}

export function getPortalNavItems(t: Messages) {
  return [
    { id: "dashboard" as const, href: appRoutes.portal(), icon: "home" as const, label: t.access.portal.nav.dashboard },
    { id: "trips" as const, href: appRoutes.portalMyTrips(), icon: "calendar" as const, label: t.access.portal.nav.trips },
    { id: "explorer" as const, href: appRoutes.portalExplorer(), icon: "map" as const, label: t.access.portal.nav.explorer },
    { id: "todos" as const, href: appRoutes.portalToDos(), icon: "list" as const, label: t.access.portal.nav.todos },
    { id: "vault" as const, href: appRoutes.portalVault(), icon: "document" as const, label: t.access.portal.nav.vault },
    { id: "settings" as const, href: appRoutes.portalSettings(), icon: "settings" as const, label: t.access.portal.nav.settings },
  ];
}

export function getAccountPortalDataCache(sessionToken: string): AccountPortalDataCache | null {
  if (accountPortalDataCache?.sessionToken !== sessionToken) return null;
  return accountPortalDataCache;
}

export function getLatestAccountPortalDataCache(): AccountPortalDataCache | null {
  return accountPortalDataCache;
}

export function cacheAccountPortalData(sessionToken: string, data: AccountPortalDataCache) {
  accountPortalDataCache = { ...data, sessionToken };
}

export function clearAccountPortalDataCache(sessionToken: string) {
  if (accountPortalDataCache?.sessionToken === sessionToken) accountPortalDataCache = null;
}

export function heroTitle(accessMode: AccountAccessMode, titles: Messages["access"]["titles"]): string {
  if (accessMode === "account-login") return titles.accountLogin;
  if (accessMode === "account-register") return titles.accountRegister;
  if (accessMode === "account-portal") return titles.accountPortal;
  if (accessMode === "trip-access") return titles.tripAccess;
  return titles.combined;
}

export function heroDetail(accessMode: AccountAccessMode, details: Messages["access"]["details"]): string {
  if (accessMode === "account-login") return details.accountLogin;
  if (accessMode === "account-register") return details.accountRegister;
  if (accessMode === "account-portal") return details.accountPortal;
  if (accessMode === "trip-access") return details.tripAccess;
  return details.combined;
}

export function isAccountEntryMode(accessMode: AccountAccessMode): accessMode is "account-login" | "account-register" {
  return accessMode === "account-login" || accessMode === "account-register";
}
