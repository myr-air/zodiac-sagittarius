import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  replaceItineraryItem,
} from "@/src/trip/itinerary";
import {
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
} from "@/src/trip/itinerary-api-requests";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { useWorkspaceItineraryPathMoveCommand } from "./use-workspace-itinerary-path-move-command";
import { useWorkspaceItineraryReorderCommand } from "./use-workspace-itinerary-reorder-command";

interface UseWorkspaceItineraryMoveCommandsParams {
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

export function useWorkspaceItineraryMoveCommands({
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
}: UseWorkspaceItineraryMoveCommandsParams) {
  const moveItem = useWorkspaceItineraryReorderCommand({
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
  });

  const moveItemIntoPlanBlock = useCallback(
    async (draggedItemId: string, planBlockItemId: string) => {
      if (!canEdit || draggedItemId === planBlockItemId) return;

      const nextTrip = moveTripItemIntoPlanBlock(
        trip,
        draggedItemId,
        planBlockItemId,
        selectedTripPlanId,
        workspaceLocalMutationTimestamp,
      );
      if (!nextTrip) return;

      const draggedItem = trip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      const movedItem = nextTrip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      if (!draggedItem || !movedItem) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedItem = await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          buildMoveItineraryItemRequest(movedItem, {
            clientMutationId: nextClientMutationId("itinerary-block-move"),
            expectedVersion: draggedItem.version,
          }),
        );
        replaceApiTrip(replaceItineraryItem(nextTrip, patchedItem));
        setSelectedItemId(draggedItemId);
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
    ],
  );

  const moveItemToDay = useCallback(
    async (draggedItemId: string, targetDay: string) => {
      if (!canEdit) return;

      const nextTrip = moveTripItemToDay(
        trip,
        draggedItemId,
        targetDay,
        selectedTripPlanId,
        workspaceLocalMutationTimestamp,
      );
      if (!nextTrip) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const draggedItem = trip.itineraryItems.find(
          (item) => item.id === draggedItemId,
        );
        if (!draggedItem) return;
        await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          buildMoveItineraryItemToDayRequest({
            clientMutationId: nextClientMutationId("itinerary-day-move"),
            expectedVersion: draggedItem.version,
            targetDay,
          }),
        );
        replaceApiTrip(nextTrip);
        setSelectedItemId(draggedItemId);
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
    ],
  );

  const moveItemToPath = useWorkspaceItineraryPathMoveCommand({
    canEdit,
    commitTrip,
    isApiMode,
    nextClientMutationId,
    participantSession,
    resolvedApiClient,
    setSelectedItemId,
    trip,
    updateApiTrip,
  });

  return {
    moveItem,
    moveItemIntoPlanBlock,
    moveItemToDay,
    moveItemToPath,
  };
}
