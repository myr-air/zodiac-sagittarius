import { describe, expect, it } from "vitest";
import { appViewportStories } from "./storybook-viewport-stories";

const expectedViewportStoryKeys = [
  "desktop1024Overview",
  "desktop1024Itinerary",
  "desktop1024Timeline",
  "desktop1024Map",
  "desktop1024Members",
  "desktop1024Expenses",
  "desktop1024Bookings",
  "desktop1024Photos",
  "desktop1024Settings",
  "desktop1024Budget",
  "desktop1024Dreamer",
  "desktop1024Flexible-hunter",
  "desktop1024Route-builder",
  "desktop1024Detail-planner",
  "desktop1024Group-wrangler",
  "desktop1024On-trip-companion",
  "desktop1440Overview",
  "desktop1440Itinerary",
  "desktop1440Timeline",
  "desktop1440Map",
  "desktop1440Members",
  "desktop1440Expenses",
  "desktop1440Bookings",
  "desktop1440Photos",
  "desktop1440Settings",
  "desktop1440Budget",
  "desktop1440Dreamer",
  "desktop1440Flexible-hunter",
  "desktop1440Route-builder",
  "desktop1440Detail-planner",
  "desktop1440Group-wrangler",
  "desktop1440On-trip-companion",
  "tabletOverview",
  "tabletItinerary",
  "tabletTimeline",
  "tabletMap",
  "tabletMembers",
  "tabletExpenses",
  "tabletBookings",
  "tabletPhotos",
  "tabletSettings",
  "tabletBudget",
  "tabletDreamer",
  "tabletFlexible-hunter",
  "tabletRoute-builder",
  "tabletDetail-planner",
  "tabletGroup-wrangler",
  "tabletOn-trip-companion",
  "mobileOverview",
  "mobileItinerary",
  "mobileTimeline",
  "mobileMap",
  "mobileMembers",
  "mobileExpenses",
  "mobileBookings",
  "mobilePhotos",
  "mobileSettings",
  "mobileBudget",
  "mobileDreamer",
  "mobileFlexible-hunter",
  "mobileRoute-builder",
  "mobileDetail-planner",
  "mobileGroup-wrangler",
  "mobileOn-trip-companion",
] as const;

describe("appViewportStories", () => {
  it("keeps the public Sagittarius app viewport story keys stable", () => {
    expect(Object.keys(appViewportStories)).toEqual(expectedViewportStoryKeys);
  });

  it("builds stories with the matching view and viewport parameters", () => {
    expect(appViewportStories.mobileItinerary.args).toMatchObject({
      initialView: "itinerary",
    });
    expect(appViewportStories.mobileItinerary.parameters).toMatchObject({
      viewport: { defaultViewport: "mobile320" },
    });
    expect(appViewportStories.desktop1440Settings.args).toMatchObject({
      initialView: "settings",
    });
    expect(appViewportStories.desktop1440Settings.parameters).toMatchObject({
      viewport: { defaultViewport: "desktop1440" },
    });
  });
});
