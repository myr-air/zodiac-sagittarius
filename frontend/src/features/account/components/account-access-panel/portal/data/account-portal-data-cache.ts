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

export function buildAccountPortalDisplayedData(
  currentData: AccountPortalDataCache,
  cachedData: AccountPortalDataCache | null,
): AccountPortalDataCache {
  return {
    explorer: currentData.explorer ?? cachedData?.explorer ?? null,
    settings: currentData.settings ?? cachedData?.settings ?? null,
    stats: currentData.stats ?? cachedData?.stats ?? null,
    todos: currentData.todos.length ? currentData.todos : cachedData?.todos ?? [],
    trips: currentData.trips.length ? currentData.trips : cachedData?.trips ?? [],
    vaultItems: currentData.vaultItems.length ? currentData.vaultItems : cachedData?.vaultItems ?? [],
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
