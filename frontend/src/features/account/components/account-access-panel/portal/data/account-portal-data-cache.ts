import type {
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
} from "@/src/account/api-client";

export interface AccountPortalDataCache {
  explorer: AccountExplorerSummary | null;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}

let accountPortalDataCache: (AccountPortalDataCache & { sessionToken: string }) | null = null;

export function createEmptyAccountPortalDataCache(): AccountPortalDataCache {
  return {
    explorer: null,
    settings: null,
    stats: null,
    todos: [],
    trips: [],
    vaultItems: [],
  };
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
