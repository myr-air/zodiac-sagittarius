import { describe, expect, it } from "vitest";
import {
  accountPortalNavSection,
  accountPortalSectionIndex,
  accountPortalSectionOrder,
  accountPortalSectionStorageKey,
  accountPortalTransitionDirection,
} from "./account-portal-dashboard-state";

describe("account portal dashboard state", () => {
  it("keeps the portal section order stable for transition state", () => {
    expect(accountPortalSectionOrder).toEqual([
      "dashboard",
      "trips",
      "new-trip",
      "explorer",
      "todos",
      "vault",
      "settings",
      "sign-out",
    ]);
    expect(accountPortalSectionStorageKey).toBe("sagittarius:portal-section-index");
  });

  it("maps new-trip to the trips nav item", () => {
    expect(accountPortalNavSection("new-trip")).toBe("trips");
    expect(accountPortalNavSection("settings")).toBe("settings");
  });

  it("returns the current portal section index", () => {
    expect(accountPortalSectionIndex("dashboard")).toBe(0);
    expect(accountPortalSectionIndex("sign-out")).toBe(7);
  });

  it("detects transition direction from the previous section index", () => {
    expect(accountPortalTransitionDirection("dashboard", accountPortalSectionIndex("settings"))).toBe("back");
    expect(accountPortalTransitionDirection("settings", accountPortalSectionIndex("dashboard"))).toBe("forward");
    expect(accountPortalTransitionDirection("settings", accountPortalSectionIndex("settings"))).toBe("forward");
  });
});
