import { useWorkspaceBookingCommands } from "./use-workspace-booking-commands";
import { useWorkspaceExpenses } from "./use-workspace-expenses";
import { useWorkspaceItineraryCommands } from "./use-workspace-itinerary-commands";
import { useWorkspaceItineraryImport } from "./use-workspace-itinerary-import";

type BookingParams = Parameters<typeof useWorkspaceBookingCommands>[0];
type ExpenseParams = Parameters<typeof useWorkspaceExpenses>[0];
type ImportParams = Parameters<typeof useWorkspaceItineraryImport>[0];
type ItineraryParams = Parameters<typeof useWorkspaceItineraryCommands>[0];

type UseWorkspacePlanningCommandsParams =
  Omit<ItineraryParams, "currentMemberId"> &
  Omit<BookingParams, "apiClient" | "currentMemberId" | "updateItineraryItemInline"> &
  Omit<ExpenseParams, "apiClient" | "createBookingDoc" | "currentMemberId"> &
  Omit<ImportParams, "apiClient"> & {
    activeMemberId: string;
    resolvedApiClient:
      | ItineraryParams["resolvedApiClient"]
      | BookingParams["apiClient"]
      | ExpenseParams["apiClient"]
      | ImportParams["apiClient"];
  };

export function useWorkspacePlanningCommands({
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
}: UseWorkspacePlanningCommandsParams) {
  const itineraryCommands = useWorkspaceItineraryCommands({
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

  const bookingCommands = useWorkspaceBookingCommands({
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
    updateItineraryItemInline: itineraryCommands.updateItineraryItemInline,
  });

  const expenseCommands = useWorkspaceExpenses({
    apiClient: resolvedApiClient,
    canEditBookings,
    canEditExpenses,
    commitTrip,
    createBookingDoc: bookingCommands.createBookingDoc,
    currentMemberId: activeMemberId,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    selectedTripPlanId,
    setBackendExpenseSummary,
    trip,
    updateApiTrip,
  });

  const importCommands = useWorkspaceItineraryImport({
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

  return {
    ...itineraryCommands,
    ...bookingCommands,
    ...expenseCommands,
    ...importCommands,
  };
}
