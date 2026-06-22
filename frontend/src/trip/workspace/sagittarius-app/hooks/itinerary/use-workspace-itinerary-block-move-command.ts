import { useCallback } from "react";
import {
  moveTripItemIntoPlanBlock,
  replaceItineraryItem,
} from "@/src/trip/itinerary-items";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { buildWorkspaceMoveItemPatchRequest } from "./command-inputs/workspace-itinerary-move-inputs";
import type {
  MoveItemIntoPlanBlockCommand,
  UseWorkspaceItineraryMoveCommandsParams,
} from "./workspace-itinerary-move-command-types";

type UseWorkspaceItineraryBlockMoveCommandParams = Omit<
  UseWorkspaceItineraryMoveCommandsParams,
  "updateApiTrip"
>;

export function useWorkspaceItineraryBlockMoveCommand({
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
}: UseWorkspaceItineraryBlockMoveCommandParams): MoveItemIntoPlanBlockCommand {
  return useCallback(
    async (draggedItemId, planBlockItemId) => {
      if (!canEdit || draggedItemId === planBlockItemId) return;

      const nextTrip = moveTripItemIntoPlanBlock(
        trip,
        draggedItemId,
        planBlockItemId,
        selectedTripPlanId,
        workspaceLocalMutationTimestamp,
      );
      if (!nextTrip) return;

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchRequest = buildWorkspaceMoveItemPatchRequest({
          clientMutationId: nextClientMutationId("itinerary-block-move"),
          itemId: draggedItemId,
          nextTrip,
          trip,
        });
        if (!patchRequest) return;
        const patchedItem = await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          patchRequest,
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
      replaceApiTrip,
      resolvedApiClient,
      selectedTripPlanId,
      setSelectedItemId,
      trip,
    ],
  );
}
