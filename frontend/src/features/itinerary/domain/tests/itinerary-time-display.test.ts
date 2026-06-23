import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatEndTime,
  formatInlineTimeLabels,
  formatTimeRangeLabel,
  formatTimeWindow,
} from "../itinerary-time-display";

describe("itinerary time display", () => {
  it("formats durations and wrapped end times", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(45)).toBe("45 m");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(135)).toBe("2 h 15 m");
    expect(formatDuration(135, "th")).toBe("2 h 15 m");
    expect(formatEndTime("", 45)).toBe("—");
    expect(formatEndTime("23:30", 90)).toBe("01:00");
  });

  it("formats compact time windows with next-day offsets", () => {
    expect(formatTimeRangeLabel("09:00", "10:00", 0)).toBe("09:00 - 10:00");
    expect(formatTimeRangeLabel("09:00", "07:30", 1)).toBe("09:00 - 07:30 +1");
    expect(formatTimeRangeLabel("", "07:30", 1)).toBe("--:-- - 07:30 +1");
    expect(formatTimeWindow({ startTime: "23:00", endTime: "02:00", endOffsetDays: 1 })).toBe("23:00-02:00⁺¹");
    expect(formatTimeWindow({ startTime: "09:00", endTime: null, endOffsetDays: 0 })).toBe("09:00");
    expect(formatTimeWindow({ startTime: "", endTime: "22:00", endOffsetDays: 0 })).toBe("22:00");
  });

  it("formats inline time labels for editable table controls", () => {
    expect(formatInlineTimeLabels({ startTime: " 09:00 ", endTime: " 10:30 ", endOffsetDays: 0 })).toEqual({
      startLabel: "09:00",
      endLabel: "10:30",
    });
    expect(formatInlineTimeLabels({ startTime: "", endTime: "07:30", endOffsetDays: 1 })).toEqual({
      startLabel: "--:--",
      endLabel: "07:30 +1",
    });
    expect(formatInlineTimeLabels({ startTime: "", endTime: null, endOffsetDays: 0 })).toEqual({
      startLabel: "--:--",
      endLabel: "--:--",
    });
  });
});
