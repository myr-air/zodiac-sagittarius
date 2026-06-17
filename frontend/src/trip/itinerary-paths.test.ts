import { describe, expect, it } from "vitest";
import { tripFixture } from "./trip-fixtures";
import { applyImportedItemsToItineraryPath, applyItemToActivityBranch, applyManualActivityPath, deriveManualActivityPathOptions } from "./itinerary-paths";
import type { ItineraryExportItem } from "./itinerary-import-export";
import { pathIdRain } from "./testing/itinerary-path-fixtures";

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
  details: {},
  note: "Rain backup",
};

describe("itinerary path import application", () => {
  it("keeps overlapping created activities on main until an organizer explicitly chooses an alternative path", () => {
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

    expect(itemsById.get("item-main-long")).toMatchObject({ pathRole: undefined });
    expect(itemsById.get("item-main-long")?.pathGroupId).toBeUndefined();
    expect(itemsById.get("item-middle")).toMatchObject({ pathRole: "main" });
    expect(itemsById.get("item-middle")?.pathGroupId).toBeUndefined();
    expect(itemsById.get("item-late")).toMatchObject({ pathRole: "main" });
    expect(itemsById.get("item-late")?.pathGroupId).toBeUndefined();
  });

  it("lets organizers explicitly assign overlapping activities to plan A or B", () => {
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
    const flatTrip = applyItemToActivityBranch(
      applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip,
      lateItem,
    ).trip;

    const planATrip = applyManualActivityPath(flatTrip, "item-late", "path-2026-06-19-sub-a").trip;
    const planBTrip = applyManualActivityPath(planATrip, "item-main-long", "path-2026-06-19-sub-b").trip;
    const itemsById = new Map(planBTrip.itineraryItems.map((item) => [item.id, item]));

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
    const flatTrip = applyItemToActivityBranch({ ...tripFixture.trip, itineraryItems: [mainItem] }, middleItem).trip;

    const next = applyManualActivityPath(flatTrip, "item-main-long", "path-2026-06-19-sub-b").trip;
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

  it("moves sub-activities with their parent activity block when assigning an explicit path", () => {
    const block = {
      ...tripFixture.planItems[0],
      id: "item-flight-block",
      day: "2026-06-19",
      startTime: "04:00",
      durationMinutes: 540,
      sortOrder: 100,
      isPlanBlock: true,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "item-flight-checkin",
      parentItemId: "item-flight-block",
      day: "2026-06-19",
      startTime: "06:00",
      durationMinutes: 60,
      sortOrder: 200,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const overlap = {
      ...tripFixture.planItems[2],
      id: "item-hotel-breakfast",
      day: "2026-06-19",
      startTime: "06:30",
      durationMinutes: 45,
      sortOrder: 300,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: undefined,
    };
    const trip = {
      ...tripFixture.trip,
      itineraryItems: [block, child, overlap],
    };

    const placement = applyManualActivityPath(trip, "item-flight-block", "path-2026-06-19-sub-a");
    const itemsById = new Map(placement.trip.itineraryItems.map((item) => [item.id, item]));

    expect(itemsById.get("item-flight-block")).toMatchObject({
      pathGroupId: "path-group-item-flight-block",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative",
    });
    expect(itemsById.get("item-flight-checkin")).toMatchObject({
      pathGroupId: "path-group-item-flight-block",
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
      pathRole: "alternative",
    });
    expect(placement.changedExistingItems.map((item) => item.id)).toEqual([
      "item-flight-block",
      "item-flight-checkin",
      "item-hotel-breakfast",
    ]);
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
      pathId: pathIdRain,
      pathName: "Rain plan",
      scope: "day",
      day: "2026-06-19",
      mode: "keep-alternatives",
      recordMode: "clone-linked",
    });

    expect(next.itineraryItems.map((item) => item.id)).toEqual([
      trip.itineraryItems[0].id,
      trip.itineraryItems[1].id,
      "import-rain-museum",
    ]);
    expect(next.itineraryItems.find((item) => item.id === "import-rain-museum")).toMatchObject({
      pathId: pathIdRain,
      pathName: "Rain plan",
      pathRole: "alternative",
      pathGroupId: "path-group-import-rain-museum",
    });
    expect(next.itineraryPaths?.find((path) => path.id === pathIdRain)).toMatchObject({
      name: "Rain plan",
      scope: "day",
      day: "2026-06-19",
    });
  });

  it("remaps imported sub-activity parents when imported ids collide with existing rows", () => {
    const existingItem = {
      ...tripFixture.planItems[0],
      id: "import-flight-block",
      day: "2026-06-19",
      sortOrder: 100,
    };
    const importedBlock: ItineraryExportItem = {
      ...importItem,
      id: "import-flight-block",
      day: "2026-06-20",
      sortOrder: 100,
      activity: "Imported flight block",
      isPlanBlock: true,
      parentItemId: null,
    };
    const importedChild: ItineraryExportItem = {
      ...importItem,
      id: "import-flight-checkin",
      day: "2026-06-20",
      sortOrder: 200,
      activity: "Imported check-in",
      parentItemId: "import-flight-block",
      isPlanBlock: false,
    };

    const next = applyImportedItemsToItineraryPath(
      { ...tripFixture.trip, itineraryItems: [existingItem] },
      [importedBlock, importedChild],
      {
        memberId: "member-aom",
        pathId: "main",
        pathName: "Main",
        scope: "trip",
        mode: "keep-alternatives",
        recordMode: "clone-linked",
      },
    );

    expect(next.itineraryItems.map((item) => item.id)).toEqual([
      "import-flight-block",
      "import-flight-block-2",
      "import-flight-checkin",
    ]);
    expect(next.itineraryItems.find((item) => item.id === "import-flight-checkin")).toMatchObject({
      parentItemId: "import-flight-block-2",
    });
  });

  it("imports into a selected draft Trip Plan without switching the Main Plan", () => {
    const draftTripPlanId = "plan-selected-draft";
    const importedBlock: ItineraryExportItem = {
      ...importItem,
      id: "import-journey-block",
      day: "2026-06-20",
      sortOrder: 100,
      activity: "Flight to Hong Kong",
      isPlanBlock: true,
      parentItemId: null,
    };
    const importedChild: ItineraryExportItem = {
      ...importItem,
      id: "import-checkin",
      day: "2026-06-20",
      sortOrder: 200,
      activity: "Airport check-in",
      parentItemId: "import-journey-block",
      isPlanBlock: false,
    };
    const trip = {
      ...tripFixture.trip,
      mainTripPlanId: tripFixture.trip.activePlanVariantId,
      tripPlans: [
        ...(tripFixture.trip.tripPlans ?? tripFixture.trip.planVariants),
        {
          id: draftTripPlanId,
          tripId: tripFixture.trip.id,
          name: "Client proposal",
          kind: "draft" as const,
          status: "draft" as const,
          description: "Draft plan for review",
          version: 1,
        },
      ],
      itineraryItems: [],
    };

    const next = applyImportedItemsToItineraryPath(trip, [importedBlock, importedChild], {
      memberId: "member-aom",
      tripPlanId: draftTripPlanId,
      pathId: "main",
      pathName: "Main",
      scope: "trip",
      mode: "keep-alternatives",
      recordMode: "clone-linked",
    });
    const imported = next.itineraryItems.filter((item) => item.id.startsWith("import-"));

    expect(next.mainTripPlanId).toBe(trip.mainTripPlanId);
    expect(next.activePlanVariantId).toBe(trip.activePlanVariantId);
    expect(imported).toHaveLength(2);
    expect(imported.map((item) => item.planVariantId)).toEqual([
      draftTripPlanId,
      draftTripPlanId,
    ]);
    expect(next.itineraryItems.find((item) => item.id === "import-checkin")).toMatchObject({
      parentItemId: "import-journey-block",
      planVariantId: draftTripPlanId,
    });
  });

  it("imports overlapping rows into main without synthesizing alternative paths", () => {
    const existingMain = {
      ...tripFixture.planItems[0],
      id: "existing-main",
      day: "2026-06-19",
      startTime: "08:00",
      durationMinutes: 90,
      sortOrder: 100,
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
    };
    const overlappingImport = {
      ...importItem,
      id: "import-overlap-main",
      day: "2026-06-19",
      startTime: "08:30",
      durationMinutes: 60,
      pathGroupId: "legacy-overlap-group",
      pathId: "legacy-plan-a",
      pathName: "Legacy Plan A",
      pathRole: "alternative" as const,
    };
    const next = applyImportedItemsToItineraryPath({
      ...tripFixture.trip,
      itineraryItems: [existingMain],
    }, [overlappingImport], {
      memberId: "member-aom",
      pathId: "main",
      pathName: "Main",
      scope: "trip",
      mode: "keep-alternatives",
      recordMode: "clone-linked",
    });
    const imported = next.itineraryItems.find((item) => item.id === "import-overlap-main");

    expect(imported).toMatchObject({
      pathRole: "main",
    });
    expect(imported?.pathGroupId).toBeUndefined();
    expect(imported?.pathId).toBeUndefined();
    expect(imported?.pathName).toBeUndefined();
    expect(next.itineraryPaths).toBe(tripFixture.trip.itineraryPaths);
  });

  it("replaces only the selected target path and keeps other paths", () => {
    const existingRain = {
      ...tripFixture.planItems[0],
      id: "existing-rain",
      day: "2026-06-19",
      pathGroupId: "group-breakfast",
      pathId: pathIdRain,
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
          id: pathIdRain,
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
      pathId: pathIdRain,
      pathName: "Rain plan",
      scope: "day",
      day: "2026-06-19",
      mode: "replace-target",
      recordMode: "clone-linked",
    });

    expect(next.itineraryItems.map((item) => item.id)).toEqual(["existing-slow", "import-rain-museum"]);
  });
});
