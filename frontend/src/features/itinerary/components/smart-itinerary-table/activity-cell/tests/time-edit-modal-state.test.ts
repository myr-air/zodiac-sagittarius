import { describe, expect, it } from "vitest";

import {
  initialTimeEditModalFormState,
  setTimeEditModalSaving,
  toggleTimeEditModalEndOffsetDays,
  updateTimeEditModalEndTime,
  updateTimeEditModalStartTime,
  type TimeEditModalFormState,
} from "../time-edit-modal-state";

const baseState: TimeEditModalFormState = {
  endOffsetDays: 0,
  endTime: "09:00",
  saving: false,
  startTime: "08:00",
};

describe("time edit modal state", () => {
  it("builds initial form state from the itinerary item time window", () => {
    expect(
      initialTimeEditModalFormState({
        endOffsetDays: 1,
        endTime: "01:00",
        startTime: "23:00",
      }),
    ).toEqual({
      endOffsetDays: 1,
      endTime: "01:00",
      saving: false,
      startTime: "23:00",
    });
  });

  it("clears offset days when an item has no end time", () => {
    expect(
      initialTimeEditModalFormState({
        endOffsetDays: 1,
        endTime: null,
        startTime: "23:00",
      }).endOffsetDays,
    ).toBe(0);
  });

  it("recomputes offset days when start or end time crosses midnight", () => {
    expect(
      updateTimeEditModalEndTime(baseState, "07:30").endOffsetDays,
    ).toBe(1);
    expect(
      updateTimeEditModalStartTime(
        { ...baseState, endTime: "01:00" },
        "23:30",
      ).endOffsetDays,
    ).toBe(1);
  });

  it("resets offset days when end time is cleared", () => {
    expect(updateTimeEditModalEndTime(baseState, "").endOffsetDays).toBe(0);
  });

  it("keeps offset days stable when changing start time without an end time", () => {
    expect(
      updateTimeEditModalStartTime(
        { ...baseState, endOffsetDays: 1, endTime: "" },
        "09:30",
      ).endOffsetDays,
    ).toBe(1);
  });

  it("toggles next-day end and saving state without changing field values", () => {
    expect(toggleTimeEditModalEndOffsetDays(baseState).endOffsetDays).toBe(1);
    expect(
      toggleTimeEditModalEndOffsetDays({
        ...baseState,
        endOffsetDays: 1,
      }).endOffsetDays,
    ).toBe(0);
    expect(setTimeEditModalSaving(baseState, true)).toEqual({
      ...baseState,
      saving: true,
    });
  });
});
