import { applyManualActivityPath } from "@/src/trip/itinerary-paths";
import type { ItineraryItemPlacement } from "@/src/trip/itinerary-items";
import type { ItineraryItem, Trip } from "@/src/trip/types";

export function buildWorkspacePathMovePlacement(
  trip: Trip,
  itemId: string,
  pathId: string,
): ItineraryItemPlacement | null {
  const branchPlacement = applyManualActivityPath(trip, itemId, pathId);
  if (
    branchPlacement.trip === trip ||
    branchPlacement.changedExistingItems.length === 0
  ) {
    return null;
  }
  return branchPlacement;
}

export function buildWorkspacePathMoveReplacementItems(
  branchPlacement: ItineraryItemPlacement,
  patchedBranchItems: ItineraryItem[],
): ItineraryItem[] {
  const changedItemIds = new Set(
    branchPlacement.changedExistingItems.map((item) => item.id),
  );
  const branchPlacementItems = branchPlacement.trip.itineraryItems.filter(
    (item) => changedItemIds.has(item.id),
  );
  return [...branchPlacementItems, ...patchedBranchItems];
}
