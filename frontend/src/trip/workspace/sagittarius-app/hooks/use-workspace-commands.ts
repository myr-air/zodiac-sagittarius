import { useWorkspaceAdministration } from "./use-workspace-administration";
import { useWorkspaceBookingCommands } from "./use-workspace-booking-commands";
import { useWorkspaceExpenses } from "./use-workspace-expenses";
import { useWorkspaceItineraryCommands } from "./use-workspace-itinerary-commands";
import { useWorkspaceItineraryImport } from "./use-workspace-itinerary-import";
import { useWorkspaceItineraryUiActions } from "./use-workspace-itinerary-ui-actions";
import { useWorkspaceParticipantSessionActions } from "./use-workspace-participant-session-actions";

type AdministrationParams = Parameters<typeof useWorkspaceAdministration>[0];
type BookingParams = Parameters<typeof useWorkspaceBookingCommands>[0];
type ExpenseParams = Parameters<typeof useWorkspaceExpenses>[0];
type ImportParams = Parameters<typeof useWorkspaceItineraryImport>[0];
type ItineraryParams = Parameters<typeof useWorkspaceItineraryCommands>[0];
type ItineraryUiParams = Parameters<typeof useWorkspaceItineraryUiActions>[0];
type ParticipantSessionParams = Parameters<
  typeof useWorkspaceParticipantSessionActions
>[0];

type UseWorkspaceCommandsParams =
  Omit<ItineraryParams, "currentMemberId"> &
  Omit<BookingParams, "apiClient" | "currentMemberId" | "updateItineraryItemInline"> &
  Omit<ExpenseParams, "apiClient" | "createBookingDoc" | "currentMemberId"> &
  Omit<ImportParams, "apiClient"> &
  Omit<AdministrationParams, "currentMemberId" | "resolvedApiClient"> &
  Omit<ItineraryUiParams, "createStop"> &
  ParticipantSessionParams & {
    activeMemberId: string;
    currentMemberId: string;
    resolvedApiClient:
      | ItineraryParams["resolvedApiClient"]
      | BookingParams["apiClient"]
      | ExpenseParams["apiClient"]
      | ImportParams["apiClient"]
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
  const {
    addStop,
    addSubActivity,
    createStop,
    deleteStop,
    moveItemToPath,
    resolveMissingMapCoordinates,
    updateItineraryItemInline,
    updateSelectedStop,
  } = useWorkspaceItineraryCommands({
    canEdit,
    canSaveItineraryErrorMessage,
    currentMemberId: activeMemberId,
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
  });

  const {
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    createItineraryBookingDraft,
    deleteBookingDoc,
    saveItineraryBookingTicket,
    unlinkBookingFromItineraryItem,
    updateBookingDoc,
  } = useWorkspaceBookingCommands({
    apiClient: resolvedApiClient,
    canEditBookings,
    commitTrip,
    currentMemberId: activeMemberId,
    isApiMode,
    latestTripRef,
    nextClientMutationId,
    participantSession,
    replaceApiTrip,
    replaceCockpitFromApi,
    selectedTripPlanId,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip,
    updateItineraryItemInline,
  });

  const {
    createExpense,
    deleteExpense,
    duplicateExpenseAsEstimate,
    recordPaybackReminder,
    updateExpense,
  } = useWorkspaceExpenses({
    apiClient: resolvedApiClient,
    canEditBookings,
    canEditExpenses,
    commitTrip,
    createBookingDoc,
    currentMemberId: activeMemberId,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    selectedTripPlanId,
    setBackendExpenseSummary,
    trip,
    updateApiTrip,
  });

  const {
    applyPendingItineraryImport,
    clearPendingItineraryImport,
    importItineraryError,
    pendingItineraryImport,
  } = useWorkspaceItineraryImport({
    apiClient: resolvedApiClient,
    canEdit,
    commitTrip,
    isApiMode,
    participantSession,
    planItems,
    selectedTripPlanId,
    setBackendExpenseSummary,
    setContextRailVisibility,
    setSelectedItemId,
    setStopNotes,
    setTasks,
    stopNotes,
    tasks,
    trip,
    updateApiTrip,
  });

  const {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
    claimCurrentMemberToAccount,
    createMember,
    resetMemberClaim,
    saveTripSettings,
    rotateJoinInviteToken,
    transferOwnerToAccountMember,
  } = useWorkspaceAdministration({
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

  const {
    deleteSelectedStop,
    editItem,
    openItemDetails,
    promoteFoodRecommendation,
    selectItem,
  } = useWorkspaceItineraryUiActions({
    canEdit,
    createStop,
    dialogState,
    setContextRailPreferredTab,
    setContextRailVisibility,
    setDialogDeleteItem,
    setDialogState,
    setSelectedItemId,
    setStopPlaceResolution,
    trip,
  });

  const {
    authenticateParticipant,
    leaveParticipantSession,
    replaceTripFromJoin,
  } = useWorkspaceParticipantSessionActions({
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
    addStop,
    addSubActivity,
    applyPendingItineraryImport,
    authenticateParticipant,
    changeBookingDocQuickFields,
    changeBookingDocType,
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
    claimCurrentMemberToAccount,
    clearPendingItineraryImport,
    createBookingDoc,
    createExpense,
    createItineraryBookingDraft,
    createMember,
    createStop,
    deleteBookingDoc,
    deleteExpense,
    deleteSelectedStop,
    deleteStop,
    duplicateExpenseAsEstimate,
    editItem,
    importItineraryError,
    leaveParticipantSession,
    moveItemToPath,
    openItemDetails,
    pendingItineraryImport,
    promoteFoodRecommendation,
    recordPaybackReminder,
    replaceTripFromJoin,
    resetMemberClaim,
    resolveMissingMapCoordinates,
    rotateJoinInviteToken,
    saveItineraryBookingTicket,
    saveTripSettings,
    selectItem,
    transferOwnerToAccountMember,
    unlinkBookingFromItineraryItem,
    updateBookingDoc,
    updateExpense,
    updateItineraryItemInline,
    updateSelectedStop,
  };
}
