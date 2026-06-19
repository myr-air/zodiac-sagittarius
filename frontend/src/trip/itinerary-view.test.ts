import { describe, expect, it } from "vitest";
import {
  buildItineraryView,
  formatDayLabel,
  getNowNext,
  sortItemsForDay,
} from "./itinerary-view";
import { tripFixture } from "./trip-fixtures";

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
});
