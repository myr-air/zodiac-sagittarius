import { describe, expect, it } from "vitest";
import {
  activityTypeLabel,
  dayRouteLabel,
  formatDuration,
  formatEndTime,
  formatThaiDate,
  formatTimeWindow,
} from "../itinerary-display";

describe("itinerary display formatting", () => {
  it("labels activity types and keeps route labels available from the facade", () => {
    expect(activityTypeLabel("food")).toBe("Food");
    expect(activityTypeLabel("food", "th")).toBe("อาหาร");
    expect(activityTypeLabel("default")).toBe("Default");
    expect(activityTypeLabel("default", "th")).toBe("ทั่วไป");
    expect(dayRouteLabel("2025-05-18", "en", [])).toBe("Trip day");
  });

  it("keeps time display helpers available from the legacy facade", () => {
    expect(formatDuration(135)).toBe("2 h 15 m");
    expect(formatEndTime("23:30", 90)).toBe("01:00");
    expect(formatTimeWindow({ startTime: "23:00", endTime: "02:00", endOffsetDays: 1 })).toBe("23:00-02:00⁺¹");
  });

  it("formats Thai fixture dates", () => {
    expect(formatThaiDate("2025-05-16", "th")).toContain("พ.ค.");
  });

  it("formats Thai dates with the actual month from the date", () => {
    expect(formatThaiDate("2025-06-02", "th")).toBe("2 มิ.ย.");
    expect(formatThaiDate("2025-12-31", "th")).toBe("31 ธ.ค.");
    expect(formatThaiDate("not-a-date", "en")).toBe("not-a-date");
  });
});
