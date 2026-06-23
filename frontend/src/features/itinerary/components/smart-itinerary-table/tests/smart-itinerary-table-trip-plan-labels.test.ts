import { describe, expect, it } from "vitest";
import type { PlanVariant } from "@/src/trip/types";
import {
  buildSmartItineraryTripPlanSelectOptions,
  formatTripPlanOptionLabel,
  selectedTripPlanIdForControl,
  smartItineraryTripPlanStatusSelectOptions,
  tripPlanStatusControlValues,
} from "../smart-itinerary-table-trip-plan-labels";

describe("smart itinerary table trip plan labels", () => {
  it("builds trip plan option labels from status", () => {
    const plans: PlanVariant[] = [
      {
        kind: "split",
        id: "split-1",
        name: "Split",
        tripId: "trip-1",
        description: "",
        status: "proposal",
      } as PlanVariant,
    ];
    const labels = {
      main: "Main",
      proposal: "Proposal",
      draft: "Draft",
      backup: "Backup",
      split: "Split",
      active: "Active",
      archived: "Archived",
      completed: "Completed",
    };
    expect(formatTripPlanOptionLabel(plans[0], labels)).toBe("Split - Proposal");
    expect(buildSmartItineraryTripPlanSelectOptions(plans, labels)).toEqual([
      { value: "split-1", label: "Split - Proposal" },
    ]);
  });

  it("centralizes status select options in control display order", () => {
    const labels = {
      main: "Main",
      proposal: "Proposal",
      draft: "Draft",
      backup: "Backup",
    };

    expect(tripPlanStatusControlValues).toEqual([
      "main",
      "draft",
      "backup",
      "proposal",
    ]);
    expect(smartItineraryTripPlanStatusSelectOptions(labels)).toEqual([
      { value: "main", label: "Main", disabled: true },
      { value: "draft", label: "Draft" },
      { value: "backup", label: "Backup" },
      { value: "proposal", label: "Proposal" },
    ]);
  });

  it("keeps selected trip plan ids stable when the plan exists", () => {
    const plans = [
      { id: "main", name: "Main" },
      { id: "rain", name: "Rain" },
    ] as PlanVariant[];

    expect(selectedTripPlanIdForControl(plans, "rain")).toBe("rain");
  });

  it("falls back to the first available trip plan when selection is stale", () => {
    const plans = [
      { id: "main", name: "Main" },
      { id: "rain", name: "Rain" },
    ] as PlanVariant[];

    expect(selectedTripPlanIdForControl(plans, "missing")).toBe("main");
    expect(selectedTripPlanIdForControl([], "missing")).toBe("");
  });
});
