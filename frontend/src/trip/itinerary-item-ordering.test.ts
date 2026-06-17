import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  compareItineraryItemsWithinDay,
  orderHierarchyItemsForDay,
  sortItineraryItemsByDayAndHierarchy,
} from "./itinerary-item-ordering";

describe("itinerary item ordering", () => {
  it("sorts items by day, then timed order, then fallback", () => {
    const dayOneMorning = {
      ...seedTrip.itineraryItems[0],
      id: "day-one-morning",
      day: "2026-06-17",
      startTime: "09:00",
      timeMode: "fixed" as const,
      sortOrder: 300,
    };
    const dayOneEarly = {
      ...seedTrip.itineraryItems[0],
      id: "day-one-early",
      day: "2026-06-17",
      startTime: "08:00",
      timeMode: "fixed" as const,
      sortOrder: 100,
    };
    const dayOneFlexible = {
      ...seedTrip.itineraryItems[0],
      id: "day-one-flex",
      day: "2026-06-17",
      startTime: "",
      timeMode: "flexible" as const,
      sortOrder: 200,
    };
    const dayTwo = {
      ...seedTrip.itineraryItems[0],
      id: "day-two-main",
      day: "2026-06-18",
      startTime: "07:30",
      timeMode: "fixed" as const,
      sortOrder: 100,
    };

    const sorted = sortItineraryItemsByDayAndHierarchy([
      dayOneMorning,
      dayOneFlexible,
      dayOneEarly,
      dayTwo,
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "day-one-early",
      "day-one-morning",
      "day-one-flex",
      "day-two-main",
    ]);
  });

  it("orders parents before direct children within a day while preserving child order", () => {
    const parent = {
      ...seedTrip.itineraryItems[0],
      id: "parent-activity",
      day: "2026-06-18",
      startTime: "09:00",
      timeMode: "fixed" as const,
      sortOrder: 100,
    };
    const child = {
      ...seedTrip.itineraryItems[0],
      id: "child-activity",
      day: "2026-06-18",
      parentItemId: "parent-activity",
      startTime: "10:00",
      timeMode: "fixed" as const,
      sortOrder: 500,
    };
    const sibling = {
      ...seedTrip.itineraryItems[0],
      id: "sibling-activity",
      day: "2026-06-18",
      startTime: "11:00",
      timeMode: "fixed" as const,
      sortOrder: 200,
    };

    const ordered = orderHierarchyItemsForDay(
      [sibling, parent, child].slice().sort(compareItineraryItemsWithinDay),
    );

    expect(ordered.map((item) => item.id)).toEqual([
      "parent-activity",
      "child-activity",
      "sibling-activity",
    ]);
  });
});
