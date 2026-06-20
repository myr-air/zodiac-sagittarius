import { describe, expect, it } from "vitest";
import type { PlanVariant } from "@/src/trip/types";
import { formatTripPlanOptionLabel } from "./smart-itinerary-table-utils";

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
});
