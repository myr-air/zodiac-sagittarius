import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  canSelectWorkspaceTripPlan,
  resolveReloadedTripPlanSelection,
} from "./workspace-trip-plan-selection";

describe("workspace trip plan selection", () => {
  it("only allows selecting existing trip plans", () => {
    expect(
      canSelectWorkspaceTripPlan(seedTrip, seedTrip.activePlanVariantId),
    ).toBe(true);
    expect(canSelectWorkspaceTripPlan(seedTrip, "")).toBe(false);
    expect(canSelectWorkspaceTripPlan(seedTrip, "missing-plan")).toBe(false);
  });

  it("uses the initial selected plan when reload is requested without a preference", () => {
    const initialSelectedTripPlanId = vi.fn(() => "main-plan");
    const resolveSelectedTripPlanId = vi.fn(() => "preferred-plan");

    expect(
      resolveReloadedTripPlanSelection({
        initialSelectedTripPlanId,
        preferredTripPlanId: null,
        resolveSelectedTripPlanId,
        trip: seedTrip,
      }),
    ).toBe("main-plan");
    expect(initialSelectedTripPlanId).toHaveBeenCalledWith(seedTrip);
    expect(resolveSelectedTripPlanId).not.toHaveBeenCalled();
  });

  it("resolves a preferred plan after reload when a preference is available", () => {
    const initialSelectedTripPlanId = vi.fn(() => "main-plan");
    const resolveSelectedTripPlanId = vi.fn(() => "preferred-plan");

    expect(
      resolveReloadedTripPlanSelection({
        initialSelectedTripPlanId,
        preferredTripPlanId: "draft-plan",
        resolveSelectedTripPlanId,
        trip: seedTrip,
      }),
    ).toBe("preferred-plan");
    expect(resolveSelectedTripPlanId).toHaveBeenCalledWith(
      seedTrip,
      "draft-plan",
    );
    expect(initialSelectedTripPlanId).not.toHaveBeenCalled();
  });
});
