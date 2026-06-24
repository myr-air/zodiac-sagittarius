import { nextClientMutationId } from "@/src/trip/identity";
import type { UseWorkspaceCommandsParams } from "./use-workspace-commands-params";
import type { UseWorkspacePlanningContextParams } from "./use-workspace-planning-context-params";
import type { WorkspacePlanningContext } from "./use-workspace-planning-context";
import type { WorkspaceSetupContext } from "./use-workspace-setup-context";

interface BuildWorkspacePlanningContextParamsOptions {
  initialTrip: UseWorkspacePlanningContextParams["initialTrip"];
  tripPlanErrorMessage: string;
}

interface BuildWorkspaceCommandsParamsOptions {
  canSaveItineraryErrorMessage: string;
  initialTrip: UseWorkspaceCommandsParams["initialTrip"];
  routeTripId: UseWorkspaceCommandsParams["routeTripId"];
  tripPlanErrorMessage: string;
}

export function buildWorkspacePlanningContextParams(
  setup: WorkspaceSetupContext,
  {
    initialTrip,
    tripPlanErrorMessage,
  }: BuildWorkspacePlanningContextParamsOptions,
): UseWorkspacePlanningContextParams {
  return {
    activePlanItems: setup.activePlanItems,
    backendExpenseSummary: setup.backendExpenseSummary,
    canCreateStopNote: setup.canCreateStopNote,
    canCreateSuggestion: setup.canCreateSuggestion,
    canReviewSuggestions: setup.canReviewSuggestions,
    canEdit: setup.canEdit,
    canManageTripPlans: setup.canManageTripPlans,
    commitTrip: setup.commitTrip,
    currentMember: setup.currentMember,
    initialTrip,
    isApiMode: setup.isApiMode,
    latestTripRef: setup.latestTripRef,
    mainPlanItems: setup.mainPlanItems,
    participantSession: setup.participantSession,
    planItems: setup.planItems,
    replaceDailyBriefings: setup.replaceDailyBriefings,
    resetBackendExpenseSummary: setup.resetBackendExpenseSummary,
    resetDailyBriefings: setup.resetDailyBriefings,
    resolvedApiClient: setup.resolvedApiClient,
    selectedItemId: setup.selectedItemId,
    selectedTripPlanId: setup.selectedTripPlanId,
    sessionRestored: setup.sessionRestored,
    setAccessError: setup.setAccessError,
    setContextRailPreferredTab: setup.setContextRailPreferredTab,
    setIsCockpitLoaded: setup.setIsCockpitLoaded,
    setIsTripPlanBusy: setup.setIsTripPlanBusy,
    setParticipantSession: setup.setParticipantSession,
    setSelectedItemId: setup.setSelectedItemId,
    setSelectedTripPlanId: setup.setSelectedTripPlanId,
    setTripPlanError: setup.setTripPlanError,
    setTripState: setup.setTripState,
    trip: setup.trip,
    tripPlanErrorMessage,
    updateApiTrip: setup.updateApiTrip,
  };
}

export function buildWorkspaceCommandsParams(
  setup: WorkspaceSetupContext,
  planning: WorkspacePlanningContext,
  {
    canSaveItineraryErrorMessage,
    initialTrip,
    routeTripId,
    tripPlanErrorMessage,
  }: BuildWorkspaceCommandsParamsOptions,
): UseWorkspaceCommandsParams {
  return {
    canEdit: setup.canEdit,
    canEditBookings: setup.canEditBookings,
    canEditExpenses: setup.canEditExpenses,
    canManagePeople: setup.canManagePeople,
    canSaveItineraryErrorMessage,
    accountClient: setup.accountClient,
    accountSession: setup.accountSession,
    activeMemberId: setup.currentMember.id,
    commitTrip: setup.commitTrip,
    currentMemberId: setup.currentMemberId,
    dialogState: setup.dialogState,
    effectivePlaceResolver: setup.effectivePlaceResolver,
    initialTrip,
    isApiMode: setup.isApiMode,
    latestTripRef: setup.latestTripRef,
    nextClientMutationId,
    pathOptions: setup.pathOptions,
    pathSelection: setup.pathSelection,
    planItems: setup.planItems,
    participantSession: setup.participantSession,
    refreshBackendExpenseSummary: setup.refreshBackendExpenseSummary,
    replaceApiTrip: setup.replaceApiTrip,
    replaceCockpitFromApi: planning.replaceCockpitFromApi,
    replaceWorkspacePath: setup.replaceWorkspacePath,
    resetTrip: setup.resetTrip,
    resolvedApiClient: setup.resolvedApiClient,
    routeTripId,
    selectedDay: planning.selectedDay,
    selectedItemId: setup.selectedItemId,
    selectedTripPlanId: setup.selectedTripPlanId,
    setAccessError: setup.setAccessError,
    setAccountClaimState: setup.setAccountClaimState,
    setBackendExpenseSummary: setup.setBackendExpenseSummary,
    setContextRailPreferredTab: setup.setContextRailPreferredTab,
    setContextRailVisibility: setup.setContextRailVisibility,
    setCurrentMemberId: setup.setCurrentMemberId,
    setDialogDeleteItem: setup.setDialogDeleteItem,
    setDialogState: setup.setDialogState,
    setIsCockpitLoaded: setup.setIsCockpitLoaded,
    setJoinInviteToken: setup.setJoinInviteToken,
    setParticipantSession: setup.setParticipantSession,
    setSelectedItemId: setup.setSelectedItemId,
    setStopNotes: planning.setStopNotes,
    setStopPlaceResolution: setup.setStopPlaceResolution,
    setTasks: planning.setTasks,
    setTripPlanError: setup.setTripPlanError,
    stopNotes: planning.stopNotes,
    tasks: planning.tasks,
    trip: setup.trip,
    tripPlanErrorMessage,
    updateApiTrip: setup.updateApiTrip,
  };
}
