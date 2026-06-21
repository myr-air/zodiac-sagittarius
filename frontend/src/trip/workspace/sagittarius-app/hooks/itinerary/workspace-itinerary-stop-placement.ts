import {
  appendItineraryItemPlacement,
  mainItineraryPathId,
  replaceItineraryItem,
} from "@/src/trip/itinerary";
import {
  applyItemToActivityBranch,
  applyManualActivityPath,
} from "@/src/trip/itinerary-paths";
import type { ItineraryItemPlacement } from "@/src/trip/itinerary";
import type { ItineraryItem, Trip } from "@/src/trip/types";

interface PlaceCreatedWorkspaceStopOptions {
  hasParentItem: boolean;
  targetPathId: string;
}

export function placeCreatedWorkspaceStop(
  trip: Trip,
  item: ItineraryItem,
  { hasParentItem, targetPathId }: PlaceCreatedWorkspaceStopOptions,
): ItineraryItemPlacement {
  if (hasParentItem || targetPathId !== mainItineraryPathId)
    return appendItineraryItemPlacement(trip, item);

  return applyItemToActivityBranch(trip, item);
}

export function placeUpdatedWorkspaceStop(
  trip: Trip,
  item: ItineraryItem,
  manualPathId?: string | null,
): ItineraryItemPlacement {
  const tripWithUpdatedItem = replaceItineraryItem(trip, item);
  const pathPlacement = applyItemToActivityBranch(tripWithUpdatedItem, item);
  return manualPathId
    ? applyManualActivityPath(pathPlacement.trip, item.id, manualPathId)
    : pathPlacement;
}
