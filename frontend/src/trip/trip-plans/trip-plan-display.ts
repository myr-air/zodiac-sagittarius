import type { Trip } from "../types";

export function tripPlanName(trip: Trip, tripPlanId: string | null | undefined, fallback = "Unassigned"): string {
  const plans = trip.tripPlans ?? trip.planVariants;
  return plans.find((plan) => plan.id === tripPlanId)?.name ?? tripPlanId ?? fallback;
}
