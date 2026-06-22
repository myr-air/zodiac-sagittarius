import { describe, expect, it } from "vitest";
import { seedTrip } from "../../seed";
import {
  defaultTripPlanId,
  findTripPlanById,
  findTripPlanOptionById,
  tripHasPlan,
  tripPlanName,
  tripPlanOptions,
} from "../../trip-plans";

describe("trip plan display", () => {
  it("centralizes canonical Trip Plan options and default ids", () => {
    const canonicalTripPlans = [
      {
        ...seedTrip.planVariants[1],
        id: "canonical-rain",
      },
    ];

    expect(tripPlanOptions({
      ...seedTrip,
      tripPlans: canonicalTripPlans,
    })).toBe(canonicalTripPlans);
    expect(tripPlanOptions({
      ...seedTrip,
      tripPlans: undefined,
    })).toBe(seedTrip.planVariants);
    expect(defaultTripPlanId({
      ...seedTrip,
      activePlanVariantId: "",
      mainTripPlanId: "",
      tripPlans: canonicalTripPlans,
    })).toBe("canonical-rain");
    expect(findTripPlanOptionById(canonicalTripPlans, "canonical-rain")).toBe(
      canonicalTripPlans[0],
    );
  });

  it("resolves Trip Plan names from canonical tripPlans", () => {
    expect(tripPlanName(seedTrip, "plan-rain")).toBe("แผนฝนตก");
    expect(findTripPlanById(seedTrip, "plan-rain")?.name).toBe("แผนฝนตก");
  });

  it("falls back to legacy planVariants when canonical tripPlans are omitted", () => {
    expect(tripPlanName({ ...seedTrip, tripPlans: undefined }, "plan-rain")).toBe("แผนฝนตก");
  });

  it("keeps unknown and unassigned plan ids readable", () => {
    expect(tripPlanName(seedTrip, "missing-plan")).toBe("missing-plan");
    expect(tripPlanName(seedTrip, null)).toBe("Unassigned");
    expect(tripPlanName(seedTrip, undefined, "No plan")).toBe("No plan");
    expect(findTripPlanById(seedTrip, null)).toBeNull();
    expect(findTripPlanOptionById(seedTrip.planVariants, "missing-plan")).toBeNull();
    expect(tripHasPlan(seedTrip, "plan-rain")).toBe(true);
    expect(tripHasPlan(seedTrip, "missing-plan")).toBe(false);
  });
});
