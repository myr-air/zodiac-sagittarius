import type { Trip } from "@/src/trip/types";

interface ResolveReloadedTripPlanSelectionOptions {
  initialSelectedTripPlanId: (trip: Trip) => string;
  preferredTripPlanId: string | null;
  resolveSelectedTripPlanId: (
    trip: Trip,
    preferredTripPlanId?: string | null,
  ) => string;
  trip: Trip;
}

export function canSelectWorkspaceTripPlan(
  trip: Trip,
  tripPlanId: string,
): boolean {
  return Boolean(
    tripPlanId && trip.planVariants.some((plan) => plan.id === tripPlanId),
  );
}

export function resolveReloadedTripPlanSelection({
  initialSelectedTripPlanId,
  preferredTripPlanId,
  resolveSelectedTripPlanId,
  trip,
}: ResolveReloadedTripPlanSelectionOptions): string {
  return preferredTripPlanId === null
    ? initialSelectedTripPlanId(trip)
    : resolveSelectedTripPlanId(trip, preferredTripPlanId);
}
