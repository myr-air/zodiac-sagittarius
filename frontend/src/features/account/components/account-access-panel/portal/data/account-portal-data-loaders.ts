import type {
  AccountApiClient,
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import {
  createEmptyAccountPortalDataCache,
  type AccountPortalDataCache,
} from "./account-portal-data-cache";

export type AccountPortalDataLoadResults = [
  PromiseSettledResult<AccountSettings>,
  PromiseSettledResult<AccountTripSummary[]>,
  PromiseSettledResult<AccountTripStats>,
  PromiseSettledResult<AccountExplorerSummary>,
  PromiseSettledResult<AccountTodoSummary[]>,
  PromiseSettledResult<AccountVaultItemSummary[]>,
];

export interface AccountPortalCoreData {
  settings: AccountSettings;
  stats: AccountTripStats;
  trips: AccountTripSummary[];
}

export function accountPortalDataFailures(
  results: AccountPortalDataLoadResults,
) {
  return results.filter((result) => result.status === "rejected");
}

export async function loadAccountPortalData(
  accountClient: AccountApiClient,
  sessionToken: string,
): Promise<AccountPortalDataLoadResults> {
  return Promise.allSettled([
    accountClient.loadSettings(sessionToken),
    accountClient.listTrips(sessionToken),
    accountClient.loadStats(sessionToken),
    accountClient.loadExplorer(sessionToken),
    accountClient.listToDos(sessionToken),
    accountClient.listVault(sessionToken),
  ]) as Promise<AccountPortalDataLoadResults>;
}

export async function loadAccountPortalCoreData(
  accountClient: AccountApiClient,
  sessionToken: string,
): Promise<AccountPortalCoreData> {
  const [settings, trips, stats] = await Promise.all([
    accountClient.loadSettings(sessionToken),
    accountClient.listTrips(sessionToken),
    accountClient.loadStats(sessionToken),
  ]);

  return {
    settings,
    stats,
    trips,
  };
}

export function mergeAccountPortalDataResults(
  [
    settings,
    trips,
    stats,
    explorer,
    todos,
    vaultItems,
  ]: AccountPortalDataLoadResults,
  cachedData: AccountPortalDataCache | null,
): AccountPortalDataCache {
  const fallbackData = cachedData ?? createEmptyAccountPortalDataCache();

  return {
    explorer: explorer.status === "fulfilled"
      ? explorer.value
      : fallbackData.explorer,
    settings: settings.status === "fulfilled"
      ? settings.value
      : fallbackData.settings,
    stats: stats.status === "fulfilled" ? stats.value : fallbackData.stats,
    todos: todos.status === "fulfilled" ? todos.value : fallbackData.todos,
    trips: trips.status === "fulfilled" ? trips.value : fallbackData.trips,
    vaultItems: vaultItems.status === "fulfilled"
      ? vaultItems.value
      : fallbackData.vaultItems,
  };
}
