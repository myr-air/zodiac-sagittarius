import { describe, expect, it } from "vitest";
import type { PlanVariant } from "@/src/trip/types";
import {
  formatTripPlanOptionLabel,
  selectedTripPlanIdForControl,
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
