import { describe, expect, it } from "vitest";
import {
  buildInlineItineraryItemPatch,
  daysBetweenIsoDates,
  itineraryDateTime,
  normalizeDurationMinutes,
  normalizeInlineTimePatch,
  shiftIsoDate,
  shiftItineraryItemsToStartDate,
} from "@/src/trip/itinerary-core";
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

  it("builds changed inline patches with trimmed text and clamped duration", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      activity: "Breakfast",
      place: "Central",
      transportation: "MTR",
      durationMinutes: 30,
    };

    expect(
      buildInlineItineraryItemPatch(item, {
        activity: "  Brunch  ",
        place: "  Sheung Wan  ",
        transportation: "  Taxi  ",
        durationMinutes: 0.4,
      }),
    ).toEqual({
      activity: "Brunch",
      place: "Sheung Wan",
      transportation: "Taxi",
      durationMinutes: 1,
    });
  });

  it("normalizes duration input to positive whole minutes", () => {
    expect(normalizeDurationMinutes(0.4)).toBe(1);
    expect(normalizeDurationMinutes(15.6)).toBe(16);
    expect(normalizeDurationMinutes(null)).toBe(1);
    expect(normalizeDurationMinutes(undefined)).toBe(1);
    expect(normalizeDurationMinutes("bad")).toBe(1);
  });

  it("rejects empty required inline activity and place edits", () => {
    const item = seedTrip.itineraryItems[0]!;

    expect(buildInlineItineraryItemPatch(item, { activity: "   " })).toBeNull();
    expect(buildInlineItineraryItemPatch(item, { place: "   " })).toBeNull();
  });

  it("returns null when an inline patch does not change the item", () => {
    const item = seedTrip.itineraryItems[0]!;

    expect(
      buildInlineItineraryItemPatch(item, {
        activity: item.activity,
        place: item.place,
      }),
    ).toBeNull();
  });
});
