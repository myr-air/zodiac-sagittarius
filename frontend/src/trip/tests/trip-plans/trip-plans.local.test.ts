import { describe, expect, it } from "vitest";
import { createLocalTripPlan } from "@/src/trip/trip-plans";
import { seedTrip } from "@/src/trip/seed";
import type { Trip } from "@/src/trip/types";
import { plan } from "./trip-plans.test-support";

describe("local trip plans", () => {
  it("creates a local draft Trip Plan in both compatibility aliases", () => {
    const result = createLocalTripPlan(
      seedTrip,
      "Museum day",
      (plans) => `plan-local-${plans.length + 1}`,
    );

    expect(result.tripPlanId).toBe(`plan-local-${seedTrip.planVariants.length + 1}`);
    expect(
      result.trip.planVariants.find((candidate) => candidate.id === result.tripPlanId),
    ).toEqual({
      id: result.tripPlanId,
      tripId: seedTrip.id,
      name: "Museum day",
      kind: "draft",
      status: "draft",
      description: "",
      version: 1,
    });
    expect(result.trip.tripPlans).toEqual(result.trip.planVariants);
  });

  it("preserves canonical tripPlans when creating a local draft Trip Plan", () => {
    const existingTripPlan = plan({
      id: "plan-canonical-only",
      name: "Canonical only",
    });
    const trip: Trip = {
      ...seedTrip,
      tripPlans: [existingTripPlan],
    };

    const result = createLocalTripPlan(
      trip,
      "Food day",
      () => "plan-food-day",
    );

    expect(result.trip.tripPlans?.map((candidate) => candidate.id)).toEqual([
      existingTripPlan.id,
      "plan-food-day",
    ]);
    expect(result.trip.planVariants.map((candidate) => candidate.id)).toContain("plan-food-day");
  });
});
