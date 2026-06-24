import { describe, expect, it } from "vitest";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { buildPromotedFoodRecommendationStop } from "./promote-food-recommendation";

describe("promote food recommendation", () => {
  it("builds a meal stop while preserving recommendation context", () => {
    const recommendation: ItineraryItem = buildTripFixtureItineraryItem({
      id: "food-rec-1",
      itemKind: "foodRecommendation",
      activity: "Dinner near the river",
      activityType: "food",
      day: "2026-06-22",
      details: { source: "local-friend" },
      endOffsetDays: undefined,
      endTime: undefined,
      note: "Reserve outdoor seats",
      parentItemId: "parent-stop",
      priority: undefined,
      timeMode: undefined,
    });

    expect(buildPromotedFoodRecommendationStop(recommendation)).toMatchObject({
      activity: "Dinner near the river",
      activityType: "food",
      day: "2026-06-22",
      details: {
        promotedFromItemId: "food-rec-1",
        source: "local-friend",
        sourceItemKind: "foodRecommendation",
      },
      endOffsetDays: 0,
      endTime: null,
      isPlanBlock: false,
      itemKind: "meal",
      note: "Reserve outdoor seats",
      parentItemId: "parent-stop",
      priority: "normal",
      saveUnresolved: true,
      status: "planned",
      timeMode: "flexible",
    });
  });

  it("ignores non-food recommendation itinerary items", () => {
    expect(buildPromotedFoodRecommendationStop(buildTripFixtureItineraryItem())).toBeNull();
  });
});
