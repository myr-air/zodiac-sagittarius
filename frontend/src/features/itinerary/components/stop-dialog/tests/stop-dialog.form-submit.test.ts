import { describe, expect, it } from "vitest";
import {
  buildInitialStopFormValues,
  buildStopSubmitValues,
} from "../stop-dialog.form";
import { emptyStopDetailValues } from "../stop-dialog.utils";

describe("stop dialog form submit values", () => {
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
});
