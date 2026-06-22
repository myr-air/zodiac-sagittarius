import { findById } from "@/src/shared/collection/find-by-id";
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

export function findTripPlanOptionById(
  tripPlans: readonly PlanVariant[],
  tripPlanId: string | null | undefined,
): PlanVariant | null {
  return findById(tripPlans, tripPlanId);
}

export function findTripPlanById(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
  tripPlanId: string | null | undefined,
): PlanVariant | null {
  return findTripPlanOptionById(tripPlanOptions(trip), tripPlanId);
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
  return Boolean(findTripPlanById(trip, tripPlanId));
}

export function tripPlanName(trip: Trip, tripPlanId: string | null | undefined, fallback = "Unassigned"): string {
  return findTripPlanById(trip, tripPlanId)?.name ?? tripPlanId ?? fallback;
}
