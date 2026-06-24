import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  buildGraphColumnWidth,
  groupGraphItemsByDay,
} from "../smart-itinerary-table-graph";

describe("smart itinerary table graph utilities", () => {
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
