import { describe, expect, it } from "vitest";
import {
  buildAccountPortalDisplayedData,
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  createEmptyAccountPortalDataCache,
  getAccountPortalDataCache,
  getLatestAccountPortalDataCache,
} from "../account-portal-data-cache";
import {
  accountSettings,
  accountStats,
  accountTrip,
} from "../../../testing/account-access-panel-test-clients";
import {
  accountTodo,
  accountVaultItem,
} from "../../../fixtures/account-access-panel-api-fixtures";

describe("account portal data cache", () => {
  it("creates the default empty portal data shape", () => {
    expect(createEmptyAccountPortalDataCache()).toEqual({
      explorer: null,
      settings: null,
      stats: null,
      todos: [],
      trips: [],
      vaultItems: [],
    });
  });

  it("keeps cached portal data isolated by session token", () => {
    cacheAccountPortalData("session-a", createEmptyAccountPortalDataCache());

    expect(getAccountPortalDataCache("session-a")).toMatchObject({ trips: [] });
    expect(getLatestAccountPortalDataCache()).toMatchObject({ trips: [] });
    expect(getAccountPortalDataCache("session-b")).toBeNull();

    clearAccountPortalDataCache("session-b");
    expect(getAccountPortalDataCache("session-a")).not.toBeNull();

    clearAccountPortalDataCache("session-a");
    expect(getAccountPortalDataCache("session-a")).toBeNull();
  });

  it("builds displayed portal data from current values with cached fallbacks", () => {
    const cachedData = {
      ...createEmptyAccountPortalDataCache(),
      settings: accountSettings,
      stats: accountStats,
      todos: [accountTodo],
      trips: [accountTrip],
      vaultItems: [accountVaultItem],
    };

    expect(
      buildAccountPortalDisplayedData(createEmptyAccountPortalDataCache(), cachedData),
    ).toEqual(cachedData);

    expect(
      buildAccountPortalDisplayedData(
        {
          ...createEmptyAccountPortalDataCache(),
          todos: [],
          trips: [{ ...accountTrip, id: "fresh-trip" }],
        },
        cachedData,
      ),
    ).toMatchObject({
      settings: accountSettings,
      stats: accountStats,
      todos: [accountTodo],
      trips: [{ id: "fresh-trip" }],
      vaultItems: [accountVaultItem],
    });
  });
});
