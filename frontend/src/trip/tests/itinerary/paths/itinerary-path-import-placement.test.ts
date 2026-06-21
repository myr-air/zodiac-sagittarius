import { describe, expect, it } from "vitest";
import { applyImportedItemsToItineraryPath } from "../../../itinerary-paths";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { importItem } from "./itinerary-path-imports.test-support";
import { pathIdRain } from "@/src/trip/testing/fixtures/itinerary-path-fixtures";

describe("itinerary path import placement", () => {
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
    expect(
      next.itineraryItems.find((item) => item.id === "import-rain-museum"),
    ).toMatchObject({
      pathId: pathIdRain,
      pathName: "Rain plan",
      pathRole: "alternative",
      pathGroupId: "path-group-import-rain-museum",
    });
    expect(
      next.itineraryPaths?.find((path) => path.id === pathIdRain),
    ).toMatchObject({
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
    const importedBlock = {
      ...importItem,
      id: "import-flight-block",
      day: "2026-06-20",
      sortOrder: 100,
      activity: "Imported flight block",
      isPlanBlock: true,
      parentItemId: null,
    };
    const importedChild = {
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
    expect(
      next.itineraryItems.find((item) => item.id === "import-flight-checkin"),
    ).toMatchObject({
      parentItemId: "import-flight-block-2",
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
    const next = applyImportedItemsToItineraryPath(
      {
        ...tripFixture.trip,
        itineraryItems: [existingMain],
      },
      [overlappingImport],
      {
        memberId: "member-aom",
        pathId: "main",
        pathName: "Main",
        scope: "trip",
        mode: "keep-alternatives",
        recordMode: "clone-linked",
      },
    );
    const imported = next.itineraryItems.find(
      (item) => item.id === "import-overlap-main",
    );

    expect(imported).toMatchObject({
      pathRole: "main",
    });
    expect(imported?.pathGroupId).toBeUndefined();
    expect(imported?.pathId).toBeUndefined();
    expect(imported?.pathName).toBeUndefined();
    expect(next.itineraryPaths).toBe(tripFixture.trip.itineraryPaths);
  });
});
