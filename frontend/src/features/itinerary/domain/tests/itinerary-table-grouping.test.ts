import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  groupChildItemsByParent,
  mergeTripDayGroups,
} from "../itinerary-table-grouping";

describe("itinerary table grouping utilities", () => {
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

});
