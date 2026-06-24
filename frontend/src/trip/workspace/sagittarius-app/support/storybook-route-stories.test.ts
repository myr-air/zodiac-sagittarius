import { describe, expect, it } from "vitest";
import { appRoutes } from "@/src/routes/app-routes";
import {
  appRouteStories,
  tripOverviewAccessStory,
} from "./storybook-route-stories";
import { seedTripJoinId, storyTripId } from "./storybook-fixtures";

const expectedRouteStoryKeys = [
  "accountLogin",
  "accountNewTrip",
  "accountPortal",
  "accountPortalExplorer",
  "accountPortalMyTrips",
  "accountPortalNewTrip",
  "accountPortalSettings",
  "accountPortalSignOut",
  "accountPortalToDos",
  "accountPortalVault",
  "accountRegister",
  "accountTrips",
  "apiJoin",
  "joinWithSeedCredentials",
  "publicEntry",
  "tripAccess",
  "tripAccessWithJoinCode",
  "tripItineraryAccess",
  "tripMapAccess",
  "tripMembersAccess",
  "tripOverviewAccess",
  "tripTimelineAccess",
] as const;

describe("appRouteStories", () => {
  it("keeps the public Sagittarius app route story keys stable", () => {
    expect(Object.keys(appRouteStories)).toEqual(expectedRouteStoryKeys);
  });

  it("builds route stories with matching args and navigation", () => {
    expect(appRouteStories.joinWithSeedCredentials.args).toMatchObject({
      accessMode: "trip-access",
      dataSource: "api",
      initialJoinCode: seedTripJoinId,
      requireJoin: true,
    });
    expect(appRouteStories.joinWithSeedCredentials.parameters).toMatchObject({
      nextjs: { navigation: { pathname: appRoutes.join() } },
    });

    expect(appRouteStories.tripOverviewAccess.args).toMatchObject({
      accessMode: "trip-access",
      dataSource: "api",
      initialView: "overview",
      requireJoin: true,
      routeTripId: storyTripId,
    });
    expect(appRouteStories.tripOverviewAccess.parameters).toMatchObject({
      nextjs: { navigation: { pathname: appRoutes.tripOverview(storyTripId) } },
    });
  });

  it("keeps named story exports aligned with the route story map", () => {
    expect(tripOverviewAccessStory).toBe(appRouteStories.tripOverviewAccess);
  });
});
