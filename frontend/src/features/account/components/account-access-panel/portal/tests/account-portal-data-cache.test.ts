import { describe, expect, it } from "vitest";
import {
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  getAccountPortalDataCache,
  getLatestAccountPortalDataCache,
  type AccountPortalDataCache,
} from "../account-portal-data-cache";

const emptyPortalData: AccountPortalDataCache = {
  explorer: null,
  settings: null,
  stats: null,
  todos: [],
  trips: [],
  vaultItems: [],
};

describe("account portal data cache", () => {
  it("keeps cached portal data isolated by session token", () => {
    cacheAccountPortalData("session-a", emptyPortalData);

    expect(getAccountPortalDataCache("session-a")).toMatchObject({ trips: [] });
    expect(getLatestAccountPortalDataCache()).toMatchObject({ trips: [] });
    expect(getAccountPortalDataCache("session-b")).toBeNull();

    clearAccountPortalDataCache("session-b");
    expect(getAccountPortalDataCache("session-a")).not.toBeNull();

    clearAccountPortalDataCache("session-a");
    expect(getAccountPortalDataCache("session-a")).toBeNull();
  });
});
