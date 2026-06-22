import { useWorkspaceItineraryBlockMoveCommand } from "./use-workspace-itinerary-block-move-command";
import { useWorkspaceItineraryDayMoveCommand } from "./use-workspace-itinerary-day-move-command";
import { useWorkspaceItineraryPathMoveCommand } from "./use-workspace-itinerary-path-move-command";
import { useWorkspaceItineraryReorderCommand } from "./use-workspace-itinerary-reorder-command";
import type { UseWorkspaceItineraryMoveCommandsParams } from "./workspace-itinerary-move-command-types";

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
  const moveItemIntoPlanBlock = useWorkspaceItineraryBlockMoveCommand({
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
  });
  const moveItemToDay = useWorkspaceItineraryDayMoveCommand({
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
  });
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
