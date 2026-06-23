import { describe, expect, it } from "vitest";
import { itineraryItemPriorityValues } from "@/src/trip/itinerary-core";
import { stopDetailLabels } from "@/src/features/itinerary/domain/stop-details";
import {
  stopDialogDaySelectOptions,
  stopDialogDetailTypeSelectOptions,
  stopDialogPathSelectOptions,
  stopDialogValueSelectOptions,
} from "../stop-dialog-select-options";

describe("stop dialog select options", () => {
  it("builds value-label options from itinerary enum values", () => {
    expect(stopDialogValueSelectOptions(itineraryItemPriorityValues)).toEqual([
      { value: "low", label: "low" },
      { value: "normal", label: "normal" },
      { value: "high", label: "high" },
      { value: "must", label: "must" },
    ]);
  });

  it("formats day and path options for context controls", () => {
    expect(
      stopDialogDaySelectOptions({
        days: ["2026-06-18"],
        locale: "en",
        startDate: "2026-06-18",
      }),
    ).toEqual([
      { value: "2026-06-18", label: "Day 1 · Jun 18" },
    ]);
    expect(
      stopDialogPathSelectOptions([
        { id: "main", name: "Main" },
        { id: "path-rain", name: "Rain Route" },
      ]),
    ).toEqual([
      { value: "main", label: "Main" },
      { value: "path-rain", label: "Rain Route" },
    ]);
  });

  it("uses localized stop detail labels for type options", () => {
    expect(
      stopDialogDetailTypeSelectOptions({
        detailLabels: stopDetailLabels("th"),
        detailTypeOptions: ["transportation", "stay"],
      }),
    ).toEqual([
      { value: "transportation", label: "การเดินทางแบบเป็นช่วง" },
      { value: "stay", label: "ที่พัก" },
    ]);
  });
});
