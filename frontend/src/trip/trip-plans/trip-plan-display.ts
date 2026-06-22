import type { PlanVariant, Trip } from "../types";

type TripPlanDisplaySource = Pick<
  Trip,
  "activePlanVariantId" | "mainTripPlanId" | "planVariants" | "tripPlans"
>;

export function tripPlanOptions(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
): PlanVariant[] {
  return trip.tripPlans ?? trip.planVariants;
}

export function defaultTripPlanId(trip: TripPlanDisplaySource): string {
  return (
    trip.mainTripPlanId ||
    trip.activePlanVariantId ||
    tripPlanOptions(trip)[0]?.id ||
    ""
  );
}

export function tripHasPlan(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
  tripPlanId: string,
): boolean {
  return tripPlanOptions(trip).some((plan) => plan.id === tripPlanId);
}

export function tripPlanName(trip: Trip, tripPlanId: string | null | undefined, fallback = "Unassigned"): string {
  return tripPlanOptions(trip).find((plan) => plan.id === tripPlanId)?.name ?? tripPlanId ?? fallback;
}
