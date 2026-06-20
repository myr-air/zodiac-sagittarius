import type { UseWorkspaceItineraryCommandsParams } from "./use-workspace-itinerary-commands-params";
import { useWorkspaceItineraryAddCommands } from "./itinerary/use-workspace-itinerary-add-commands";
import { useWorkspaceItineraryDeleteCommand } from "./itinerary/use-workspace-itinerary-delete-command";
import { useWorkspaceItineraryInlineUpdateCommand } from "./itinerary/use-workspace-itinerary-inline-update-command";
import { useWorkspaceItineraryMapCommands } from "./itinerary/use-workspace-itinerary-map-commands";
import { useWorkspaceItineraryMoveCommands } from "./itinerary/use-workspace-itinerary-move-commands";
import { useWorkspaceItineraryStopSaveCommands } from "./itinerary/use-workspace-itinerary-stop-save-commands";

export function useWorkspaceItineraryCommands({
  canEdit,
  canSaveItineraryErrorMessage,
  currentMemberId,
  dialogState,
  effectivePlaceResolver,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  pathOptions,
  pathSelection,
  planItems,
  participantSession,
  resolvedApiClient,
  replaceApiTrip,
  replaceCockpitFromApi,
  selectedDay,
  selectedItemId,
  selectedTripPlanId,
  setContextRailVisibility,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  setTripPlanError,
  tripPlanErrorMessage,
  trip,
  commitTrip,
  updateApiTrip,
}: UseWorkspaceItineraryCommandsParams) {
  const updateItineraryItemInline = useWorkspaceItineraryInlineUpdateCommand({
    canEdit,
    canSaveItineraryErrorMessage,
    commitTrip,
    isApiMode,
    latestTripRef,
    nextClientMutationId,
    participantSession,
    replaceApiTrip,
    replaceCockpitFromApi,
    resolvedApiClient,
    setSelectedItemId,
    setTripPlanError,
  });

  const addCommands = useWorkspaceItineraryAddCommands({
    canEdit,
    setContextRailVisibility,
    setDialogState,
    setStopPlaceResolution,
    setTripPlanError,
    trip,
    tripPlanErrorMessage,
    updateItineraryItemInline,
  });

  const moveCommands = useWorkspaceItineraryMoveCommands({
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

  const stopSaveCommands = useWorkspaceItineraryStopSaveCommands({
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
  });

  const mapCommands = useWorkspaceItineraryMapCommands({
    canEdit,
    effectivePlaceResolver,
    nextClientMutationId,
    trip,
    updateItineraryItemInline,
  });

  const deleteStop = useWorkspaceItineraryDeleteCommand({
    canEdit,
    commitTrip,
    isApiMode,
    participantSession,
    resolvedApiClient,
    selectedItemId,
    setContextRailVisibility,
    setDialogState,
    setSelectedItemId,
    trip,
    updateApiTrip,
  });

  return {
    ...addCommands,
    ...moveCommands,
    ...stopSaveCommands,
    ...mapCommands,
    updateItineraryItemInline,
    ...deleteStop,
  };
}
