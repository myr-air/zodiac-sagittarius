import { describe, expect, it } from "vitest";
import {
  buildItineraryStoryItem,
  buildItineraryStoryPathItems,
  buildOverflowStoryItems,
  withStoryPrefix,
} from "./itinerary-story-items";
import { defaultSmartItineraryPathOptions, pathOptionsForDay } from "./itinerary-items";
import { itineraryFixtureDay } from "./path-options";

describe("itinerary story item builders", () => {
  it("builds a story item with stable fixture defaults and patch overrides", () => {
    const item = buildItineraryStoryItem(0, {
      id: "story-item",
      activity: "Story stop",
      sortOrder: 240,
    });

    expect(item).toMatchObject({
      id: "story-item",
      activity: "Story stop",
      day: itineraryFixtureDay,
      durationMinutes: 60,
      sortOrder: 240,
      startTime: "08:00",
      tripId: "trip-id",
    });
  });

  it("maps path rows into alternative story items", () => {
    const [main, alternative] = buildItineraryStoryPathItems([
      ["main-row", "08:00", 45, 100, "Main route", "Main", undefined, "main"],
      ["alt-row", "08:15", 60, 200, "Plan A route", "Plan A", "path-a", "alternative"],
    ] as const, {
      pathGroupId: (row) => `group-${row[3]}`,
    });

    expect(main).toMatchObject({
      id: "main-row",
      pathGroupId: "group-100",
      pathName: undefined,
      pathRole: "main",
    });
    expect(alternative).toMatchObject({
      id: "alt-row",
      pathGroupId: "group-200",
      pathId: "path-a",
      pathName: "Plan A",
      pathRole: "alternative",
    });
  });

  it("prefixes story ids and path groups without mutating source rows", () => {
    const source = [{ id: "item", pathGroupId: "group" }];

    expect(withStoryPrefix(source, "story")).toEqual([
      { id: "story-item", pathGroupId: "story-group" },
    ]);
    expect(source).toEqual([{ id: "item", pathGroupId: "group" }]);
  });

  it("builds overflow copies without mutating source items", () => {
    const source = [
      buildItineraryStoryItem(0, {
        id: "source-item",
        activity: "Boarding",
        place: "Airport",
      }),
    ];

    expect(
      buildOverflowStoryItems(source, {
        activityDetail: "with extended copy",
        idPrefix: "overflow",
        placeDetail: " - details",
      }),
    ).toEqual([
      expect.objectContaining({
        id: "overflow-source-item",
        activity: "Boarding with extended copy 1",
        place: "Airport - details",
        transport: "Airport Express transfer with luggage coordination",
      }),
    ]);
    expect(source[0]).toMatchObject({
      id: "source-item",
      activity: "Boarding",
      place: "Airport",
    });
  });

  it("normalizes day-scoped path options for story dates without mutating defaults", () => {
    const [mainOption, tripOption, dayOption] = pathOptionsForDay(
      defaultSmartItineraryPathOptions,
      "2026-07-04",
    );

    expect(mainOption).toBe(defaultSmartItineraryPathOptions[0]);
    expect(tripOption).toBe(defaultSmartItineraryPathOptions[1]);
    expect(dayOption).toMatchObject({ day: "2026-07-04", scope: "day" });
    expect(defaultSmartItineraryPathOptions[2]).toMatchObject({
      day: itineraryFixtureDay,
      scope: "day",
    });
  });
});
