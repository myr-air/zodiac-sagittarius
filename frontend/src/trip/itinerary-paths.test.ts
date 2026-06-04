import { describe, expect, it } from "vitest";
import { tripFixture } from "./trip-fixtures";
import { applyImportedItemsToItineraryPath } from "./itinerary-paths";
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
