import { describe, expect, it } from "vitest";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatEndTime, formatThaiDate } from "./itineraryDisplay";

describe("itinerary display formatting", () => {
  it("labels known route days and activity types", () => {
    expect(activityTypeLabel("food")).toBe("อาหาร");
    expect(dayRouteLabel("2025-05-15")).toBe("Bangkok -> Hong Kong");
    expect(dayRouteLabel("2025-05-16")).toBe("Hong Kong City Day");
    expect(dayRouteLabel("2025-05-17")).toBe("Hong Kong -> Shenzhen");
    expect(dayRouteLabel("2025-05-18")).toBe("Trip day");
  });

  it("formats durations and wrapped end times", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(45)).toBe("45 นาที");
    expect(formatDuration(120)).toBe("2 ชม.");
    expect(formatDuration(135)).toBe("2 ชม. 15 นาที");
    expect(formatEndTime("", 45)).toBe("—");
    expect(formatEndTime("23:30", 90)).toBe("01:00");
  });

  it("formats Thai fixture dates", () => {
    expect(formatThaiDate("2025-05-16")).toContain("พ.ค.");
  });
});
