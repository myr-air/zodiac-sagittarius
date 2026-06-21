import { describe, expect, it } from "vitest";
import {
  itineraryItemPathFieldsForTarget,
  mainItineraryPathId,
  selectedItineraryPathIdForDay,
  updateItineraryPathSelection,
} from "../../../itinerary-paths";
import {
  normalizeStopHierarchyValues,
} from "../../../itinerary-core";
import {
  pathIdPlanA,
  pathIdRain,
  pathNamePlanA,
} from "@/src/trip/testing/fixtures/itinerary-path-fixtures";

describe("itinerary path selection", () => {
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
});
