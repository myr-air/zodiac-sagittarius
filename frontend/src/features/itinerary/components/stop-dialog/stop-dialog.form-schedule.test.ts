import { describe, expect, it } from "vitest";
import {
  applyStopDetailType,
  applyStopEndTime,
  applyStopStartTime,
  applyStopTimeMode,
  buildInitialStopFormValues,
  toggleStopNextDayEnd,
} from "./stop-dialog.form";

describe("stop dialog form schedule updates", () => {
  it("keeps time-window fields in sync as start, end, and next-day values change", () => {
    const values = {
      ...buildInitialStopFormValues({ initialDay: "2026-06-19" }),
      durationMinutes: 60,
      endOffsetDays: 0,
      endTime: "10:00",
      startTime: "09:00",
    };

    expect(applyStopStartTime(values, "09:30")).toMatchObject({
      durationMinutes: 30,
      endOffsetDays: 0,
      endTime: "10:00",
      startTime: "09:30",
    });

    expect(applyStopEndTime(values, "08:30")).toMatchObject({
      durationMinutes: 1410,
      endOffsetDays: 1,
      endTime: "08:30",
    });

    expect(toggleStopNextDayEnd(values)).toMatchObject({
      durationMinutes: 1500,
      endOffsetDays: 1,
    });
  });

  it("clears schedule fields when users switch a stop to flexible timing", () => {
    expect(
      applyStopTimeMode({
        ...buildInitialStopFormValues({ initialDay: "2026-06-19" }),
        durationMinutes: 45,
        endOffsetDays: 1,
        endTime: "01:00",
        startTime: "23:00",
      }, "flexible"),
    ).toMatchObject({
      durationMinutes: null,
      endOffsetDays: 0,
      endTime: null,
      startTime: "",
      timeMode: "flexible",
    });
  });

  it("updates item kind and scheduling when detail type changes", () => {
    const base = buildInitialStopFormValues({ initialDay: "2026-06-19" });

    expect(applyStopDetailType(base, "transportation")).toMatchObject({
      activityType: "travel",
      isPlanBlock: true,
      itemKind: "travel",
    });

    expect(applyStopDetailType(base, "task")).toMatchObject({
      durationMinutes: null,
      endOffsetDays: 0,
      endTime: null,
      isPlanBlock: false,
      itemKind: "note",
      startTime: "",
      timeMode: "flexible",
    });
  });
});
