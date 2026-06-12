import { describe, expect, it } from "vitest";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatEndTime, formatThaiDate, formatTimeWindow } from "./itineraryDisplay";

describe("itinerary display formatting", () => {
  it("labels known route days and activity types", () => {
    expect(activityTypeLabel("food")).toBe("Food");
    expect(activityTypeLabel("food", "th")).toBe("อาหาร");
    expect(dayRouteLabel("2026-06-18")).toBe("Bangkok -> Hong Kong");
    expect(dayRouteLabel("2025-05-16")).toBe("Hong Kong City Day");
    expect(dayRouteLabel("2025-05-17")).toBe("Hong Kong -> Shenzhen");
    expect(dayRouteLabel("2025-05-18")).toBe("Trip day");
  });

  it("formats durations and wrapped end times", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(45)).toBe("45 m");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(135)).toBe("2 h 15 m");
    expect(formatDuration(135, "th")).toBe("2 h 15 m");
    expect(formatEndTime("", 45)).toBe("—");
    expect(formatEndTime("23:30", 90)).toBe("01:00");
    expect(formatTimeWindow({ startTime: "23:00", endTime: "02:00", endOffsetDays: 1 })).toBe("23:00-02:00⁺¹");
    expect(formatTimeWindow({ startTime: "09:00", endTime: null, endOffsetDays: 0 })).toBe("09:00");
  });

  it("formats Thai fixture dates", () => {
    expect(formatThaiDate("2025-05-16", "th")).toContain("พ.ค.");
  });

  it("formats Thai dates with the actual month from the date", () => {
    expect(formatThaiDate("2025-06-02", "th")).toBe("2 มิ.ย.");
    expect(formatThaiDate("2025-12-31", "th")).toBe("31 ธ.ค.");
  });
});
