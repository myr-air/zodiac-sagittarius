import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import {
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  getAccountPortalDataCache,
  getLatestAccountPortalDataCache,
  getPortalNavItems,
  heroDetail,
  heroTitle,
  isAccountEntryMode,
  mainLabel,
  type AccountPortalDataCache,
} from "./account-access-panel-support";

const emptyPortalData: AccountPortalDataCache = {
  explorer: null,
  settings: null,
  stats: null,
  todos: [],
  trips: [],
  vaultItems: [],
};

describe("account access panel support", () => {
  it("routes access modes to the matching hero and landmark copy", () => {
    expect(mainLabel("account-login", messages.en.access.mainLabels)).toBe(messages.en.access.mainLabels.accountLogin);
    expect(heroTitle("account-register", messages.en.access.titles)).toBe(messages.en.access.titles.accountRegister);
    expect(heroDetail("trip-access", messages.en.access.details)).toBe(messages.en.access.details.tripAccess);
    expect(isAccountEntryMode("account-login")).toBe(true);
    expect(isAccountEntryMode("account-portal")).toBe(false);
  });

  it("builds portal navigation from app routes and localized labels", () => {
    expect(getPortalNavItems(messages.en).map((item) => [item.id, item.href, item.label])).toEqual([
      ["dashboard", "/portal", messages.en.access.portal.nav.dashboard],
      ["trips", "/portal/my-trips", messages.en.access.portal.nav.trips],
      ["explorer", "/portal/explorer", messages.en.access.portal.nav.explorer],
      ["todos", "/portal/to-dos", messages.en.access.portal.nav.todos],
      ["vault", "/portal/vault", messages.en.access.portal.nav.vault],
      ["settings", "/portal/settings", messages.en.access.portal.nav.settings],
    ]);
  });

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
