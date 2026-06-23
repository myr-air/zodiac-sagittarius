import { describe, expect, it } from "vitest";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  getNextChildSortOrder,
  getNextSortOrder,
} from "../../../itinerary-core";

describe("itinerary sort order helpers", () => {
  it("derives next sort order for a trip day", () => {
    expect(getNextSortOrder([], "2026-06-19")).toBe(100);
    expect(getNextSortOrder([
      buildTripFixtureItineraryItem({
        day: "2026-06-18",
        sortOrder: 500,
      }),
      buildTripFixtureItineraryItem({
        day: "2026-06-19",
        sortOrder: 100,
      }),
      buildTripFixtureItineraryItem({
        day: "2026-06-19",
        sortOrder: 250,
      }),
    ], "2026-06-19")).toBe(350);
  });

  it("derives next child sort order beneath a parent stop", () => {
    const parentItem = buildTripFixtureItineraryItem({
      id: "item-parent",
      day: "2026-06-19",
      sortOrder: 200,
    });

    expect(getNextChildSortOrder([parentItem], parentItem)).toBe(210);
    expect(getNextChildSortOrder([
      parentItem,
      buildTripFixtureItineraryItem({
        id: "item-child-a",
        day: "2026-06-19",
        parentItemId: parentItem.id,
        sortOrder: 220,
      }),
      buildTripFixtureItineraryItem({
        id: "item-other-day-child",
        day: "2026-06-20",
        parentItemId: parentItem.id,
        sortOrder: 900,
      }),
    ], parentItem)).toBe(230);
  });
});
