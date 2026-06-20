import { describe, expect, it } from "vitest";
import { sortItemsForDay, validateItineraryItem } from "./itinerary";
import { arrivalDay } from "./itinerary.test-support";
import { seedTrip } from "./seed";

describe("itinerary hierarchy and ordering", () => {
  it("orders scheduled rows before flexible rows while keeping flexible manual order", () => {
    const base = seedTrip.itineraryItems[0];
    const scheduledLate = { ...base, id: "scheduled-late", day: arrivalDay, startTime: "15:00", sortOrder: 3, timeMode: "scheduled" as const };
    const scheduledEarly = { ...base, id: "scheduled-early", day: arrivalDay, startTime: "09:00", sortOrder: 4, timeMode: "scheduled" as const };
    const flexibleFirst = { ...base, id: "flexible-first", day: arrivalDay, startTime: "", sortOrder: 1, timeMode: "flexible" as const, durationMinutes: null };
    const flexibleSecond = { ...base, id: "flexible-second", day: arrivalDay, startTime: "", sortOrder: 2, timeMode: "flexible" as const, durationMinutes: null };

    expect(sortItemsForDay([flexibleSecond, scheduledLate, flexibleFirst, scheduledEarly], arrivalDay).map((item) => item.id)).toEqual([
      "scheduled-early",
      "scheduled-late",
      "flexible-first",
      "flexible-second",
    ]);
  });

  it("keeps sub-activities directly under their parent activity block", () => {
    const base = seedTrip.itineraryItems[0];
    const block = {
      ...base,
      id: "block-flight",
      activity: "Flight to Hong Kong",
      day: arrivalDay,
      startTime: "04:00",
      sortOrder: 100,
      isPlanBlock: true,
      parentItemId: null,
    };
    const unrelatedEarly = {
      ...base,
      id: "activity-breakfast",
      activity: "Breakfast",
      day: arrivalDay,
      startTime: "05:30",
      sortOrder: 110,
      isPlanBlock: false,
      parentItemId: null,
    };
    const child = {
      ...base,
      id: "child-checkin",
      activity: "Check in",
      day: arrivalDay,
      startTime: "06:00",
      sortOrder: 300,
      isPlanBlock: false,
      parentItemId: "block-flight",
    };
    const laterActivity = {
      ...base,
      id: "activity-market",
      activity: "Market walk",
      day: arrivalDay,
      startTime: "07:00",
      sortOrder: 200,
      isPlanBlock: false,
      parentItemId: null,
    };

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

  it("warns when a timed child sits outside its plan block window", () => {
    const base = seedTrip.itineraryItems[0];
    const block = {
      ...base,
      id: "block-morning",
      activity: "Morning block",
      day: arrivalDay,
      startTime: "09:00",
      durationMinutes: 60,
      isPlanBlock: true,
    };
    const child = {
      ...base,
      id: "child-late",
      parentItemId: block.id,
      activity: "Late child",
      day: arrivalDay,
      startTime: "10:30",
      durationMinutes: 30,
    };

    expect(validateItineraryItem(child, [block, child]).map((warning) => warning.code)).toContain("child-outside-plan-block");
  });

  it("checks overlap only between sibling activities or sibling sub-activities", () => {
    const base = seedTrip.itineraryItems[0];
    const journeyBlock = {
      ...base,
      id: "block-flight-window",
      activity: "Flight to Hong Kong",
      day: arrivalDay,
      startTime: "04:00",
      endTime: "13:00",
      durationMinutes: 540,
      isPlanBlock: true,
      parentItemId: null,
    };
    const ticketedSegment = {
      ...base,
      id: "child-ticketed-flight",
      activity: "Ticketed flight",
      day: arrivalDay,
      startTime: "07:00",
      endTime: "11:00",
      durationMinutes: 240,
      isPlanBlock: false,
      parentItemId: journeyBlock.id,
    };
    const immigration = {
      ...base,
      id: "child-immigration",
      activity: "Immigration",
      day: arrivalDay,
      startTime: "10:30",
      endTime: "12:00",
      durationMinutes: 90,
      isPlanBlock: false,
      parentItemId: journeyBlock.id,
    };
    const parallelTopLevel = {
      ...base,
      id: "activity-airport-meeting",
      activity: "Airport meeting",
      day: arrivalDay,
      startTime: "06:00",
      endTime: "08:00",
      durationMinutes: 120,
      isPlanBlock: false,
      parentItemId: null,
    };

    expect(
      validateItineraryItem(ticketedSegment, [journeyBlock, ticketedSegment]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("overlap");
    expect(
      validateItineraryItem(journeyBlock, [journeyBlock, parallelTopLevel]).map(
        (warning) => warning.code,
      ),
    ).toContain("overlap");
    expect(
      validateItineraryItem(ticketedSegment, [
        journeyBlock,
        ticketedSegment,
        immigration,
      ]).map((warning) => warning.code),
    ).toContain("overlap");
  });

  it("warns when hierarchy rows break Day > Activity block > Sub-activity", () => {
    const base = seedTrip.itineraryItems[0];
    const block = {
      ...base,
      id: "block-flight",
      activity: "Flight to Hong Kong",
      day: arrivalDay,
      startTime: "04:00",
      durationMinutes: 540,
      isPlanBlock: true,
      parentItemId: null,
    };
    const plainActivity = {
      ...base,
      id: "activity-checkin",
      activity: "Check in",
      day: arrivalDay,
      startTime: "06:00",
      durationMinutes: 45,
      isPlanBlock: false,
      parentItemId: null,
    };
    const validChild = {
      ...base,
      id: "child-immigration",
      activity: "Immigration",
      day: arrivalDay,
      startTime: "11:00",
      durationMinutes: 45,
      isPlanBlock: false,
      parentItemId: block.id,
    };
    const orphanChild = {
      ...validChild,
      id: "child-orphan",
      parentItemId: "missing-block",
    };
    const childUnderPlainActivity = {
      ...validChild,
      id: "child-under-plain",
      parentItemId: plainActivity.id,
    };
    const grandchild = {
      ...validChild,
      id: "child-nested",
      parentItemId: validChild.id,
    };
    const otherPlanChild = {
      ...validChild,
      id: "child-other-plan",
      planVariantId: "plan-other",
    };

    expect(
      validateItineraryItem(validChild, [block, validChild]).map(
        (warning) => warning.code,
      ),
    ).not.toContain("child-outside-plan-block");
    expect(
      validateItineraryItem(orphanChild, [block, orphanChild]).map(
        (warning) => warning.code,
      ),
    ).toContain("missing-parent-item");
    expect(
      validateItineraryItem(childUnderPlainActivity, [
        plainActivity,
        childUnderPlainActivity,
      ]).map((warning) => warning.code),
    ).toContain("invalid-parent-plan-block");
    expect(
      validateItineraryItem(grandchild, [block, validChild, grandchild]).map(
        (warning) => warning.code,
      ),
    ).toEqual(
      expect.arrayContaining(["nested-sub-activity", "invalid-parent-plan-block"]),
    );
    expect(
      validateItineraryItem(otherPlanChild, [block, otherPlanChild]).map(
        (warning) => warning.code,
      ),
    ).toContain("parent-scope-mismatch");
  });
});
