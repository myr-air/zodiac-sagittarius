import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { tripPlanOptions } from "@/src/trip/trip-plans";
import type { ItineraryItem, Trip } from "@/src/trip/types";

export function expenseDialogLinkedItem(
  trip: Pick<Trip, "itineraryItems">,
  itemId: string,
): ItineraryItem | null {
  return findItineraryItemById(trip.itineraryItems, itemId);
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

export function expenseDialogItemSelectionFields({
  currentTripPlanId,
  itemId,
  trip,
}: {
  currentTripPlanId: string;
  itemId: string;
  trip: Pick<Trip, "itineraryItems">;
}): { itemId: string; tripPlanId: string } {
  return {
    itemId,
    tripPlanId:
      expenseDialogTripPlanIdForItemSelection(trip, itemId) ?? currentTripPlanId,
  };
}

export function expenseDialogTripPlanOptions(
  trip: Pick<Trip, "tripPlans" | "planVariants">,
) {
  return tripPlanOptions(trip);
}
