import { describe, expect, it } from "vitest";
import { appRoutes, tripWorkspaceNavItems, encodeReturnTo, decodeReturnTo } from "@/src/routes/app-routes";

const labels = {
  overview: "Overview",
  itinerary: "Itinerary",
  map: "Map",
  timeline: "Timeline",
  members: "Members",
  expenses: "Expenses",
  settings: "Settings",
};

describe("app route helpers", () => {
  it("builds trip-scoped workspace paths", () => {
    expect(appRoutes.access()).toBe("/access?mode=sign-in");
    expect(appRoutes.access("register")).toBe("/access?mode=register");
    expect(appRoutes.login()).toBe("/access?mode=sign-in");
    expect(appRoutes.register()).toBe("/access?mode=register");
    expect(appRoutes.portal()).toBe("/portal");
    expect(appRoutes.portalMyTrips()).toBe("/portal/my-trips");
    expect(appRoutes.portalNewTrip()).toBe("/portal/trips/new");
    expect(appRoutes.portalExplorer()).toBe("/portal/explorer");
    expect(appRoutes.portalToDos()).toBe("/portal/to-dos");
    expect(appRoutes.portalVault()).toBe("/portal/vault");
    expect(appRoutes.portalSettings()).toBe("/portal/settings");
    expect(appRoutes.portalSignOut()).toBe("/portal/sign-out");
    expect(appRoutes.trips()).toBe("/trips");
    expect(appRoutes.tripOverview("trip 1")).toBe("/trips/trip%201");
    expect(appRoutes.tripItinerary("trip 1")).toBe("/trips/trip%201/itinerary");
    expect(appRoutes.tripMap("trip 1")).toBe("/trips/trip%201/map");
    expect(appRoutes.tripTimeline("trip 1")).toBe("/trips/trip%201/timeline");
    expect(appRoutes.tripMembers("trip 1")).toBe("/trips/trip%201/members");
    expect(appRoutes.tripExpenses("trip 1")).toBe("/trips/trip%201/expenses");
    expect(appRoutes.tripSettings("trip 1")).toBe("/trips/trip%201/settings");
    expect(appRoutes.tripOverview("018f4e80-5788-7de0-a45c-8a555d17fc2d")).toBe("/trips/AY9OgFeIfeCkXIpVXRf8LQ");
    expect(appRoutes.join()).toBe("/join");
    expect(appRoutes.join("HK-SZ-2025")).toBe("/join/HK-SZ-2025");
  });

  it("obfuscates and decodes returnTo parameter using URL-safe Base64", () => {
    const path = "/trips/018f4e80-5788-7de0-a45c-8a555d17fc2d/members";
    const encoded = encodeReturnTo(path);
    // Should not contain plain path
    expect(encoded).not.toContain("trips");
    expect(encoded).not.toContain("members");

    // Decoding should yield original path
    expect(decodeReturnTo(encoded)).toBe(path);

    // appRoutes.join should use encoded returnTo path
    const joinUrl = appRoutes.join(undefined, path);
    expect(joinUrl).toBe(`/join?rt=${encodeURIComponent(encoded)}`);
  });

  it("keeps workspace nav tied to a trip id", () => {
    expect(tripWorkspaceNavItems("trip-1", labels).map((item) => item.href)).toEqual([
      "/trips/trip-1",
      "/trips/trip-1/itinerary",
      "/trips/trip-1/map",
      "/trips/trip-1/timeline",
      "/trips/trip-1/members",
      "/trips/trip-1/expenses",
    ]);
  });
});
