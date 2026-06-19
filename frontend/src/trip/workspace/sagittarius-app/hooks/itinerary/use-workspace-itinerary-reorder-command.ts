import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  moveTripItem,
  replaceItineraryItem,
  replaceItineraryItems,
} from "@/src/trip/itinerary";
import {
  buildMoveItineraryItemRequest,
  buildReorderItineraryItemsRequest,
} from "@/src/trip/itinerary-api-requests";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";

interface UseWorkspaceItineraryReorderCommandParams {
  canEdit: boolean;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  resolvedApiClient?: TripApiClient;
  selectedTripPlanId: string;
  setSelectedItemId: (itemId: string) => void;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryReorderCommand({
  canEdit,
  commitTrip,
  isApiMode,
  nextClientMutationId,
  participantSession,
  replaceApiTrip,
  resolvedApiClient,
  selectedTripPlanId,
  setSelectedItemId,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryReorderCommandParams) {
  return useCallback(
    async (draggedItemId: string, targetItemId: string) => {
      if (!canEdit || draggedItemId === targetItemId) return;

      const nextTrip = moveTripItem(
        trip,
        draggedItemId,
        targetItemId,
        selectedTripPlanId,
        workspaceLocalMutationTimestamp,
      );
      if (!nextTrip) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const draggedItem = trip.itineraryItems.find(
          (item) => item.id === draggedItemId,
        );
        const targetItem = nextTrip.itineraryItems.find(
          (item) => item.id === targetItemId,
        );
        if (!draggedItem || !targetItem) return;
        const movedItem = nextTrip.itineraryItems.find(
          (item) => item.id === draggedItemId,
        );
        if (!movedItem) return;
        const parentChanged =
          (draggedItem.parentItemId ?? null) !==
          (movedItem.parentItemId ?? null);
        if (draggedItem.day !== movedItem.day || parentChanged) {
          const patchedItem = await resolvedApiClient.patchItineraryItem(
            trip.id,
            draggedItemId,
            participantSession.sessionToken,
            buildMoveItineraryItemRequest(movedItem, {
              clientMutationId: nextClientMutationId("itinerary-day-move"),
              expectedVersion: draggedItem.version,
            }),
          );
          replaceApiTrip(replaceItineraryItem(nextTrip, patchedItem));
          setSelectedItemId(draggedItemId);
          return;
        }

        const reorderedDayItems = nextTrip.itineraryItems.filter(
          (item) =>
            item.planVariantId === targetItem.planVariantId &&
            item.day === targetItem.day,
        );
        const reorderedItems = await resolvedApiClient.reorderItineraryItems(
          trip.id,
          participantSession.sessionToken,
          buildReorderItineraryItemsRequest(reorderedDayItems, {
            clientMutationId: nextClientMutationId("itinerary-reorder"),
            day: targetItem.day,
            planVariantId: targetItem.planVariantId,
          }),
        );
        updateApiTrip((current) => replaceItineraryItems(current, reorderedItems));
        return;
      }

      commitTrip(() => nextTrip, draggedItemId);
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      replaceApiTrip,
      selectedTripPlanId,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );
}
