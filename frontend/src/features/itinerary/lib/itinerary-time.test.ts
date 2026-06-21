import { describe, expect, it } from "vitest";
import {
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  minutesToTime,
  parseTimeToMinutes,
} from "./itinerary-time";

describe("itinerary time helpers", () => {
  it("parses and formats HH:MM clock values", () => {
    expect(parseTimeToMinutes("08:15")).toBe(495);
    expect(parseTimeToMinutes("bad")).toBeNull();
    expect(minutesToTime(9 * 60 + 5)).toBe("09:05");
  });

  it("computes offsets and durations across day boundaries", () => {
    expect(endOffsetDaysBetweenTimes("23:00", "01:00")).toBe(1);
    expect(durationBetweenTimes("23:00", "01:00", 1)).toBe(120);
  });

  it("returns null for invalid duration inputs", () => {
    expect(durationBetweenTimes("bad", "01:00")).toBeNull();
    expect(durationBetweenTimes("23:00", "bad")).toBeNull();
  });
});
