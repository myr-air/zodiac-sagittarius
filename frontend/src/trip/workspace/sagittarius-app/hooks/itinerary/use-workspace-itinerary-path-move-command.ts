import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { replaceItineraryItems } from "@/src/trip/itinerary-items";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import {
  buildWorkspacePathMovePlacement,
  buildWorkspacePathMoveReplacementItems,
} from "./command-inputs/workspace-itinerary-path-move-inputs";

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

      const branchPlacement = buildWorkspacePathMovePlacement(
        trip,
        itemId,
        pathId,
      );
      if (!branchPlacement) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        updateApiTrip((current) =>
          replaceItineraryItems(
            current,
            buildWorkspacePathMoveReplacementItems(
              branchPlacement,
              patchedBranchItems,
            ),
          ),
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
