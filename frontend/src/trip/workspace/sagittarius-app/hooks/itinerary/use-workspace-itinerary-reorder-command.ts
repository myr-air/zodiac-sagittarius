import { useCallback } from "react";
import {
  moveTripItem,
  replaceItineraryItem,
  replaceItineraryItems,
} from "@/src/trip/itinerary-items";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { buildWorkspaceReorderApiInput } from "./command-inputs/workspace-itinerary-move-inputs";
import type {
  MoveItemCommand,
  UseWorkspaceItineraryReorderCommandParams,
} from "./workspace-itinerary-move-command-types";

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
}: UseWorkspaceItineraryReorderCommandParams): MoveItemCommand {
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
        const reorderInput = buildWorkspaceReorderApiInput({
          draggedItemId,
          getMoveClientMutationId: () =>
            nextClientMutationId("itinerary-day-move"),
          getReorderClientMutationId: () =>
            nextClientMutationId("itinerary-reorder"),
          nextTrip,
          targetItemId,
          trip,
        });
        if (!reorderInput) return;

        if (reorderInput.kind === "move") {
          const patchedItem = await resolvedApiClient.patchItineraryItem(
            trip.id,
            draggedItemId,
            participantSession.sessionToken,
            reorderInput.request,
          );
          replaceApiTrip(replaceItineraryItem(nextTrip, patchedItem));
          setSelectedItemId(draggedItemId);
          return;
        }

        const reorderedItems = await resolvedApiClient.reorderItineraryItems(
          trip.id,
          participantSession.sessionToken,
          reorderInput.request,
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
