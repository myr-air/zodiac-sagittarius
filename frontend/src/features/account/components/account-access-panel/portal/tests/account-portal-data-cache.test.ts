import { describe, expect, it } from "vitest";
import {
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  createEmptyAccountPortalDataCache,
  getAccountPortalDataCache,
  getLatestAccountPortalDataCache,
} from "../account-portal-data-cache";

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
});
