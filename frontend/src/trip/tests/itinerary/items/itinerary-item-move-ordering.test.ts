import { describe, expect, it } from "vitest";
import {
  buildTripFixtureItineraryItem,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  mergeItineraryDayItems,
  renumberItineraryDayItems,
  sortedTargetDayItemsExcluding,
} from "../../../itinerary-items/itinerary-item-move-ordering";

describe("itinerary item move ordering", () => {
  it("sorts target day items and excludes the dragged item", () => {
    const planVariantId = tripFixture.trip.activePlanVariantId;
    const first = buildTripFixtureItineraryItem({
      id: "first",
      day: "2026-06-19",
      sortOrder: 100,
      planVariantId,
    });
    const dragged = {
      ...first,
      id: "dragged",
      sortOrder: 200,
    };
    const later = {
      ...first,
      id: "later",
      startTime: "14:00",
      sortOrder: 300,
    };

    expect(
      sortedTargetDayItemsExcluding(
        [later, dragged, first],
        planVariantId,
        "2026-06-19",
        dragged.id,
      ).map((item) => item.id),
    ).toEqual(["first", "later"]);
  });

  it("renumbers day items with stable 100-point spacing", () => {
    expect(
      renumberItineraryDayItems([
        buildTripFixtureItineraryItem({ id: "a", sortOrder: 900 }),
        buildTripFixtureItineraryItem({ id: "b", sortOrder: 100 }),
      ]).map((item) => ({ id: item.id, sortOrder: item.sortOrder })),
    ).toEqual([
      { id: "a", sortOrder: 100 },
      { id: "b", sortOrder: 200 },
    ]);
  });

  it("merges reordered day items back into the original trip item list", () => {
    const original = [
      buildTripFixtureItineraryItem({ id: "outside", sortOrder: 100 }),
      buildTripFixtureItineraryItem({ id: "moved", sortOrder: 200 }),
    ];
    const reordered = [
      { ...original[1], sortOrder: 100 },
    ];

    expect(mergeItineraryDayItems(original, reordered)).toEqual([
      original[0],
      reordered[0],
    ]);
  });
});
