import { useCallback } from "react";
import { moveTripItemToDay } from "@/src/trip/itinerary-items";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { buildWorkspaceMoveItemToDayPatchRequest } from "./command-inputs/workspace-itinerary-move-inputs";
import type {
  MoveItemToDayCommand,
  UseWorkspaceItineraryDayMoveCommandParams,
} from "./workspace-itinerary-move-command-types";

export function useWorkspaceItineraryDayMoveCommand({
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
}: UseWorkspaceItineraryDayMoveCommandParams): MoveItemToDayCommand {
  return useCallback(
    async (draggedItemId, targetDay) => {
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
        const patchRequest = buildWorkspaceMoveItemToDayPatchRequest({
          clientMutationId: nextClientMutationId("itinerary-day-move"),
          itemId: draggedItemId,
          targetDay,
          trip,
        });
        if (!patchRequest) return;
        await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          patchRequest,
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
      replaceApiTrip,
      resolvedApiClient,
      selectedTripPlanId,
      setSelectedItemId,
      trip,
    ],
  );
}
