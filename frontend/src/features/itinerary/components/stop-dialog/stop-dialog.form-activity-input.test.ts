import { describe, expect, it } from "vitest";
import {
  applyStopActivityInput,
  buildInitialStopFormValues,
} from "./stop-dialog.form";
import { emptyStopDetailValues } from "./stop-dialog.utils";

describe("stop dialog form activity input", () => {
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
