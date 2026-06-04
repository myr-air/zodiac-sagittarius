import { describe, expect, it } from "vitest";
import { tripFixture } from "./trip-fixtures";
import { applyImportedItemsToItineraryPath, applyItemToActivityBranch, applyManualActivityPath, autoResolveSamePathOverlaps, deriveManualActivityPathOptions } from "./itinerary-paths";
import type { ItineraryExportItem } from "./itinerary-import-export";

const importItem: ItineraryExportItem = {
  id: "import-rain-museum",
  day: "2026-06-19",
  sortOrder: 150,
  startTime: "08:30",
  activity: "Indoor museum",
  activityType: "attraction",
  place: "Museum",
  linkLabel: "Map",
  mapLink: "https://maps.example.test",
  durationMinutes: 60,
  transportation: "MTR",
  note: "Rain backup",
};

describe("itinerary path import application", () => {
  it("moves overlapping created activities into sub paths while keeping the first activity on main", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const lateItem = {
      ...middleItem,
      id: "item-late",
      startTime: "09:00",
      durationMinutes: 45,
      sortOrder: 300,
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [mainItem],
    };

    const withMiddle = applyItemToActivityBranch(trip, middleItem).trip;
    const withLate = applyItemToActivityBranch(withMiddle, lateItem).trip;
    const itemsById = new Map(withLate.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-main-long")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathRole: "main",
    });
    expect(itemsById.get("item-middle")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative",
    });
    expect(itemsById.get("item-late")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathId: "path-2026-06-19-sub-b",
      pathName: "Plan B",
      pathRole: "alternative",
    });
  });

  it("manually promotes an overlapping activity to main and lets organizers assign plan A or B", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const lateItem = {
      ...middleItem,
      id: "item-late",
      startTime: "09:00",
      durationMinutes: 45,
      sortOrder: 300,
    };
    const autoTrip = applyItemToActivityBranch(
      applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip,
      lateItem,
    ).trip;

    const promotedTrip = applyManualActivityPath(autoTrip, "item-middle", "main").trip;
    const planBTrip = applyManualActivityPath(promotedTrip, "item-main-long", "path-2026-06-19-sub-b").trip;
    const planATrip = applyManualActivityPath(planBTrip, "item-late", "path-2026-06-19-sub-a").trip;
    const itemsById = new Map(planATrip.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-middle")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathRole: "main",
    });
    expect(itemsById.get("item-late")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative",
    });
    expect(itemsById.get("item-main-long")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathId: "path-2026-06-19-sub-b",
      pathName: "Plan B",
      pathRole: "alternative",
    });
  });

  it("promotes another branch item when the current main activity is moved into an empty plan", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const autoTrip = applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip;

    const next = applyManualActivityPath(autoTrip, "item-main-long", "path-2026-06-19-sub-b").trip;
    const itemsById = new Map(next.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-main-long")).toMatchObject({
      pathId: "path-2026-06-19-sub-b",
      pathName: "Plan B",
      pathRole: "alternative",
    });
    expect(itemsById.get("item-middle")).toMatchObject({
      pathGroupId: "path-group-item-main-long",
      pathRole: "main",
    });
  });

  it("auto resolves same-plan overlap by moving later activities into free plans", () => {
    const earlyItem = {
      ...tripFixture.planItems[0],
      id: "item-early",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
    };
    const lateItem = {
      ...middleItem,
      id: "item-late",
      startTime: "09:00",
      durationMinutes: 45,
      sortOrder: 300,
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [earlyItem, middleItem, lateItem],
    };

    const next = autoResolveSamePathOverlaps(trip, { day: "2026-06-19", planVariantId: trip.activePlanVariantId }).trip;
    const itemsById = new Map(next.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-early")).toMatchObject({
      pathGroupId: "path-group-item-early",
      pathRole: "main",
    });
    expect(itemsById.get("item-middle")).toMatchObject({
      pathGroupId: "path-group-item-early",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative",
    });
    expect(itemsById.get("item-late")).toMatchObject({
      pathGroupId: "path-group-item-early",
      pathId: "path-2026-06-19-sub-b",
      pathName: "Plan B",
      pathRole: "alternative",
    });
  });

  it("exposes manual path choices for an overlapping activity branch", () => {
    const mainItem = {
      ...tripFixture.planItems[0],
      id: "item-main-long",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 225,
      sortOrder: 100,
    };
    const middleItem = {
      ...tripFixture.planItems[1],
      id: "item-middle",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
    };
    const trip = applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip;

    expect(deriveManualActivityPathOptions(trip, "item-middle")).toEqual([
      { id: "main", name: "Main" },
      { id: "path-2026-06-19-sub-a", name: "Plan A" },
      { id: "path-2026-06-19-sub-b", name: "Plan B" },
    ]);
  });

  it("keeps non-overlapping created activities on the main path", () => {
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [{
        ...tripFixture.planItems[0],
        id: "item-main",
        day: "2026-06-19",
        startTime: "08:00",
        durationMinutes: 45,
        sortOrder: 100,
      }],
    };
    const nextItem = {
      ...tripFixture.planItems[1],
      id: "item-later",
      day: "2026-06-19",
      startTime: "10:00",
      durationMinutes: 45,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };

    const next = applyItemToActivityBranch(trip, nextItem).trip;

    expect(next.itineraryItems.find((item) => item.id === "item-later")).toMatchObject({
      pathRole: "main",
    });
    expect(next.itineraryItems.find((item) => item.id === "item-later")?.pathGroupId).toBeUndefined();
  });

  it("keeps main items and adds imported rows as an alternative path", () => {
    const trip = {
      ...tripFixture.trip,
      itineraryItems: tripFixture.planItems.slice(0, 2).map((item, index) => ({
        ...item,
        day: "2026-06-19",
        startTime: index === 0 ? "08:30" : "11:00",
        sortOrder: (index + 1) * 100,
        pathRole: "main" as const,
      })),
    };

    const next = applyImportedItemsToItineraryPath(trip, [importItem], {
      memberId: "member-aom",
      pathId: "path-rain",
      pathName: "Rain plan",
      scope: "day",
      day: "2026-06-19",
      mode: "keep-alternatives",
    });

    expect(next.itineraryItems.map((item) => item.id)).toEqual([
      trip.itineraryItems[0].id,
      trip.itineraryItems[1].id,
      "import-rain-museum",
    ]);
    expect(next.itineraryItems.find((item) => item.id === "import-rain-museum")).toMatchObject({
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative",
      pathGroupId: `path-group-${trip.itineraryItems[0].id}`,
    });
    expect(next.itineraryPaths?.find((path) => path.id === "path-rain")).toMatchObject({
      name: "Rain plan",
      scope: "day",
      day: "2026-06-19",
    });
  });

  it("replaces only the selected target path and keeps other paths", () => {
    const existingRain = {
      ...tripFixture.planItems[0],
      id: "existing-rain",
      day: "2026-06-19",
      pathGroupId: "group-breakfast",
      pathId: "path-rain",
      pathRole: "alternative" as const,
    };
    const existingSlow = {
      ...existingRain,
      id: "existing-slow",
      pathId: "path-slow",
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [existingRain, existingSlow],
      itineraryPaths: [
        {
          id: "path-rain",
          tripId: tripFixture.trip.id,
          name: "Rain plan",
          scope: "day" as const,
          day: "2026-06-19",
          createdBy: "member-aom",
          createdAt: "2026-06-04T00:00:00.000Z",
          updatedAt: "2026-06-04T00:00:00.000Z",
        },
      ],
    };

    const next = applyImportedItemsToItineraryPath(trip, [importItem], {
      memberId: "member-aom",
      pathId: "path-rain",
      pathName: "Rain plan",
      scope: "day",
      day: "2026-06-19",
      mode: "replace-target",
    });

    expect(next.itineraryItems.map((item) => item.id)).toEqual(["existing-slow", "import-rain-museum"]);
  });
});
