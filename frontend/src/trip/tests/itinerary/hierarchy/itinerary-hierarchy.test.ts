import { describe, expect, it } from "vitest";
import { sortItemsForDay } from "../../../itinerary";
import { hierarchyItem } from "./itinerary-hierarchy.test-support";
import { arrivalDay } from "../core/itinerary.test-support";

describe("itinerary hierarchy and ordering", () => {
  it("orders scheduled rows before flexible rows while keeping flexible manual order", () => {
    const scheduledLate = hierarchyItem({ id: "scheduled-late", startTime: "15:00", sortOrder: 3, timeMode: "scheduled" });
    const scheduledEarly = hierarchyItem({ id: "scheduled-early", startTime: "09:00", sortOrder: 4, timeMode: "scheduled" });
    const flexibleFirst = hierarchyItem({ id: "flexible-first", startTime: "", sortOrder: 1, timeMode: "flexible", durationMinutes: null });
    const flexibleSecond = hierarchyItem({ id: "flexible-second", startTime: "", sortOrder: 2, timeMode: "flexible", durationMinutes: null });

    expect(sortItemsForDay([flexibleSecond, scheduledLate, flexibleFirst, scheduledEarly], arrivalDay).map((item) => item.id)).toEqual([
      "scheduled-early",
      "scheduled-late",
      "flexible-first",
      "flexible-second",
    ]);
  });

  it("keeps sub-activities directly under their parent activity block", () => {
    const block = hierarchyItem({
      id: "block-flight",
      activity: "Flight to Hong Kong",
      startTime: "04:00",
      sortOrder: 100,
      isPlanBlock: true,
      parentItemId: null,
    });
    const unrelatedEarly = hierarchyItem({
      id: "activity-breakfast",
      activity: "Breakfast",
      startTime: "05:30",
      sortOrder: 110,
      isPlanBlock: false,
      parentItemId: null,
    });
    const child = hierarchyItem({
      id: "child-checkin",
      activity: "Check in",
      startTime: "06:00",
      sortOrder: 300,
      isPlanBlock: false,
      parentItemId: "block-flight",
    });
    const laterActivity = hierarchyItem({
      id: "activity-market",
      activity: "Market walk",
      startTime: "07:00",
      sortOrder: 200,
      isPlanBlock: false,
      parentItemId: null,
    });

    expect(
      sortItemsForDay([child, laterActivity, unrelatedEarly, block], arrivalDay).map(
        (item) => item.id,
      ),
    ).toEqual([
      "block-flight",
      "child-checkin",
      "activity-breakfast",
      "activity-market",
    ]);
  });
});
