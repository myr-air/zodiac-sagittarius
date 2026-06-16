import { describe, expect, it } from "vitest";
import { mainItineraryPathId, humanizePathId, itineraryItemPathId } from "./itinerary-path-identifiers";
import type { ItineraryItem } from "./types";

function fixtureItem(overrides: Partial<ItineraryItem>): ItineraryItem {
  return {
    id: "item-id",
    tripId: "trip-id",
    planVariantId: "plan-id",
    day: "2026-01-01",
    sortOrder: 100,
    startTime: "09:00",
    endOffsetDays: 0,
    activity: "Activity",
    activityType: "activity",
    place: "Venue",
    mapLink: "",
    transportation: "",
    durationMinutes: 45,
    details: { notes: [] },
    note: "",
    createdBy: "member-id",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as ItineraryItem;
}

describe("itinerary path identifiers", () => {
  it("classifies main path items consistently", () => {
    expect(mainItineraryPathId).toBe("main");
    expect(itineraryItemPathId(fixtureItem({
      id: "a",
      pathRole: "main",
      pathId: "path-main",
      pathGroupId: "g",
      pathName: "Main",
    }))).toBe(mainItineraryPathId);
  });

  it("classifies alternative path items with path id fallback to item id", () => {
    expect(
      itineraryItemPathId(fixtureItem({
        id: "a",
        pathRole: "alternative",
        pathId: "path-x",
        pathGroupId: "g",
        pathName: "Plan X",
      })),
    ).toBe("path-x");

    expect(
      itineraryItemPathId(
        fixtureItem({
          id: "alt-no-path",
          pathRole: "alternative",
          pathId: undefined,
        }),
      ),
    ).toBe("alt-no-path");
  });

  it("humanizes path ids", () => {
    expect(humanizePathId("path-2026-06-04-sub-a")).toBe("2026 06 04 Sub A");
    expect(humanizePathId("path_main_path")).toBe("Path Main Path");
    expect(humanizePathId("already-friendly")).toBe("Already Friendly");
  });
});
