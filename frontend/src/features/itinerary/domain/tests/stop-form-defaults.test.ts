import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
} from "../stop-form-model";
import { emptyStopDetailValues } from "../stop-details";

describe("stop dialog form defaults", () => {
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
      startTime: "",
      timeMode: "flexible",
    });
  });

  it("new activities default to flexible with no time", () => {
    expect(
      buildInitialStopFormValues({
        initialDay: "2026-06-19",
        startDate: "2026-06-18",
      }),
    ).toMatchObject({
      startTime: "",
      endTime: null,
      timeMode: "flexible",
      durationMinutes: null,
    });
  });

  it("builds edit defaults from the selected item", () => {
    const initialItem = buildItineraryItem({
      endTime: null,
      durationMinutes: 75,
      startTime: "10:00",
    });

    expect(buildInitialStopFormValues({ initialItem })).toMatchObject({
      activity: initialItem.activity,
      day: initialItem.day,
      endTime: "11:15",
      startTime: "10:00",
    });
  });

  it("prefills structured detail values with transportation fallback", () => {
    expect(
      buildInitialStopDetailValues(
        buildItineraryItem({
          transportation: "Plane",
          details: { kind: "transportation", origin: "DMK", destination: "HKG" },
        }),
      ),
    ).toEqual({
      ...emptyStopDetailValues,
      origin: "DMK",
      destination: "HKG",
      mode: "Plane",
    });
  });
});
