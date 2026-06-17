import { describe, expect, it } from "vitest";
import {
  endOffsetDaysBetweenTimes,
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  minutesToTime,
  parseTimeToMinutes,
  toDateTimeLocalValue,
} from "./itinerary-time";

describe("itinerary-time helpers", () => {
  it("parses HH:MM into minute offsets with validation", () => {
    expect(parseTimeToMinutes("09:30")).toBe(570);
    expect(parseTimeToMinutes("09:30   ")).toBe(570);
    expect(parseTimeToMinutes("09:60")).toBeNull();
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("9:30")).toBeNull();
  });

  it("normalizes day/time helper values", () => {
    expect(itineraryDateTimeValue("2026-06-10", "09:30")).toBe("2026-06-10T09:30");
    expect(itineraryDateTimeValue("2026-06-10", "   ")).toBeNull();
    expect(toDateTimeLocalValue("2026-06-10T09:45:30.000Z")).toBe("2026-06-10T09:45");
    expect(fromDateTimeLocalValue("2026-06-10T09:45:30.000Z")).toBe("2026-06-10T09:45:30.000Z");
    expect(fromDateTimeLocalValue("   ")).toBeNull();
  });

  it("computes midnight-overflow indicators and time formatting", () => {
    expect(endOffsetDaysBetweenTimes("18:00", "07:30")).toBe(1);
    expect(endOffsetDaysBetweenTimes("09:00", "10:00")).toBe(0);
    expect(minutesToTime(9 * 60 + 5)).toBe("09:05");
  });
});
