"use client";

import { useCallback } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  type TripApiClient,
} from "@/src/trip/api-client";
import { type PlaceResolver } from "@/src/trip/place-resolution";
import {
  type PlanningView,
  workspaceViewSupportsContextRail,
} from "@/src/trip/workspace/planning-view";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
} from "@/src/trip/workspace/selected-trip-plan";
import { useDailyBriefings } from "@/src/trip/workspace/use-daily-briefings";
import { useItineraryPathWorkspace } from "@/src/trip/workspace/use-itinerary-path-workspace";
import { useTripWorkspaceRecords } from "@/src/trip/workspace/use-trip-workspace-records";
import { useTripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";
import { useWorkspaceChrome } from "@/src/trip/workspace/use-workspace-chrome";
import { useWorkspaceNavigation } from "@/src/trip/workspace/use-workspace-navigation";
import {
  useWorkspacePhotoAlbums,
  useWorkspaceBookingCommands,
  useWorkspaceAccessContext,
  useWorkspaceApiCockpitEffects,
  useWorkspaceApiClients,
  useWorkspaceBackendExpenseSummary,
  useWorkspaceCockpitReplacement,
  useWorkspaceItineraryImport,
  useWorkspaceItineraryUiActions,
  useWorkspaceParticipantSessionActions,
  useWorkspaceAdministration,
  useWorkspaceExpenses,
  useWorkspaceItineraryCommands,
  useWorkspaceRecords,
  useWorkspaceTripPlanCommands,
  useWorkspaceSession,
  useWorkspaceItineraryViewModel,
  useEffectivePlaceResolver,
  useWorkspaceSelectedTripPlanState,
  useWorkspaceSelectedTripPlanSync,
  useWorkspaceUiState,
} from "./hooks";
import { nextClientMutationId } from "@/src/trip/local-ids";
import { seedTrip } from "@/src/trip/seed";
import { WorkspaceAppFrame } from "./WorkspaceAppFrame";
import {
  buildWorkspaceAccessProps,
  buildWorkspaceShellProps,
  buildWorkspaceViewsProps,
} from "./props";
import type { Trip } from "@/src/trip/types";
import type { SagittariusAccessMode, SagittariusPortalSection } from "./types";

interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
  dataSource?: "api" | "local";
  apiClient?: TripApiClient;
  placeResolver?: PlaceResolver;
  routeTripId?: string;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  accessMode?: SagittariusAccessMode;
  accountSuccessRedirectHref?: string;
  portalSection?: SagittariusPortalSection;
  initialMemberId?: string;
  initialTrip?: Trip;
}

export function SagittariusApp({
  initialView = "overview",
  requireJoin = false,
  dataSource = "local",
  apiClient,
  placeResolver,
  routeTripId,
  initialJoinCode,
  initialJoinToken,
  accessMode = "combined",
  accountSuccessRedirectHref,
  portalSection = "dashboard",
  initialMemberId,
  initialTrip = seedTrip,
}: SagittariusAppProps) {
  const { t } = useI18n();
  const {
    accountClient,
    apiBaseUrl,
    resolvedApiClient,
  } = useWorkspaceApiClients({ apiClient, dataSource });
  const {
    accountClaimState,
    currentMemberId,
    dialogDeleteItem,
    dialogState,
    isCockpitLoaded,
    isTripPlanBusy,
    joinInviteToken,
    selectedItemId,
    setAccountClaimState,
    setCurrentMemberId,
    setDialogDeleteItem,
    setDialogState,
    setIsCockpitLoaded,
    setIsTripPlanBusy,
    setJoinInviteToken,
    setSelectedItemId,
    setStopPlaceResolution,
    setTripPlanError,
    stopPlaceResolution,
    tripPlanError,
  } = useWorkspaceUiState({
    initialJoinToken,
    initialMemberId,
    initialTrip,
  });
  const {
    contextRailMounted,
    contextRailOpen,
    contextRailPreferredTab,
    dismissWorkspaceToast,
    setContextRailPreferredTab,
    setContextRailVisibility,
    sidebarCollapsed,
    toggleContextRail,
    toggleSidebarCollapsed,
    toastDismissed,
    toastDismissing,
  } = useWorkspaceChrome({ autoDismissToast: requireJoin });
  const [selectedTripPlanId, setSelectedTripPlanId] =
    useWorkspaceSelectedTripPlanState(initialTrip);
  const {
    commitTrip,
    latestTripRef,
    replaceApiTrip,
    resetTrip,
    setTripState,
    trip,
    updateApiTrip,
  } = useTripWorkspaceState(initialTrip, setSelectedItemId);
  const isDataSourceApiMode = dataSource === "api";
  const {
    accessError,
    accountSession,
    accountSessionLoaded,
    accountTripAccessDeniedRouteId,
    changeAccountSession,
    participantSession,
    sessionRestored,
    setAccessError,
    setParticipantSession,
  } = useWorkspaceSession({
    accountClient,
    initialTrip,
    isApiMode: isDataSourceApiMode,
    requireJoin,
    routeTripId,
    setCurrentMemberId,
    setSelectedTripPlanId,
    setTripState,
  });
  const {
    activePlanItems,
    changeDayPath,
    clearDayPath,
    dayPathOverrides,
    mainPlanItems,
    pathOptions,
    pathSelection,
    planItems,
    selectedTripPathId,
    showAllPaths,
    toggleShowAllPaths,
  } = useItineraryPathWorkspace(trip, selectedTripPlanId);

  const {
    currentView,
    navigateWorkspacePath,
    replaceWorkspacePath,
  } = useWorkspaceNavigation({
    initialView,
    routeTripId,
    tripId: trip.id,
  });
  const effectivePlaceResolver = useEffectivePlaceResolver({
    apiClient: resolvedApiClient,
    participantSession,
    placeResolver,
    tripId: trip.id,
  });
  const {
    canAccessPanel,
    canCreateStopNote,
    canCreateSuggestion,
    canEdit,
    canEditBookings,
    canEditExpenses,
    canEditPhotoAlbums,
    canManagePeople,
    canManageTripPlans,
    canReviewSuggestions,
    canViewExpenses,
    currentMember,
    isAccountTripAccessPending,
    isApiMode,
    isTripLoading,
    sessionMember,
    shouldRedirectUnauthenticatedTripRoute,
  } = useWorkspaceAccessContext({
    accessError,
    accessMode,
    accountSession,
    accountSessionLoaded,
    accountTripAccessDeniedRouteId,
    currentMemberId,
    dataSource,
    isCockpitLoaded,
    participantSession,
    requireJoin,
    routeTripId,
    sessionRestored,
    trip,
  });
  const {
    replaceDailyBriefings,
    resetDailyBriefings,
    saveDailyBriefingOverrides,
    visibleDailyBriefings,
  } = useDailyBriefings({
    apiClient: resolvedApiClient,
    isApiMode,
    participantSession,
    trip,
  });
  const supportsContextRail = workspaceViewSupportsContextRail(currentView);
  const {
    backendExpenseSummary,
    refreshBackendExpenseSummary,
    resetBackendExpenseSummary,
    setBackendExpenseSummary,
  } = useWorkspaceBackendExpenseSummary({
    apiClient: resolvedApiClient,
    canViewExpenses,
    currentView,
    isApiMode,
    isCockpitLoaded,
    participantSession,
    selectedTripPlanId,
    setAccessError,
    setParticipantSession,
    trip,
  });
  const {
    createPhotoAlbum,
    deletePhotoAlbum,
    updatePhotoAlbum,
  } = useWorkspacePhotoAlbums({
    apiClient: resolvedApiClient,
    canEditPhotoAlbums,
    commitTrip,
    currentMemberId: currentMember.id,
    isApiMode,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    setTripState,
    trip,
  });

  useWorkspaceSelectedTripPlanSync({
    isApiMode,
    sessionRestored,
    setSelectedTripPlanId,
    trip,
  });
  const {
    itineraryView,
    mainItineraryView,
    selectedDay,
    selectedItem,
    selectedItemIdForView,
  } = useWorkspaceItineraryViewModel({
    activePlanItems,
    latestTripRef,
    mainPlanItems,
    planItems,
    selectedItemId,
    trip,
  });
  const {
    createItineraryNote,
    createStopNote,
    createTask,
    deleteStopNote,
    reviewSuggestion,
    replaceWorkspaceRecords,
    setStopNotes,
    setTasks,
    stopNotes,
    suggestions,
    suggestSelectedStop,
    tasks,
    toggleTaskStatus,
    updateStopNote,
  } = useWorkspaceRecords({
    canCreateSuggestion,
    canReviewSuggestions,
    canCreateStopNote,
    canEdit,
    commitTrip,
    currentMemberId: currentMember.id,
    initialTrip,
    isApiMode,
    participantSession,
    resolveApiClient: resolvedApiClient,
    selectedItem: selectedItem ?? null,
    selectedTripPlanId,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip,
  });

  const replaceCockpitFromApi = useWorkspaceCockpitReplacement({
    replaceWorkspaceRecords,
    resetBackendExpenseSummary,
    setIsCockpitLoaded,
    setTripState,
  });

  const {
    createTripPlan,
    selectTripPlan,
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  } = useWorkspaceTripPlanCommands({
    canManageTripPlans,
    isApiMode,
    latestTripRef,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    resolveSelectedTripPlanId,
    selectedTripPlanId,
    setIsTripPlanBusy,
    setSelectedTripPlanId,
    setTripPlanError,
    trip,
    tripPlanErrorMessage: t.itinerary.tripPlans.error,
    commitTrip,
    updateApiTrip,
    initialSelectedTripPlanId,
    resolvedApiClient,
  });

  const {
    expenseSummary,
    scopedSuggestions,
    scopedTripForRecords,
    scopedTripPlanRecords,
  } = useTripWorkspaceRecords({
    activePlanItems,
    backendExpenseSummary,
    currentMemberId: currentMember.id,
    selectedTripPlanId,
    stopNotes,
    suggestions,
    tasks,
    trip,
  });

  useWorkspaceApiCockpitEffects({
    isApiMode,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    replaceDailyBriefings,
    resetDailyBriefings,
    resolvedApiClient,
    resolveSelectedTripPlanId,
    setAccessError,
    setIsCockpitLoaded,
    setParticipantSession,
    setSelectedTripPlanId,
    updateApiTrip,
  });

  const navigateWorkspaceView = useCallback(
    (view: PlanningView, href: string) => {
      navigateWorkspacePath(view, href);
      setContextRailVisibility(false);
    },
    [navigateWorkspacePath, setContextRailVisibility],
  );

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
    canSaveItineraryErrorMessage: t.itinerary.saveError,
    currentMemberId: currentMember.id,
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
    tripPlanErrorMessage: t.itinerary.tripPlans.error,
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
    currentMemberId: currentMember.id,
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
    currentMemberId: currentMember.id,
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

  function openExpensesWorkspace() {
    navigateWorkspaceView("expenses", appRoutes.tripExpenses(trip.id));
  }

  const viewsProps = buildWorkspaceViewsProps({
    activePlanItems,
    apiBaseUrl,
    bookingDocs: scopedTripPlanRecords.bookingDocs,
    canEdit,
    canEditBookings,
    canEditExpenses,
    canEditPhotoAlbums,
    canManagePeople,
    contextRailOpen,
    currentMember,
    currentView,
    dailyBriefings: visibleDailyBriefings,
    dayPathOverrides,
    expenseSummary,
    itineraryView,
    joinInviteToken,
    mainItineraryView,
    mainPlanItems,
    onAddBookingForItem: createItineraryBookingDraft,
    onAddNoteForItem: (itemId, body) => void createItineraryNote(itemId, body),
    onAddStop: addStop,
    onAddSubActivity: addSubActivity,
    onChangeDayPath: changeDayPath,
    onChangeMemberAccessStatus: changeMemberAccessStatus,
    onChangeMemberPassword: changeMemberPassword,
    onChangeMemberRole: changeMemberRole,
    onChangeTripPlan: selectTripPlan,
    onChangeTripPlanStatus: updateTripPlanStatus,
    onClearDayPath: clearDayPath,
    onCreateBookingDoc: async (input) => {
      await createBookingDoc(input);
    },
    onCreateExpense: createExpense,
    onCreateMember: createMember,
    onCreatePhotoAlbum: createPhotoAlbum,
    onCreateTask: createTask,
    onCreateTripPlan: createTripPlan,
    onDeleteBookingDoc: deleteBookingDoc,
    onDeleteExpense: deleteExpense,
    onDeleteItem: deleteStop,
    onDeletePhotoAlbum: deletePhotoAlbum,
    onDuplicateExpenseAsEstimate: duplicateExpenseAsEstimate,
    onEditItem: editItem,
    onMoveItemToPath: moveItemToPath,
    onOpenExpenses: openExpensesWorkspace,
    onOpenItemDetails: openItemDetails,
    onRecordPaybackReminder: recordPaybackReminder,
    onRenameTripPlan: renameTripPlan,
    onResetMemberClaim: resetMemberClaim,
    onResolveMissingCoordinates:
      canEdit && effectivePlaceResolver ? resolveMissingMapCoordinates : undefined,
    onRotateJoinInviteToken: isApiMode ? rotateJoinInviteToken : undefined,
    onSaveDailyBriefingOverrides: saveDailyBriefingOverrides,
    onSaveDayTitle: (date, version, title) =>
      saveDailyBriefingOverrides(date, version, { dayTitle: title }),
    onSaveItineraryBookingTicket: saveItineraryBookingTicket,
    onSaveTripSettings: saveTripSettings,
    onSelectItem: selectItem,
    onSetMainTripPlan: setMainTripPlan,
    onToggleContextRail: toggleContextRail,
    onToggleShowAllPaths: toggleShowAllPaths,
    onToggleTaskStatus: toggleTaskStatus,
    onTransferOwnership:
      currentMember.role === "owner" &&
      accountSession &&
      participantSession &&
      resolvedApiClient
        ? transferOwnerToAccountMember
        : undefined,
    onUnlinkBookingForItem: unlinkBookingFromItineraryItem,
    onUpdateBookingDoc: updateBookingDoc,
    onUpdateExpense: updateExpense,
    onUpdateItemInline: updateItineraryItemInline,
    onUpdatePhotoAlbum: updatePhotoAlbum,
    pathOptions,
    photoAlbumLinks: trip.photoAlbumLinks ?? [],
    planItems,
    scopedSuggestions,
    scopedTripForRecords,
    selectedItemIdForView,
    selectedTripPlanId,
    showAllPaths,
    tasks: scopedTripPlanRecords.tasks,
    trip,
    tripPlanError,
    isTripPlanBusy,
  });
  const accessProps = buildWorkspaceAccessProps({
    accessMode,
    accountClient,
    accountSession,
    accountSessionLoaded,
    accountSuccessRedirectHref,
    apiClient: resolvedApiClient,
    canAccessPanel,
    initialError: accessError,
    initialJoinCode,
    initialJoinToken,
    isAccountTripAccessPending,
    isTripLoading,
    portalSection,
    requireJoin,
    routeTripId,
    sessionMember: Boolean(sessionMember),
    sessionRestored,
    shouldRedirectUnauthenticatedTripRoute,
    trip,
    onAccountSessionChange: changeAccountSession,
    onAuthenticated: authenticateParticipant,
    onCockpitLoaded: replaceCockpitFromApi,
    onTripChange: replaceTripFromJoin,
  });
  const shellProps = buildWorkspaceShellProps({
    accountClaimState,
    accountSession,
    applyPendingItineraryImport,
    canClaimMember: Boolean(
      accountSession && participantSession && !currentMember.userId,
    ),
    canCreateStopNote,
    canCreateSuggestion,
    canEdit,
    canEditExpenses,
    canReviewSuggestions,
    changeBookingDocQuickFields,
    changeBookingDocType,
    clearPendingItineraryImport,
    contextRailMounted,
    contextRailOpen,
    contextRailPreferredTab,
    createExpense,
    createStop,
    createStopNote,
    currentMember,
    currentView,
    deleteExpense,
    deleteSelectedStop,
    deleteStop,
    deleteStopNote,
    dialogDeleteItem,
    dialogState,
    dismissWorkspaceToast,
    editSelectedItem: () => {
      if (selectedItem) editItem(selectedItem.id);
    },
    expenseSummary,
    importItineraryError,
    isToastDismissing: toastDismissing,
    navigateWorkspaceView,
    onClaimMember: () => void claimCurrentMemberToAccount(),
    onLeaveParticipantSession: requireJoin ? leaveParticipantSession : undefined,
    pathOptions,
    pendingItineraryImport,
    promoteFoodRecommendation,
    requireJoin,
    reviewSuggestion,
    scopedSuggestions,
    scopedTripPlanRecords,
    scopedTripForRecords,
    selectedDay,
    selectedItem,
    selectedTripPathId,
    selectedTripPlanId,
    sessionMember,
    setContextRailVisibility,
    setCurrentMemberId,
    setDialogDeleteItem,
    setDialogState,
    setStopPlaceResolution,
    sidebarCollapsed,
    stopPlaceResolution,
    suggestSelectedStop,
    supportsContextRail,
    t,
    toastDismissed,
    toggleContextRailCollapsed: toggleSidebarCollapsed,
    toggleTaskStatus,
    trip,
    updateExpense,
    updateSelectedStop,
    updateStopNote,
    viewsProps,
  });

  return (
    <WorkspaceAppFrame
      accessProps={accessProps}
      shellProps={shellProps}
    />
  );
}
