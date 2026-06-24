import { describe, expect, it } from "vitest";
import {
  formatOverviewStopSchedule,
  formatOverviewStopScheduleWithPlace,
} from "../overview-stop-labels";

describe("overview stop labels", () => {
  it("formats overview stop schedule labels from the trip start date", () => {
    expect(
      formatOverviewStopSchedule(
        { day: "2026-06-20", startTime: "09:30" },
        "2026-06-19",
        "en",
      ),
    ).toBe("Day 2 · 09:30");
  });

  it("formats overview stop schedule labels with place detail", () => {
    expect(
      formatOverviewStopScheduleWithPlace(
        { day: "2026-06-19", place: "Central Pier", startTime: "14:00" },
        "2026-06-19",
        "en",
      ),
    ).toBe("Day 1 · 14:00 · Central Pier");
  });
});
