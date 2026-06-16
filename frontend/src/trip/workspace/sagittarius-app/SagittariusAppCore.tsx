"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppShell } from "@/src/components/AppShell";
import { StopDialog } from "@/src/components/StopDialog";
import type { TripSettingsFormValues } from "@/src/components/TripSettingsPage";
import { Select } from "@/src/components/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import { slugifyFilePart } from "@/src/lib/file-names";
import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";
import { appRoutes, decodeReturnTo } from "@/src/trip/workspace/sagittarius-app/support";
import {
  createTripApiClient,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import {
  isAuthFailure,
  isForbidden,
  isUnauthenticated,
} from "@/src/trip/api-errors";
import {
  createAccountApiClient,
  type AccountSession,
} from "@/src/account/api-client";
import {
  loadPersistedAccountSession,
  persistAccountSession,
} from "@/src/account/session-storage";
import {
  canTripRole,
  appendTripParticipant,
  buildCreateMemberRequest,
  buildPatchMemberAccessStatusRequest,
  buildPatchMemberPasswordRequest,
  buildPatchMemberRoleRequest,
  buildUpdatePresenceRequest,
  createTripParticipant,
  findSessionMember,
  replaceTripParticipant,
  resetTripParticipantClaim,
  setTripParticipantPassword,
  setTripParticipantAccessStatus,
  updateTripParticipantRole,
} from "@/src/trip/auth";
import {
  clearParticipantSession,
  isLocalParticipantSession,
  loadPersistedParticipantSession,
  persistParticipantSession,
} from "@/src/trip/participant-session-storage";
import {
  normalizeTripPlanAliases,
} from "@/src/trip/trip-plans";
import { deriveTripCountriesFromDestination } from "@/src/trip/trip-countries";
import {
  buildItineraryView,
} from "@/src/trip/itinerary";
import {
  shiftItineraryItemsToStartDate,
} from "@/src/trip/itinerary-time";
import { buildShiftItineraryItemDayRequest } from "@/src/trip/itinerary-api-requests";
import {
  applyTripSettingsToTrip,
  buildPatchTripSettingsRequest,
  mergePatchedTripSettings,
} from "@/src/trip/trip-settings";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import {
  applyImportedItemsToItineraryPath,
  deriveManualActivityPathOptions,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import {
  buildImportItineraryRequest,
  buildImportedItineraryItemCreateRequest,
  createImportedPlanRecordsViaApi,
} from "@/src/trip/workspace/itinerary-import-api";
import {
  buildImportedPlanRecordsForTripPlan,
  emptyItineraryExportRecords,
  mergeApiImportedPlanRecordsIntoTrip,
  mergeImportedRecordsIntoTripPlan,
  mergeImportedStopNotes,
  mergeImportedTasks,
  pendingItineraryImportFromDocument,
  shouldUseApiItineraryImport,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
  tripHasPlan,
} from "@/src/trip/workspace/selected-trip-plan";
import { TripWorkspaceDeleteDialog } from "@/src/trip/workspace/TripWorkspaceDeleteDialog";
import { TripWorkspaceFrame } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceImportDialog } from "@/src/trip/workspace/TripWorkspaceImportDialog";
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
  useWorkspaceExpenses,
  useWorkspaceItineraryCommands,
  useWorkspaceRecords,
  useWorkspaceTripPlanCommands,
} from "./hooks";
import {
  buildItineraryExport,
  parseItineraryImportDocument,
} from "@/src/trip/itinerary-import-export";
import { nextClientMutationId } from "@/src/trip/local-ids";
import { loadPersistedTripDraft } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { TripWorkspaceAccessPanel } from "./access-gate";
import type {
  ItineraryItem,
  Trip,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
} from "@/src/trip/types";
import type { SagittariusAccessMode, SagittariusPortalSection } from "./types";

const workspaceShellClassName = "workspace-shell min-w-0 bg-transparent max-[1199px]:min-h-[calc(100dvh-48px)]";

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
        ? createTripApiClient({
            baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "",
          })
        : undefined),
    [apiClient, dataSource],
  );
  const accountClient = useMemo(
    () =>
      createAccountApiClient({
        baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "",
      }),
    [],
  );
  const [participantSession, setParticipantSession] =
    useState<TripParticipantSession | null>(null);
  const [isCockpitLoaded, setIsCockpitLoaded] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accountSession, setAccountSession] = useState<AccountSession | null>(
    null,
  );
  const [accountSessionLoaded, setAccountSessionLoaded] = useState(false);
  const [accountClaimState, setAccountClaimState] = useState<{
    status: "idle" | "saving";
    message: string | null;
  }>({ status: "idle", message: null });
  const [accountTripAccessDeniedRouteId, setAccountTripAccessDeniedRouteId] =
    useState<string | null>(null);
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
    canRedo,
    canUndo,
    commitTrip,
    latestTripRef,
    redo,
    replaceApiTrip,
    resetTrip,
    setTripState,
    trip,
    undo,
    updateApiTrip,
  } = useTripWorkspaceState(initialTrip, setSelectedItemId);
  const [dialogState, setDialogState] = useState<
    | { mode: "create"; day?: string; parentItemId?: string | null }
    | { mode: "edit"; item: ItineraryItem }
    | null
  >(null);
  const [stopPlaceResolution, setStopPlaceResolution] =
    useState<StopPlaceResolutionState>({ state: "idle", candidates: [] });
  const [dialogDeleteItem, setDialogDeleteItem] =
    useState<ItineraryItem | null>(null);
  const [pendingItineraryImport, setPendingItineraryImport] =
    useState<PendingItineraryImport | null>(null);
  const [itineraryImportError, setItineraryImportError] = useState<
    string | null
  >(null);
  const [tripPlanError, setTripPlanError] = useState<string | null>(null);
  const [isTripPlanBusy, setIsTripPlanBusy] = useState(false);
  const {
    activePlanItems,
    changeDayPath,
    changeTripPath,
    clearAllDayPaths,
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
  const isAccountOnlyAccessMode =
    accessMode === "account-login" || accessMode === "account-register";
  const hasRouteParticipantSession = Boolean(
    participantSession &&
    (!routeTripId || participantSession.tripId === routeTripId),
  );
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
  const canEdit = canTripRole(currentMember.role, "editItinerary");
  const canCreateSuggestion = canTripRole(
    currentMember.role,
    "createSuggestion",
  );
  const canReviewSuggestions = canTripRole(
    currentMember.role,
    "reviewSuggestions",
  );
  const canViewExpenses = canTripRole(currentMember.role, "viewExpenses");
  const canEditExpenses = canTripRole(currentMember.role, "editExpenses");
  const canManagePeople = canTripRole(currentMember.role, "managePeople");
  const canManageTripPlans = canTripRole(currentMember.role, "manageTripPlans");
  const canEditBookings = canEdit || canEditExpenses;
  const canEditPhotoAlbums = canTripRole(currentMember.role, "managePhotoAlbums");
  const canCreateStopNote = canCreateSuggestion || canEdit;
  const supportsContextRail =
    currentView === "overview" ||
    currentView === "itinerary" ||
    currentView === "timeline";
  const shouldSyncBackendExpenseSummary =
    currentView === "expenses" || supportsContextRail;
  const hasSelectedBackendExpenseTripPlan = Boolean(
    selectedTripPlanId && tripHasPlan(trip, selectedTripPlanId),
  );
  const handleBackendExpenseAuthFailure = useCallback(() => {
    clearParticipantSession();
    setParticipantSession(null);
    setAccessError("unauthenticated");
  }, []);
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

  /* v8 ignore next */
  const selectedItem =
    activePlanItems.find((item) => item.id === selectedItemId) ??
    planItems[0] ??
    activePlanItems[0];
  const selectedDay =
    selectedItem?.day ?? itineraryView.dayGroups[0]?.day ?? trip.startDate;
  const selectedItemIdForView = selectedItem?.id ?? "";
  const {
    createItineraryNote,
    createItineraryTask,
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
    selectedItem,
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
    itineraryCommitmentsByItemId,
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

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setSessionRestored(false);
    });
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      const persistedTrip = loadPersistedTripDraft(normalizeTripPlanAliases);
      const nextTrip = normalizeTripPlanAliases(persistedTrip ?? initialTrip);
      const persistedSession = loadPersistedParticipantSession(
        requireJoin,
        nextTrip,
        isApiMode,
        routeTripId,
      );

      if (persistedTrip) {
        setTripState({ trip: nextTrip, past: [], future: [] });
        setSelectedTripPlanId(resolveSelectedTripPlanId(nextTrip));
      }
      if (persistedSession) {
        setParticipantSession(persistedSession);
        setCurrentMemberId(persistedSession.memberId);
      } else {
        setParticipantSession(null);
      }
      setSessionRestored(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [initialTrip, isApiMode, requireJoin, routeTripId, setTripState]);

  useEffect(() => {
    if (accountSessionLoaded) return;
    const timeout = window.setTimeout(() => {
      setAccountSession(loadPersistedAccountSession());
      setAccountSessionLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [accountSessionLoaded]);

  useEffect(() => {
    if (!accountSessionLoaded) return;
    persistAccountSession(accountSession);
  }, [accountSession, accountSessionLoaded]);

  const changeAccountSession = useCallback((session: AccountSession | null) => {
    setAccountSession(session);
    persistAccountSession(session);
  }, []);

  useEffect(() => {
    if (
      !isApiMode ||
      !routeTripId ||
      !accountSessionLoaded ||
      !accountSession ||
      participantSession
    )
      return undefined;
    let cancelled = false;

    void accountClient
      .createTripMemberSession(accountSession.sessionToken, routeTripId)
      .then((session) => {
        if (cancelled) return;
        setAccountTripAccessDeniedRouteId(null);
        setAccessError(null);
        setParticipantSession(session);
        setCurrentMemberId(session.memberId);
        persistParticipantSession(session);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isUnauthenticated(caught)) {
          changeAccountSession(null);
          setAccessError("unauthenticated");
          return;
        }
        if (isForbidden(caught)) {
          setAccountTripAccessDeniedRouteId(routeTripId);
          clearParticipantSession();
          return;
        }
        setAccessError("trip access check failed");
      });

    return () => {
      cancelled = true;
    };
  }, [
    accountClient,
    accountSession,
    accountSessionLoaded,
    changeAccountSession,
    isApiMode,
    participantSession,
    routeTripId,
  ]);

  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient)
      return undefined;
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setIsCockpitLoaded(false);
      resetDailyBriefings();
    });

    void resolvedApiClient
      .loadTrip(participantSession.tripId, participantSession.sessionToken)
      .then((cockpit) => {
        if (cancelled) return;
        const loadedTripPlanId = resolveSelectedTripPlanId(cockpit.trip);
        replaceCockpitFromApi(cockpit);
        setSelectedTripPlanId(loadedTripPlanId);
        rememberSelectedTripPlanId(cockpit.trip, loadedTripPlanId);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isAuthFailure(caught)) {
          clearParticipantSession();
          setParticipantSession(null);
          setAccessError("unauthenticated");
          resetDailyBriefings();
          setIsCockpitLoaded(false);
          return;
        }
        setAccessError("trip load failed");
        resetDailyBriefings();
        setIsCockpitLoaded(false);
      });

    void resolvedApiClient
      .listDailyBriefings(
        participantSession.tripId,
        participantSession.sessionToken,
      )
      .then((briefings) => {
        if (cancelled) return;
        replaceDailyBriefings(briefings);
      })
      .catch(() => {
        if (cancelled) return;
        resetDailyBriefings();
      });

    return () => {
      cancelled = true;
    };
  }, [
    isApiMode,
    participantSession,
    replaceDailyBriefings,
    replaceWorkspaceRecords,
    resetBackendExpenseSummary,
    resetDailyBriefings,
    replaceCockpitFromApi,
    resolvedApiClient,
  ]);

  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient)
      return undefined;
    let cancelled = false;

    void Promise.resolve(
      resolvedApiClient.updatePresence(
        participantSession.tripId,
        participantSession.sessionToken,
        buildUpdatePresenceRequest("online", {
          clientMutationId: nextClientMutationId("presence-online"),
        }),
      ),
    )
      .then((member) => {
        if (cancelled || !member) return;
        updateApiTrip((current) => replaceTripParticipant(current, member));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isApiMode, participantSession, resolvedApiClient, updateApiTrip]);

  const navigateWorkspaceView = useCallback(
    (view: PlanningView, href: string) => {
      navigateWorkspacePath(view, href);
      setContextRailVisibility(false);
    },
    [navigateWorkspacePath, setContextRailVisibility],
  );

  useEffect(() => {
    if (
      !requireJoin ||
      !participantSession ||
      !sessionMember ||
      routeTripId ||
      typeof window === "undefined"
    )
      return;
    if (!window.location.pathname.startsWith(appRoutes.join())) return;
    const returnToParam = new URLSearchParams(window.location.search).get("rt");
    const returnTo = returnToParam ? decodeReturnTo(returnToParam) : null;
    const target =
      resolveJoinPostAuthReturnTo(returnTo, participantSession.tripId) ??
      appRoutes.tripOverview(participantSession.tripId);
    window.location.replace(target);
  }, [participantSession, requireJoin, routeTripId, sessionMember]);

  const {
    addStop,
    addSubActivity,
    createStop,
    deleteStop,
    moveItem,
    moveItemIntoPlanBlock,
    moveItemToDay,
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

  function selectItem(itemId: string) {
    setContextRailPreferredTab("notes");
    setSelectedItemId(itemId);
  }

  function openItemDetails(itemId: string) {
    setContextRailPreferredTab("notes");
    setSelectedItemId(itemId);
    setContextRailVisibility(true);
  }

  async function promoteFoodRecommendation(item: ItineraryItem) {
    if (!canEdit || item.itemKind !== "foodRecommendation") return;
    await createStop({
      day: item.day,
      parentItemId: item.parentItemId ?? null,
      itemKind: "meal",
      timeMode: item.timeMode ?? "flexible",
      isPlanBlock: false,
      status: "planned",
      priority: item.priority ?? "normal",
      startTime: item.startTime,
      endTime: item.endTime ?? null,
      endOffsetDays: item.endOffsetDays ?? 0,
      activity: item.activity,
      activityType: "food",
      place: item.place,
      mapLink: item.mapLink,
      durationMinutes: item.durationMinutes,
      transportation: item.transportation,
      details: {
        ...(item.details ?? {}),
        promotedFromItemId: item.id,
        sourceItemKind: item.itemKind,
      },
      note: item.note,
      saveUnresolved: true,
    });
  }

  async function deleteSelectedStop() {
    /* v8 ignore next */
    if (dialogState?.mode !== "edit" || !canEdit) return;
    setDialogDeleteItem(dialogState.item);
  }

  function editItem(itemId: string) {
    const item = trip.itineraryItems.find(
      (candidate) => candidate.id === itemId,
    );
    if (item) {
      setStopPlaceResolution({ state: "idle", candidates: [] });
      setDialogState({ mode: "edit", item });
    }
  }


  function authenticateParticipant(session: TripParticipantSession) {
    setAccessError(null);
    setParticipantSession(session);
    setCurrentMemberId(session.memberId);
    persistParticipantSession(session);

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const returnToParam = searchParams.get("rt");
      const returnTo = returnToParam ? decodeReturnTo(returnToParam) : null;
      const safeReturnTo = resolveJoinPostAuthReturnTo(
        returnTo,
        session.tripId,
      );
      const postAuthHref =
        safeReturnTo ??
        (!routeTripId ? appRoutes.tripOverview(session.tripId) : null);
      if (postAuthHref) {
        replaceWorkspacePath(postAuthHref, session.tripId);
      }
    }
  }

  function leaveParticipantSession() {
    setParticipantSession(null);
    setCurrentMemberId(initialTrip.members[0].id);
    setContextRailVisibility(false);
    clearParticipantSession();
    setIsCockpitLoaded(false);
  }

  function replaceTripFromJoin(nextTrip: Trip) {
    resetTrip(nextTrip, { persist: !isApiMode });
  }

  async function claimCurrentMemberToAccount() {
    if (!accountSession || !participantSession || !resolvedApiClient) return;
    setAccountClaimState({ status: "saving", message: null });
    try {
      await accountClient.claimMember(
        accountSession.sessionToken,
        participantSession.tripId,
        participantSession.memberId,
        participantSession.sessionToken,
      );
      const cockpit = await resolvedApiClient.loadTrip(
        participantSession.tripId,
        participantSession.sessionToken,
      );
      replaceCockpitFromApi(cockpit);
      setAccountClaimState({
        status: "idle",
        message: "ผูก temp identity เข้ากับ account แล้ว",
      });
    } catch (caught) {
      setAccountClaimState({
        status: "idle",
        message:
          caught instanceof Error ? caught.message : "Claim account ไม่สำเร็จ",
      });
    }
  }

  async function transferOwnerToAccountMember(targetMemberId: string) {
    if (!accountSession || !participantSession || !resolvedApiClient) return;
    setAccountClaimState({ status: "saving", message: null });
    try {
      await accountClient.transferOwner(
        accountSession.sessionToken,
        participantSession.tripId,
        targetMemberId,
      );
      const cockpit = await resolvedApiClient.loadTrip(
        participantSession.tripId,
        participantSession.sessionToken,
      );
      replaceCockpitFromApi(cockpit);
      setAccountClaimState({
        status: "idle",
        message: "โอนสิทธิ owner แล้ว trip ยังมี owner 1 คนเสมอ",
      });
    } catch (caught) {
      setAccountClaimState({
        status: "idle",
        message:
          caught instanceof Error ? caught.message : "โอน owner ไม่สำเร็จ",
      });
    }
  }

  async function resetMemberClaim(memberId: string) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.resetMemberClaim(
        trip.id,
        memberId,
        participantSession.sessionToken,
      );
      commitTrip((current) => replaceTripParticipant(current, member));
      return;
    }
    commitTrip((current) => resetTripParticipantClaim(current, memberId));
  }

  async function changeMemberRole(
    memberId: string,
    role: Exclude<TripRole, "owner">,
  ) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.patchMember(
        trip.id,
        memberId,
        participantSession.sessionToken,
        buildPatchMemberRoleRequest(role),
      );
      commitTrip((current) => replaceTripParticipant(current, member));
      return;
    }
    commitTrip((current) => updateTripParticipantRole(current, memberId, role));
  }

  async function changeMemberAccessStatus(
    memberId: string,
    accessStatus: TripMemberAccessStatus,
  ) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.patchMember(
        trip.id,
        memberId,
        participantSession.sessionToken,
        buildPatchMemberAccessStatusRequest(accessStatus),
      );
      commitTrip((current) => replaceTripParticipant(current, member));
      return;
    }
    commitTrip((current) =>
      setTripParticipantAccessStatus(current, memberId, accessStatus),
    );
  }

  async function changeMemberPassword(memberId: string, password: string) {
    /* v8 ignore next */
    if (!canManagePeople || memberId !== currentMember.id) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.patchMember(
        trip.id,
        memberId,
        participantSession.sessionToken,
        buildPatchMemberPasswordRequest(password),
      );
      commitTrip((current) => replaceTripParticipant(current, member));
      return;
    }
    commitTrip((current) =>
      setTripParticipantPassword(current, memberId, password),
    );
  }

  async function createMember(input: {
    displayName: string;
    role: Exclude<TripRole, "owner">;
  }) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.createMember(
        trip.id,
        participantSession.sessionToken,
        buildCreateMemberRequest(input, { memberCount: trip.members.length }),
      );
      commitTrip((current) => appendTripParticipant(current, member));
      return;
    }
    commitTrip((current) => createTripParticipant(current, input));
  }

  async function rotateJoinInviteToken() {
    if (
      !canManagePeople ||
      !isApiMode ||
      !resolvedApiClient ||
      !participantSession?.sessionToken
    )
      return;
    const response = await resolvedApiClient.rotateJoinInviteToken?.(
      trip.id,
      participantSession.sessionToken,
    );
    if (!response) return;
    setJoinInviteToken(response.token);
  }

  async function saveTripSettings(values: TripSettingsFormValues) {
    if (!canManagePeople) return;
    const shiftedItems = shiftItineraryItemsToStartDate(
      trip.itineraryItems,
      trip.startDate,
      values.startDate,
    );
    const nextCountries = deriveTripCountriesFromDestination(
      values.destinationLabel,
      trip.countries ?? [],
    );

    if (isApiMode && resolvedApiClient && participantSession) {
      const patchedTrip = await resolvedApiClient.patchTrip(
        trip.id,
        participantSession.sessionToken,
        buildPatchTripSettingsRequest(
          { ...values, countries: nextCountries },
          {
            clientMutationId: nextClientMutationId("trip-settings"),
            expectedVersion: trip.version ?? 0,
          },
        ),
      );
      const changedItems = shiftedItems.filter((shiftedItem) => {
        const currentItem = trip.itineraryItems.find(
          (item) => item.id === shiftedItem.id,
        );
        return currentItem && currentItem.day !== shiftedItem.day;
      });
      const patchedItems = await Promise.all(
        changedItems.map((item) =>
          resolvedApiClient.patchItineraryItem(
            trip.id,
            item.id,
            participantSession.sessionToken,
            buildShiftItineraryItemDayRequest({
              clientMutationId: nextClientMutationId("itinerary-day-shift"),
              expectedVersion: item.version,
              shiftedDay: item.day,
            }),
          ),
        ),
      );
      const patchedItemsById = new Map(
        patchedItems.map((item) => [item.id, item]),
      );
      updateApiTrip((current) =>
        mergePatchedTripSettings(current, patchedTrip, patchedItemsById),
      );
      return;
    }

    commitTrip((current) =>
      applyTripSettingsToTrip(current, { ...values, countries: nextCountries }),
    );
  }

  function exportItinerary() {
    const document = buildItineraryExport({
      exportedAt: new Date().toISOString(),
      items: planItems,
      stopNotes,
      tasks,
      trip,
    });
    const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugifyFilePart(trip.name)}-itinerary-v1.json`;
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importItinerary(file: File) {
    /* v8 ignore next */
    if (!canEdit) return;
    const content = await file.text();
    await importItineraryContent({
      fileName: file.name,
      contentType: file.type || "text/plain",
      content,
      preferApi: true,
    });
  }

  async function importItineraryText(content: string, sourceName: string) {
    /* v8 ignore next */
    if (!canEdit) return;
    await importItineraryContent({
      fileName: sourceName,
      contentType: "text/plain",
      content,
      preferApi: false,
    });
  }

  async function importItineraryContent({
    fileName,
    contentType,
    content,
    preferApi,
  }: {
    fileName: string;
    contentType: string;
    content: string;
    preferApi: boolean;
  }) {
    try {
      const document =
        preferApi &&
        shouldUseApiItineraryImport({ contentType, fileName }) &&
        isApiMode &&
        resolvedApiClient &&
        participantSession
          ? await resolvedApiClient.importItinerary(
              trip.id,
              participantSession.sessionToken,
              buildImportItineraryRequest({ fileName, contentType, content }),
            )
          : parseItineraryImportDocument(content);
      setPendingItineraryImport(
        pendingItineraryImportFromDocument({ document, fileName }),
      );
      setItineraryImportError(null);
    } catch (caught) {
      setItineraryImportError(
        caught instanceof Error ? caught.message : "Import itinerary ไม่สำเร็จ",
      );
    }
  }

  async function applyPendingItineraryImport(
    target: ItineraryImportApplyTarget,
  ) {
    if (!pendingItineraryImport) return;
    try {
      const previewTrip = applyImportedItemsToItineraryPath(
        trip,
        pendingItineraryImport.items,
        target,
      );
      const currentIds = new Set(trip.itineraryItems.map((item) => item.id));
      const previewIds = new Set(
        previewTrip.itineraryItems.map((item) => item.id),
      );
      const deletedItems = trip.itineraryItems.filter(
        (item) => !previewIds.has(item.id),
      );
      const previewImportedItems = previewTrip.itineraryItems.filter(
        (item) => !currentIds.has(item.id),
      );
      const appliedImportedItems = previewTrip.itineraryItems.slice(
        -pendingItineraryImport.items.length,
      );

      if (isApiMode && resolvedApiClient && participantSession) {
        for (const item of deletedItems) {
          await resolvedApiClient.deleteItineraryItem(
            trip.id,
            item.id,
            participantSession.sessionToken,
          );
        }
        const createdItems: ItineraryItem[] = [];
        const createdItemIdsByImportId = new Map<string, string>();
        const createdItemIdsByPreviewId = new Map<string, string>();
        for (const item of previewImportedItems) {
          const importedItem = pendingItineraryImport.items[createdItems.length];
          const createdItem = await resolvedApiClient.createItineraryItem(
            trip.id,
            participantSession.sessionToken,
            buildImportedItineraryItemCreateRequest({
              clientMutationId: nextClientMutationId("itinerary-import-create"),
              createdItemIdsByImportId,
              createdItemIdsByPreviewId,
              item,
            }),
          );
          createdItems.push(createdItem);
          if (importedItem) {
            createdItemIdsByImportId.set(importedItem.id, createdItem.id);
          }
          createdItemIdsByPreviewId.set(item.id, createdItem.id);
        }
        const importedPlanRecords = buildImportedPlanRecordsForTripPlan({
          appliedImportedItems: createdItems,
          importedItems: pendingItineraryImport.items,
          records:
            target.recordMode === "clone-linked"
              ? pendingItineraryImport.records
              : emptyItineraryExportRecords(),
          targetTrip: previewTrip,
          tripPlanId: target.tripPlanId || trip.activePlanVariantId,
        });
        const createdPlanRecords = await createImportedPlanRecordsViaApi({
          apiClient: resolvedApiClient,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
          records: importedPlanRecords,
        });
        const deletedIds = new Set(deletedItems.map((item) => item.id));
        updateApiTrip((current) =>
          mergeApiImportedPlanRecordsIntoTrip({
            createdItems,
            currentTrip: current,
            deletedItemIds: deletedIds,
            previewTrip,
            records: createdPlanRecords,
          }),
        );
        setTasks((current) =>
          mergeImportedTasks(current, createdPlanRecords),
        );
        setStopNotes((current) =>
          mergeImportedStopNotes(current, createdPlanRecords),
        );
        if (createdPlanRecords.expenses.length > 0) {
          setBackendExpenseSummary({
            tripPlanId: selectedTripPlanId,
            summary: await resolvedApiClient.getExpenseSummary(
              trip.id,
              participantSession.sessionToken,
              selectedTripPlanId,
            ),
          });
        }
        const nextSelectedItemId = createdItems[0]?.id ?? "";
        setSelectedItemId(nextSelectedItemId);
        if (!nextSelectedItemId) setContextRailVisibility(false);
        setPendingItineraryImport(null);
        return;
      }

      const nextSelectedItemId = appliedImportedItems[0]?.id ?? "";
      const importedPlanRecords = buildImportedPlanRecordsForTripPlan({
        appliedImportedItems,
        importedItems: pendingItineraryImport.items,
        records:
          target.recordMode === "clone-linked"
            ? pendingItineraryImport.records
            : emptyItineraryExportRecords(),
        targetTrip: previewTrip,
        tripPlanId: target.tripPlanId || trip.activePlanVariantId,
      });
      commitTrip(
        () =>
          mergeImportedRecordsIntoTripPlan(previewTrip, importedPlanRecords),
        nextSelectedItemId,
      );
      setTasks((current) =>
        mergeImportedTasks(current, importedPlanRecords),
      );
      setStopNotes((current) =>
        mergeImportedStopNotes(current, importedPlanRecords),
      );
      if (!nextSelectedItemId) setContextRailVisibility(false);
      setPendingItineraryImport(null);
      setItineraryImportError(null);
    } catch (caught) {
      setItineraryImportError(
        caught instanceof Error ? caught.message : "Import itinerary ไม่สำเร็จ",
      );
    }
  }

  function openExpensesWorkspace() {
    navigateWorkspaceView("expenses", appRoutes.tripExpenses(trip.id));
  }

  const isAccountTripAccessPending =
    requireJoin &&
    isApiMode &&
    Boolean(routeTripId) &&
    !sessionMember &&
    !accessError &&
    (!accountSessionLoaded ||
      Boolean(
        accountSession && accountTripAccessDeniedRouteId !== routeTripId,
      ));
  const shouldRedirectUnauthenticatedTripRoute =
    sessionRestored &&
    requireJoin &&
    Boolean(routeTripId) &&
    !hasRouteParticipantSession &&
    !accessError &&
    !isAccountTripAccessPending &&
    !isTripLoading &&
    typeof window !== "undefined" &&
    !window.location.pathname.includes("iframe.html") &&
    !("__vitest_browser__" in window);

  useEffect(() => {
    if (!shouldRedirectUnauthenticatedTripRoute) return;
    const returnTo = window.location.pathname + window.location.search;
    const joinHref = appRoutes.join(undefined, returnTo);
    window.location.replace(joinHref);
  }, [shouldRedirectUnauthenticatedTripRoute]);

  if (
    isAccountTripAccessPending ||
    isTripLoading ||
    shouldRedirectUnauthenticatedTripRoute
  ) {
    return <TripAccessLoadingFrame />;
  }

  const canAccessPanel =
    accessMode === "account-portal" ||
    isAccountOnlyAccessMode ||
    (requireJoin &&
      !sessionMember &&
      (!routeTripId || accessMode === "trip-access"));

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
          <label className="sr-only">
            Role preview
            <Select
              value={currentMember.id}
              onChange={(event) => setCurrentMemberId(event.target.value)}
            >
              {trip.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName} ({member.role})
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <TripWorkspaceFrame
          contextRailOpen={contextRailOpen}
          importError={itineraryImportError}
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
                apiBaseUrl:
                  process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "",
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
                canRedo,
                canRestructure: canEdit,
                canUndo,
                contextRailOpen,
                endDate: trip.endDate,
                graphItems: activePlanItems,
                items: planItems,
                commitmentsByItemId: itineraryCommitmentsByItemId,
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
                selectedTripPathId,
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
                onAddTaskForItem: (itemId) => void createItineraryTask(itemId),
                onOpenItemDetails: openItemDetails,
                onSelectItem: selectItem,
                onMoveItem: moveItem,
                onMoveItemIntoPlanBlock: moveItemIntoPlanBlock,
                onMoveItemToDay: moveItemToDay,
                onMoveItemToPath: moveItemToPath,
                onUpdateItemInline: updateItineraryItemInline,
                onEditItem: editItem,
                onDeleteItem: deleteStop,
                onExportItinerary: exportItinerary,
                onImportItinerary: importItinerary,
                onImportItineraryText: importItineraryText,
                onChangeTripPath: changeTripPath,
                onChangeDayPath: changeDayPath,
                onClearDayPath: clearDayPath,
                onClearAllDayPaths: clearAllDayPaths,
                onToggleShowAllPaths: toggleShowAllPaths,
                onRedo: redo,
                onToggleContextRail: toggleContextRail,
                onUndo: undo,
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
        {dialogState ? (
          <StopDialog
            key={
              dialogState.mode === "edit"
                ? `edit-${dialogState.item.id}`
                : "create-stop"
            }
            mode={dialogState.mode}
            startDate={trip.startDate}
            endDate={trip.endDate}
            initialItem={
              dialogState.mode === "edit" ? dialogState.item : undefined
            }
            initialDay={
              dialogState.mode === "create"
                ? (dialogState.day ?? selectedDay)
                : undefined
            }
            initialParentItemId={
              dialogState.mode === "create"
                ? dialogState.parentItemId
                : undefined
            }
            manualPathOptions={
              dialogState.mode === "edit"
                ? deriveManualActivityPathOptions(trip, dialogState.item.id)
                : undefined
            }
            onClose={() => {
              setStopPlaceResolution({ state: "idle", candidates: [] });
              setDialogState(null);
            }}
            onDelete={
              dialogState.mode === "edit" ? deleteSelectedStop : undefined
            }
            onPromoteFoodRecommendation={
              dialogState.mode === "edit"
                ? () => void promoteFoodRecommendation(dialogState.item)
                : undefined
            }
            onSubmit={
              dialogState.mode === "edit" ? updateSelectedStop : createStop
            }
            placeResolution={stopPlaceResolution}
          />
        ) : null}
        {pendingItineraryImport ? (
          <TripWorkspaceImportDialog
            currentTripPathId={selectedTripPathId}
            importedItems={pendingItineraryImport.items}
            memberId={currentMember.id}
            pathOptions={pathOptions}
            records={pendingItineraryImport.records}
            tripPlanOptions={trip.tripPlans ?? trip.planVariants}
            tripPlanId={selectedTripPlanId}
            startDate={trip.startDate}
            onApply={(target) => void applyPendingItineraryImport(target)}
            onClose={() => setPendingItineraryImport(null)}
          />
        ) : null}
        <TripWorkspaceDeleteDialog
          item={dialogDeleteItem}
          cancelLabel={t.itinerary.row.confirmDeleteNo}
          confirmLabel={t.itinerary.row.confirmDeleteYes}
          titleForActivity={(activity) =>
            t.itinerary.row.confirmDeleteTitle({ activity })
          }
          bodyForActivity={(activity) =>
            t.itinerary.row.confirmDeleteBody({ activity })
          }
          onCancel={() => setDialogDeleteItem(null)}
          onConfirm={async (itemId) => {
            setDialogDeleteItem(null);
            await deleteStop(itemId);
          }}
        />
      </main>
    </AppShell>
  );
}
