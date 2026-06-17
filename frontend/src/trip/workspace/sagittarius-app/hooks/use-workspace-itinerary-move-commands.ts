import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  replaceItineraryItem,
  replaceItineraryItems,
} from "@/src/trip/itinerary";
import {
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
  buildReorderItineraryItemsRequest,
} from "@/src/trip/itinerary-api-requests";
import { applyManualActivityPath } from "@/src/trip/itinerary-paths";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths-api";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";

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
  const moveItem = useCallback(
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

  const moveItemToPath = useCallback(
    async (itemId: string, pathId: string) => {
      if (!canEdit) return;

      const branchPlacement = applyManualActivityPath(trip, itemId, pathId);
      if (
        branchPlacement.trip === trip ||
        branchPlacement.changedExistingItems.length === 0
      ) {
        return;
      }

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        const changedItemIds = new Set(
          branchPlacement.changedExistingItems.map((item) => item.id),
        );
        const branchPlacementItems = branchPlacement.trip.itineraryItems.filter(
          (item) => changedItemIds.has(item.id),
        );
        updateApiTrip((current) =>
          replaceItineraryItems(current, [
            ...branchPlacementItems,
            ...patchedBranchItems,
          ]),
        );
        setSelectedItemId(itemId);
        return;
      }

      commitTrip(() => branchPlacement.trip, itemId);
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );

  return {
    moveItem,
    moveItemIntoPlanBlock,
    moveItemToDay,
    moveItemToPath,
  };
}
