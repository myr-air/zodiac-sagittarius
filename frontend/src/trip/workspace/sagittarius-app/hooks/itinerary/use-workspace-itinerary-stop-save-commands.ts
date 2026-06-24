import { useWorkspaceItineraryStopCreateCommand } from "./use-workspace-itinerary-stop-create-command";
import { useWorkspaceItineraryStopUpdateCommand } from "./use-workspace-itinerary-stop-update-command";
import type { UseWorkspaceItineraryStopSaveCommandsParams } from "./workspace-itinerary-stop-command-types";

export function useWorkspaceItineraryStopSaveCommands({
  commitTrip,
  currentMemberId,
  dialogState,
  effectivePlaceResolver,
  isApiMode,
  nextClientMutationId,
  participantSession,
  pathOptions,
  pathSelection,
  planItems,
  resolvedApiClient,
  selectedDay,
  selectedTripPlanId,
  setContextRailVisibility,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryStopSaveCommandsParams) {
  const createStop = useWorkspaceItineraryStopCreateCommand({
    commitTrip,
    currentMemberId,
    effectivePlaceResolver,
    isApiMode,
    nextClientMutationId,
    participantSession,
    pathOptions,
    pathSelection,
    planItems,
    resolvedApiClient,
    selectedDay,
    selectedTripPlanId,
    setContextRailVisibility,
    setDialogState,
    setSelectedItemId,
    setStopPlaceResolution,
    trip,
    updateApiTrip,
  });

  const updateSelectedStop = useWorkspaceItineraryStopUpdateCommand({
    commitTrip,
    dialogState,
    effectivePlaceResolver,
    isApiMode,
    nextClientMutationId,
    participantSession,
    resolvedApiClient,
    setDialogState,
    setSelectedItemId,
    setStopPlaceResolution,
    trip,
    updateApiTrip,
  });

  return {
    createStop,
    updateSelectedStop,
  };
}
