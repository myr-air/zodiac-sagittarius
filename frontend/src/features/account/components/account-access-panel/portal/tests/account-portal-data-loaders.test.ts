import { describe, expect, it, vi } from "vitest";
import type { AccountPortalDataCache } from "../account-portal-data-cache";
import {
  accountPortalDataFailures,
  loadAccountPortalCoreData,
  loadAccountPortalData,
  mergeAccountPortalDataResults,
  type AccountPortalDataLoadResults,
} from "../account-portal-data-loaders";
import {
  accountSettings,
  accountStats,
  accountTrip,
  accountTrips,
  createAccountClient,
} from "../../testing/account-access-panel-test-clients";

const sessionToken = "account-session";

const cachedData: AccountPortalDataCache = {
  explorer: {
    destinationCount: 3,
    nextTrip: accountTrip,
    ownedTrips: 1,
    upcomingTrips: 2,
  },
  settings: accountSettings,
  stats: accountStats,
  todos: [
    {
      assigneeId: null,
      id: "todo-cached",
      kind: "booking",
      relatedItemId: null,
      status: "open",
      title: "Cached todo",
      tripId: "trip-id",
      tripName: "Seoul Spring",
      version: 1,
      visibility: "shared",
    },
  ],
  trips: [accountTrip],
  vaultItems: [
    {
      createdAt: "2026-05-30T08:00:00.000Z",
      detail: "cached",
      externalUrl: null,
      id: "vault-cached",
      kind: "note",
      source: "vault",
      title: "Cached vault",
      tripId: null,
      tripName: null,
    },
  ],
};

describe("account portal data loaders", () => {
  it("loads all portal data endpoints as settled results", async () => {
    const accountClient = createAccountClient();
    vi.mocked(accountClient.listVault).mockRejectedValueOnce(
      new Error("vault unavailable"),
    );

    const results = await loadAccountPortalData(accountClient, sessionToken);

    expect(accountClient.loadSettings).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.listTrips).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.loadStats).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.loadExplorer).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.listToDos).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.listVault).toHaveBeenCalledWith(sessionToken);
    expect(results).toHaveLength(6);
    expect(results[0]).toMatchObject({ status: "fulfilled" });
    expect(results[5]).toMatchObject({ status: "rejected" });
    expect(accountPortalDataFailures(results)).toHaveLength(1);
  });

  it("loads the core account portal data used after mutations", async () => {
    const accountClient = createAccountClient();

    await expect(
      loadAccountPortalCoreData(accountClient, sessionToken),
    ).resolves.toEqual({
      settings: accountSettings,
      stats: accountStats,
      trips: accountTrips,
    });

    expect(accountClient.loadSettings).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.listTrips).toHaveBeenCalledWith(sessionToken);
    expect(accountClient.loadStats).toHaveBeenCalledWith(sessionToken);
  });

  it("merges fulfilled endpoint results over cached fallback data", () => {
    const results: AccountPortalDataLoadResults = [
      { status: "fulfilled", value: accountSettings },
      { reason: new Error("trips unavailable"), status: "rejected" },
      { status: "fulfilled", value: accountStats },
      { reason: new Error("explorer unavailable"), status: "rejected" },
      { status: "fulfilled", value: [] },
      { reason: new Error("vault unavailable"), status: "rejected" },
    ];

    expect(mergeAccountPortalDataResults(results, cachedData)).toEqual({
      explorer: cachedData.explorer,
      settings: accountSettings,
      stats: accountStats,
      todos: [],
      trips: cachedData.trips,
      vaultItems: cachedData.vaultItems,
    });
  });
});
