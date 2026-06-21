import { describe, expect, it } from "vitest";
import {
  buildItineraryView,
  formatDayLabel,
  getNowNext,
  sortItemsForDay,
} from "../../../itinerary-view";
import { getTripFixtureItineraryItem, tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { hongKongDay, shenzhenDay } from "@/src/trip/testing/fixtures/itinerary-test-days";

describe("itinerary view helpers", () => {
  it("groups sorted itinerary items with route stats", () => {
    const view = buildItineraryView(tripFixture.planItems);
    const firstDay = view.dayGroups[0];

    expect(firstDay?.day).toBe(tripFixture.planItems[0]?.day);
    expect(firstDay?.items.map((item) => item.id)).toEqual(
      sortItemsForDay(tripFixture.planItems, firstDay?.day ?? "").map((item) => item.id),
    );
    expect(view.routeDayStats[0]).toMatchObject({
      day: firstDay?.day,
      itemCount: firstDay?.items.length,
    });
  });

  it("finds the current and next timed stops", () => {
    const day = "2026-06-19";
    const items = [
      {
        ...tripFixture.planItems[0],
        id: "item-breakfast",
        day,
        startTime: "09:00",
        endTime: "10:00",
        sortOrder: 100,
      },
      {
        ...tripFixture.planItems[0],
        id: "item-museum",
        day,
        startTime: "11:00",
        endTime: "12:00",
        sortOrder: 200,
      },
    ];

    expect(getNowNext(items, day, "09:30")).toMatchObject({
      current: { id: "item-breakfast" },
      next: { id: "item-museum" },
      fallbackReason: null,
    });
    expect(getNowNext(items, day, "bad-time")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "Current time is unavailable.",
    });
  });

  it("formats day labels relative to the trip start date", () => {
    expect(formatDayLabel("2026-06-20", "2026-06-18")).toBe("Day 3");
    expect(formatDayLabel("2026-06-20", "2026-06-18", "th")).toBe("วันที่ 3");
    expect(formatDayLabel("not-a-date", "2026-06-18")).toBe("not-a-date");
  });

  it("builds a shared itinerary view with sorted items and warning totals", () => {
    const selectedItems = [
      {
        ...getTripFixtureItineraryItem("item-victoria-peak"),
        id: "item-overlap-a",
        day: hongKongDay,
        sortOrder: 300,
        startTime: "09:30",
        durationMinutes: 45,
      },
      {
        ...getTripFixtureItineraryItem("item-dimdim"),
        id: "item-overlap-b",
        day: hongKongDay,
        sortOrder: 100,
        startTime: "09:00",
        durationMinutes: 60,
      },
      {
        ...getTripFixtureItineraryItem("item-pacific-place"),
        id: "item-safe-stop",
        day: hongKongDay,
        sortOrder: 200,
        startTime: "11:00",
        durationMinutes: 30,
      },
      {
        ...getTripFixtureItineraryItem("item-temple-street"),
        id: "item-invalid-fields",
        day: hongKongDay,
        sortOrder: 400,
        startTime: "24:99",
        durationMinutes: 0,
        mapLink: " ",
        transportation: " ",
      },
      {
        ...getTripFixtureItineraryItem("item-checkout"),
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
});
