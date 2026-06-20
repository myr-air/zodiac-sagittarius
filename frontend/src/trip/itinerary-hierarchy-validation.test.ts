import { describe, expect, it } from "vitest";
import { validateItineraryItem } from "./itinerary";
import { hierarchyItem } from "./itinerary-hierarchy.test-support";

describe("itinerary hierarchy validation", () => {
  it("warns when a timed child sits outside its plan block window", () => {
    const block = hierarchyItem({
      id: "block-morning",
      activity: "Morning block",
      startTime: "09:00",
      durationMinutes: 60,
      isPlanBlock: true,
    });
    const child = hierarchyItem({
      id: "child-late",
      parentItemId: block.id,
      activity: "Late child",
      startTime: "10:30",
      durationMinutes: 30,
    });

    expect(validateItineraryItem(child, [block, child]).map((warning) => warning.code)).toContain("child-outside-plan-block");
  });

  it("checks overlap only between sibling activities or sibling sub-activities", () => {
    const journeyBlock = hierarchyItem({
      id: "block-flight-window",
      activity: "Flight to Hong Kong",
      startTime: "04:00",
      endTime: "13:00",
      durationMinutes: 540,
      isPlanBlock: true,
      parentItemId: null,
    });
    const ticketedSegment = hierarchyItem({
      id: "child-ticketed-flight",
      activity: "Ticketed flight",
      startTime: "07:00",
      endTime: "11:00",
      durationMinutes: 240,
      isPlanBlock: false,
      parentItemId: journeyBlock.id,
    });
    const immigration = hierarchyItem({
      id: "child-immigration",
      activity: "Immigration",
      startTime: "10:30",
      endTime: "12:00",
      durationMinutes: 90,
      isPlanBlock: false,
      parentItemId: journeyBlock.id,
    });
    const parallelTopLevel = hierarchyItem({
      id: "activity-airport-meeting",
      activity: "Airport meeting",
      startTime: "06:00",
      endTime: "08:00",
      durationMinutes: 120,
      isPlanBlock: false,
      parentItemId: null,
    });

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
    const block = hierarchyItem({
      id: "block-flight",
      activity: "Flight to Hong Kong",
      startTime: "04:00",
      durationMinutes: 540,
      isPlanBlock: true,
      parentItemId: null,
    });
    const plainActivity = hierarchyItem({
      id: "activity-checkin",
      activity: "Check in",
      startTime: "06:00",
      durationMinutes: 45,
      isPlanBlock: false,
      parentItemId: null,
    });
    const validChild = hierarchyItem({
      id: "child-immigration",
      activity: "Immigration",
      startTime: "11:00",
      durationMinutes: 45,
      isPlanBlock: false,
      parentItemId: block.id,
    });
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
