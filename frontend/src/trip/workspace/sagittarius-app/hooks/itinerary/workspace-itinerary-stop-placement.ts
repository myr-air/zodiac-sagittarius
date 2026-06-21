import {
  appendItineraryItemPlacement,
  mainItineraryPathId,
} from "@/src/trip/itinerary";
import { applyItemToActivityBranch } from "@/src/trip/itinerary-paths";
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
