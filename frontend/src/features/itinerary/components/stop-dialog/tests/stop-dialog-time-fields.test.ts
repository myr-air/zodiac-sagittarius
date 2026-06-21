import { describe, expect, it } from "vitest";
import {
  applyStopEndTime,
  applyStopStartTime,
  applyStopTimeMode,
  toggleStopNextDayEnd,
} from "../stop-dialog-time-fields";
import { buildInitialStopFormValues } from "../stop-dialog.form";

describe("stop dialog time field helpers", () => {
  it("keeps derived duration and next-day fields in sync", () => {
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

  it("clears scheduled time fields for flexible stops", () => {
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
});
