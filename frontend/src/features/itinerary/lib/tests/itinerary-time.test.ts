import { describe, expect, it } from "vitest";
import {
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  minutesToTime,
  parseTimeToMinutes,
  toDateTimeLocalValue,
} from "../itinerary-time";

describe("itinerary-time helpers", () => {
  it("exposes trip-core time helpers through the feature facade", () => {
    expect(parseTimeToMinutes("09:30")).toBe(570);
    expect(endOffsetDaysBetweenTimes("18:00", "07:30")).toBe(1);
    expect(durationBetweenTimes("23:00", "01:00", 1)).toBe(120);
    expect(minutesToTime(9 * 60 + 5)).toBe("09:05");
  });

  it("exposes shared date-time-local helpers through the feature facade", () => {
    expect(itineraryDateTimeValue("2026-06-10", "09:30")).toBe("2026-06-10T09:30");
    expect(itineraryDateTimeValue("2026-06-10", "   ")).toBeNull();
    expect(toDateTimeLocalValue("2026-06-10T09:45:30.000Z")).toBe("2026-06-10T09:45");
    expect(fromDateTimeLocalValue("2026-06-10T09:45:30.000Z")).toBe("2026-06-10T09:45:30.000Z");
    expect(fromDateTimeLocalValue("   ")).toBeNull();
  });
});
