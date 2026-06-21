import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import { getPortalNavItems } from "../account-portal-nav-items";

describe("account portal nav items", () => {
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
});
