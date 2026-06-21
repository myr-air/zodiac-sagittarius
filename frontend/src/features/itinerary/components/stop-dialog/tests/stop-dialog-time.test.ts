import { describe, expect, it } from "vitest";

import {
  addMinutesToTime,
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  endWindowFromDuration,
  parseRouteActivity,
  parseTimeRange,
} from "../stop-dialog-time";

describe("stop dialog time helpers", () => {
  it("computes duration and end windows across day boundaries", () => {
    expect(durationBetweenTimes("23:00", "01:00", 1)).toBe(120);
    expect(endOffsetDaysBetweenTimes("23:00", "01:00")).toBe(1);
    expect(endWindowFromDuration("23:30", 90)).toEqual({ endOffsetDays: 1, endTime: "01:00" });
  });

  it("adds minutes to valid clock times", () => {
    expect(addMinutesToTime("08:15", 45)).toBe("09:00");
    expect(addMinutesToTime("bad", 45)).toBe("");
  });

  it("parses route syntax with optional time window", () => {
    expect(parseRouteActivity("DMK -> HKG (8.00am - 11.30am)")).toMatchObject({
      origin: "DMK",
      destination: "HKG",
      startTime: "08:00",
      durationMinutes: 210,
    });
  });

  it("rejects invalid time ranges", () => {
    expect(parseTimeRange("25:00 - 26:00")).toBeNull();
    expect(parseTimeRange("11:90 - 12:00")).toBeNull();
  });
});
