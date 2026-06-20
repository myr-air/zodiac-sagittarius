import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  mergeItineraryDayItems,
  renumberItineraryDayItems,
  sortedTargetDayItemsExcluding,
} from "./itinerary-item-move-ordering";

describe("itinerary item move ordering", () => {
  it("sorts target day items and excludes the dragged item", () => {
    const planVariantId = seedTrip.activePlanVariantId;
    const first = {
      ...seedTrip.itineraryItems[0],
      id: "first",
      day: "2026-06-19",
      sortOrder: 100,
      planVariantId,
    };
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
        { ...seedTrip.itineraryItems[0], id: "a", sortOrder: 900 },
        { ...seedTrip.itineraryItems[1], id: "b", sortOrder: 100 },
      ]).map((item) => ({ id: item.id, sortOrder: item.sortOrder })),
    ).toEqual([
      { id: "a", sortOrder: 100 },
      { id: "b", sortOrder: 200 },
    ]);
  });

  it("merges reordered day items back into the original trip item list", () => {
    const original = [
      { ...seedTrip.itineraryItems[0], id: "outside", sortOrder: 100 },
      { ...seedTrip.itineraryItems[1], id: "moved", sortOrder: 200 },
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
