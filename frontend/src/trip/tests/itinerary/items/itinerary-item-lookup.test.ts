import { describe, expect, it } from "vitest";

import { findItineraryItemById } from "@/src/trip/itinerary-items";

describe("itinerary item lookup", () => {
  const items = [
    { id: "item-hotel", activity: "Hotel check-in" },
    { id: "item-dinner", activity: "Dinner" },
  ];

  it("returns the matching itinerary item", () => {
    expect(findItineraryItemById(items, "item-dinner")).toEqual({
      id: "item-dinner",
      activity: "Dinner",
    });
  });

  it("returns null for empty or missing item ids", () => {
    expect(findItineraryItemById(items, "")).toBeNull();
    expect(findItineraryItemById(items, null)).toBeNull();
    expect(findItineraryItemById(items, undefined)).toBeNull();
    expect(findItineraryItemById(items, "missing-item")).toBeNull();
  });
});
