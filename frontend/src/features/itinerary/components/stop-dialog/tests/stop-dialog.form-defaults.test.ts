import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
} from "../stop-dialog.form";
import { emptyStopDetailValues } from "../stop-dialog.utils";

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
});
