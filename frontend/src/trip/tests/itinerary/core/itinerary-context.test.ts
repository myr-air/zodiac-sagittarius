import { describe, expect, it } from "vitest";
import { hongKongDay, shenzhenDay } from "@/src/trip/testing/fixtures/itinerary-test-days";
import {
  buildItineraryView,
  formatDayLabel,
  getNowNext,
  parseTime,
  sortItemsForDay,
  validateItineraryItem,
} from "../../../itinerary-core";
import {
  getTripDates,
} from "../../../itinerary-core";
import { seedTrip } from "../../../seed";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";

describe("itinerary warnings, dates, and on-trip context", () => {
  it("keeps invalid field warning totals stable in shared derive", () => {
    const invalidDayItem = {
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-invalid-fields-only",
      day: hongKongDay,
      sortOrder: 999,
      startTime: " ",
      durationMinutes: 0,
      mapLink: " ",
      transportation: " ",
    };

    const view = buildItineraryView([invalidDayItem]);

    expect(view.warningCount).toBe(4);
    expect(view.dayGroups[0]?.warningCount).toBe(4);
  });

  it("falls back for invalid trip dates and invalid display days", () => {
    expect(getTripDates("bad-date", "2026-06-23")).toEqual(["bad-date"]);
    expect(getTripDates("2026-06-23", "2025-05-21")).toEqual(["2026-06-23"]);
    expect(formatDayLabel("not-a-date", seedTrip.startDate)).toBe("not-a-date");
  });

  it("formats day labels in the active locale", () => {
    expect(formatDayLabel(hongKongDay, seedTrip.startDate)).toBe("Day 2");
    expect(formatDayLabel(shenzhenDay, seedTrip.startDate, "th")).toBe("วันที่ 3");
  });

  it("finds validation issues without relying on color alone", () => {
    const dayItems = sortItemsForDay(seedTrip.itineraryItems, hongKongDay);
    const missing = getTripFixtureItineraryItem("item-arrive-hkg");
    const dimsum = getTripFixtureItineraryItem("item-dimdim");
    const overlapFixture = { ...dimsum, id: "item-overlap-fixture", startTime: "09:00", durationMinutes: 90 };

    expect(validateItineraryItem(missing, [missing]).map((warning) => warning.code)).toContain("missing-duration");
    expect(validateItineraryItem(dimsum, [...dayItems, overlapFixture]).map((warning) => warning.code)).toContain("overlap");
    expect(validateItineraryItem(dimsum, [...dayItems, overlapFixture])[0]?.message).toMatch(/overlaps|เวลา/i);
  });

  it("reports invalid timing and missing movement details", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      startTime: "24:99",
      durationMinutes: 0,
      mapLink: " ",
      transportation: "",
    };

    expect(validateItineraryItem(item, [item]).map((warning) => warning.code)).toEqual([
      "invalid-start-time",
      "missing-duration",
      "missing-map-link",
      "missing-transportation",
    ]);
    expect(parseTime("23:59")).toBe(1439);
    expect(parseTime("7:30")).toBeNull();
    expect(validateItineraryItem({ ...item, startTime: " " }, [item]).map((warning) => warning.code)).toContain("missing-start-time");
  });

  it("uses explicit end time windows when duration is not set", () => {
    const overnight = {
      ...getTripFixtureItineraryItem("item-dimdim"),
      id: "item-explicit-window",
      day: hongKongDay,
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: null,
    };

    expect(
      validateItineraryItem(overnight, [overnight]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("missing-duration");
    expect(getNowNext([overnight], hongKongDay, "23:30").current?.id).toBe(
      "item-explicit-window",
    );
  });

  it("derives now and next for the on-trip context", () => {
    const state = getNowNext(seedTrip.itineraryItems, hongKongDay, "09:10");

    expect(state.current?.id).toBe("item-dimdim");
    expect(state.next?.id).toBe("item-victoria-peak");
    expect(state.fallbackReason).toBeNull();
  });

  it("explains now/next fallback states for invalid, empty, and completed days", () => {
    expect(getNowNext(seedTrip.itineraryItems, hongKongDay, "bad")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "Current time is unavailable.",
    });
    expect(getNowNext(seedTrip.itineraryItems, "2099-01-01", "09:00")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "No timed stops for this day yet.",
    });
    expect(getNowNext(seedTrip.itineraryItems, hongKongDay, "23:59")).toMatchObject({
      current: null,
      next: null,
      fallbackReason: "The day plan has ended.",
    });
  });
});
