"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppShell } from "@/src/features/workspace/components/app-shell";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import {
  createConfiguredAccountApiClient,
  createConfiguredTripApiClient,
  publicSagittariusApiBaseUrl,
} from "@/src/api/sagittarius-api-clients";
import {
  findSessionMember,
} from "@/src/trip/auth";
import {
  clearParticipantSession,
  isLocalParticipantSession,
} from "@/src/trip/participant-session-storage";
import {
  normalizeTripPlanAliases,
} from "@/src/trip/trip-plans";
import {
  buildItineraryView,
} from "@/src/trip/itinerary";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import {
  type PlanningView,
  workspaceViewShouldSyncBackendExpenseSummary,
  workspaceViewSupportsContextRail,
} from "@/src/trip/workspace/planning-view";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
  tripHasPlan,
} from "@/src/trip/workspace/selected-trip-plan";
import { resolveSelectedWorkspaceItem } from "@/src/trip/workspace/selected-itinerary-item";
import { TripWorkspaceFrame } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceRail } from "@/src/trip/workspace/TripWorkspaceRail";
import { TripWorkspaceViews } from "@/src/trip/workspace/TripWorkspaceViews";
import { TripAccessLoadingFrame } from "@/src/trip/workspace/TripAccessLoadingFrame";
import { useBackendExpenseSummary } from "@/src/trip/workspace/use-backend-expense-summary";
import { useDailyBriefings } from "@/src/trip/workspace/use-daily-briefings";
import { useItineraryPathWorkspace } from "@/src/trip/workspace/use-itinerary-path-workspace";
import { useTripWorkspaceRecords } from "@/src/trip/workspace/use-trip-workspace-records";
import { useTripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";
import { useWorkspaceChrome } from "@/src/trip/workspace/use-workspace-chrome";
import { useWorkspaceNavigation } from "@/src/trip/workspace/use-workspace-navigation";
import { WorkspaceToast } from "@/src/trip/workspace/WorkspaceToast";
import {
  useWorkspacePhotoAlbums,
  useWorkspaceBookingCommands,
  useWorkspaceAccessGate,
  useWorkspaceApiCockpitEffects,
  useWorkspaceItineraryImport,
  useWorkspaceItineraryUiActions,
  useWorkspaceParticipantSessionActions,
  useWorkspaceAdministration,
  useWorkspaceExpenses,
  useWorkspaceItineraryCommands,
  useWorkspaceRecords,
  useWorkspaceTripPlanCommands,
  useWorkspaceSession,
} from "./hooks";
import { nextClientMutationId } from "@/src/trip/local-ids";
import { seedTrip } from "@/src/trip/seed";
import { TripWorkspaceAccessPanel } from "./access-gate";
import { WorkspaceDialogs } from "./WorkspaceDialogs";
import { WorkspaceRolePreview } from "./WorkspaceRolePreview";
import { deriveWorkspacePermissions } from "./workspace-permissions";
import { workspaceShellClassName } from "./sagittarius-app.styles";
import type { ItineraryDialogState } from "./hooks/itinerary/itinerary-dialog-state";
import type {
  ItineraryItem,
  Trip,
} from "@/src/trip/types";
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
  /* v8 ignore next 3 */
  const resolvedApiClient = useMemo(
    () =>
      apiClient ??
      (dataSource === "api"
        ? createConfiguredTripApiClient()
        : undefined),
    [apiClient, dataSource],
  );
  const accountClient = useMemo(
    () => createConfiguredAccountApiClient(),
    [],
  );
  const [isCockpitLoaded, setIsCockpitLoaded] = useState(false);
  const [accountClaimState, setAccountClaimState] = useState<{
    status: "idle" | "saving";
    message: string | null;
  }>({ status: "idle", message: null });
  const [joinInviteToken, setJoinInviteToken] = useState<string | null>(
    initialJoinToken ?? null,
  );
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
  const [selectedTripPlanId, setSelectedTripPlanId] = useState(() =>
    resolveSelectedTripPlanId(initialTrip),
  );
  const [currentMemberId, setCurrentMemberId] = useState(
    initialMemberId ?? initialTrip.members[0].id,
  );
  const [selectedItemId, setSelectedItemId] = useState("item-dimdim");
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
  const [dialogState, setDialogState] = useState<ItineraryDialogState>(null);
  const [stopPlaceResolution, setStopPlaceResolution] =
    useState<StopPlaceResolutionState>({ state: "idle", candidates: [] });
  const [dialogDeleteItem, setDialogDeleteItem] =
    useState<ItineraryItem | null>(null);
  const [tripPlanError, setTripPlanError] = useState<string | null>(null);
  const [isTripPlanBusy, setIsTripPlanBusy] = useState(false);
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
  const effectivePlaceResolver = useMemo<PlaceResolver | null>(() => {
    if (placeResolver) return placeResolver;
    if (!resolvedApiClient?.resolvePlace || !participantSession) return null;
    return (request) =>
      resolvedApiClient.resolvePlace!(
        trip.id,
        participantSession.sessionToken,
        request,
      );
  }, [participantSession, placeResolver, resolvedApiClient, trip.id]);
  const sessionMember = findSessionMember(trip, participantSession);
  const currentMember =
    sessionMember ??
    trip.members.find((member) => member.id === currentMemberId) ??
    trip.members[0];
  const isApiMode =
    dataSource === "api" && !isLocalParticipantSession(participantSession);
  const isTripLoading =
    isApiMode && Boolean(participantSession) && !isCockpitLoaded;
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
  const {
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
  } = deriveWorkspacePermissions(currentMember.role);
  const {
    canAccessPanel,
    isAccountTripAccessPending,
    shouldRedirectUnauthenticatedTripRoute,
  } = useWorkspaceAccessGate({
    accessMode,
    accountSession,
    accountSessionLoaded,
    accountTripAccessDeniedRouteId,
    accessError,
    isApiMode,
    isTripLoading,
    participantSession,
    routeTripId,
    requireJoin,
    sessionMember: Boolean(sessionMember),
    sessionRestored,
  });
  const supportsContextRail = workspaceViewSupportsContextRail(currentView);
  const shouldSyncBackendExpenseSummary =
    workspaceViewShouldSyncBackendExpenseSummary(currentView);
  const hasSelectedBackendExpenseTripPlan = Boolean(
    selectedTripPlanId && tripHasPlan(trip, selectedTripPlanId),
  );
  const handleBackendExpenseAuthFailure = useCallback(() => {
    clearParticipantSession();
    setParticipantSession(null);
    setAccessError("unauthenticated");
  }, [setAccessError, setParticipantSession]);
  const {
    backendExpenseSummary,
    refreshBackendExpenseSummary,
    resetBackendExpenseSummary,
    setBackendExpenseSummary,
  } = useBackendExpenseSummary({
    apiClient: resolvedApiClient,
    canViewExpenses,
    enabled: shouldSyncBackendExpenseSummary,
    hasSelectedTripPlan: hasSelectedBackendExpenseTripPlan,
    isApiMode,
    isCockpitLoaded,
    onUnauthenticated: handleBackendExpenseAuthFailure,
    participantSession,
    selectedTripPlanId,
    tripId: trip.id,
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

  useEffect(() => {
    if (!sessionRestored && !isApiMode) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSelectedTripPlanId((current) => {
        const nextTripPlanId = resolveSelectedTripPlanId(trip, current);
        rememberSelectedTripPlanId(trip, nextTripPlanId);
        return nextTripPlanId;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isApiMode, sessionRestored, trip]);
  const itineraryView = useMemo(
    () => buildItineraryView(planItems),
    [planItems],
  );
  const mainItineraryView = useMemo(
    () => buildItineraryView(mainPlanItems),
    [mainPlanItems],
  );
  useEffect(() => {
    latestTripRef.current = trip;
  }, [latestTripRef, trip]);

  const {
    selectedDay,
    selectedItem,
    selectedItemIdForView,
  } = resolveSelectedWorkspaceItem({
    activePlanItems,
    itineraryView,
    planItems,
    selectedItemId,
    tripStartDate: trip.startDate,
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

  const replaceCockpitFromApi = useCallback((cockpit: TripCockpit) => {
    setTripState({
      trip: normalizeTripPlanAliases(cockpit.trip),
      past: [],
      future: [],
    });
    replaceWorkspaceRecords(cockpit);
    resetBackendExpenseSummary();
    setIsCockpitLoaded(true);
  }, [
    replaceWorkspaceRecords,
    resetBackendExpenseSummary,
    setTripState,
  ]);

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

  if (
    isAccountTripAccessPending ||
    isTripLoading ||
    shouldRedirectUnauthenticatedTripRoute
  ) {
    return <TripAccessLoadingFrame />;
  }

  if (canAccessPanel) {
    if (routeTripId && accessMode === "trip-access" && !sessionRestored) {
      return <TripAccessLoadingFrame />;
    }

    return (
      <TripWorkspaceAccessPanel
        accessMode={accessMode}
        accountClient={accountClient}
        accountSession={accountSession}
        accountSessionLoaded={accountSessionLoaded}
        accountSuccessRedirectHref={accountSuccessRedirectHref}
        portalSection={portalSection}
        apiClient={resolvedApiClient}
        initialError={accessError}
        initialJoinCode={initialJoinCode}
        initialJoinToken={initialJoinToken}
        trip={routeTripId ? undefined : trip}
        onAccountSessionChange={changeAccountSession}
        onAuthenticated={authenticateParticipant}
        onCockpitLoaded={replaceCockpitFromApi}
        onTripChange={replaceTripFromJoin}
      />
    );
  }

  if (requireJoin && !sessionMember) {
    if (routeTripId) {
      return <TripAccessLoadingFrame />;
    }
  }

  return (
    <AppShell
      activeView={currentView}
      collapsed={sidebarCollapsed}
      currentMember={currentMember}
      onLeaveParticipantSession={
        requireJoin ? leaveParticipantSession : undefined
      }
      onNavigateView={navigateWorkspaceView}
      trip={trip}
      onToggleCollapsed={toggleSidebarCollapsed}
    >
      <main className={workspaceShellClassName}>
        {requireJoin && !toastDismissed ? (
          <WorkspaceToast
            accountSession={accountSession}
            memberUserId={currentMember.userId}
            claimState={accountClaimState}
            canClaim={Boolean(
              accountSession && participantSession && !currentMember.userId,
            )}
            dismissing={toastDismissing}
            onClaim={() => void claimCurrentMemberToAccount()}
            onDismiss={dismissWorkspaceToast}
          />
        ) : null}
        {!sessionMember ? (
          <WorkspaceRolePreview
            currentMemberId={currentMember.id}
            members={trip.members}
            onChangeMember={setCurrentMemberId}
          />
        ) : null}
        <TripWorkspaceFrame
          contextRailOpen={contextRailOpen}
          importError={importItineraryError}
          supportsContextRail={supportsContextRail}
          rail={
            <TripWorkspaceRail
              enabled={supportsContextRail}
              mounted={contextRailMounted}
              railProps={{
                trip: scopedTripForRecords,
                selectedItem,
                suggestions: scopedSuggestions,
                stopNotes: scopedTripPlanRecords.stopNotes,
                tasks: scopedTripPlanRecords.tasks,
                bookingDocs: scopedTripPlanRecords.bookingDocs,
                currentMember,
                expenseSummary,
                canEdit,
                canCreateNote: canCreateStopNote,
                canCreateSuggestion,
                canReviewSuggestions,
                canEditExpenses,
                open: contextRailOpen,
                preferredTab: contextRailPreferredTab,
                onChangeBookingDocType: changeBookingDocType,
                onChangeBookingDocQuickFields: changeBookingDocQuickFields,
                onCreateNote: createStopNote,
                onCreateExpense: createExpense,
                onUpdateExpense: updateExpense,
                onDeleteExpense: deleteExpense,
                onDeleteNote: deleteStopNote,
                onEditSelected: () => {
                  if (selectedItem) editItem(selectedItem.id);
                },
                onReviewSuggestion: reviewSuggestion,
                onSuggestSelected: suggestSelectedStop,
                onToggleTaskStatus: toggleTaskStatus,
                onUpdateNote: updateStopNote,
                onClose: () => setContextRailVisibility(false),
              }}
            />
          }
        >
            <TripWorkspaceViews
              currentView={currentView}
              settingsProps={{
                canEdit: canManagePeople,
                currentMember,
                trip,
                onSave: saveTripSettings,
              }}
              membersProps={{
                trip,
                currentMember,
                canManagePeople,
                joinInviteToken,
                onChangeMemberAccessStatus: changeMemberAccessStatus,
                onChangeMemberPassword: changeMemberPassword,
                onChangeMemberRole: changeMemberRole,
                onCreateMember: createMember,
                onRotateJoinInviteToken: isApiMode
                  ? rotateJoinInviteToken
                  : undefined,
                onResetMemberClaim: resetMemberClaim,
                onTransferOwnership:
                  currentMember.role === "owner" &&
                  accountSession &&
                  participantSession &&
                  resolvedApiClient
                    ? transferOwnerToAccountMember
                    : undefined,
              }}
              bookingsProps={{
                trip: scopedTripForRecords,
                tasks: scopedTripPlanRecords.tasks,
                currentMember,
                bookingDocs: scopedTripPlanRecords.bookingDocs,
                canEditBookings,
                onCreateBookingDoc: async (input) => {
                  await createBookingDoc(input);
                },
                onUpdateBookingDoc: updateBookingDoc,
                onDeleteBookingDoc: deleteBookingDoc,
              }}
              photosProps={{
                trip,
                currentMember,
                photoAlbumLinks: trip.photoAlbumLinks ?? [],
                canEditPhotoAlbums,
                onCreatePhotoAlbum: createPhotoAlbum,
                onUpdatePhotoAlbum: updatePhotoAlbum,
                onDeletePhotoAlbum: deletePhotoAlbum,
              }}
              expensesProps={{
                trip: scopedTripForRecords,
                currentMember,
                expenseSummary,
                canEditExpenses,
                selectedTripPlanId,
                apiBaseUrl: publicSagittariusApiBaseUrl(),
                onCreateExpense: createExpense,
                onUpdateExpense: updateExpense,
                onDeleteExpense: deleteExpense,
                onDuplicateExpenseAsEstimate: duplicateExpenseAsEstimate,
                onRecordPaybackReminder: recordPaybackReminder,
              }}
              overviewProps={{
                trip: scopedTripForRecords,
                currentMemberId: currentMember.id,
                expenseSummary,
                items: planItems,
                itineraryView,
                suggestions: scopedSuggestions,
                tasks: scopedTripPlanRecords.tasks,
                dailyBriefings: visibleDailyBriefings,
                onOpenExpenses: openExpensesWorkspace,
                onCreateTask: createTask,
                onSaveDailyBriefingOverrides: saveDailyBriefingOverrides,
                onToggleTaskStatus: toggleTaskStatus,
              }}
              itineraryProps={{
                canRestructure: canEdit,
                endDate: trip.endDate,
                graphItems: activePlanItems,
                items: planItems,
                dailyBriefings: visibleDailyBriefings,
                itineraryView,
                pathOptions,
                tripPlans: trip.tripPlans ?? trip.planVariants,
                selectedTripPlanId,
                mainTripPlanId: trip.mainTripPlanId || trip.activePlanVariantId,
                onChangeTripPlan: selectTripPlan,
                onSetMainTripPlan: setMainTripPlan,
                onChangeTripPlanStatus: updateTripPlanStatus,
                onCreateTripPlan: createTripPlan,
                onRenameTripPlan: renameTripPlan,
                onSaveDayTitle: (date, version, title) =>
                  saveDailyBriefingOverrides(date, version, { dayTitle: title }),
                tripPlanError,
                isTripPlanBusy,
                role: currentMember.role,
                startDate: trip.startDate,
                selectedItemId: selectedItemIdForView,
                dayPathOverrides,
                showAllPaths,
                tripName: trip.name,
                bookingDocs: scopedTripPlanRecords.bookingDocs,
                onAddBookingForItem: createItineraryBookingDraft,
                onSaveBookingForItem: saveItineraryBookingTicket,
                onUnlinkBookingForItem: unlinkBookingFromItineraryItem,
                onAddStop: addStop,
                onAddSubActivity: addSubActivity,
                onAddNoteForItem: (itemId, body) =>
                  void createItineraryNote(itemId, body),
                onOpenItemDetails: openItemDetails,
                onSelectItem: selectItem,
                onMoveItemToPath: moveItemToPath,
                onUpdateItemInline: updateItineraryItemInline,
                onEditItem: editItem,
                onDeleteItem: deleteStop,
                onChangeDayPath: changeDayPath,
                onClearDayPath: clearDayPath,
                onToggleShowAllPaths: toggleShowAllPaths,
              }}
              mapProps={{
                countries: trip.countries ?? [],
                destinationLabel: trip.destinationLabel,
                endDate: trip.endDate,
                items: mainPlanItems,
                itineraryView: mainItineraryView,
                startDate: trip.startDate,
                tripName: trip.name,
                onResolveMissingCoordinates:
                  canEdit && effectivePlaceResolver
                    ? resolveMissingMapCoordinates
                    : undefined,
              }}
              timelineProps={{
                contextRailOpen,
                endDate: trip.endDate,
                items: planItems,
                itineraryView,
                selectedItemId: selectedItemIdForView,
                startDate: trip.startDate,
                tripName: trip.name,
                onSelectItem: selectItem,
                onToggleContextRail: toggleContextRail,
              }}
            />
        </TripWorkspaceFrame>
        <WorkspaceDialogs
          applyPendingItineraryImport={applyPendingItineraryImport}
          clearPendingItineraryImport={clearPendingItineraryImport}
          createStop={createStop}
          currentMemberId={currentMember.id}
          deleteSelectedStop={deleteSelectedStop}
          deleteStop={deleteStop}
          dialogDeleteItem={dialogDeleteItem}
          dialogState={dialogState}
          importPathOptions={pathOptions}
          pendingItineraryImport={pendingItineraryImport}
          promoteFoodRecommendation={promoteFoodRecommendation}
          selectedDay={selectedDay}
          selectedTripPathId={selectedTripPathId}
          selectedTripPlanId={selectedTripPlanId}
          setDialogDeleteItem={setDialogDeleteItem}
          setDialogState={setDialogState}
          setStopPlaceResolution={setStopPlaceResolution}
          stopPlaceResolution={stopPlaceResolution}
          trip={trip}
          tripPlanOptions={trip.tripPlans ?? trip.planVariants}
          updateSelectedStop={updateSelectedStop}
          deleteCancelLabel={t.itinerary.row.confirmDeleteNo}
          deleteConfirmLabel={t.itinerary.row.confirmDeleteYes}
          deleteTitleForActivity={(activity) =>
            t.itinerary.row.confirmDeleteTitle({ activity })
          }
          deleteBodyForActivity={(activity) =>
            t.itinerary.row.confirmDeleteBody({ activity })
          }
        />
      </main>
    </AppShell>
  );
}
