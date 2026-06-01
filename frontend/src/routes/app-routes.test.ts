import { describe, expect, it } from "vitest";
import { appRoutes, tripWorkspaceNavItems } from "@/src/routes/app-routes";

const labels = {
  overview: "Overview",
  itinerary: "Itinerary",
  map: "Map",
  timeline: "Timeline",
  members: "Members",
};

describe("app route helpers", () => {
  it("builds trip-scoped workspace paths", () => {
    expect(appRoutes.login()).toBe("/login");
    expect(appRoutes.register()).toBe("/register");
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
    expect(appRoutes.join()).toBe("/join");
    expect(appRoutes.join("HK-SZ-2025")).toBe("/join/HK-SZ-2025");
  });

  it("keeps workspace nav tied to a trip id", () => {
    expect(tripWorkspaceNavItems("trip-1", labels).map((item) => item.href)).toEqual([
      "/trips/trip-1",
      "/trips/trip-1/itinerary",
      "/trips/trip-1/map",
      "/trips/trip-1/timeline",
      "/trips/trip-1/members",
    ]);
  });
});
