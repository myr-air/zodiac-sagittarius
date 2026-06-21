import { describe, expect, it } from "vitest";
import {
  endOffsetDaysBetweenTimes,
  parseTimeToMinutes,
} from "../../../lib/itinerary-time";
import {
  formatTimeRangeLabel,
  formatTimeTooltip,
} from "../../../domain/itinerary-item-editing";

describe("smart itinerary time helpers", () => {
  it("normalizes time ranges and midnight-overflow offsets", () => {
    expect(parseTimeToMinutes("09:30")).toBe(570);
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(endOffsetDaysBetweenTimes("09:00", "10:00")).toBe(0);
    expect(endOffsetDaysBetweenTimes("18:00", "07:30")).toBe(1);
    expect(formatTimeRangeLabel("09:00", "10:00", 0)).toBe("09:00 - 10:00");
    expect(formatTimeRangeLabel("09:00", "07:30", 1)).toBe("09:00 - 07:30 +1");
  });

  it("builds concise time tooltips for row inline UI", () => {
    expect(formatTimeTooltip(
      {
        startTime: "09:00",
        endTime: "10:30",
        endOffsetDays: 0,
        durationMinutes: 90,
      },
      "en",
    )).toBe("09:00 - 10:30\n1 h 30 m");
    expect(formatTimeTooltip(
      {
        startTime: "09:00",
        endTime: null,
        endOffsetDays: 0,
        durationMinutes: null,
      },
      "en",
    )).toBe("09:00");
  });
});
