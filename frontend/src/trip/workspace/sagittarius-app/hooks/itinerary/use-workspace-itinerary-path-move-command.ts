import { useCallback } from "react";
import { replaceItineraryItems } from "@/src/trip/itinerary-items";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths";
import {
  buildWorkspacePathMovePlacement,
  buildWorkspacePathMoveReplacementItems,
} from "./command-inputs/workspace-itinerary-path-move-inputs";
import type {
  MoveItemToPathCommand,
  UseWorkspaceItineraryPathMoveCommandParams,
} from "./workspace-itinerary-move-command-types";

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
}: UseWorkspaceItineraryPathMoveCommandParams): MoveItemToPathCommand {
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
