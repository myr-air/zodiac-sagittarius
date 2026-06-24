import { findById } from "@/src/shared/collection";
import {
  buildSelectOptionsFromItems,
  type SelectOption,
} from "@/src/shared/select-options";
import type { PlanVariant, Trip } from "../types";

type TripPlanDisplaySource = Pick<
  Trip,
  "activePlanVariantId" | "mainTripPlanId" | "planVariants" | "tripPlans"
>;

export type TripPlanSelectOption = SelectOption;

export function tripPlanOptions(
  trip: Pick<Trip, "planVariants" | "tripPlans">,
): PlanVariant[] {
  return trip.tripPlans ?? trip.planVariants;
}

export function buildTripPlanSelectOptions(
  tripPlans: readonly Pick<PlanVariant, "id" | "name">[],
): TripPlanSelectOption[] {
  return buildSelectOptionsFromItems(
    tripPlans,
    (plan) => plan.id,
    (plan) => plan.name,
  );
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
