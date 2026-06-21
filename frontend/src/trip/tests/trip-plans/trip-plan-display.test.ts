import { describe, expect, it } from "vitest";
import { seedTrip } from "../../seed";
import { tripPlanName } from "../../trip-plan-display";

describe("trip plan display", () => {
  it("resolves Trip Plan names from canonical tripPlans", () => {
    expect(tripPlanName(seedTrip, "plan-rain")).toBe("แผนฝนตก");
  });

  it("falls back to legacy planVariants when canonical tripPlans are omitted", () => {
    expect(tripPlanName({ ...seedTrip, tripPlans: undefined }, "plan-rain")).toBe("แผนฝนตก");
  });

  it("keeps unknown and unassigned plan ids readable", () => {
    expect(tripPlanName(seedTrip, "missing-plan")).toBe("missing-plan");
    expect(tripPlanName(seedTrip, null)).toBe("Unassigned");
    expect(tripPlanName(seedTrip, undefined, "No plan")).toBe("No plan");
  });
});
