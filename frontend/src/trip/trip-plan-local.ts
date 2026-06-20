import type { PlanVariant, Trip } from "@/src/trip/types";

export interface CreateLocalTripPlanResult {
  trip: Trip;
  tripPlanId: string;
}

export function createLocalTripPlan(
  trip: Trip,
  name: string,
  nextPlanVariantId: (plans: PlanVariant[]) => string,
): CreateLocalTripPlanResult {
  const variant: PlanVariant = {
    id: nextPlanVariantId(trip.planVariants),
    tripId: trip.id,
    name,
    kind: "draft",
    status: "draft",
    description: "",
    version: 1,
  };
  return {
    trip: {
      ...trip,
      planVariants: [...trip.planVariants, variant],
      tripPlans: [...(trip.tripPlans ?? trip.planVariants), variant],
    },
    tripPlanId: variant.id,
  };
}
