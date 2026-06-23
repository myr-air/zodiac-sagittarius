import { useEffect, useState } from "react";
import type {
  AccountApiClient,
  AccountExplorerSummary,
  AccountSettings,
  AccountSession,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import {
  buildAccountPortalDisplayedData,
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  getAccountPortalDataCache,
} from "./account-portal-data-cache";
import {
  accountPortalDataFailures,
  type AccountPortalDataLoadResults,
  loadAccountPortalCoreData,
  loadAccountPortalData,
  mergeAccountPortalDataResults,
} from "./account-portal-data-loaders";
import { ACCESS_ERROR_CODES, isUnauthenticated, rawErrorMessage } from "../../auth";

interface UseAccountPortalDataOptions {
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  isAccountEntry: boolean;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onError: (message: string | null) => void;
}

export function useAccountPortalData({
  accountClient,
  accountSession,
  isAccountEntry,
  onAccountSessionChange,
  onError,
}: UseAccountPortalDataOptions) {
  const initialPortalData = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const [settings, setSettings] = useState<AccountSettings | null>(() => initialPortalData?.settings ?? null);
  const [trips, setTrips] = useState<AccountTripSummary[]>(() => initialPortalData?.trips ?? []);
  const [stats, setStats] = useState<AccountTripStats | null>(() => initialPortalData?.stats ?? null);
  const [explorer, setExplorer] = useState<AccountExplorerSummary | null>(() => initialPortalData?.explorer ?? null);
  const [todos, setTodos] = useState<AccountTodoSummary[]>(() => initialPortalData?.todos ?? []);
  const [vaultItems, setVaultItems] = useState<AccountVaultItemSummary[]>(() => initialPortalData?.vaultItems ?? []);
  const currentPortalCache = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const displayedPortalData = buildAccountPortalDisplayedData(
    {
      explorer,
      settings,
      stats,
      todos,
      trips,
      vaultItems,
    },
    currentPortalCache,
  );

  useEffect(() => {
    if (!accountSession || isAccountEntry) {
      return;
    }

    let cancelled = false;
    const cachedData = getAccountPortalDataCache(accountSession.sessionToken);

    loadAccountPortalData(accountClient, accountSession.sessionToken)
      .then(([nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]) => {
        if (cancelled) return;
        const results: AccountPortalDataLoadResults = [
          nextSettings,
          nextTrips,
          nextStats,
          nextExplorer,
          nextTodos,
          nextVaultItems,
        ];
        const failures = accountPortalDataFailures(results);
        if (nextSettings.status === "fulfilled") setSettings(nextSettings.value);
        if (nextTrips.status === "fulfilled") setTrips(nextTrips.value);
        if (nextStats.status === "fulfilled") setStats(nextStats.value);
        if (nextExplorer.status === "fulfilled") setExplorer(nextExplorer.value);
        if (nextTodos.status === "fulfilled") setTodos(nextTodos.value);
        if (nextVaultItems.status === "fulfilled") setVaultItems(nextVaultItems.value);
        cacheAccountPortalData(
          accountSession.sessionToken,
          mergeAccountPortalDataResults(results, cachedData),
        );
        if (failures.some((result) => isUnauthenticated(result.reason))) {
          clearAccountPortalDataCache(accountSession.sessionToken);
          onAccountSessionChange(null);
          return;
        }
        if (failures.length) {
          onError(rawErrorMessage(failures[0].reason, ACCESS_ERROR_CODES.accountLoadFailed));
        } else {
          onError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession, isAccountEntry, onAccountSessionChange, onError]);

  async function refreshAccount(sessionToken: string) {
    const coreData = await loadAccountPortalCoreData(accountClient, sessionToken);
    setSettings(coreData.settings);
    setTrips(coreData.trips);
    setStats(coreData.stats);
    cacheAccountPortalData(sessionToken, {
      settings: coreData.settings,
      trips: coreData.trips,
      stats: coreData.stats,
      explorer,
      todos,
      vaultItems,
    });
  }

  return {
    displayedExplorer: displayedPortalData.explorer,
    displayedSettings: displayedPortalData.settings,
    displayedStats: displayedPortalData.stats,
    displayedTodos: displayedPortalData.todos,
    displayedTrips: displayedPortalData.trips,
    displayedVaultItems: displayedPortalData.vaultItems,
    refreshAccount,
    setSettings,
    setVaultItems,
  };
}
