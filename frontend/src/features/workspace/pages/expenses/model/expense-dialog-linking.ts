import { tripPlanOptions } from "@/src/trip/trip-plans";
import type { ItineraryItem, Trip } from "@/src/trip/types";

export function expenseDialogLinkedItem(
  trip: Pick<Trip, "itineraryItems">,
  itemId: string,
): ItineraryItem | null {
  if (!itemId) return null;
  return trip.itineraryItems.find((item) => item.id === itemId) ?? null;
}

export function expenseDialogEffectiveTripPlanId({
  linkedItem,
  tripPlanId,
}: {
  linkedItem: ItineraryItem | null;
  tripPlanId: string;
}): string {
  return linkedItem?.planVariantId ?? tripPlanId;
}

export function expenseDialogTripPlanIdForItemSelection(
  trip: Pick<Trip, "itineraryItems">,
  itemId: string,
): string | null {
  return expenseDialogLinkedItem(trip, itemId)?.planVariantId ?? null;
}

export function expenseDialogTripPlanOptions(
  trip: Pick<Trip, "tripPlans" | "planVariants">,
) {
  return tripPlanOptions(trip);
}
