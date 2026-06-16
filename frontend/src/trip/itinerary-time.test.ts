import { describe, expect, it } from "vitest";
import {
  daysBetweenIsoDates,
  itineraryDateTime,
  normalizeInlineTimePatch,
  shiftIsoDate,
  shiftItineraryItemsToStartDate,
} from "@/src/trip/itinerary-time";
import { seedTrip } from "@/src/trip/seed";
import type { ItineraryItem } from "@/src/trip/types";

describe("itinerary time helpers", () => {
  it("calculates ISO date shifts in UTC days", () => {
    expect(daysBetweenIsoDates("2026-06-18", "2026-06-20")).toBe(2);
    expect(daysBetweenIsoDates("2026-06-20", "2026-06-18")).toBe(-2);
    expect(shiftIsoDate("2026-06-18", 3)).toBe("2026-06-21");
    expect(shiftIsoDate("2026-06-18", -1)).toBe("2026-06-17");
    expect(itineraryDateTime("2026-06-18", "09:30")).toBe(
      "2026-06-18T09:30:00",
    );
  });

  it("shifts itinerary item days when the trip start date changes", () => {
    const items = [
      { id: "item-a", day: "2026-06-18" },
      { id: "item-b", day: "2026-06-20" },
    ] as ItineraryItem[];

    expect(
      shiftItineraryItemsToStartDate(items, "2026-06-18", "2026-06-20").map(
        ({ day }) => day,
      ),
    ).toEqual(["2026-06-20", "2026-06-22"]);
    expect(shiftItineraryItemsToStartDate(items, "2026-06-18", "2026-06-18"))
      .toBe(items);
  });

  it("normalizes inline time-window edits into matching durations", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      startTime: "23:00",
      endTime: "01:00",
      endOffsetDays: 1,
      durationMinutes: 120,
    };

    expect(normalizeInlineTimePatch(item, { endTime: "02:30" })).toMatchObject({
      endTime: "02:30",
      durationMinutes: 210,
    });
    expect(
      normalizeInlineTimePatch(item, {
        endTime: "02:00",
        endOffsetDays: 0,
      }),
    ).toMatchObject({
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: 180,
    });
    expect(normalizeInlineTimePatch(item, { startTime: "00:30" })).toMatchObject(
      {
        startTime: "00:30",
        endOffsetDays: 0,
        durationMinutes: 30,
      },
    );
    expect(normalizeInlineTimePatch(item, { endTime: "23:30" })).toMatchObject({
      endTime: "23:30",
      endOffsetDays: 0,
      durationMinutes: 30,
    });
    expect(
      normalizeInlineTimePatch(item, {
        endTime: null,
        endOffsetDays: 1,
      }),
    ).toMatchObject({
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    });
  });
});
