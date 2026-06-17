import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import {
  appendItineraryItemPlacement,
  appendItineraryItemToTrip,
  getNowNext,
  buildItineraryCommitmentsByItemId,
  buildItineraryItemDraft,
  buildItineraryView,
  buildUpdatedItineraryItem,
  deleteItineraryItemFromTrip,
  deriveItineraryPathOptions,
  itineraryItemPathFieldsForTarget,
  hasDescendantItem,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  mainItineraryPathId,
  mergeCreatedItineraryItemIntoTrip,
  mergeUpdatedItineraryBranchIntoTrip,
  normalizeStopHierarchyValues,
  replaceItineraryItem,
  replaceItineraryItems,
  resolveItineraryPathItems,
  getTripDates,
  getNextChildSortOrder,
  getNextSortOrder,
  groupItemsByDay,
  parseTime,
  formatDayLabel,
  sortItemsForDay,
  selectedItineraryPathIdForDay,
  updateItineraryPathSelection,
  itineraryPathOptionsForDay,
  validateItineraryItem,
} from "./itinerary";
import { createLocalTripRepository } from "./repository";
import {
  approveSuggestion,
  createLocalEditSuggestion,
  detectSuggestionConflict,
  rejectSuggestionById,
  replaceSuggestionById,
} from "./suggestions";
import type { Suggestion } from "./types";

describe("itinerary planning domain", () => {
  const tripDates = getTripDates(seedTrip.startDate, seedTrip.endDate);
  const arrivalDay = tripDates[0] ?? seedTrip.startDate;
  const hongKongDay = tripDates[1] ?? seedTrip.startDate;
  const shenzhenDay = tripDates[2] ?? seedTrip.endDate;

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
      pathId: "path-rain",
      pathRole: "alternative" as const,
      activity: "Indoor museum rain plan",
    };

    const visible = resolveItineraryPathItems([mainBreakfast, mainMuseum, rainMuseum], {
      tripPathId: "path-rain",
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
      pathId: "path-rain",
      pathRole: "alternative" as const,
      activity: "Rain dinner",
    };
    const items = [mainDinner, planOneDinner, rainDinner];

    const visible = resolveItineraryPathItems(items, {
      tripPathId: "path-plan-1",
      dayPathOverrides: { "2025-05-17": "path-rain" },
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
        tripPathId: "path-rain",
        dayPathOverrides: { "2026-06-19": "path-food" },
      }),
    ).toBe("path-food");
    expect(
      selectedItineraryPathIdForDay("2026-06-20", {
        tripPathId: "path-rain",
        dayPathOverrides: { "2026-06-19": "path-food" },
      }),
    ).toBe("path-rain");
    expect(selectedItineraryPathIdForDay("2026-06-20", {})).toBe("main");
    expect(
      selectedItineraryPathIdForDay("2026-06-20", {
        showAll: true,
        tripPathId: "path-rain",
      }),
    ).toBe("main");
  });

  it("updates itinerary path selection state with trip, day, and show-all actions", () => {
    const currentSelection = {
      tripPathId: "path-rain",
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
      tripPathId: "path-rain",
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
      tripPathId: "path-rain",
      dayPathOverrides: { "2026-06-19": undefined },
      showAll: false,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "clear-day-path",
        day: "2026-06-19",
      }),
    ).toEqual({
      tripPathId: "path-rain",
      dayPathOverrides: { "2026-06-19": undefined },
      showAll: true,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "clear-all-day-paths",
      }),
    ).toEqual({
      tripPathId: "path-rain",
      dayPathOverrides: {},
      showAll: true,
    });
    expect(
      updateItineraryPathSelection(currentSelection, {
        type: "toggle-show-all-paths",
        showAll: false,
      }),
    ).toEqual({
      tripPathId: "path-rain",
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
        "path-2026-06-19-sub-a",
        "Plan A",
      ),
    ).toEqual({
      pathGroupId: "path-group-breakfast",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
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
      id: "path-rain",
      tripId: seedTrip.id,
      name: "Rain plan",
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
      { id: "path-rain", name: "Rain plan", scope: "day", day: "2025-05-16" },
      { id: "path-slow", name: "Slow morning", scope: "trip" },
    ]);
  });

  it("derives generated activity sub plans as day-scoped path options", () => {
    const planAItem = {
      ...seedTrip.itineraryItems[0],
      day: "2026-06-19",
      pathGroupId: "path-group-morning",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };

    expect(deriveItineraryPathOptions([planAItem])).toEqual([
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
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

  it("derives next sort order for a trip day", () => {
    expect(getNextSortOrder([], "2026-06-19")).toBe(100);
    expect(getNextSortOrder([
      {
        ...seedTrip.itineraryItems[0],
        day: "2026-06-18",
        sortOrder: 500,
      },
      {
        ...seedTrip.itineraryItems[1],
        day: "2026-06-19",
        sortOrder: 100,
      },
      {
        ...seedTrip.itineraryItems[2],
        day: "2026-06-19",
        sortOrder: 250,
      },
    ], "2026-06-19")).toBe(350);
  });

  it("derives next child sort order beneath a parent stop", () => {
    const parentItem = {
      ...seedTrip.itineraryItems[0],
      id: "item-parent",
      day: "2026-06-19",
      sortOrder: 200,
    };

    expect(getNextChildSortOrder([parentItem], parentItem)).toBe(210);
    expect(getNextChildSortOrder([
      parentItem,
      {
        ...seedTrip.itineraryItems[1],
        id: "item-child-a",
        day: "2026-06-19",
        parentItemId: parentItem.id,
        sortOrder: 220,
      },
      {
        ...seedTrip.itineraryItems[2],
        id: "item-other-day-child",
        day: "2026-06-20",
        parentItemId: parentItem.id,
        sortOrder: 900,
      },
    ], parentItem)).toBe(230);
  });

  it("builds new itinerary item drafts with target path fields", () => {
    const nextItem = buildItineraryItemDraft(
      {
        activity: "Museum",
        activityType: "attraction",
        day: "2026-06-19",
        details: { ticket: "onsite" },
        durationMinutes: 90,
        endOffsetDays: 0,
        endTime: null,
        isPlanBlock: false,
        itemKind: "activity",
        note: "Buy ticket",
        parentItemId: null,
        place: "Central",
        priority: "normal",
        startTime: "10:00",
        status: "planned",
        timeMode: "scheduled",
        transportation: "MTR",
      },
      {
        address: "Central, Hong Kong",
        coordinates: { lat: 22.281, lng: 114.159 },
        createdBy: "member-aom",
        mapLink: "https://maps.example/museum",
        nextItemId: "item-local-1",
        pathId: "path-rain-day",
        pathName: "Rain day",
        planItems: seedTrip.itineraryItems,
        selectedTripPlanId: seedTrip.activePlanVariantId,
        trip: seedTrip,
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    );

    expect(nextItem).toMatchObject({
      id: "item-local-1",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      pathGroupId: "path-group-item-local-1",
      pathId: "path-rain-day",
      pathName: "Rain day",
      pathRole: "alternative",
      parentItemId: null,
      linkLabel: "แผนที่",
      mapLink: "https://maps.example/museum",
      address: "Central, Hong Kong",
      createdBy: "member-aom",
      updatedAt: "2026-06-16T00:00:00.000Z",
      version: 1,
    });
    expect(nextItem.sortOrder).toBeGreaterThan(0);
  });

  it("builds child itinerary item drafts by inheriting the parent path", () => {
    const parentItem = {
      ...seedTrip.itineraryItems[0],
      pathGroupId: "path-group-parent",
      pathId: "path-parent",
      pathName: "Parent path",
      pathRole: "alternative" as const,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: [parentItem, ...seedTrip.itineraryItems.slice(1)],
    };
    const child = buildItineraryItemDraft(
      {
        activity: "Coffee stop",
        activityType: "food",
        day: parentItem.day,
        details: {},
        durationMinutes: 30,
        endOffsetDays: 0,
        endTime: null,
        isPlanBlock: false,
        itemKind: "meal",
        note: "",
        parentItemId: parentItem.id,
        place: "Cafe",
        priority: "normal",
        startTime: "11:00",
        status: "planned",
        timeMode: "scheduled",
        transportation: "walk",
      },
      {
        address: "Cafe address",
        coordinates: undefined,
        createdBy: "member-aom",
        mapLink: "https://maps.example/cafe",
        nextItemId: "item-child",
        pathId: mainItineraryPathId,
        planItems: trip.itineraryItems,
        selectedTripPlanId: seedTrip.activePlanVariantId,
        trip,
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    );

    expect(child).toMatchObject({
      id: "item-child",
      parentItemId: parentItem.id,
      pathGroupId: "path-group-parent",
      pathId: "path-parent",
      pathName: "Parent path",
      pathRole: "alternative",
      planVariantId: parentItem.planVariantId,
    });
    expect(child.sortOrder).toBe(parentItem.sortOrder + 10);
  });

  it("appends itinerary items to trips without branch side effects", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      id: "item-appended",
      activity: "Appended item",
    };

    const nextTrip = appendItineraryItemToTrip(seedTrip, item);
    const placement = appendItineraryItemPlacement(seedTrip, item);

    expect(nextTrip).not.toBe(seedTrip);
    expect(nextTrip.itineraryItems.at(-1)).toEqual(item);
    expect(seedTrip.itineraryItems.some((candidate) => candidate.id === item.id)).toBe(false);
    expect(placement).toEqual({
      trip: nextTrip,
      item,
      changedExistingItems: [],
    });
  });

  it("merges API-created itinerary items with placement path fields and patched branch items", () => {
    const patchedExistingItem = {
      ...seedTrip.itineraryItems[0],
      activity: "Patched branch item",
      version: seedTrip.itineraryItems[0].version + 1,
    };
    const placementItem = {
      ...seedTrip.itineraryItems[1],
      id: "item-created-draft",
      pathGroupId: "path-group-created",
      pathId: "path-created",
      pathName: "Created path",
      pathRole: "alternative" as const,
    };
    const createdItem = {
      ...placementItem,
      id: "item-created-api",
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
      version: 1,
    };

    const nextTrip = mergeCreatedItineraryItemIntoTrip(
      seedTrip,
      createdItem,
      { item: placementItem },
      [patchedExistingItem],
    );

    expect(
      nextTrip.itineraryItems.find((item) => item.id === patchedExistingItem.id),
    ).toMatchObject({
      activity: "Patched branch item",
      version: patchedExistingItem.version,
    });
    expect(nextTrip.itineraryItems.at(-1)).toMatchObject({
      id: "item-created-api",
      pathGroupId: "path-group-created",
      pathId: "path-created",
      pathName: "Created path",
      pathRole: "alternative",
    });
  });

  it("merges updated itinerary branch placement with patched API items first", () => {
    const editedItem = {
      ...seedTrip.itineraryItems[0],
      activity: "Edited item",
      pathId: "path-edited",
    };
    const branchChangedItem = {
      ...seedTrip.itineraryItems[1],
      activity: "Branch placement change",
      pathId: "path-branch",
    };
    const patchedBranchItem = {
      ...branchChangedItem,
      activity: "API patched branch change",
      version: branchChangedItem.version + 1,
    };
    const placement = {
      trip: {
        ...seedTrip,
        itineraryItems: seedTrip.itineraryItems.map((item) =>
          item.id === editedItem.id
            ? editedItem
            : item.id === branchChangedItem.id
            ? branchChangedItem
            : item,
        ),
      },
      item: editedItem,
      changedExistingItems: [branchChangedItem],
    };

    const nextTrip = mergeUpdatedItineraryBranchIntoTrip(
      seedTrip,
      editedItem.id,
      placement,
      [patchedBranchItem],
    );

    expect(nextTrip.itineraryItems.find((item) => item.id === editedItem.id)).toMatchObject({
      activity: "Edited item",
      pathId: "path-edited",
    });
    expect(
      nextTrip.itineraryItems.find((item) => item.id === branchChangedItem.id),
    ).toMatchObject({
      activity: "API patched branch change",
      pathId: "path-branch",
      version: patchedBranchItem.version,
    });
  });

  it("builds updated itinerary items from local edit values", () => {
    const item = seedTrip.itineraryItems[0];
    const updated = buildUpdatedItineraryItem(
      item,
      {
        activity: "Updated local activity",
        activityType: "food",
        day: "2026-06-20",
        details: { reservationName: "Aom" },
        durationMinutes: 45,
        endOffsetDays: 1,
        endTime: "12:30",
        isPlanBlock: false,
        itemKind: "meal",
        note: "Updated note",
        parentItemId: null,
        place: "Updated place",
        priority: "high",
        startTime: "11:45",
        status: "booked",
        timeMode: "scheduled",
        transportation: "walk",
      },
      {
        address: "Updated address",
        coordinates: { lat: 22.3, lng: 114.2 },
        mapLink: "https://maps.example/updated",
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    );

    expect(updated).toMatchObject({
      id: item.id,
      tripId: item.tripId,
      day: "2026-06-20",
      parentItemId: null,
      itemKind: "meal",
      activity: "Updated local activity",
      activityType: "food",
      place: "Updated place",
      mapLink: "https://maps.example/updated",
      address: "Updated address",
      coordinates: { lat: 22.3, lng: 114.2 },
      durationMinutes: 45,
      transportation: "walk",
      details: { reservationName: "Aom" },
      note: "Updated note",
      updatedAt: "2026-06-16T00:00:00.000Z",
      version: item.version + 1,
    });
  });

  it("replaces one itinerary item without changing other trip records", () => {
    const item = seedTrip.itineraryItems[0]!;
    const updatedItem = { ...item, activity: "Updated activity" };

    const nextTrip = replaceItineraryItem(seedTrip, updatedItem);

    expect(nextTrip.itineraryItems.find((candidate) => candidate.id === item.id)).toEqual(updatedItem);
    expect(nextTrip.itineraryItems).toHaveLength(seedTrip.itineraryItems.length);
  });

  it("replaces multiple itinerary items without changing unrelated items", () => {
    const firstItem = seedTrip.itineraryItems[0]!;
    const secondItem = seedTrip.itineraryItems[1]!;
    const updatedFirst = { ...firstItem, activity: "Updated first activity" };
    const updatedSecond = { ...secondItem, activity: "Updated second activity" };

    const nextTrip = replaceItineraryItems(seedTrip, [
      updatedFirst,
      updatedSecond,
    ]);

    expect(
      nextTrip.itineraryItems.find((candidate) => candidate.id === firstItem.id),
    ).toEqual(updatedFirst);
    expect(
      nextTrip.itineraryItems.find(
        (candidate) => candidate.id === secondItem.id,
      ),
    ).toEqual(updatedSecond);
    expect(nextTrip.itineraryItems).toHaveLength(seedTrip.itineraryItems.length);
  });

  it("deletes an itinerary item and removes expenses linked to it", () => {
    const item = seedTrip.itineraryItems[0]!;
    const linkedExpense = {
      ...seedTrip.expenses[0]!,
      id: "expense-linked-item",
      itineraryItemId: item.id,
    };
    const unrelatedExpense = {
      ...seedTrip.expenses[0]!,
      id: "expense-unrelated-item",
      itineraryItemId: "other-item",
    };
    const trip = {
      ...seedTrip,
      expenses: [linkedExpense, unrelatedExpense],
    };

    const nextTrip = deleteItineraryItemFromTrip(trip, item.id);

    expect(nextTrip.itineraryItems.some((candidate) => candidate.id === item.id)).toBe(false);
    expect(nextTrip.expenses).toEqual([unrelatedExpense]);
  });

  it("moves an itinerary item before a target and reorders the target day", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const firstItem = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const secondItem = seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!;

    const nextTrip = moveTripItem(seedTrip, secondItem.id, firstItem.id, planVariantId, updatedAt);
    const dayItems = nextTrip?.itineraryItems
      .filter((item) => item.day === firstItem.day && item.planVariantId === planVariantId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    expect(dayItems?.[0]).toMatchObject({
      id: secondItem.id,
      day: firstItem.day,
      parentItemId: firstItem.parentItemId ?? null,
      sortOrder: 100,
      updatedAt,
      version: secondItem.version + 1,
    });
    expect(dayItems?.[1]).toMatchObject({ id: firstItem.id, sortOrder: 200 });
  });

  it("moves an itinerary item to the end of another day and clears its parent", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const draggedItem = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      parentItemId: "item-parent",
    };
    const trip = {
      ...seedTrip,
      itineraryItems: seedTrip.itineraryItems.map((item) =>
        item.id === draggedItem.id ? draggedItem : item,
      ),
    };

    const nextTrip = moveTripItemToDay(trip, draggedItem.id, shenzhenDay, planVariantId, updatedAt);
    const movedItem = nextTrip?.itineraryItems.find((item) => item.id === draggedItem.id);

    expect(movedItem).toMatchObject({
      day: shenzhenDay,
      parentItemId: null,
      updatedAt,
      version: draggedItem.version + 1,
    });
    expect(movedItem?.sortOrder).toBeGreaterThan(0);
  });

  it("moves an itinerary item inside a plan block after existing children", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const planBlock = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const child = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
      id: "item-existing-child",
      parentItemId: planBlock.id,
      sortOrder: 200,
    };
    const draggedItem = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-pacific-place")!,
      id: "item-dragged-activity",
      sortOrder: 300,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: [planBlock, child, draggedItem],
    };

    const nextTrip = moveTripItemIntoPlanBlock(
      trip,
      draggedItem.id,
      planBlock.id,
      planVariantId,
      updatedAt,
    );
    const movedItem = nextTrip?.itineraryItems.find((item) => item.id === draggedItem.id);
    const orderedIds = nextTrip?.itineraryItems
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.id);

    expect(movedItem).toMatchObject({
      parentItemId: planBlock.id,
      day: planBlock.day,
      sortOrder: 300,
      updatedAt,
      version: draggedItem.version + 1,
    });
    expect(orderedIds).toEqual([planBlock.id, child.id, draggedItem.id]);
  });

  it("rejects hierarchy moves that would nest a plan block under a child or create a cycle", () => {
    const updatedAt = "2026-06-16T00:00:00.000Z";
    const planVariantId = seedTrip.activePlanVariantId;
    const planBlock = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-plan-block",
      isPlanBlock: true,
      sortOrder: 100,
    };
    const child = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
      id: "item-child",
      parentItemId: planBlock.id,
      sortOrder: 200,
    };
    const grandchild = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-pacific-place")!,
      id: "item-grandchild",
      parentItemId: child.id,
      sortOrder: 300,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: [planBlock, child, grandchild],
    };

    expect(hasDescendantItem(trip.itineraryItems, planBlock.id, grandchild.id)).toBe(true);
    expect(moveTripItem(trip, planBlock.id, child.id, planVariantId, updatedAt)).toBeNull();
    expect(moveTripItemIntoPlanBlock(trip, planBlock.id, child.id, planVariantId, updatedAt)).toBeNull();
  });

  it("builds a shared itinerary view with sorted items and warning totals", () => {
    const selectedItems = [
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-victoria-peak")!,
        id: "item-overlap-a",
        day: hongKongDay,
        sortOrder: 300,
        startTime: "09:30",
        durationMinutes: 45,
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
        id: "item-overlap-b",
        day: hongKongDay,
        sortOrder: 100,
        startTime: "09:00",
        durationMinutes: 60,
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-pacific-place")!,
        id: "item-safe-stop",
        day: hongKongDay,
        sortOrder: 200,
        startTime: "11:00",
        durationMinutes: 30,
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-temple-street")!,
        id: "item-invalid-fields",
        day: hongKongDay,
        sortOrder: 400,
        startTime: "24:99",
        durationMinutes: 0,
        mapLink: " ",
        transportation: " ",
      },
      {
        ...seedTrip.itineraryItems.find((item) => item.id === "item-checkout")!,
        id: "item-other-day",
      },
    ];

    const view = buildItineraryView(selectedItems);

    expect(view.sortedItems.map((item) => item.id)).toEqual([
      "item-overlap-b",
      "item-overlap-a",
      "item-safe-stop",
      "item-invalid-fields",
      "item-other-day",
    ]);
    expect(view.dayGroups.map((group) => ({
      day: group.day,
      warningCount: group.warningCount,
      ids: group.items.map((item) => item.id),
    }))).toEqual([
      {
        day: hongKongDay,
        warningCount: 6,
        ids: ["item-overlap-b", "item-overlap-a", "item-safe-stop", "item-invalid-fields"],
      },
      {
        day: shenzhenDay,
        warningCount: 0,
        ids: ["item-other-day"],
      },
    ]);
    expect(view.routeDayStats).toEqual([
      {
        day: hongKongDay,
        itemCount: 4,
        coordinateItemCount: 4,
        warningCount: 6,
      },
      {
        day: shenzhenDay,
        itemCount: 1,
        coordinateItemCount: 1,
        warningCount: 0,
      },
    ]);
  });

  it("summarizes linked bookings, expenses, notes, and open tasks by itinerary item", () => {
    const commitments = buildItineraryCommitmentsByItemId({
      bookingDocs: [
        {
          relatedItineraryItemIds: ["item-dimdim", "item-peak"],
        },
        {
          relatedItineraryItemIds: ["item-dimdim"],
        },
      ],
      expenses: [
        { itineraryItemId: "item-dimdim" },
        { itineraryItemId: null },
      ],
      stopNotes: [
        { itemId: "item-dimdim" },
        { itemId: "item-peak" },
      ],
      tasks: [
        { relatedItemId: "item-dimdim", status: "open" },
        { relatedItemId: "item-dimdim", status: "done" },
        { relatedItemId: "item-peak", status: "open" },
      ],
    });

    expect(commitments).toEqual({
      "item-dimdim": {
        bookingCount: 2,
        expenseCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
      "item-peak": {
        bookingCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
    });
  });

  it("keeps invalid field warning totals stable in shared derive", () => {
    const invalidDayItem = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-invalid-fields-only",
      day: hongKongDay,
      sortOrder: 999,
      startTime: " ",
      durationMinutes: 0,
      mapLink: " ",
      transportation: " ",
    };

    const view = buildItineraryView([invalidDayItem]);

    expect(view.warningCount).toBe(4);
    expect(view.dayGroups[0]?.warningCount).toBe(4);
  });

  it("falls back for invalid trip dates and invalid display days", () => {
    expect(getTripDates("bad-date", "2026-06-23")).toEqual(["bad-date"]);
    expect(getTripDates("2026-06-23", "2025-05-21")).toEqual(["2026-06-23"]);
    expect(formatDayLabel("not-a-date", seedTrip.startDate)).toBe("not-a-date");
  });

  it("formats day labels in the active locale", () => {
    expect(formatDayLabel(hongKongDay, seedTrip.startDate)).toBe("Day 2");
    expect(formatDayLabel(shenzhenDay, seedTrip.startDate, "th")).toBe("วันที่ 3");
  });

  it("finds validation issues without relying on color alone", () => {
    const dayItems = sortItemsForDay(seedTrip.itineraryItems, hongKongDay);
    const missing = seedTrip.itineraryItems.find((item) => item.id === "item-arrive-hkg");
    const dimsum = dayItems.find((item) => item.id === "item-dimdim")!;
    const overlapFixture = { ...dimsum, id: "item-overlap-fixture", startTime: "09:00", durationMinutes: 90 };

    expect(validateItineraryItem(missing!, [missing!]).map((warning) => warning.code)).toContain("missing-duration");
    expect(validateItineraryItem(dimsum, [...dayItems, overlapFixture]).map((warning) => warning.code)).toContain("overlap");
    expect(validateItineraryItem(dimsum, [...dayItems, overlapFixture])[0]?.message).toMatch(/overlaps|เวลา/i);
  });

  it("reports invalid timing and missing movement details", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      startTime: "24:99",
      durationMinutes: 0,
      mapLink: " ",
      transportation: "",
    };

    expect(validateItineraryItem(item, [item]).map((warning) => warning.code)).toEqual([
      "invalid-start-time",
      "missing-duration",
      "missing-map-link",
      "missing-transportation",
    ]);
    expect(parseTime("23:59")).toBe(1439);
    expect(parseTime("7:30")).toBeNull();
    expect(validateItineraryItem({ ...item, startTime: " " }, [item]).map((warning) => warning.code)).toContain("missing-start-time");
  });

  it("uses explicit end time windows when duration is not set", () => {
    const overnight = {
      ...seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!,
      id: "item-explicit-window",
      day: hongKongDay,
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: null,
    };

    expect(
      validateItineraryItem(overnight, [overnight]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("missing-duration");
    expect(getNowNext([overnight], hongKongDay, "23:30").current?.id).toBe(
      "item-explicit-window",
    );
  });

  it("derives now and next for the on-trip context", () => {
    const state = getNowNext(seedTrip.itineraryItems, hongKongDay, "09:10");

    expect(state.current?.id).toBe("item-dimdim");
    expect(state.next?.id).toBe("item-victoria-peak");
    expect(state.fallbackReason).toBeNull();
  });

  it("explains now/next fallback states for invalid, empty, and completed days", () => {
    expect(getNowNext(seedTrip.itineraryItems, hongKongDay, "bad")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "Current time is unavailable.",
    });
    expect(getNowNext(seedTrip.itineraryItems, "2099-01-01", "09:00")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "No timed stops for this day yet.",
    });
    expect(getNowNext(seedTrip.itineraryItems, hongKongDay, "23:59")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "The day plan has ended.",
    });
  });

  it("detects stale suggestion conflicts and approves fresh suggestions", () => {
    const target = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const conflicted = detectSuggestionConflict(seedTrip.itineraryItems, {
      id: "suggestion-stale",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      proposerId: "member-beam",
      type: "edit",
      targetItemId: target.id,
      sourceVersion: target.version - 1,
      status: "pending",
      proposedPatch: { note: "ขอเลื่อนร้านนี้หลังเช็คอิน" },
      createdAt: "2026-05-27T12:00:00.000Z",
    });

    const approved = approveSuggestion(seedTrip.itineraryItems, {
      ...conflicted,
      id: "suggestion-fresh",
      sourceVersion: target.version,
      status: "pending",
    });

    expect(conflicted.status).toBe("conflicted");
    expect(approved.status).toBe("approved");
    expect(approved.items.find((item) => item.id === target.id)?.note).toBe("ขอเลื่อนร้านนี้หลังเช็คอิน");
  });

  it("builds local edit suggestions and rejects them by id", () => {
    const target = seedTrip.itineraryItems.find((item) => item.id === "item-dimdim")!;
    const suggestion = createLocalEditSuggestion([], {
      tripId: seedTrip.id,
      proposerId: "member-beam",
      targetItem: target,
      createdAt: "2026-05-27T12:00:00.000Z",
      nextSuggestionId: (suggestions) => `suggestion-local-${suggestions.length + 1}`,
    });

    expect(suggestion).toEqual({
      id: "suggestion-local-1",
      tripId: seedTrip.id,
      proposerId: "member-beam",
      type: "edit",
      targetItemId: target.id,
      planVariantId: target.planVariantId,
      proposedPatch: { activity: target.activity },
      sourceVersion: target.version,
      status: "pending",
      createdAt: "2026-05-27T12:00:00.000Z",
    });
    expect(rejectSuggestionById([suggestion], suggestion.id)[0].status).toBe("rejected");
  });

  it("leaves add, resolved, and missing-target suggestions out of conflict handling", () => {
    const baseSuggestion = {
      id: "suggestion-add",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      proposerId: "member-beam",
      type: "add" as const,
      targetItemId: null,
      sourceVersion: null,
      status: "pending" as const,
      proposedPatch: { activity: "Add dessert stop" },
      createdAt: "2026-05-27T12:00:00.000Z",
    };

    expect(detectSuggestionConflict(seedTrip.itineraryItems, baseSuggestion)).toBe(baseSuggestion);
    expect(approveSuggestion(seedTrip.itineraryItems, { ...baseSuggestion, type: "edit", targetItemId: null }).items).toBe(seedTrip.itineraryItems);
    expect(approveSuggestion(seedTrip.itineraryItems, { ...baseSuggestion, type: "edit", targetItemId: "missing-item" })).toMatchObject({
      status: "conflicted",
      suggestion: { status: "conflicted" },
    });
    expect(detectSuggestionConflict(seedTrip.itineraryItems, { ...baseSuggestion, status: "approved" })).toMatchObject({ status: "approved" });
  });

  it("replaces one suggestion by id without changing the rest of the queue", () => {
    expect(
      replaceSuggestionById(
        [
          { id: "suggestion-a", status: "pending" },
          { id: "suggestion-b", status: "pending" },
        ] as Suggestion[],
        "suggestion-b",
        { id: "suggestion-b", status: "approved" } as Suggestion,
      ),
    ).toEqual([
      { id: "suggestion-a", status: "pending" },
      { id: "suggestion-b", status: "approved" },
    ]);
  });

  it("summarizes owed, owing, and settled expense states", () => {
    expect(buildExpenseSummary([], "member-aom")).toMatchObject({
      groupSpend: 0,
      currentUserNetLabel: "You are settled",
      settlementSuggestions: [],
    });
    const summary = buildExpenseSummary(
      [
        {
          id: "expense-1",
          title: "Taxi",
          amount: 100.005,
          paidBy: "member-aom",
          splits: { "member-aom": 50.005, "member-beam": 50 },
          category: "transport",
        },
      ],
      "member-beam",
    );

    expect(summary.groupSpend).toBe(100.01);
    expect(summary.currentUserNetLabel).toBe("You owe HK$50.00");
    expect(summary.settlementSuggestions).toEqual([{ from: "member-beam", to: "member-aom", amount: 50, currency: "HKD" }]);

    expect(buildExpenseSummary([
      {
        id: "expense-mismatch",
        title: "Refunded deposit",
        amount: 100,
        paidBy: "member-aom",
        splits: { "member-aom": 90 },
        category: "settlement",
      },
    ], "member-aom").groupSpend).toBe(0);

    const currentMemberPaidOnly = buildExpenseSummary([
      {
        id: "expense-paid-only",
        title: "Deposit",
        amount: 25,
        paidBy: "member-aom",
        splits: {},
        category: "stay",
      },
    ], "member-aom");
    expect(currentMemberPaidOnly.currentUserNetLabel).toBe("You are owed HK$25.00");

    const zeroSettlement = buildExpenseSummary([
      {
        id: "expense-zero-share",
        title: "Zero adjustment",
        amount: 0,
        paidBy: "member-aom",
        splits: { "member-aom": 0 },
        category: "settlement",
      },
    ], "member-aom");
    expect(zeroSettlement.settlementSuggestions).toEqual([]);
  });

  it("summarizes shared expenses with current-user impact", () => {
    const summary = buildExpenseSummary(seedTrip.expenses, "member-aom");

    expect(summary.groupSpend).toBeGreaterThan(0);
    expect(summary.currentUserNetLabel).toMatch(/You/);
    expect(summary.settlementSuggestions.length).toBeGreaterThan(0);
  });

  it("orders scheduled rows before flexible rows while keeping flexible manual order", () => {
    const base = seedTrip.itineraryItems[0];
    const scheduledLate = { ...base, id: "scheduled-late", day: arrivalDay, startTime: "15:00", sortOrder: 3, timeMode: "scheduled" as const };
    const scheduledEarly = { ...base, id: "scheduled-early", day: arrivalDay, startTime: "09:00", sortOrder: 4, timeMode: "scheduled" as const };
    const flexibleFirst = { ...base, id: "flexible-first", day: arrivalDay, startTime: "", sortOrder: 1, timeMode: "flexible" as const, durationMinutes: null };
    const flexibleSecond = { ...base, id: "flexible-second", day: arrivalDay, startTime: "", sortOrder: 2, timeMode: "flexible" as const, durationMinutes: null };

    expect(sortItemsForDay([flexibleSecond, scheduledLate, flexibleFirst, scheduledEarly], arrivalDay).map((item) => item.id)).toEqual([
      "scheduled-early",
      "scheduled-late",
      "flexible-first",
      "flexible-second",
    ]);
  });

  it("keeps sub-activities directly under their parent activity block", () => {
    const base = seedTrip.itineraryItems[0];
    const block = {
      ...base,
      id: "block-flight",
      activity: "Flight to Hong Kong",
      day: arrivalDay,
      startTime: "04:00",
      sortOrder: 100,
      isPlanBlock: true,
      parentItemId: null,
    };
    const unrelatedEarly = {
      ...base,
      id: "activity-breakfast",
      activity: "Breakfast",
      day: arrivalDay,
      startTime: "05:30",
      sortOrder: 110,
      isPlanBlock: false,
      parentItemId: null,
    };
    const child = {
      ...base,
      id: "child-checkin",
      activity: "Check in",
      day: arrivalDay,
      startTime: "06:00",
      sortOrder: 300,
      isPlanBlock: false,
      parentItemId: "block-flight",
    };
    const laterActivity = {
      ...base,
      id: "activity-market",
      activity: "Market walk",
      day: arrivalDay,
      startTime: "07:00",
      sortOrder: 200,
      isPlanBlock: false,
      parentItemId: null,
    };

    expect(
      sortItemsForDay([child, laterActivity, unrelatedEarly, block], arrivalDay).map(
        (item) => item.id,
      ),
    ).toEqual([
      "block-flight",
      "child-checkin",
      "activity-breakfast",
      "activity-market",
    ]);
  });

  it("warns when a timed child sits outside its plan block window", () => {
    const base = seedTrip.itineraryItems[0];
    const block = {
      ...base,
      id: "block-morning",
      activity: "Morning block",
      day: arrivalDay,
      startTime: "09:00",
      durationMinutes: 60,
      isPlanBlock: true,
    };
    const child = {
      ...base,
      id: "child-late",
      parentItemId: block.id,
      activity: "Late child",
      day: arrivalDay,
      startTime: "10:30",
      durationMinutes: 30,
    };

    expect(validateItineraryItem(child, [block, child]).map((warning) => warning.code)).toContain("child-outside-plan-block");
  });

  it("checks overlap only between sibling activities or sibling sub-activities", () => {
    const base = seedTrip.itineraryItems[0];
    const journeyBlock = {
      ...base,
      id: "block-flight-window",
      activity: "Flight to Hong Kong",
      day: arrivalDay,
      startTime: "04:00",
      endTime: "13:00",
      durationMinutes: 540,
      isPlanBlock: true,
      parentItemId: null,
    };
    const ticketedSegment = {
      ...base,
      id: "child-ticketed-flight",
      activity: "Ticketed flight",
      day: arrivalDay,
      startTime: "07:00",
      endTime: "11:00",
      durationMinutes: 240,
      isPlanBlock: false,
      parentItemId: journeyBlock.id,
    };
    const immigration = {
      ...base,
      id: "child-immigration",
      activity: "Immigration",
      day: arrivalDay,
      startTime: "10:30",
      endTime: "12:00",
      durationMinutes: 90,
      isPlanBlock: false,
      parentItemId: journeyBlock.id,
    };
    const parallelTopLevel = {
      ...base,
      id: "activity-airport-meeting",
      activity: "Airport meeting",
      day: arrivalDay,
      startTime: "06:00",
      endTime: "08:00",
      durationMinutes: 120,
      isPlanBlock: false,
      parentItemId: null,
    };

    expect(
      validateItineraryItem(ticketedSegment, [journeyBlock, ticketedSegment]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("overlap");
    expect(
      validateItineraryItem(journeyBlock, [journeyBlock, parallelTopLevel]).map(
        (warning) => warning.code,
      ),
    ).toContain("overlap");
    expect(
      validateItineraryItem(ticketedSegment, [
        journeyBlock,
        ticketedSegment,
        immigration,
      ]).map((warning) => warning.code),
    ).toContain("overlap");
  });

  it("warns when hierarchy rows break Day > Activity block > Sub-activity", () => {
    const base = seedTrip.itineraryItems[0];
    const block = {
      ...base,
      id: "block-flight",
      activity: "Flight to Hong Kong",
      day: arrivalDay,
      startTime: "04:00",
      durationMinutes: 540,
      isPlanBlock: true,
      parentItemId: null,
    };
    const plainActivity = {
      ...base,
      id: "activity-checkin",
      activity: "Check in",
      day: arrivalDay,
      startTime: "06:00",
      durationMinutes: 45,
      isPlanBlock: false,
      parentItemId: null,
    };
    const validChild = {
      ...base,
      id: "child-immigration",
      activity: "Immigration",
      day: arrivalDay,
      startTime: "11:00",
      durationMinutes: 45,
      isPlanBlock: false,
      parentItemId: block.id,
    };
    const orphanChild = {
      ...validChild,
      id: "child-orphan",
      parentItemId: "missing-block",
    };
    const childUnderPlainActivity = {
      ...validChild,
      id: "child-under-plain",
      parentItemId: plainActivity.id,
    };
    const grandchild = {
      ...validChild,
      id: "child-nested",
      parentItemId: validChild.id,
    };
    const otherPlanChild = {
      ...validChild,
      id: "child-other-plan",
      planVariantId: "plan-other",
    };

    expect(
      validateItineraryItem(validChild, [block, validChild]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("child-outside-plan-block");
    expect(
      validateItineraryItem(orphanChild, [block, orphanChild]).map(
        (warning) => warning.code,
      ),
    ).toContain("missing-parent-item");
    expect(
      validateItineraryItem(childUnderPlainActivity, [
        plainActivity,
        childUnderPlainActivity,
      ]).map((warning) => warning.code),
    ).toContain("invalid-parent-plan-block");
    expect(
      validateItineraryItem(grandchild, [block, validChild, grandchild]).map(
        (warning) => warning.code,
      ),
    ).toEqual(
      expect.arrayContaining(["nested-sub-activity", "invalid-parent-plan-block"]),
    );
    expect(
      validateItineraryItem(otherPlanChild, [block, otherPlanChild]).map(
        (warning) => warning.code,
      ),
    ).toContain("parent-scope-mismatch");
  });

  it("saves through a repository boundary instead of direct UI storage", () => {
    const saved: string[] = [];
    const repository = createLocalTripRepository("test-storage", {
      load: () => saved[0] ?? null,
      save: (_key, value) => saved.push(value),
      remove: () => saved.splice(0),
    });

    repository.saveTrip(seedTrip);
    expect(repository.loadTrip().id).toBe(seedTrip.id);
    repository.clearDraft();
    expect(repository.loadTrip()).toBe(seedTrip);
    expect(repository.describeSource()).toEqual({
      mode: "seed",
      restBase: "seed-trip",
    });
  });

  it("returns the seed trip when local draft JSON is corrupt", () => {
    const repository = createLocalTripRepository("test-storage", {
      load: () => "{",
      save: () => undefined,
      remove: () => undefined,
    });

    expect(repository.loadTrip()).toBe(seedTrip);
  });
});
