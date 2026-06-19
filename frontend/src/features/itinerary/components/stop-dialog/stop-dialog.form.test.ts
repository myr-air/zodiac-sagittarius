import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  applyStopActivityInput,
  applyStopDetailType,
  applyStopEndTime,
  applyStopStartTime,
  applyStopTimeMode,
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
  buildStopSubmitValues,
  toggleStopNextDayEnd,
} from "./stop-dialog.form";
import { emptyStopDetailValues } from "./stop-dialog.utils";

describe("stop dialog form helpers", () => {
  it("builds create defaults from trip context", () => {
    expect(
      buildInitialStopFormValues({
        initialDay: "2026-06-19",
        initialParentItemId: "parent-stop",
        startDate: "2026-06-18",
      }),
    ).toMatchObject({
      activity: "",
      day: "2026-06-19",
      endTime: null,
      parentItemId: "parent-stop",
      pathId: "main",
      startTime: "16:30",
      timeMode: "scheduled",
    });
  });

  it("builds edit defaults from the selected item", () => {
    const initialItem = {
      ...tripFixture.planItems[0],
      endTime: null,
      durationMinutes: 75,
      startTime: "10:00",
    };

    expect(buildInitialStopFormValues({ initialItem })).toMatchObject({
      activity: initialItem.activity,
      day: initialItem.day,
      endTime: "11:15",
      startTime: "10:00",
    });
  });

  it("prefills structured detail values with transportation fallback", () => {
    expect(
      buildInitialStopDetailValues({
        ...tripFixture.planItems[0],
        transportation: "Plane",
        details: { kind: "transportation", origin: "DMK", destination: "HKG" },
      }),
    ).toEqual({
      ...emptyStopDetailValues,
      origin: "DMK",
      destination: "HKG",
      mode: "Plane",
    });
  });

  it("normalizes submit payloads and preserves selected place candidates", () => {
    const candidate = {
      address: "Austin Road West, Hong Kong",
      confidence: 0.92,
      coordinates: { lat: 22.3049, lng: 114.1617 },
      evidence: ["name match"],
      mapLink: "https://maps.example.test/elements",
      name: "The Elements",
      source: "storybook",
    };

    expect(
      buildStopSubmitValues({
        detailType: "transportation",
        detailValues: {
          ...emptyStopDetailValues,
          destination: " Hong Kong International Airport ",
          origin: " Don Mueang ",
          mode: " Plane ",
        },
        saveUnresolved: false,
        selectedCandidate: candidate,
        values: {
          ...buildInitialStopFormValues({ initialDay: "2026-06-19" }),
          activity: "  DMK -> HKG  ",
          activityType: "experience",
          durationMinutes: 180,
          endOffsetDays: 1,
          endTime: "02:00",
          mapLink: " https://maps.example.test/route ",
          note: " group ticket ",
          place: "",
          startTime: "23:00",
          transportation: " plane ",
        },
      }),
    ).toMatchObject({
      activity: "DMK -> HKG",
      activityType: "travel",
      details: {
        kind: "transportation",
        destination: "Hong Kong International Airport",
        mode: "Plane",
        origin: "Don Mueang",
      },
      durationMinutes: 180,
      endOffsetDays: 1,
      mapLink: "https://maps.example.test/route",
      note: "group ticket",
      place: "Hong Kong International Airport",
      resolvedPlace: candidate,
      transportation: "plane",
    });
  });

  it("clears hidden time fields for flexible items", () => {
    expect(
      buildStopSubmitValues({
        detailType: "task",
        detailValues: { ...emptyStopDetailValues, detail: "Ask before ticket issue" },
        saveUnresolved: true,
        values: {
          ...buildInitialStopFormValues({ initialDay: "2026-06-19" }),
          activity: " Passport spelling ",
          activityType: "food",
          durationMinutes: 120,
          endOffsetDays: 1,
          endTime: "01:00",
          startTime: "23:00",
          timeMode: "flexible",
        },
      }),
    ).toMatchObject({
      activity: "Passport spelling",
      activityType: "experience",
      durationMinutes: null,
      endOffsetDays: 0,
      endTime: null,
      resolvedPlace: undefined,
      saveUnresolved: true,
      startTime: "",
    });
  });

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

  it("parses route-style activity input into transportation details and timing", () => {
    const result = applyStopActivityInput({
      activity: "DMK -> HKG (09:15-11:45)",
      detailValues: emptyStopDetailValues,
      values: buildInitialStopFormValues({ initialDay: "2026-06-19" }),
    });

    expect(result.detailType).toBe("transportation");
    expect(result.detailValues).toMatchObject({
      destination: "HKG",
      origin: "DMK",
    });
    expect(result.values).toMatchObject({
      activity: "DMK -> HKG (09:15-11:45)",
      durationMinutes: 150,
      endOffsetDays: 0,
      endTime: "11:45",
      itemKind: "travel",
      startTime: "09:15",
    });
  });
});
