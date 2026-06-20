import { tripFixture } from "@/src/trip/trip-fixtures";
import type { PlanVariant, Trip } from "@/src/trip/types";

export function tripWithPlans(): Trip {
  const rainPlan: PlanVariant = {
    description: "",
    id: "plan-rain",
    kind: "draft",
    name: "Rain Plan",
    status: "backup",
    tripId: tripFixture.trip.id,
  };
  return {
    ...tripFixture.trip,
    mainTripPlanId: "plan-main",
    activePlanVariantId: "plan-main",
    planVariants: [
      { ...tripFixture.trip.planVariants[0], id: "plan-main" },
      rainPlan,
    ],
    tripPlans: [
      { ...tripFixture.trip.planVariants[0], id: "plan-main" },
      rainPlan,
    ],
  };
}

export function tripWithOnlyMainPlan(): Trip {
  const trip = tripWithPlans();
  return {
    ...trip,
    planVariants: [trip.planVariants[0]],
    tripPlans: [trip.tripPlans![0]],
  };
}
