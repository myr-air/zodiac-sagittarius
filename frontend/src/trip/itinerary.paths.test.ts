import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  deriveItineraryPathOptions,
  getTripDates,
  groupItemsByDay,
  itineraryItemPathFieldsForTarget,
  itineraryPathOptionsForDay,
  mainItineraryPathId,
  normalizeStopHierarchyValues,
  resolveItineraryPathItems,
  selectedItineraryPathIdForDay,
  updateItineraryPathSelection,
} from "./itinerary";
import { arrivalDay } from "./itinerary.test-support";
import {
  pathIdPlanA,
  pathIdRain,
  pathNamePlanA,
  pathNameRain,
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

  it("selects the effective itinerary path for a day", () => {
    expect(
      selectedItineraryPathIdForDay("2026-06-19", {
        tripPathId: pathIdRain,
        dayPathOverrides: { "2026-06-19": "path-food" },
      }),
    ).toBe("path-food");
    expect(
      selectedItineraryPathIdForDay("2026-06-20", {
        tripPathId: pathIdRain,
        dayPathOverrides: { "2026-06-19": "path-food" },
      }),
    ).toBe(pathIdRain);
    expect(selectedItineraryPathIdForDay("2026-06-20", {})).toBe("main");
    expect(
      selectedItineraryPathIdForDay("2026-06-20", {
        showAll: true,
        tripPathId: pathIdRain,
      }),
    ).toBe("main");
  });

  it("updates itinerary path selection state with trip, day, and show-all actions", () => {
    const currentSelection = {
      tripPathId: pathIdRain,
      dayPathOverrides: { "2026-06-19": "path-food" },
      showAll: true,
    };

    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "change-trip-path",
        pathId: "path-slow",
      }),
    ).toEqual({
      tripPathId: "path-slow",
      dayPathOverrides: { "2026-06-19": "path-food" },
      showAll: false,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "change-day-path",
        day: "2026-06-20",
        pathId: "path-museum",
      }),
    ).toEqual({
      tripPathId: pathIdRain,
      dayPathOverrides: {
        "2026-06-19": "path-food",
        "2026-06-20": "path-museum",
      },
      showAll: false,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "change-day-path",
        day: "2026-06-19",
        pathId: mainItineraryPathId,
      }),
    ).toEqual({
      tripPathId: pathIdRain,
      dayPathOverrides: { "2026-06-19": undefined },
      showAll: false,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "clear-day-path",
        day: "2026-06-19",
      }),
    ).toEqual({
      tripPathId: pathIdRain,
      dayPathOverrides: { "2026-06-19": undefined },
      showAll: true,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "clear-all-day-paths",
      }),
    ).toEqual({
      tripPathId: pathIdRain,
      dayPathOverrides: {},
      showAll: true,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "toggle-show-all-paths",
        showAll: false,
      }),
    ).toEqual({
      tripPathId: pathIdRain,
      dayPathOverrides: { "2026-06-19": "path-food" },
      showAll: false,
    });
  });

  it("builds itinerary path fields for main and alternative targets", () => {
    expect(
      itineraryItemPathFieldsForTarget("path-group-breakfast", "main"),
    ).toEqual({
      pathGroupId: "path-group-breakfast",
      pathRole: "main",
    });
    expect(
      itineraryItemPathFieldsForTarget(
        "path-group-breakfast",
        pathIdPlanA,
        pathNamePlanA,
      ),
    ).toEqual({
      pathGroupId: "path-group-breakfast",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative",
    });
  });

  it("normalizes child stop values so nested items cannot remain plan blocks", () => {
    expect(
      normalizeStopHierarchyValues({
        activity: "Nested breakfast",
        parentItemId: "item-morning",
        isPlanBlock: true,
      }),
    ).toEqual({
      activity: "Nested breakfast",
      parentItemId: "item-morning",
      isPlanBlock: false,
    });
  });

  it("preserves top-level stop plan block values", () => {
    const values = {
      activity: "Morning plan",
      parentItemId: null,
      isPlanBlock: true,
    };

    expect(normalizeStopHierarchyValues(values)).toBe(values);
    expect(normalizeStopHierarchyValues(values)).toEqual(values);
  });

  it("derives main and named path options from metadata and item fields", () => {
    const rainPath = {
      id: pathIdRain,
      tripId: seedTrip.id,
      name: pathNameRain,
      scope: "day" as const,
      day: "2025-05-16",
      createdBy: "member-aom",
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z",
    };
    const slowItem = {
      ...seedTrip.itineraryItems[0],
      pathId: "path-slow",
      pathName: "Slow morning",
      pathRole: "alternative" as const,
    };

    expect(deriveItineraryPathOptions([slowItem], [rainPath])).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: pathIdRain, name: pathNameRain, scope: "day", day: "2025-05-16" },
      { id: "path-slow", name: "Slow morning", scope: "trip" },
    ]);
  });

  it("derives generated activity sub plans as day-scoped path options", () => {
    const planAItem = {
      ...seedTrip.itineraryItems[0],
      day: "2026-06-19",
      pathGroupId: "path-group-morning",
      pathId: pathIdPlanA,
      pathName: pathNamePlanA,
      pathRole: "alternative" as const,
    };

    expect(deriveItineraryPathOptions([planAItem])).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: pathIdPlanA, name: pathNamePlanA, scope: "day", day: "2026-06-19" },
    ]);
  });

  it("filters path options to visible day scope", () => {
    const options: Parameters<typeof itineraryPathOptionsForDay>[0] = [
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
      { id: "plan-b", name: "Plan B", scope: "day", day: "2026-06-19" },
      { id: "day-plan", name: "Day Plan", scope: "day", day: "2026-06-20" },
    ];

    expect(itineraryPathOptionsForDay(options, "2026-06-19")).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
      { id: "plan-b", name: "Plan B", scope: "day", day: "2026-06-19" },
    ]);
    expect(itineraryPathOptionsForDay(options, "2026-06-20")).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: "plan-a", name: "Plan A", scope: "trip", day: "2026-06-19" },
      { id: "day-plan", name: "Day Plan", scope: "day", day: "2026-06-20" },
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
