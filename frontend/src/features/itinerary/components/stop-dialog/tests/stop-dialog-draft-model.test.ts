import { describe, expect, it } from "vitest";
import type { PlaceResolutionCandidate } from "@/src/trip/types";
import { emptyStopDetailValues } from "@/src/features/itinerary/domain/stop-details";
import { buildInitialStopDialogDraftState } from "../stop-dialog-draft-initial-state";
import { buildStopDialogDraftSubmitValues } from "../stop-dialog-draft-submit";
import {
  selectStopDialogPlaceCandidate,
  toggleStopDialogNextDayEnd,
  updateStopDialogActivity,
  updateStopDialogDetailType,
  updateStopDialogDetailValue,
  updateStopDialogEndTime,
  updateStopDialogStartTime,
  updateStopDialogTimeMode,
  updateStopDialogValue,
} from "../stop-dialog-draft-updaters";

const candidate: PlaceResolutionCandidate = {
  address: "Austin Road West, Hong Kong",
  confidence: 0.92,
  coordinates: { lat: 22.3049, lng: 114.1617 },
  evidence: ["name match"],
  mapLink: "https://maps.example.test/elements",
  name: "The Elements",
  source: "unit",
};

describe("stop dialog draft state", () => {
  it("builds initial draft state from create inputs", () => {
    expect(
      buildInitialStopDialogDraftState({
        initialDay: "2026-06-20",
        initialParentItemId: "parent-1",
      }),
    ).toMatchObject({
      detailType: "experience",
      detailValues: emptyStopDetailValues,
      values: {
        day: "2026-06-20",
        parentItemId: "parent-1",
        pathId: "main",
        timeMode: "scheduled",
      },
    });
  });

  it("updates simple values and detail values without changing other draft fields", () => {
    const initial = buildInitialStopDialogDraftState({
      initialDay: "2026-06-20",
    });

    const renamed = updateStopDialogValue(initial, "activity", "Dinner");
    const detailed = updateStopDialogDetailValue(
      renamed,
      "meetingPoint",
      "Lobby",
    );

    expect(detailed).toMatchObject({
      ...renamed,
      detailValues: {
        ...emptyStopDetailValues,
        meetingPoint: "Lobby",
      },
      values: {
        ...initial.values,
        activity: "Dinner",
      },
    });
  });

  it("updates time fields through the shared stop form time model", () => {
    const initial = buildInitialStopDialogDraftState({
      initialDay: "2026-06-20",
    });
    const scheduled = updateStopDialogEndTime(
      updateStopDialogStartTime(initial, "22:30"),
      "01:15",
    );

    expect(scheduled.values).toMatchObject({
      durationMinutes: 165,
      endOffsetDays: 1,
      endTime: "01:15",
      startTime: "22:30",
    });

    expect(toggleStopDialogNextDayEnd(scheduled).values.endOffsetDays).toBe(0);
    expect(updateStopDialogTimeMode(scheduled, "flexible").values).toMatchObject({
      durationMinutes: null,
      endOffsetDays: 0,
      endTime: null,
      startTime: "",
      timeMode: "flexible",
    });
  });

  it("keeps detail type and stop values in sync", () => {
    const initial = buildInitialStopDialogDraftState({
      initialDay: "2026-06-20",
    });

    expect(updateStopDialogDetailType(initial, "task")).toMatchObject({
      detailType: "task",
      values: {
        durationMinutes: null,
        endOffsetDays: 0,
        endTime: null,
        itemKind: "note",
        startTime: "",
        timeMode: "flexible",
      },
    });
  });

  it("parses route-like activity input into transportation draft state", () => {
    const initial = buildInitialStopDialogDraftState({
      initialDay: "2026-06-20",
    });
    const parsed = updateStopDialogActivity(
      initial,
      "Central -> Cheung Chau (09:00-09:45)",
    );

    expect(parsed).toMatchObject({
      detailType: "transportation",
      detailValues: {
        destination: "Cheung Chau",
        origin: "Central",
      },
      values: {
        activity: "Central -> Cheung Chau (09:00-09:45)",
        activityType: "travel",
        durationMinutes: 45,
        itemKind: "travel",
        startTime: "09:00",
      },
    });
  });

  it("builds submit values with selected candidate or unresolved save", () => {
    const initial = buildInitialStopDialogDraftState({
      initialDay: "2026-06-20",
    });
    const selected = selectStopDialogPlaceCandidate(
      updateStopDialogValue(initial, "activity", " Elements "),
      candidate,
    );

    expect(buildStopDialogDraftSubmitValues(selected, false)).toMatchObject({
      activity: "Elements",
      resolvedPlace: candidate,
      saveUnresolved: false,
    });
    expect(buildStopDialogDraftSubmitValues(selected, true)).toMatchObject({
      resolvedPlace: undefined,
      saveUnresolved: true,
    });
  });
});
