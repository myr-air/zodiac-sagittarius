import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  appendItineraryItemPlacement,
  appendItineraryItemToTrip,
  buildItineraryItemDraft,
  buildUpdatedItineraryItem,
  deleteItineraryItemFromTrip,
  getNextChildSortOrder,
  getNextSortOrder,
  mainItineraryPathId,
  mergeCreatedItineraryItemIntoTrip,
  mergeUpdatedItineraryBranchIntoTrip,
  replaceItineraryItem,
  replaceItineraryItems,
} from "./itinerary";
import {
  pathIdRainDay,
  pathNameRainDay,
} from "./testing/itinerary-path-fixtures";

describe("itinerary mutation domain", () => {
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
        pathId: pathIdRainDay,
        pathName: pathNameRainDay,
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
      pathId: pathIdRainDay,
      pathName: pathNameRainDay,
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
});
