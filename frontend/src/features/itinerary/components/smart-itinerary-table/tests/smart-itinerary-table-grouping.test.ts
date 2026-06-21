import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  buildGraphColumnWidth,
  groupChildItemsByParent,
  groupGraphItemsByDay,
  mergeTripDayGroups,
} from "../smart-itinerary-table-utils";

describe("smart itinerary table grouping utilities", () => {
  it("fills missing day groups with ordered empty entries", () => {
    const tripDates = ["2026-06-10", "2026-06-11", "2026-06-12"];
    const groups = mergeTripDayGroups(
      [{ day: "2026-06-11", items: [], warningCount: 0 }],
      "2026-06-10",
      "2026-06-12",
      tripDates,
    );
    expect(groups).toEqual([
      { day: "2026-06-10", items: [], warningCount: 0 },
      { day: "2026-06-11", items: [], warningCount: 0 },
      { day: "2026-06-12", items: [], warningCount: 0 },
    ]);
  });

  it("groups child items and preserves parent ordering", () => {
    const items = [
      buildItineraryItem({
        id: "c",
        parentItemId: "p",
        sortOrder: 2,
        startTime: "10:00",
        endTime: "10:30",
        activity: "c",
      }),
      buildItineraryItem({
        id: "b",
        parentItemId: "p",
        sortOrder: 1,
        startTime: "09:00",
        endTime: "09:30",
        activity: "b",
      }),
      buildItineraryItem({
        id: "p",
        sortOrder: 0,
        startTime: "08:00",
        endTime: "08:30",
        activity: "p",
      }),
    ];
    expect(groupChildItemsByParent(items).get("p")?.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("maps graph items by day and computes dynamic lane width", () => {
    const items = [
      buildItineraryItem({
        id: "a",
        pathRole: "main",
        pathId: "main",
        day: "2026-06-10",
        sortOrder: 0,
        startTime: "08:00",
        endTime: null,
        activity: "a",
      }),
      buildItineraryItem({
        id: "b",
        pathRole: "alternative",
        pathId: "p1",
        day: "2026-06-10",
        sortOrder: 0,
        startTime: "08:00",
        endTime: null,
        activity: "b",
      }),
      buildItineraryItem({
        id: "c",
        pathRole: "alternative",
        pathId: "p2",
        day: "2026-06-10",
        sortOrder: 0,
        startTime: "10:00",
        endTime: null,
        activity: "c",
      }),
    ];
    expect([...groupGraphItemsByDay(items).entries()].map(([day, dayItems]) => [day, dayItems.length])).toEqual([["2026-06-10", 3]]);
    expect(buildGraphColumnWidth(items, 30, 9, 18)).toBe(66);
  });
});
