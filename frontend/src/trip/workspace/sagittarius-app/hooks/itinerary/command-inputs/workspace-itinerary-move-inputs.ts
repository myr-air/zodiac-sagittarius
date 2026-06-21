import {
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
  buildReorderItineraryItemsRequest,
} from "@/src/trip/itinerary-items";
import type { ItineraryItem, Trip } from "@/src/trip/types";

interface WorkspaceMoveItemPatchRequestContext {
  clientMutationId: string;
  itemId: string;
  nextTrip: Trip;
  trip: Trip;
}

interface WorkspaceMoveItemToDayPatchRequestContext {
  clientMutationId: string;
  itemId: string;
  targetDay: string;
  trip: Trip;
}

interface WorkspaceReorderApiInputContext {
  draggedItemId: string;
  getMoveClientMutationId: () => string;
  getReorderClientMutationId: () => string;
  nextTrip: Trip;
  targetItemId: string;
  trip: Trip;
}

export function findWorkspaceItineraryItem(
  trip: Pick<Trip, "itineraryItems">,
  itemId: string,
): ItineraryItem | null {
  return trip.itineraryItems.find((item) => item.id === itemId) ?? null;
}

export function buildWorkspaceMoveItemPatchRequest({
  clientMutationId,
  itemId,
  nextTrip,
  trip,
}: WorkspaceMoveItemPatchRequestContext) {
  const originalItem = findWorkspaceItineraryItem(trip, itemId);
  const movedItem = findWorkspaceItineraryItem(nextTrip, itemId);
  if (!originalItem || !movedItem) return null;

  return buildMoveItineraryItemRequest(movedItem, {
    clientMutationId,
    expectedVersion: originalItem.version,
  });
}

export function buildWorkspaceMoveItemToDayPatchRequest({
  clientMutationId,
  itemId,
  targetDay,
  trip,
}: WorkspaceMoveItemToDayPatchRequestContext) {
  const originalItem = findWorkspaceItineraryItem(trip, itemId);
  if (!originalItem) return null;

  return buildMoveItineraryItemToDayRequest({
    clientMutationId,
    expectedVersion: originalItem.version,
    targetDay,
  });
}

export function buildWorkspaceReorderApiInput({
  draggedItemId,
  getMoveClientMutationId,
  getReorderClientMutationId,
  nextTrip,
  targetItemId,
  trip,
}: WorkspaceReorderApiInputContext) {
  const draggedItem = findWorkspaceItineraryItem(trip, draggedItemId);
  const movedItem = findWorkspaceItineraryItem(nextTrip, draggedItemId);
  const targetItem = findWorkspaceItineraryItem(nextTrip, targetItemId);
  if (!draggedItem || !movedItem || !targetItem) return null;

  const parentChanged =
    (draggedItem.parentItemId ?? null) !== (movedItem.parentItemId ?? null);
  if (draggedItem.day !== movedItem.day || parentChanged) {
    return {
      kind: "move" as const,
      request: buildMoveItineraryItemRequest(movedItem, {
        clientMutationId: getMoveClientMutationId(),
        expectedVersion: draggedItem.version,
      }),
    };
  }

  const reorderedDayItems = nextTrip.itineraryItems.filter(
    (item) =>
      item.planVariantId === targetItem.planVariantId &&
      item.day === targetItem.day,
  );

  return {
    kind: "reorder" as const,
    request: buildReorderItineraryItemsRequest(reorderedDayItems, {
      clientMutationId: getReorderClientMutationId(),
      day: targetItem.day,
      planVariantId: targetItem.planVariantId,
    }),
  };
}
