import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { replaceItineraryItems } from "@/src/trip/itinerary";
import { applyManualActivityPath } from "@/src/trip/itinerary-paths";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths-api";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

interface UseWorkspaceItineraryPathMoveCommandParams {
  canEdit: boolean;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  setSelectedItemId: (itemId: string) => void;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryPathMoveCommand({
  canEdit,
  commitTrip,
  isApiMode,
  nextClientMutationId,
  participantSession,
  resolvedApiClient,
  setSelectedItemId,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryPathMoveCommandParams) {
  return useCallback(
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
}
