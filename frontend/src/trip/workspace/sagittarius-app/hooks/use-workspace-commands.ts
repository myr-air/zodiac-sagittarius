import { useWorkspaceAdministration } from "./use-workspace-administration";
import { useWorkspaceItineraryUiActions } from "./use-workspace-itinerary-ui-actions";
import { useWorkspaceParticipantSessionActions } from "./use-workspace-participant-session-actions";
import { useWorkspacePlanningCommands } from "./use-workspace-planning-commands";

type AdministrationParams = Parameters<typeof useWorkspaceAdministration>[0];
type ItineraryUiParams = Parameters<typeof useWorkspaceItineraryUiActions>[0];
type ParticipantSessionParams = Parameters<
  typeof useWorkspaceParticipantSessionActions
>[0];
type PlanningParams = Parameters<typeof useWorkspacePlanningCommands>[0];

type UseWorkspaceCommandsParams =
  PlanningParams &
  Omit<AdministrationParams, "currentMemberId" | "resolvedApiClient"> &
  Omit<ItineraryUiParams, "createStop"> &
  ParticipantSessionParams & {
    currentMemberId: string;
    resolvedApiClient:
      | PlanningParams["resolvedApiClient"]
      | AdministrationParams["resolvedApiClient"];
  };

export function useWorkspaceCommands({
  accountClient,
  accountSession,
  activeMemberId,
  canEdit,
  canEditBookings,
  canEditExpenses,
  canManagePeople,
  canSaveItineraryErrorMessage,
  commitTrip,
  currentMemberId,
  dialogState,
  effectivePlaceResolver,
  initialTrip,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  participantSession,
  pathOptions,
  pathSelection,
  planItems,
  refreshBackendExpenseSummary,
  replaceApiTrip,
  replaceCockpitFromApi,
  replaceWorkspacePath,
  resetTrip,
  resolvedApiClient,
  routeTripId,
  selectedDay,
  selectedItemId,
  selectedTripPlanId,
  setAccessError,
  setAccountClaimState,
  setBackendExpenseSummary,
  setContextRailPreferredTab,
  setContextRailVisibility,
  setCurrentMemberId,
  setDialogDeleteItem,
  setDialogState,
  setIsCockpitLoaded,
  setJoinInviteToken,
  setParticipantSession,
  setSelectedItemId,
  setStopNotes,
  setStopPlaceResolution,
  setTasks,
  setTripPlanError,
  stopNotes,
  tasks,
  trip,
  tripPlanErrorMessage,
  updateApiTrip,
}: UseWorkspaceCommandsParams) {
  const planningCommands = useWorkspacePlanningCommands({
    activeMemberId,
    canEdit,
    canEditBookings,
    canEditExpenses,
    canSaveItineraryErrorMessage,
    commitTrip,
    dialogState,
    effectivePlaceResolver,
    isApiMode,
    latestTripRef,
    nextClientMutationId,
    participantSession,
    pathOptions,
    pathSelection,
    planItems,
    refreshBackendExpenseSummary,
    replaceApiTrip,
    replaceCockpitFromApi,
    resolvedApiClient,
    selectedDay,
    selectedItemId,
    selectedTripPlanId,
    setBackendExpenseSummary,
    setContextRailPreferredTab,
    setContextRailVisibility,
    setDialogState,
    setSelectedItemId,
    setStopNotes,
    setStopPlaceResolution,
    setTasks,
    setTripPlanError,
    stopNotes,
    tasks,
    trip,
    tripPlanErrorMessage,
    updateApiTrip,
  });

  const administrationCommands = useWorkspaceAdministration({
    accountClient,
    accountSession,
    canManagePeople,
    commitTrip,
    currentMemberId,
    isApiMode,
    participantSession,
    resolvedApiClient,
    setAccountClaimState,
    setJoinInviteToken,
    trip,
    replaceCockpitFromApi,
    updateApiTrip,
  });

  const itineraryUiActions = useWorkspaceItineraryUiActions({
    canEdit,
    createStop: planningCommands.createStop,
    dialogState,
    setContextRailPreferredTab,
    setContextRailVisibility,
    setDialogDeleteItem,
    setDialogState,
    setSelectedItemId,
    setStopPlaceResolution,
    trip,
  });

  const participantSessionActions = useWorkspaceParticipantSessionActions({
    initialTrip,
    isApiMode,
    replaceWorkspacePath,
    resetTrip,
    routeTripId,
    setAccessError,
    setContextRailVisibility,
    setCurrentMemberId,
    setIsCockpitLoaded,
    setParticipantSession,
  });

  return {
    ...planningCommands,
    ...administrationCommands,
    ...itineraryUiActions,
    ...participantSessionActions,
  };
}
