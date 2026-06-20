import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  getTripDates,
  groupItemsByDay,
  resolveItineraryPathItems,
} from "./itinerary";
import { arrivalDay } from "./itinerary.test-support";
import {
  pathIdRain,
} from "./testing/itinerary-path-fixtures";

describe("itinerary path domain", () => {
  it("resolves trip path items with time-slot fallback to main", () => {
    const mainBreakfast = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "main-breakfast",
      pathGroupId: "group-breakfast",
      pathRole: "main" as const,
      day: "2025-05-16",
      startTime: "09:00",
      sortOrder: 100,
      activity: "Dim sum breakfast",
    };
    const mainMuseum = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
      id: "main-museum",
      pathGroupId: "group-museum",
      pathRole: "main" as const,
      day: "2025-05-16",
      startTime: "11:00",
      sortOrder: 200,
      activity: "Museum main",
    };
    const rainMuseum = {
      ...mainMuseum,
      id: "rain-museum",
      pathId: pathIdRain,
      pathRole: "alternative" as const,
      activity: "Indoor museum rain plan",
    };

    const visible = resolveItineraryPathItems([mainBreakfast, mainMuseum, rainMuseum], {
      tripPathId: pathIdRain,
    });

    expect(visible.map((item) => item.id)).toEqual(["main-breakfast", "rain-museum"]);
  });

  it("does not collapse imported main rows that accidentally share one path group", () => {
    const items = [
      {
        ...seedTrip.itineraryItems[0],
        id: "imported-main-flight",
        day: "2026-06-18",
        sortOrder: 100,
        pathGroupId: "path-group-import-batch",
        pathRole: "main" as const,
      },
      {
        ...seedTrip.itineraryItems[1],
        id: "imported-main-hotel",
        day: "2026-06-18",
        sortOrder: 200,
        pathGroupId: "path-group-import-batch",
        pathRole: "main" as const,
      },
      {
        ...seedTrip.itineraryItems[2],
        id: "imported-main-breakfast",
        day: "2026-06-19",
        sortOrder: 100,
        pathGroupId: "path-group-import-batch",
        pathRole: "main" as const,
      },
    ];

    const visible = resolveItineraryPathItems(items, { tripPathId: "main" });

    expect(visible.map((item) => item.id)).toEqual([
      "imported-main-flight",
      "imported-main-hotel",
      "imported-main-breakfast",
    ]);
  });

  it("lets day path overrides win over the whole-trip path without deleting rows", () => {
    const mainDinner = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-temple-street")!,
      id: "main-dinner",
      pathGroupId: "group-dinner",
      pathRole: "main" as const,
      day: "2025-05-17",
      startTime: "18:00",
      sortOrder: 100,
      activity: "Night market main",
    };
    const planOneDinner = {
      ...mainDinner,
      id: "plan-one-dinner",
      pathId: "path-plan-1",
      pathRole: "alternative" as const,
      activity: "Plan 1 dinner",
    };
    const rainDinner = {
      ...mainDinner,
      id: "rain-dinner",
      pathId: pathIdRain,
      pathRole: "alternative" as const,
      activity: "Rain dinner",
    };
    const items = [mainDinner, planOneDinner, rainDinner];

    const visible = resolveItineraryPathItems(items, {
      tripPathId: "path-plan-1",
      dayPathOverrides: { "2025-05-17": pathIdRain },
    });

    expect(visible.map((item) => item.id)).toEqual(["rain-dinner"]);
    expect(items.map((item) => item.id)).toEqual(["main-dinner", "plan-one-dinner", "rain-dinner"]);
  });

  it("can show all main and alternative path items for inspection", () => {
    const mainItem = {
      ...seedTrip.itineraryItems[0],
      id: "main-route",
      pathGroupId: "group-route",
      pathRole: "main" as const,
    };
    const alternativeItem = {
      ...mainItem,
      id: "slow-route",
      pathId: "path-slow",
      pathRole: "alternative" as const,
      activity: "Slow route",
    };

    expect(resolveItineraryPathItems([mainItem, alternativeItem], { showAll: true }).map((item) => item.id)).toEqual([
      "main-route",
      "slow-route",
    ]);
  });

  it("groups and sorts selected plan items by day", () => {
    const items = seedTrip.itineraryItems.filter((item) => item.planVariantId === seedTrip.activePlanVariantId);
    const groups = groupItemsByDay(items);

    expect(getTripDates(seedTrip.startDate, seedTrip.endDate)).toEqual([
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
      "2026-06-23",
    ]);
    expect(groups[0]?.day).toBe(arrivalDay);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      "item-flight-bkk-hkg",
      "item-arrive-hkg",
      "item-airport-express",
      "item-hotel-checkin",
      "item-avenue-stars",
      "item-symphony-lights",
      "item-temple-street",
    ]);
  });
});
