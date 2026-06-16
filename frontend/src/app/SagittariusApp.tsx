"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppShell, resolveViewFromPath } from "@/src/components/AppShell";
import { AccountAccessPanel } from "@/src/components/AccountAccessPanel";
import type { BookingDocInput } from "@/src/components/BookingsDocsPage";
import type { MapCoordinateResolutionResult } from "@/src/components/RouteMapView";
import {
  type ItineraryBookingTicketInput,
  type ItineraryBookingTemplate,
  type InlineItineraryItemPatch,
} from "@/src/components/SmartItineraryTable";
import { StopDialog, type StopFormValues } from "@/src/components/StopDialog";
import type { TripPhotoAlbumInput } from "@/src/components/TripPhotosPage";
import type { TripSettingsFormValues } from "@/src/components/TripSettingsPage";
import { Select } from "@/src/components/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import { slugifyFilePart } from "@/src/lib/file-names";
import { appRoutes, decodeReturnTo } from "@/src/routes/app-routes";
import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";
import {
  createTripApiClient,
  TripApiError,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import {
  isAuthFailure,
  isForbidden,
  isUnauthenticated,
} from "@/src/trip/api-errors";
import {
  createLocalPhotoAlbum,
  serializePhotoAlbumInputForApi,
  updateLocalPhotoAlbum,
} from "@/src/trip/photo-albums";
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
  createTripParticipant,
  findSessionMember,
  nextTripMemberColor,
  resetTripParticipantClaim,
  setTripParticipantPassword,
  setTripParticipantAccessStatus,
  updateTripParticipantRole,
} from "@/src/trip/auth";
import {
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingDocInputForExpenseEstimate,
  bookingTypeForBookingTemplate,
  bookingTypeForItineraryItem,
  clearItineraryBookingTicketDetails,
  createLocalBookingDoc,
  findDuplicateBookingDoc,
  serializeBookingDocInputForApi,
  syncItineraryDetailsWithBookingTicket,
  uniqueStringIds,
} from "@/src/trip/booking-docs";
import {
  clearParticipantSession,
  isLocalParticipantSession,
  loadPersistedParticipantSession,
  persistParticipantSession,
} from "@/src/trip/participant-session-storage";
import {
  createLocalTripPlan,
  legacyKindForPlanStatus,
  mergePublishedTripPlan,
  normalizeTripPlanAliases,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { deriveTripCountriesFromDestination } from "@/src/trip/trip-countries";
import {
  appendLocalExpensesToTrip,
  buildExpenseCreateDrafts,
  buildExpenseUpdateDraft,
  buildExpenseSummary,
  expenseReminderRequestForSuggestion,
  expenseSplitsToMinor,
  filterExpenseRemindersForTripPlan,
  recordLocalExpenseReminderInTrip,
  updateLocalExpenseInTrip,
} from "@/src/trip/expenses";
import {
  buildItineraryCommitmentsByItemId,
  buildItineraryView,
  deleteItineraryItemFromTrip,
  deriveItineraryPathOptions,
  getNextChildSortOrder,
  getNextSortOrder,
  itineraryItemPathFieldsForTarget,
  mainItineraryPathId,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  normalizeStopHierarchyValues,
  replaceItineraryItem,
  resolveItineraryPathItems,
  selectedItineraryPathIdForDay,
  updateItineraryPathSelection,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import {
  buildInlineItineraryItemPatch,
  shiftItineraryItemsToStartDate,
} from "@/src/trip/itinerary-time";
import {
  applyTripSettingsToTrip,
  mergePatchedTripSettings,
} from "@/src/trip/trip-settings";
import {
  createLocalStopNote,
  deleteLocalStopNote,
  updateLocalStopNote,
} from "@/src/trip/stop-notes";
import {
  buildTaskCreateDraft,
  createLocalTask,
  toggledTaskStatus,
  toggleLocalTaskStatus,
} from "@/src/trip/tasks";
import {
  buildMapLink,
  locationFieldsFromCandidate,
  mapResolutionActivity,
  mapResolutionPlaceHint,
  resolveStopPlace,
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import {
  applyImportedItemsToItineraryPath,
  applyItemToActivityBranch,
  applyManualActivityPath,
  deriveManualActivityPathOptions,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths-api";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import { createImportedPlanRecordsViaApi } from "@/src/trip/workspace/itinerary-import-api";
import {
  buildImportedPlanRecordsForTripPlan,
  emptyItineraryExportRecords,
  mergeImportedRecordsIntoTripPlan,
  pendingItineraryImportFromDocument,
  resolveCreatedImportId,
  shouldUseApiItineraryImport,
  upsertById,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
  tripHasPlan,
} from "@/src/trip/workspace/selected-trip-plan";
import {
  selectTripPlanRecords,
  tripPlanIdForBookingRecord,
  tripPlanIdForRecord,
} from "@/src/trip/workspace/trip-plan-records";
import { TripWorkspaceDeleteDialog } from "@/src/trip/workspace/TripWorkspaceDeleteDialog";
import { TripWorkspaceFrame } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceImportDialog } from "@/src/trip/workspace/TripWorkspaceImportDialog";
import { TripWorkspaceRail } from "@/src/trip/workspace/TripWorkspaceRail";
import { TripWorkspaceViews } from "@/src/trip/workspace/TripWorkspaceViews";
import { TripAccessLoadingFrame } from "@/src/trip/workspace/TripAccessLoadingFrame";
import { WorkspaceToast } from "@/src/trip/workspace/WorkspaceToast";
import {
  buildItineraryExport,
  parseItineraryImportDocument,
} from "@/src/trip/itinerary-import-export";
import {
  nextClientMutationId,
  nextLocalBookingDocId,
  nextLocalExpenseId,
  nextLocalItemId,
  nextLocalPhotoAlbumId,
  nextLocalPlanVariantId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
} from "@/src/trip/local-ids";
import { buildFallbackBriefings } from "@/src/trip/weather-briefings";
import {
  tripFixtureStopNotes,
  tripFixtureSuggestions,
  tripFixtureTasks,
} from "@/src/trip/trip-fixtures";
import {
  loadPersistedTripDraft,
  persistTripDraft,
} from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { safeExternalHref } from "@/src/trip/safe-links";
import { approveSuggestion, replaceSuggestionById } from "@/src/trip/suggestions";
import type {
  BookingDoc,
  BookingDocType,
  DailyBriefingOverrides,
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseSummary,
  ItineraryItem,
  PlanStatus,
  SettlementSuggestion,
  StopNote,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
  TripTask,
} from "@/src/trip/types";

export {
  nextClientMutationId,
  nextLocalBookingDocId,
  nextLocalItemId,
  nextLocalPhotoAlbumId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
} from "@/src/trip/local-ids";
export {
  bookingTypeForItineraryItem,
  findDuplicateBookingDoc,
} from "@/src/trip/booking-docs";
export { normalizeInlineTimePatch } from "@/src/trip/itinerary-time";

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";
const workspaceShellClassName = "workspace-shell min-w-0 bg-transparent max-[1199px]:min-h-[calc(100dvh-48px)]";

type PortalSection =
  | "dashboard"
  | "trips"
  | "new-trip"
  | "explorer"
  | "todos"
  | "vault"
  | "settings"
  | "sign-out";
interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
  dataSource?: "api" | "local";
  apiClient?: TripApiClient;
  placeResolver?: PlaceResolver;
  routeTripId?: string;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  accessMode?:
    | "combined"
    | "account-login"
    | "account-register"
    | "account-portal"
    | "trip-access";
  accountSuccessRedirectHref?: string;
  portalSection?: PortalSection;
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
  const [tripState, setTripState] = useState<{
    trip: Trip;
    past: Trip[];
    future: Trip[];
  }>(() => ({
    trip: normalizeTripPlanAliases(initialTrip),
    past: [],
    future: [],
  }));
  const latestTripRef = useRef(tripState.trip);
  const inlineUpdateQueueRef = useRef<Map<string, Promise<void>>>(new Map());
  const bookingDocUpdateQueueRef = useRef<Map<string, Promise<void>>>(new Map());
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
  const [toastDismissed, setToastDismissed] = useState(false);
  const [toastDismissing, setToastDismissing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() =>
    tripFixtureSuggestions.map((suggestion) => ({ ...suggestion })),
  );
  const [tasks, setTasks] = useState<TripTask[]>(() =>
    (initialTrip.tasks ?? tripFixtureTasks).map((task) => ({ ...task })),
  );
  const [stopNotes, setStopNotes] = useState<StopNote[]>(() =>
    tripFixtureStopNotes.map((note) => ({ ...note })),
  );
  const [dailyBriefings, setDailyBriefings] = useState<TripDailyBriefing[]>([]);
  const [backendExpenseSummary, setBackendExpenseSummary] =
    useState<{ tripPlanId: string; summary: ExpenseSummary } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextRailOpen, setContextRailOpen] = useState(false);
  const [contextRailMounted, setContextRailMounted] = useState(false);
  const [contextRailPreferredTab, setContextRailPreferredTab] =
    useState<"notes" | "booking" | "suggestions">("notes");
  // Auto-dismiss the workspace toast after 6 s when the session is a join-only (temp) session
  useEffect(() => {
    if (!requireJoin || toastDismissed) return;
    const timer = setTimeout(() => {
      setToastDismissing(true);
      setTimeout(() => setToastDismissed(true), 220);
    }, 6000);
    return () => clearTimeout(timer);
  }, [requireJoin, toastDismissed]);
  const [navigatedView, setNavigatedView] = useState<PlanningView | null>(null);
  const [selectedTripPlanId, setSelectedTripPlanId] = useState(() =>
    resolveSelectedTripPlanId(initialTrip),
  );
  const [currentMemberId, setCurrentMemberId] = useState(
    initialMemberId ?? initialTrip.members[0].id,
  );
  const [selectedItemId, setSelectedItemId] = useState("item-dimdim");
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
  const [pathSelection, setPathSelection] = useState<ItineraryPathSelection>({
    tripPathId: mainItineraryPathId,
    dayPathOverrides: {},
  });

  const trip = tripState.trip;
  const tripIdForPath = routeTripId ?? trip.id;
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
  const resolveCurrentView = useCallback(() => {
    if (typeof window === "undefined") return initialView;
    return resolveViewFromPath(
      window.location.pathname,
      tripIdForPath,
      initialView,
    );
  }, [initialView, tripIdForPath]);
  const currentView = navigatedView ?? resolveCurrentView();
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
  const activePlanItems = useMemo(
    () =>
      trip.itineraryItems.filter(
        (item) => item.planVariantId === selectedTripPlanId,
      ),
    [selectedTripPlanId, trip.itineraryItems],
  );
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
  const pathOptions = useMemo(
    () =>
      deriveItineraryPathOptions(activePlanItems, trip.itineraryPaths ?? []),
    [activePlanItems, trip.itineraryPaths],
  );
  const planItems = useMemo(
    () => resolveItineraryPathItems(activePlanItems, pathSelection),
    [activePlanItems, pathSelection],
  );
  const mainPlanItems = useMemo(() => {
    const mainTripPlanId = trip.mainTripPlanId || trip.activePlanVariantId;
    const items = trip.itineraryItems.filter(
      (item) => item.planVariantId === mainTripPlanId,
    );
    return resolveItineraryPathItems(items, pathSelection);
  }, [
    pathSelection,
    trip.activePlanVariantId,
    trip.itineraryItems,
    trip.mainTripPlanId,
  ]);
  const itineraryView = useMemo(
    () => buildItineraryView(planItems),
    [planItems],
  );
  const mainItineraryView = useMemo(
    () => buildItineraryView(mainPlanItems),
    [mainPlanItems],
  );
  const visibleDailyBriefings = useMemo(
    () =>
      dailyBriefings.length ? dailyBriefings : buildFallbackBriefings(trip),
    [dailyBriefings, trip],
  );

  useEffect(() => {
    latestTripRef.current = trip;
  }, [trip]);

  /* v8 ignore next */
  const selectedItem =
    activePlanItems.find((item) => item.id === selectedItemId) ??
    planItems[0] ??
    activePlanItems[0];
  const selectedDay =
    selectedItem?.day ?? itineraryView.dayGroups[0]?.day ?? trip.startDate;
  const selectedItemIdForView = selectedItem?.id ?? "";
  const scopedTripPlanRecords = useMemo(
    () =>
      selectTripPlanRecords(trip, selectedTripPlanId, {
        stopNotes,
        tasks,
      }),
    [selectedTripPlanId, stopNotes, tasks, trip],
  );
  const expenseSummary = useMemo(
    () => {
      if (backendExpenseSummary?.tripPlanId === selectedTripPlanId) {
        return backendExpenseSummary.summary;
      }

      return buildExpenseSummary(
        scopedTripPlanRecords.expenses,
        currentMember.id,
        filterExpenseRemindersForTripPlan(
          trip.expenseReminders ?? [],
          selectedTripPlanId,
          trip.mainTripPlanId || trip.activePlanVariantId,
        ),
      );
    },
    [
      backendExpenseSummary,
      currentMember.id,
      selectedTripPlanId,
      trip.expenseReminders,
      trip.mainTripPlanId,
      trip.activePlanVariantId,
      scopedTripPlanRecords.expenses,
    ],
  );
  const scopedTripForRecords = useMemo(
    () => ({
      ...trip,
      bookingDocs: scopedTripPlanRecords.bookingDocs,
      expenses: scopedTripPlanRecords.expenses,
      itineraryItems: activePlanItems,
      stopNotes: scopedTripPlanRecords.stopNotes,
    }),
    [
      activePlanItems,
      scopedTripPlanRecords.bookingDocs,
      scopedTripPlanRecords.expenses,
      scopedTripPlanRecords.stopNotes,
      trip,
    ],
  );
  const scopedSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) => suggestion.planVariantId === selectedTripPlanId,
      ),
    [selectedTripPlanId, suggestions],
  );
  const itineraryCommitmentsByItemId = useMemo(
    () =>
      buildItineraryCommitmentsByItemId({
        bookingDocs: scopedTripPlanRecords.bookingDocs,
        expenses: scopedTripPlanRecords.expenses,
        stopNotes: scopedTripPlanRecords.stopNotes,
        tasks: scopedTripPlanRecords.tasks,
      }),
    [scopedTripPlanRecords],
  );

  function changeTripPath(pathId: string) {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "change-trip-path", pathId }),
    );
  }

  function changeDayPath(day: string, pathId: string) {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "change-day-path", day, pathId }),
    );
  }

  function clearDayPath(day: string) {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "clear-day-path", day }),
    );
  }

  function clearAllDayPaths() {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "clear-all-day-paths" }),
    );
  }

  function toggleShowAllPaths(showAll: boolean) {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "toggle-show-all-paths", showAll }),
    );
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => setNavigatedView(resolveCurrentView());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resolveCurrentView]);

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
  }, [initialTrip, isApiMode, requireJoin, routeTripId]);

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
      setDailyBriefings([]);
    });

    void resolvedApiClient
      .loadTrip(participantSession.tripId, participantSession.sessionToken)
      .then((cockpit) => {
        if (cancelled) return;
        const loadedTripPlanId = resolveSelectedTripPlanId(cockpit.trip);
        setTripState({ trip: cockpit.trip, past: [], future: [] });
        setSelectedTripPlanId(loadedTripPlanId);
        rememberSelectedTripPlanId(cockpit.trip, loadedTripPlanId);
        setSuggestions(cockpit.suggestions);
        setTasks(cockpit.tasks);
        setStopNotes(cockpit.stopNotes);
        setBackendExpenseSummary(null);
        setIsCockpitLoaded(true);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isAuthFailure(caught)) {
          clearParticipantSession();
          setParticipantSession(null);
          setAccessError("unauthenticated");
          setDailyBriefings([]);
          setIsCockpitLoaded(false);
          return;
        }
        setAccessError("trip load failed");
        setDailyBriefings([]);
        setIsCockpitLoaded(false);
      });

    void resolvedApiClient
      .listDailyBriefings(
        participantSession.tripId,
        participantSession.sessionToken,
      )
      .then((briefings) => {
        if (cancelled) return;
        setDailyBriefings(briefings);
      })
      .catch(() => {
        if (cancelled) return;
        setDailyBriefings([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isApiMode, participantSession, resolvedApiClient]);

  useEffect(() => {
    if (
      !isApiMode ||
      !participantSession ||
      !resolvedApiClient ||
      !isCockpitLoaded ||
      !canViewExpenses ||
      !shouldSyncBackendExpenseSummary ||
      !hasSelectedBackendExpenseTripPlan ||
      !selectedTripPlanId
    ) {
      return undefined;
    }
    if (backendExpenseSummary?.tripPlanId === selectedTripPlanId) {
      return undefined;
    }

    let cancelled = false;
    void Promise.resolve(
      resolvedApiClient.getExpenseSummary(
        participantSession.tripId,
        participantSession.sessionToken,
        selectedTripPlanId,
      ),
    )
      .then((summary) => {
        if (cancelled || !summary) return;
        setBackendExpenseSummary({ tripPlanId: selectedTripPlanId, summary });
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isAuthFailure(caught)) {
          clearParticipantSession();
          setParticipantSession(null);
          setAccessError("unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    backendExpenseSummary?.tripPlanId,
    canViewExpenses,
    isApiMode,
    isCockpitLoaded,
    hasSelectedBackendExpenseTripPlan,
    participantSession,
    resolvedApiClient,
    selectedTripPlanId,
    shouldSyncBackendExpenseSummary,
  ]);

  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient)
      return undefined;
    let cancelled = false;

    void Promise.resolve(
      resolvedApiClient.updatePresence(
        participantSession.tripId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("presence-online"),
          presence: "online",
        },
      ),
    )
      .then((member) => {
        if (cancelled || !member) return;
        setTripState((current) => ({
          ...current,
          trip: {
            ...current.trip,
            members: current.trip.members.map((candidate) =>
              candidate.id === member.id ? member : candidate,
            ),
          },
        }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isApiMode, participantSession, resolvedApiClient]);

  useEffect(() => {
    if (contextRailOpen) return undefined;
    const timeout = window.setTimeout(() => setContextRailMounted(false), 900);
    return () => window.clearTimeout(timeout);
  }, [contextRailOpen]);

  const setContextRailVisibility = useCallback((open: boolean) => {
    if (open) setContextRailMounted(true);
    setContextRailOpen(open);
  }, []);

  const navigateWorkspaceView = useCallback(
    (view: PlanningView, href: string) => {
      setNavigatedView(view);
      setContextRailVisibility(false);
      if (typeof window !== "undefined" && window.location.pathname !== href) {
        window.history.pushState(null, "", href);
      }
    },
    [setContextRailVisibility],
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
    if (!window.location.pathname.startsWith("/join")) return;
    const returnToParam = new URLSearchParams(window.location.search).get("rt");
    const returnTo = returnToParam ? decodeReturnTo(returnToParam) : null;
    const target =
      resolveJoinPostAuthReturnTo(returnTo, participantSession.tripId) ??
      appRoutes.tripOverview(participantSession.tripId);
    window.location.replace(target);
  }, [participantSession, requireJoin, routeTripId, sessionMember]);

  useEffect(() => {
    if (!contextRailOpen) return undefined;

    function closeContextRailFromOutside(event: Event) {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".context-rail")) return;
      if (event.target.closest(".page-header, .side-rail")) return;
      if (event.target.closest('[role="dialog"]')) return;
      if (event.target.closest(".data-row")) return;
      setContextRailVisibility(false);
    }

    document.addEventListener("pointerdown", closeContextRailFromOutside);
    document.addEventListener("click", closeContextRailFromOutside);
    return () => {
      document.removeEventListener("pointerdown", closeContextRailFromOutside);
      document.removeEventListener("click", closeContextRailFromOutside);
    };
  }, [contextRailOpen, setContextRailVisibility]);

  async function reloadTripPlanConflict(
    preferredTripPlanId: string | null = selectedTripPlanId,
  ) {
    if (!resolvedApiClient || !participantSession) return;
    const cockpit = await resolvedApiClient.loadTrip(
      trip.id,
      participantSession.sessionToken,
    );
    replaceCockpitFromApi(cockpit);
    const reloadedTripPlanId =
      preferredTripPlanId === null
        ? initialSelectedTripPlanId(cockpit.trip)
        : resolveSelectedTripPlanId(cockpit.trip, preferredTripPlanId);
    setSelectedTripPlanId(reloadedTripPlanId);
    rememberSelectedTripPlanId(cockpit.trip, reloadedTripPlanId);
    latestTripRef.current = cockpit.trip;
  }

  function selectTripPlan(tripPlanId: string): boolean {
    if (!tripPlanId || !trip.planVariants.some((plan) => plan.id === tripPlanId)) {
      return false;
    }
    setSelectedTripPlanId(tripPlanId);
    rememberSelectedTripPlanId(trip, tripPlanId);
    return true;
  }

  async function setMainTripPlan(tripPlanId: string): Promise<boolean> {
    const mainTripPlanId = trip.mainTripPlanId || trip.activePlanVariantId;
    if (!canManageTripPlans || !tripPlanId || tripPlanId === mainTripPlanId) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      setIsTripPlanBusy(true);
      try {
        const setMainTripPlan =
          resolvedApiClient.setMainTripPlan ??
          resolvedApiClient.publishPlanVariant;
        const publishedTrip = await setMainTripPlan(
          trip.id,
          tripPlanId,
          participantSession.sessionToken,
          { clientMutationId: nextClientMutationId("trip-plan-set-main") },
        );
        setTripState((current) => {
          const nextTrip = mergePublishedTripPlan(
            current.trip,
            publishedTrip,
            tripPlanId,
          );
          latestTripRef.current = nextTrip;
          return { ...current, trip: nextTrip };
        });
        setSelectedTripPlanId(tripPlanId);
        rememberSelectedTripPlanId(publishedTrip, tripPlanId);
      } catch (error) {
        if (
          error instanceof TripApiError &&
          error.code === "version_conflict"
        ) {
          await reloadTripPlanConflict(null);
          return true;
        }
        setTripPlanError(t.itinerary.tripPlans.error);
        return false;
      } finally {
        setIsTripPlanBusy(false);
      }
      return true;
    }

    commitTrip((current) => ({
      ...current,
      activePlanVariantId: tripPlanId,
      mainTripPlanId: tripPlanId,
    }));
    setSelectedTripPlanId(tripPlanId);
    rememberSelectedTripPlanId(trip, tripPlanId);
    return true;
  }

  async function updateTripPlanStatus(
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ): Promise<boolean> {
    if (!canManageTripPlans || !tripPlanId) return false;
    const currentPlan = trip.planVariants.find((plan) => plan.id === tripPlanId);
    if (!currentPlan || currentPlan.status === "main") return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      setIsTripPlanBusy(true);
      try {
        const patchTripPlanMutation =
          resolvedApiClient.patchTripPlan ??
          resolvedApiClient.patchPlanVariant;
        const updatedPlan = await patchTripPlanMutation(
          trip.id,
          tripPlanId,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("trip-plan-status"),
            expectedVersion: currentPlan.version ?? 1,
            patch: { status },
          },
        );
        setTripState((current) => {
          const nextTrip = updateTripPlanInTrip(current.trip, updatedPlan);
          latestTripRef.current = nextTrip;
          return { ...current, trip: nextTrip };
        });
      } catch (error) {
        if (
          error instanceof TripApiError &&
          error.code === "version_conflict"
        ) {
          await reloadTripPlanConflict();
          return true;
        }
        setTripPlanError(t.itinerary.tripPlans.error);
        return false;
      } finally {
        setIsTripPlanBusy(false);
      }
      return true;
    }

    commitTrip((current) =>
      updateTripPlanInTrip(current, {
        ...currentPlan,
        kind: legacyKindForPlanStatus(status),
        status,
        version: (currentPlan.version ?? 1) + 1,
      }),
    );
    return true;
  }

  async function renameTripPlan(
    tripPlanId: string,
    name: string,
  ): Promise<boolean> {
    if (!canManageTripPlans || !tripPlanId) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const currentPlan = trip.planVariants.find((plan) => plan.id === tripPlanId);
    if (!currentPlan || currentPlan.name === trimmedName) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      setIsTripPlanBusy(true);
      try {
        const patchTripPlanMutation =
          resolvedApiClient.patchTripPlan ??
          resolvedApiClient.patchPlanVariant;
        const updatedPlan = await patchTripPlanMutation(
          trip.id,
          tripPlanId,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("trip-plan-rename"),
            expectedVersion: currentPlan.version ?? 1,
            patch: { name: trimmedName },
          },
        );
        setTripState((current) => {
          const nextTrip = updateTripPlanInTrip(current.trip, updatedPlan);
          latestTripRef.current = nextTrip;
          return { ...current, trip: nextTrip };
        });
      } catch (error) {
        if (
          error instanceof TripApiError &&
          error.code === "version_conflict"
        ) {
          await reloadTripPlanConflict();
          return true;
        }
        setTripPlanError(t.itinerary.tripPlans.error);
        return false;
      } finally {
        setIsTripPlanBusy(false);
      }
      return true;
    }

    commitTrip((current) =>
      updateTripPlanInTrip(current, {
        ...currentPlan,
        name: trimmedName,
        version: (currentPlan.version ?? 1) + 1,
      }),
    );
    return true;
  }

  async function createTripPlan(name: string): Promise<boolean> {
    if (!canManageTripPlans) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      setIsTripPlanBusy(true);
      try {
        const createTripPlanMutation =
          resolvedApiClient.createTripPlan ??
          resolvedApiClient.createPlanVariant;
        const createdVariant = await createTripPlanMutation(
          trip.id,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("trip-plan-create"),
            name: trimmedName,
            status: "draft",
            creationMode: "blank",
            description: "",
          },
        );
        setTripState((current) => {
          const nextTrip = updateTripPlanInTrip(current.trip, createdVariant);
          latestTripRef.current = nextTrip;
          return { ...current, trip: nextTrip };
        });
        setSelectedTripPlanId(createdVariant.id);
        rememberSelectedTripPlanId(trip, createdVariant.id);
      } catch (error) {
        if (
          error instanceof TripApiError &&
          error.code === "version_conflict"
        ) {
          await reloadTripPlanConflict();
          return true;
        }
        setTripPlanError(t.itinerary.tripPlans.error);
        return false;
      } finally {
        setIsTripPlanBusy(false);
      }
      return true;
    }

    let createdTripPlanId = "";
    commitTrip((current) => {
      const result = createLocalTripPlan(
        current,
        trimmedName,
        nextLocalPlanVariantId,
      );
      createdTripPlanId = result.tripPlanId;
      return result.trip;
    });
    if (createdTripPlanId) {
      setSelectedTripPlanId(createdTripPlanId);
      rememberSelectedTripPlanId(trip, createdTripPlanId);
    }
    return true;
  }

  function addStop(day?: string, parentItemId?: string | null) {
    /* v8 ignore next */
    if (!canEdit) return;
    setStopPlaceResolution({ state: "idle", candidates: [] });
    setContextRailVisibility(false);
    setDialogState({ mode: "create", day, parentItemId: parentItemId ?? null });
  }

  async function addSubActivity(parentItemId: string) {
    const parentItem = trip.itineraryItems.find((item) => item.id === parentItemId);
    if (!parentItem) return;
    if (!parentItem.isPlanBlock) {
      try {
        setTripPlanError(null);
        await updateItineraryItemInline(parentItem.id, { isPlanBlock: true });
      } catch {
        setTripPlanError(t.itinerary.tripPlans.error);
        return;
      }
    }
    addStop(parentItem.day, parentItem.id);
  }

  function selectItem(itemId: string) {
    setContextRailPreferredTab("notes");
    setSelectedItemId(itemId);
  }

  function openItemDetails(itemId: string) {
    setContextRailPreferredTab("notes");
    setSelectedItemId(itemId);
    setContextRailVisibility(true);
  }

  async function moveItem(draggedItemId: string, targetItemId: string) {
    /* v8 ignore next */
    if (!canEdit || draggedItemId === targetItemId) return;

    const nextTrip = moveTripItem(
      trip,
      draggedItemId,
      targetItemId,
      selectedTripPlanId,
      localMutationTimestamp,
    );
    if (!nextTrip) return;

    if (isApiMode && resolvedApiClient && participantSession) {
      const draggedItem = trip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      const targetItem = nextTrip.itineraryItems.find(
        (item) => item.id === targetItemId,
      );
      if (!draggedItem || !targetItem) return;
      const movedItem = nextTrip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      if (!movedItem) return;
      const parentChanged =
        (draggedItem.parentItemId ?? null) !==
        (movedItem.parentItemId ?? null);
      if (draggedItem.day !== movedItem.day || parentChanged) {
        const patchedItem = await resolvedApiClient.patchItineraryItem(
          trip.id,
          draggedItemId,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("itinerary-day-move"),
            expectedVersion: draggedItem.version,
            patch: {
              day: movedItem.day,
              parentItemId: movedItem.parentItemId ?? null,
              sortOrder: movedItem.sortOrder,
            },
          },
        );
        setTripState((current) => ({
          ...current,
          trip: replaceItineraryItem(nextTrip, patchedItem),
        }));
        setSelectedItemId(draggedItemId);
        return;
      }
      const orderedIds = nextTrip.itineraryItems
        .filter(
          (item) =>
            item.planVariantId === targetItem.planVariantId &&
            item.day === targetItem.day,
        )
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime),
        )
        .map((item) => item.id);
      const reorderedItems = await resolvedApiClient.reorderItineraryItems(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("itinerary-reorder"),
          planVariantId: targetItem.planVariantId,
          day: targetItem.day,
          itemIds: orderedIds,
        },
      );
      setTripState((current) => {
        const itemsById = new Map(
          reorderedItems.map((item) => [item.id, item]),
        );
        return {
          ...current,
          trip: {
            ...current.trip,
            itineraryItems: current.trip.itineraryItems.map(
              (item) => itemsById.get(item.id) ?? item,
            ),
          },
        };
      });
      return;
    }

    commitTrip(() => nextTrip, draggedItemId);
  }

  async function moveItemIntoPlanBlock(
    draggedItemId: string,
    planBlockItemId: string,
  ) {
    /* v8 ignore next */
    if (!canEdit || draggedItemId === planBlockItemId) return;
    const nextTrip = moveTripItemIntoPlanBlock(
      trip,
      draggedItemId,
      planBlockItemId,
      selectedTripPlanId,
      localMutationTimestamp,
    );
    if (!nextTrip) return;

    const draggedItem = trip.itineraryItems.find(
      (item) => item.id === draggedItemId,
    );
    const movedItem = nextTrip.itineraryItems.find(
      (item) => item.id === draggedItemId,
    );
    if (!draggedItem || !movedItem) return;

    if (isApiMode && resolvedApiClient && participantSession) {
      const patchedItem = await resolvedApiClient.patchItineraryItem(
        trip.id,
        draggedItemId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("itinerary-block-move"),
          expectedVersion: draggedItem.version,
          patch: {
            day: movedItem.day,
            parentItemId: movedItem.parentItemId ?? null,
            sortOrder: movedItem.sortOrder,
          },
        },
      );
      setTripState((current) => ({
        ...current,
        trip: replaceItineraryItem(nextTrip, patchedItem),
      }));
      setSelectedItemId(draggedItemId);
      return;
    }

    commitTrip(() => nextTrip, draggedItemId);
  }

  async function moveItemToDay(draggedItemId: string, targetDay: string) {
    /* v8 ignore next */
    if (!canEdit) return;

    const nextTrip = moveTripItemToDay(
      trip,
      draggedItemId,
      targetDay,
      selectedTripPlanId,
      localMutationTimestamp,
    );
    if (!nextTrip) return;

    if (isApiMode && resolvedApiClient && participantSession) {
      const draggedItem = trip.itineraryItems.find(
        (item) => item.id === draggedItemId,
      );
      if (!draggedItem) return;
      await resolvedApiClient.patchItineraryItem(
        trip.id,
        draggedItemId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("itinerary-day-move"),
          expectedVersion: draggedItem.version,
          patch: { day: targetDay, parentItemId: null },
        },
      );
      setTripState((current) => ({ ...current, trip: nextTrip }));
      setSelectedItemId(draggedItemId);
      return;
    }

    commitTrip(() => nextTrip, draggedItemId);
  }

  async function moveItemToPath(itemId: string, pathId: string) {
    /* v8 ignore next */
    if (!canEdit) return;

    const branchPlacement = applyManualActivityPath(trip, itemId, pathId);
    if (
      branchPlacement.trip === trip ||
      branchPlacement.changedExistingItems.length === 0
    )
      return;

    if (isApiMode && resolvedApiClient && participantSession) {
      const patchedBranchItems = await patchApiItineraryBranchItems({
        apiClient: resolvedApiClient,
        items: branchPlacement.changedExistingItems,
        nextClientMutationId,
        sessionToken: participantSession.sessionToken,
        tripId: trip.id,
      });
      const patchedBranchItemsById = new Map(
        patchedBranchItems.map((item) => [item.id, item]),
      );
      const branchPlacementItemsById = new Map(
        branchPlacement.trip.itineraryItems
          .filter((item) =>
            branchPlacement.changedExistingItems.some(
              (changedItem) => changedItem.id === item.id,
            ),
          )
          .map((item) => [item.id, item]),
      );
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          itineraryItems: current.trip.itineraryItems.map(
            (item) =>
              patchedBranchItemsById.get(item.id) ??
              branchPlacementItemsById.get(item.id) ??
              item,
          ),
        },
      }));
      setSelectedItemId(itemId);
      return;
    }

    commitTrip(() => branchPlacement.trip, itemId);
  }

  async function createStop(values: StopFormValues) {
    values = normalizeStopHierarchyValues(values);
    const day = values.day || selectedDay;
    setStopPlaceResolution(
      effectivePlaceResolver && !values.resolvedPlace && !values.saveUnresolved
        ? { state: "resolving", candidates: [] }
        : { state: "idle", candidates: [] },
    );
    const placeResolution = await resolveStopPlace(
      { ...values, day },
      trip,
      effectivePlaceResolver,
      nextClientMutationId,
    );
    if (placeResolution.state) {
      setStopPlaceResolution(placeResolution.state);
      return;
    }
    setStopPlaceResolution({ state: "idle", candidates: [] });
    const locationFields = locationFieldsFromCandidate(
      placeResolution.candidate,
      values.place,
      values.mapLink,
    );
    const parentItem = values.parentItemId
      ? trip.itineraryItems.find((item) => item.id === values.parentItemId)
      : undefined;
    const targetPathId = selectedItineraryPathIdForDay(day, pathSelection);
    const targetPathName = pathOptions.find(
      (option) => option.id === targetPathId,
    )?.name;
    const nextItemId = nextLocalItemId(trip.itineraryItems, "item-new");
    const sortOrder = parentItem
      ? getNextChildSortOrder(planItems, parentItem)
      : getNextSortOrder(planItems, day);
    const pathFields = parentItem
      ? {
          pathGroupId: parentItem.pathGroupId,
          pathId: parentItem.pathId,
          pathName: parentItem.pathName,
          pathRole: parentItem.pathRole ?? "main",
        }
      : itineraryItemPathFieldsForTarget(
          `path-group-${nextItemId}`,
          targetPathId,
          targetPathName,
        );
    const draftItem: ItineraryItem = {
      id: nextItemId,
      tripId: trip.id,
      planVariantId: parentItem?.planVariantId ?? selectedTripPlanId,
      ...pathFields,
      parentItemId: values.parentItemId ?? null,
      itemKind: values.itemKind,
      timeMode: values.timeMode,
      isPlanBlock: values.isPlanBlock,
      status: values.status,
      priority: values.priority,
      day,
      sortOrder,
      startTime: values.startTime,
      endTime: values.endTime,
      endOffsetDays: values.endOffsetDays,
      activity: values.activity,
      activityType: values.activityType,
      place: values.place,
      linkLabel: "แผนที่",
      mapLink: locationFields.mapLink,
      address: locationFields.address,
      coordinates: locationFields.coordinates,
      durationMinutes: values.durationMinutes,
      transportation: values.transportation,
      details: values.details,
      advisories: [],
      note: values.note,
      createdBy: currentMember.id,
      updatedAt: localMutationTimestamp,
      version: 1,
    };
    const branchPlacement =
      parentItem
        ? {
            trip: {
              ...trip,
              itineraryItems: [...trip.itineraryItems, draftItem],
            },
            item: draftItem,
            changedExistingItems: [],
          }
        : targetPathId === mainItineraryPathId
        ? applyItemToActivityBranch(trip, draftItem)
        : {
            trip: {
              ...trip,
              itineraryItems: [...trip.itineraryItems, draftItem],
            },
            item: draftItem,
            changedExistingItems: [],
          };
    if (isApiMode && resolvedApiClient && participantSession) {
      const patchedBranchItems = await patchApiItineraryBranchItems({
        apiClient: resolvedApiClient,
        items: branchPlacement.changedExistingItems,
        nextClientMutationId,
        sessionToken: participantSession.sessionToken,
        tripId: trip.id,
      });
      const createdItem = await resolvedApiClient.createItineraryItem(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("itinerary-create"),
          planVariantId: parentItem?.planVariantId ?? selectedTripPlanId,
          pathGroupId: branchPlacement.item.pathGroupId,
          pathId: branchPlacement.item.pathId,
          pathName: branchPlacement.item.pathName,
          pathRole: branchPlacement.item.pathRole,
          parentItemId: values.parentItemId ?? null,
          itemKind: values.itemKind,
          timeMode: values.timeMode,
          isPlanBlock: values.isPlanBlock,
          status: values.status,
          priority: values.priority,
          day,
          startTime: values.startTime,
          endTime: values.endTime,
          endOffsetDays: values.endOffsetDays,
          activity: values.activity,
          activityType: values.activityType,
          place: values.place,
          mapLink: locationFields.mapLink,
          address: locationFields.address,
          coordinates: locationFields.coordinates,
          durationMinutes: values.durationMinutes,
          transportation: values.transportation,
          details: values.details,
          note: values.note,
        },
      );
      const createdItemWithPath = {
        ...createdItem,
        pathGroupId: branchPlacement.item.pathGroupId,
        pathId: branchPlacement.item.pathId,
        pathName: branchPlacement.item.pathName,
        pathRole: branchPlacement.item.pathRole,
      };
      const patchedBranchItemsById = new Map(
        patchedBranchItems.map((item) => [item.id, item]),
      );
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          itineraryItems: [
            ...current.trip.itineraryItems.map(
              (item) => patchedBranchItemsById.get(item.id) ?? item,
            ),
            createdItemWithPath,
          ],
        },
      }));
      setSelectedItemId(createdItem.id);
      setContextRailVisibility(false);
      setDialogState(null);
      return;
    }

    commitTrip(
      (current) =>
        parentItem
          ? {
              ...current,
              itineraryItems: [...current.itineraryItems, draftItem],
            }
          : targetPathId === mainItineraryPathId
          ? applyItemToActivityBranch(current, draftItem).trip
          : {
              ...current,
              itineraryItems: [...current.itineraryItems, draftItem],
            },
      draftItem.id,
    );
    setContextRailVisibility(false);
    setDialogState(null);
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

  async function updateSelectedStop(values: StopFormValues) {
    /* v8 ignore next */
    if (dialogState?.mode !== "edit") return;
    values = normalizeStopHierarchyValues(values);
    const itemId = dialogState.item.id;
    const editDay = values.day || dialogState.item.day;
    const shouldResolvePlace =
      values.place !== dialogState.item.place ||
      safeExternalHref(values.mapLink) !==
        safeExternalHref(dialogState.item.mapLink) ||
      Boolean(values.resolvedPlace) ||
      Boolean(values.saveUnresolved);
    setStopPlaceResolution(
      shouldResolvePlace &&
        effectivePlaceResolver &&
        !values.resolvedPlace &&
        !values.saveUnresolved
        ? { state: "resolving", candidates: [] }
        : { state: "idle", candidates: [] },
    );
    const placeResolution = shouldResolvePlace
      ? await resolveStopPlace(
          { ...values, day: editDay },
          trip,
          effectivePlaceResolver,
          nextClientMutationId,
        )
      : { candidate: null, state: null };
    if (placeResolution.state) {
      setStopPlaceResolution(placeResolution.state);
      return;
    }
    setStopPlaceResolution({ state: "idle", candidates: [] });
    const locationFields = shouldResolvePlace
      ? locationFieldsFromCandidate(
          placeResolution.candidate,
          values.place,
          values.mapLink,
        )
      : {
          address: dialogState.item.address ?? dialogState.item.place,
          coordinates: dialogState.item.coordinates,
          mapLink: dialogState.item.mapLink,
        };
    if (isApiMode && resolvedApiClient && participantSession) {
      const patchedItem = await resolvedApiClient.patchItineraryItem(
        trip.id,
        itemId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("itinerary-patch"),
          expectedVersion: dialogState.item.version,
          patch: {
            day: editDay,
            parentItemId: values.parentItemId ?? null,
            itemKind: values.itemKind,
            timeMode: values.timeMode,
            isPlanBlock: values.isPlanBlock,
            status: values.status,
            priority: values.priority,
            startTime: values.startTime,
            endTime: values.endTime,
            endOffsetDays: values.endOffsetDays,
            activity: values.activity,
            activityType: values.activityType,
            place: values.place,
            mapLink: locationFields.mapLink,
            address: locationFields.address,
            coordinates: locationFields.coordinates ?? null,
            durationMinutes: values.durationMinutes,
            transportation: values.transportation,
            details: values.details,
            note: values.note,
          },
        },
      );
      const tripWithPatchedItem = {
        ...trip,
        itineraryItems: trip.itineraryItems.map((item) =>
          item.id === itemId
            ? { ...patchedItem, day: values.day || patchedItem.day }
            : item,
        ),
      };
      const pathPlacement = applyItemToActivityBranch(
        tripWithPatchedItem,
        { ...patchedItem, day: values.day || patchedItem.day },
      );
      const branchPlacement = values.pathId
        ? applyManualActivityPath(
            pathPlacement.trip,
            itemId,
            values.pathId,
          )
        : pathPlacement;
      const patchedBranchItems = await patchApiItineraryBranchItems({
        apiClient: resolvedApiClient,
        items: branchPlacement.changedExistingItems,
        nextClientMutationId,
        sessionToken: participantSession.sessionToken,
        tripId: trip.id,
      });
      const patchedBranchItemsById = new Map(
        patchedBranchItems.map((item) => [item.id, item]),
      );
      const branchPlacementItemsById = new Map(
        branchPlacement.trip.itineraryItems
          .filter((item) =>
            branchPlacement.changedExistingItems.some(
              (changedItem) => changedItem.id === item.id,
            ),
          )
          .map((item) => [item.id, item]),
      );
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          itineraryItems: current.trip.itineraryItems.map((item) => {
            if (patchedBranchItemsById.has(item.id))
              return patchedBranchItemsById.get(item.id) ?? item;
            if (branchPlacementItemsById.has(item.id))
              return branchPlacementItemsById.get(item.id) ?? item;
            return item.id === itemId ? branchPlacement.item : item;
          }),
        },
      }));
      setSelectedItemId(itemId);
      setDialogState(null);
      return;
    }
    commitTrip((current) => {
      const updatedItem = {
        ...dialogState.item,
        day: editDay,
        parentItemId: values.parentItemId ?? null,
        itemKind: values.itemKind,
        timeMode: values.timeMode,
        isPlanBlock: values.isPlanBlock,
        status: values.status,
        priority: values.priority,
        startTime: values.startTime,
        endTime: values.endTime,
        endOffsetDays: values.endOffsetDays,
        activity: values.activity,
        activityType: values.activityType,
        place: values.place,
        mapLink: locationFields.mapLink,
        address: locationFields.address,
        coordinates: locationFields.coordinates,
        durationMinutes: values.durationMinutes,
        transportation: values.transportation,
        details: values.details,
        note: values.note,
        updatedAt: localMutationTimestamp,
        version: dialogState.item.version + 1,
      };
      const tripWithUpdatedItem = {
        ...current,
        itineraryItems: current.itineraryItems.map((item) =>
          item.id === itemId ? updatedItem : item,
        ),
      };
      const pathPlacement = applyItemToActivityBranch(
        tripWithUpdatedItem,
        updatedItem,
      );
      return values.pathId
        ? applyManualActivityPath(
            pathPlacement.trip,
            itemId,
            values.pathId,
          ).trip
        : pathPlacement.trip;
    });
    setSelectedItemId(itemId);
    setDialogState(null);
  }

  async function updateItineraryItemInline(
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) {
    if (!canEdit) return;
    const previousUpdate =
      inlineUpdateQueueRef.current.get(itemId) ?? Promise.resolve();
    const queuedUpdate = previousUpdate
      .catch(() => undefined)
      .then(() => runItineraryItemInlineUpdate(itemId, patch));
    inlineUpdateQueueRef.current.set(itemId, queuedUpdate);
    try {
      await queuedUpdate;
      setTripPlanError(null);
    } catch {
      setTripPlanError(t.itinerary.saveError);
    } finally {
      if (inlineUpdateQueueRef.current.get(itemId) === queuedUpdate) {
        inlineUpdateQueueRef.current.delete(itemId);
      }
    }
  }

  async function runItineraryItemInlineUpdate(
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) {
    if (isApiMode && resolvedApiClient && participantSession) {
      let currentTrip = latestTripRef.current;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const item = currentTrip.itineraryItems.find(
          (candidate) => candidate.id === itemId,
        );
        if (!item) return;
        const nextPatch = buildInlineItineraryItemPatch(item, patch);
        if (!nextPatch) return;
        try {
          const patchedItem = await resolvedApiClient.patchItineraryItem(
            currentTrip.id,
            itemId,
            participantSession.sessionToken,
            {
              clientMutationId: nextClientMutationId("itinerary-inline-patch"),
              expectedVersion: item.version,
              patch: {
                ...nextPatch,
                ...(nextPatch.place !== undefined
                  ? {
                      address: nextPatch.place,
                      coordinates: null,
                      mapLink: buildMapLink(nextPatch.place),
                    }
                  : {}),
              },
            },
          );
          const nextTrip = {
            ...latestTripRef.current,
            itineraryItems: latestTripRef.current.itineraryItems.map(
              (candidate) =>
                candidate.id === itemId ? patchedItem : candidate,
            ),
          };
          latestTripRef.current = nextTrip;
          setTripState((current) => ({ ...current, trip: nextTrip }));
          setSelectedItemId(itemId);
          return;
        } catch (error) {
          if (
            !(error instanceof TripApiError) ||
            error.code !== "version_conflict" ||
            attempt > 0
          )
            throw error;
          const cockpit = await resolvedApiClient.loadTrip(
            currentTrip.id,
            participantSession.sessionToken,
          );
          replaceCockpitFromApi(cockpit);
          latestTripRef.current = cockpit.trip;
          currentTrip = cockpit.trip;
        }
      }
      return;
    }

    commitTrip((current) => {
      const item = current.itineraryItems.find(
        (candidate) => candidate.id === itemId,
      );
      if (!item) return current;
      const nextPatch = buildInlineItineraryItemPatch(item, patch);
      if (!nextPatch) return current;
      const updatedItem = {
        ...item,
        ...nextPatch,
        ...(nextPatch.place !== undefined
          ? {
              address: nextPatch.place,
              coordinates: undefined,
              mapLink: buildMapLink(nextPatch.place),
            }
          : {}),
        updatedAt: localMutationTimestamp,
        version: item.version + 1,
      };
      return {
        ...current,
        itineraryItems: current.itineraryItems.map((candidate) =>
          candidate.id === itemId ? updatedItem : candidate,
        ),
      };
    }, itemId);
  }

  async function resolveMissingMapCoordinates(itemsToResolve: ItineraryItem[]): Promise<MapCoordinateResolutionResult> {
    const result: MapCoordinateResolutionResult = {
      attempted: 0,
      failed: 0,
      resolved: 0,
      skipped: 0,
    };
    if (!canEdit || !effectivePlaceResolver) return result;
    for (const item of itemsToResolve) {
      if (item.coordinates) continue;
      result.attempted += 1;
      const placeHint = mapResolutionPlaceHint(item);
      if (!placeHint) {
        result.skipped += 1;
        continue;
      }
      try {
        const response = await effectivePlaceResolver({
          clientMutationId: nextClientMutationId("map-place-resolve"),
          activity: mapResolutionActivity(item),
          placeHint,
          destinationLabel: trip.destinationLabel,
          countries: Array.from(
            new Set(
              [trip.originCountryCode, ...(trip.countries ?? [])].filter(
                (country): country is string => Boolean(country),
              ),
            ),
          ),
          day: item.day,
        });
        if (response.status !== "resolved") {
          result.skipped += 1;
          continue;
        }
        const candidate = response.candidates[0];
        if (!candidate) {
          result.skipped += 1;
          continue;
        }
        await updateItineraryItemInline(item.id, {
          address: candidate.address,
          coordinates: candidate.coordinates,
          mapLink: candidate.mapLink,
        });
        result.resolved += 1;
      } catch {
        result.failed += 1;
      }
    }
    return result;
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

  async function deleteStop(itemId: string) {
    if (!canEdit) return;
    const item = trip.itineraryItems.find(
      (candidate) => candidate.id === itemId,
    );
    if (!item) return;
    const remainingItems = trip.itineraryItems.filter(
      (item) => item.id !== itemId,
    );
    const nextSelectedItemId =
      selectedItemId === itemId
        ? (remainingItems[0]?.id ?? "")
        : selectedItemId;
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteItineraryItem(
        trip.id,
        itemId,
        participantSession.sessionToken,
      );
      setTripState((current) => ({
        ...current,
        trip: deleteItineraryItemFromTrip(current.trip, itemId),
      }));
      setSelectedItemId(nextSelectedItemId);
      if (!nextSelectedItemId) setContextRailVisibility(false);
      setDialogState((current) =>
        current?.mode === "edit" && current.item.id === itemId ? null : current,
      );
      return;
    }
    commitTrip(
      (current) => deleteItineraryItemFromTrip(current, itemId),
      nextSelectedItemId,
    );
    if (!nextSelectedItemId) setContextRailVisibility(false);
    setDialogState((current) =>
      current?.mode === "edit" && current.item.id === itemId ? null : current,
    );
  }

  async function saveDailyBriefingOverrides(
    date: string,
    version: number,
    overrides: DailyBriefingOverrides,
  ) {
    if (isApiMode && resolvedApiClient && participantSession) {
      const patched = await resolvedApiClient.patchDailyBriefing(
        trip.id,
        date,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("daily-briefing"),
          expectedVersion: version,
          ...overrides,
        },
      );
      setDailyBriefings((current) =>
        current.map((briefing) =>
          briefing.date === date ? patched : briefing,
        ),
      );
      return;
    }

    setDailyBriefings((current) =>
      (current.length ? current : buildFallbackBriefings(trip)).map((briefing) =>
        briefing.date === date
          ? {
              ...briefing,
              manualOverrides: { ...briefing.manualOverrides, ...overrides },
              version: briefing.version + 1,
            }
          : briefing,
      ),
    );
  }

  function commitTrip(
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) {
    setTripState((current) => {
      const nextTrip = normalizeTripPlanAliases(updater(current.trip));
      persistTripDraft(nextTrip, normalizeTripPlanAliases);
      return {
        trip: nextTrip,
        past: [...current.past, current.trip].slice(-20),
        future: [],
      };
    });
    if (nextSelectedItemId) setSelectedItemId(nextSelectedItemId);
  }

  function undo() {
    setTripState((current) => {
      const previous = current.past.at(-1);
      /* v8 ignore next */
      if (!previous) return current;
      return {
        trip: previous,
        past: current.past.slice(0, -1),
        future: [current.trip, ...current.future].slice(0, 20),
      };
    });
  }

  function redo() {
    setTripState((current) => {
      const next = current.future[0];
      /* v8 ignore next */
      if (!next) return current;
      return {
        trip: next,
        past: [...current.past, current.trip].slice(-20),
        future: current.future.slice(1),
      };
    });
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
        window.history.replaceState(null, "", postAuthHref);
        const postAuthPath = new URL(postAuthHref, window.location.origin)
          .pathname;
        setNavigatedView(
          resolveViewFromPath(postAuthPath, session.tripId, initialView),
        );
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
    const normalizedTrip = normalizeTripPlanAliases(nextTrip);
    if (!isApiMode) persistTripDraft(normalizedTrip, normalizeTripPlanAliases);
    setTripState({ trip: normalizedTrip, past: [], future: [] });
  }

  function replaceCockpitFromApi(cockpit: TripCockpit) {
    setTripState({
      trip: normalizeTripPlanAliases(cockpit.trip),
      past: [],
      future: [],
    });
    setSuggestions(cockpit.suggestions);
    setTasks(cockpit.tasks);
    setStopNotes(cockpit.stopNotes);
    setBackendExpenseSummary(null);
    setIsCockpitLoaded(true);
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
      commitTrip((current) => ({
        ...current,
        members: current.members.map((candidate) =>
          candidate.id === memberId ? member : candidate,
        ),
      }));
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
        { role },
      );
      commitTrip((current) => ({
        ...current,
        members: current.members.map((candidate) =>
          candidate.id === memberId ? member : candidate,
        ),
      }));
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
        { accessStatus },
      );
      commitTrip((current) => ({
        ...current,
        members: current.members.map((candidate) =>
          candidate.id === memberId ? member : candidate,
        ),
      }));
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
        { participantPassword: password },
      );
      commitTrip((current) => ({
        ...current,
        members: current.members.map((candidate) =>
          candidate.id === memberId ? member : candidate,
        ),
      }));
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
        {
          displayName: input.displayName,
          role: input.role,
          color: nextTripMemberColor(trip.members.length),
        },
      );
      commitTrip((current) => ({
        ...current,
        members: [...current.members, member],
      }));
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

  async function suggestSelectedStop() {
    /* v8 ignore next */
    if (!canCreateSuggestion || !selectedItem) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const suggestion = await resolvedApiClient.createSuggestion(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("suggestion-create"),
          type: "edit",
          targetItemId: selectedItem.id,
          planVariantId: selectedItem.planVariantId,
          proposedPatch: { activity: selectedItem.activity },
          sourceVersion: selectedItem.version,
        },
      );
      setSuggestions((current) => [...current, suggestion]);
      return;
    }
    setSuggestions((current) => [
      ...current,
      {
        id: nextLocalSuggestionId(current),
        tripId: trip.id,
        proposerId: currentMember.id,
        type: "edit",
        targetItemId: selectedItem.id,
        planVariantId: selectedItem.planVariantId,
        proposedPatch: { activity: selectedItem.activity },
        sourceVersion: selectedItem.version,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function createTask(input: {
    title: string;
    visibility: TripTask["visibility"];
    assigneeId?: string | null;
    relatedItemId?: string | null;
  }) {
    const title = input.title.trim();
    /* v8 ignore next */
    if (!title) return;
    const taskDraft = buildTaskCreateDraft(input, {
      title,
      tripPlanId: tripPlanIdForRecord(
        trip,
        input.relatedItemId ?? null,
        selectedTripPlanId,
      ),
      currentMemberId: currentMember.id,
    });
    if (isApiMode && resolvedApiClient && participantSession) {
      const task = await resolvedApiClient.createTask(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("task-create"),
          title: taskDraft.title,
          visibility: taskDraft.visibility,
          kind: taskDraft.kind,
          tripPlanId: taskDraft.tripPlanId,
          assigneeId: taskDraft.assigneeId,
          relatedItemId: taskDraft.relatedItemId,
        },
      );
      setTasks((current) => [...current, task]);
      return;
    }
    setTasks((current) => [
      ...current,
      createLocalTask(current, taskDraft, { nextTaskId: nextLocalTaskId }),
    ]);
  }

  async function createItineraryTask(itemId: string) {
    if (!canEdit) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    await createTask({
      title: `Plan: ${item.activity}`,
      visibility: "shared",
      assigneeId: null,
      relatedItemId: item.id,
    });
    setContextRailPreferredTab("booking");
    setSelectedItemId(item.id);
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
        {
          clientMutationId: nextClientMutationId("trip-settings"),
          expectedVersion: trip.version ?? 0,
          name: values.name,
          destinationLabel: values.destinationLabel,
          countries: nextCountries,
          startDate: values.startDate,
          endDate: values.endDate,
          partySize: values.partySize,
          defaultTimezone: values.defaultTimezone,
        },
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
            {
              clientMutationId: nextClientMutationId("itinerary-day-shift"),
              expectedVersion: item.version,
              patch: { day: item.day },
            },
          ),
        ),
      );
      const patchedItemsById = new Map(
        patchedItems.map((item) => [item.id, item]),
      );
      setTripState((current) => ({
        ...current,
        trip: mergePatchedTripSettings(
          current.trip,
          patchedTrip,
          patchedItemsById,
        ),
      }));
      return;
    }

    commitTrip((current) =>
      applyTripSettingsToTrip(current, { ...values, countries: nextCountries }),
    );
  }

  async function createBookingDoc(input: BookingDocInput): Promise<BookingDoc | null> {
    if (!canEditBookings) return null;
    const title = input.title.trim();
    if (!title) return null;
    if (isApiMode && resolvedApiClient && participantSession) {
      const clientMutationId = nextClientMutationId("booking-doc-create");
      try {
        const bookingDoc = await resolvedApiClient.createBookingDoc(
          trip.id,
          participantSession.sessionToken,
          {
            clientMutationId,
            ...serializeBookingDocInputForApi({
              ...input,
              title,
              tripPlanId:
                input.tripPlanId ??
                tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
            }),
          },
        );
        const nextTrip = {
          ...latestTripRef.current,
          bookingDocs: [
            ...(latestTripRef.current.bookingDocs ?? []),
            bookingDoc,
          ],
        };
        latestTripRef.current = nextTrip;
        setTripState((current) => ({ ...current, trip: nextTrip }));
        return bookingDoc;
      } catch (error) {
        if (
          !(error instanceof TripApiError) ||
          error.code !== "version_conflict"
        )
          throw error;
        const cockpit = await resolvedApiClient.loadTrip(
          trip.id,
          participantSession.sessionToken,
        );
        replaceCockpitFromApi(cockpit);
        latestTripRef.current = cockpit.trip;
      }
      return null;
    }
    const bookingDoc = createLocalBookingDoc(trip, input, {
      title,
      tripPlanId:
        input.tripPlanId ??
        tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
      createdBy: currentMember.id,
      updatedAt: localMutationTimestamp,
      nextBookingDocId: nextLocalBookingDocId,
    });
    commitTrip((current) => ({
      ...current,
      bookingDocs: [...(current.bookingDocs ?? []), bookingDoc],
    }));
    return bookingDoc;
  }

  async function createItineraryBookingDraft(
    itemId: string,
    template: ItineraryBookingTemplate = "recommended",
  ) {
    if (!canEditBookings) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const draftDetails = bookingDraftDetailsForItineraryItem(item);
    const timeWindow = bookingDraftTimeWindowForItineraryItem(item);
    const bookingType =
      template === "recommended"
        ? bookingTypeForItineraryItem(item)
        : bookingTypeForBookingTemplate(template);
    const bookingDocInput: BookingDocInput = {
      type: bookingType,
      title: bookingDraftTitleForItineraryItem(item, bookingType),
      status: "draft",
      visibility: "shared",
      ownerMemberId: currentMember.id,
      providerName: draftDetails.providerName,
      confirmationCode: draftDetails.confirmationCode,
      startsAt: timeWindow.startsAt,
      endsAt: timeWindow.endsAt,
      timezone: trip.defaultTimezone ?? null,
      priceAmount: null,
      currency: null,
      travelerIds: trip.members.map((member) => member.id),
      externalLinks: [],
      relatedItineraryItemIds: [item.id],
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: draftDetails.notes,
    };
    const matchingDraft = findDuplicateBookingDoc(
      latestTripRef.current.bookingDocs ?? [],
      bookingDocInput,
    );
    if (matchingDraft) {
      setContextRailPreferredTab("booking");
      setSelectedItemId(item.id);
      return matchingDraft.title;
    }
    const bookingDoc = await createBookingDoc({
      ...bookingDocInput,
    });
    setContextRailPreferredTab("booking");
    setSelectedItemId(item.id);
    return bookingDoc?.title;
  }

  async function saveItineraryBookingTicket(input: ItineraryBookingTicketInput) {
    if (!canEditBookings) return;
    const currentTrip = latestTripRef.current;
    const item = currentTrip.itineraryItems.find(
      (candidate) => candidate.id === input.itemId,
    );
    if (!item) return;
    const relatedItineraryItemIds = uniqueStringIds([
      ...input.relatedItineraryItemIds,
      input.itemId,
    ]);
    const explicitBookingDoc = input.bookingDocId
      ? currentTrip.bookingDocs?.find(
          (candidate) => candidate.id === input.bookingDocId,
        )
      : null;
    const bookingDocInput: BookingDocInput = {
      tripPlanId: explicitBookingDoc?.tripPlanId,
      type: explicitBookingDoc?.type ?? input.type,
      title: input.title,
      status: explicitBookingDoc?.status ?? input.status,
      visibility: explicitBookingDoc?.visibility ?? input.visibility,
      ownerMemberId: explicitBookingDoc?.ownerMemberId ?? currentMember.id,
      providerName: input.providerName,
      confirmationCode: input.confirmationCode,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: explicitBookingDoc?.timezone ?? trip.defaultTimezone ?? null,
      priceAmount: explicitBookingDoc?.priceAmount ?? null,
      currency: explicitBookingDoc?.currency ?? null,
      travelerIds:
        explicitBookingDoc?.travelerIds.length || input.travelerIds.length
          ? explicitBookingDoc?.travelerIds.length
            ? explicitBookingDoc.travelerIds
            : input.travelerIds
          : trip.members.map((member) => member.id),
      externalLinks: explicitBookingDoc?.externalLinks ?? [],
      relatedItineraryItemIds,
      relatedTaskIds: explicitBookingDoc?.relatedTaskIds ?? [],
      relatedExpenseIds: explicitBookingDoc?.relatedExpenseIds ?? [],
      noteIds: explicitBookingDoc?.noteIds ?? [],
      notes: input.notes,
    };
    const existingBookingDoc =
      explicitBookingDoc ??
      findDuplicateBookingDoc(currentTrip.bookingDocs ?? [], bookingDocInput);

    if (existingBookingDoc) {
      await updateBookingDoc(existingBookingDoc.id, bookingDocInput);
    } else {
      await createBookingDoc(bookingDocInput);
    }

    for (const relatedItemId of relatedItineraryItemIds) {
      const relatedItem = latestTripRef.current.itineraryItems.find(
        (candidate) => candidate.id === relatedItemId,
      );
      if (!relatedItem) continue;
      const nextDetails = syncItineraryDetailsWithBookingTicket(
        relatedItem,
        input,
      );
      await updateItineraryItemInline(relatedItem.id, { details: nextDetails });
    }

    setContextRailPreferredTab("booking");
    setSelectedItemId(item.id);
    return input.title;
  }

  async function unlinkBookingFromItineraryItem(
    bookingDocId: string,
    itemId: string,
  ) {
    if (!canEditBookings) return;
    const currentTrip = latestTripRef.current;
    const bookingDoc = currentTrip.bookingDocs?.find(
      (candidate) => candidate.id === bookingDocId,
    );
    if (!bookingDoc || !bookingDoc.relatedItineraryItemIds.includes(itemId))
      return;
    await updateBookingDoc(bookingDoc.id, {
      type: bookingDoc.type,
      title: bookingDoc.title,
      status: bookingDoc.status,
      visibility: bookingDoc.visibility,
      ownerMemberId: bookingDoc.ownerMemberId,
      providerName: bookingDoc.providerName,
      confirmationCode: bookingDoc.confirmationCode,
      startsAt: bookingDoc.startsAt,
      endsAt: bookingDoc.endsAt,
      timezone: bookingDoc.timezone,
      priceAmount: bookingDoc.priceAmount,
      currency: bookingDoc.currency,
      travelerIds: bookingDoc.travelerIds,
      externalLinks: bookingDoc.externalLinks,
      relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds.filter(
        (relatedItemId) => relatedItemId !== itemId,
      ),
      relatedTaskIds: bookingDoc.relatedTaskIds,
      relatedExpenseIds: bookingDoc.relatedExpenseIds,
      noteIds: bookingDoc.noteIds,
      notes: bookingDoc.notes,
    });
    const item = latestTripRef.current.itineraryItems.find(
      (candidate) => candidate.id === itemId,
    );
    if (item) {
      await updateItineraryItemInline(item.id, {
        details: clearItineraryBookingTicketDetails(item),
      });
    }
    setContextRailPreferredTab("booking");
    setSelectedItemId(itemId);
  }

  async function updateBookingDoc(
    bookingDocId: string,
    input: BookingDocInput,
  ) {
    await queueBookingDocUpdate(bookingDocId, () =>
      runBookingDocUpdate(bookingDocId, input),
    );
  }

  async function queueBookingDocUpdate(
    bookingDocId: string,
    update: () => void | Promise<void>,
  ) {
    const previousUpdate =
      bookingDocUpdateQueueRef.current.get(bookingDocId) ?? Promise.resolve();
    const queuedUpdate = previousUpdate
      .catch(() => undefined)
      .then(() => update());
    bookingDocUpdateQueueRef.current.set(bookingDocId, queuedUpdate);
    try {
      await queuedUpdate;
    } finally {
      if (bookingDocUpdateQueueRef.current.get(bookingDocId) === queuedUpdate) {
        bookingDocUpdateQueueRef.current.delete(bookingDocId);
      }
    }
  }

  async function runBookingDocUpdate(
    bookingDocId: string,
    input: BookingDocInput,
  ) {
    if (!canEditBookings) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const currentTrip = latestTripRef.current;
        const bookingDoc = currentTrip.bookingDocs?.find(
          (candidate) => candidate.id === bookingDocId,
        );
        if (!bookingDoc) return;
        try {
          const patchedBookingDoc = await resolvedApiClient.patchBookingDoc(
            currentTrip.id,
            bookingDocId,
            participantSession.sessionToken,
            {
              clientMutationId: nextClientMutationId("booking-doc-patch"),
              expectedVersion: bookingDoc.version,
              patch: serializeBookingDocInputForApi({
                ...input,
                title: input.title.trim(),
              }),
            },
          );
          const nextTrip = {
            ...latestTripRef.current,
            bookingDocs: (latestTripRef.current.bookingDocs ?? []).map(
              (candidate) =>
                candidate.id === bookingDocId ? patchedBookingDoc : candidate,
            ),
          };
          latestTripRef.current = nextTrip;
          setTripState((current) => ({ ...current, trip: nextTrip }));
          return;
        } catch (error) {
          if (
            !(error instanceof TripApiError) ||
            error.code !== "version_conflict" ||
            attempt > 0
          )
            throw error;
          const cockpit = await resolvedApiClient.loadTrip(
            currentTrip.id,
            participantSession.sessionToken,
          );
          replaceCockpitFromApi(cockpit);
          latestTripRef.current = cockpit.trip;
        }
      }
      return;
    }
    commitTrip((current) => ({
      ...current,
      bookingDocs: (current.bookingDocs ?? []).map((bookingDoc) =>
        bookingDoc.id === bookingDocId
          ? {
              ...bookingDoc,
              ...input,
              title: input.title.trim(),
              externalLinks: input.externalLinks.map((link, index) => ({
                ...link,
                id:
                  link.id ||
                  bookingDoc.externalLinks[index]?.id ||
                  `link-local-${index + 1}`,
              })),
              updatedAt: localMutationTimestamp,
              version: bookingDoc.version + 1,
            }
          : bookingDoc,
      ),
    }));
  }

  async function changeBookingDocType(
    bookingDocId: string,
    type: BookingDocType,
  ) {
    const bookingDoc = latestTripRef.current.bookingDocs?.find(
      (candidate) => candidate.id === bookingDocId,
    );
    if (!bookingDoc || bookingDoc.type === type) return;
    await updateBookingDoc(bookingDoc.id, {
      type,
      title: bookingDoc.title,
      status: bookingDoc.status,
      visibility: bookingDoc.visibility,
      ownerMemberId: bookingDoc.ownerMemberId,
      providerName: bookingDoc.providerName,
      confirmationCode: bookingDoc.confirmationCode,
      startsAt: bookingDoc.startsAt,
      endsAt: bookingDoc.endsAt,
      timezone: bookingDoc.timezone,
      priceAmount: bookingDoc.priceAmount,
      currency: bookingDoc.currency,
      travelerIds: bookingDoc.travelerIds,
      externalLinks: bookingDoc.externalLinks,
      relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds,
      relatedTaskIds: bookingDoc.relatedTaskIds,
      relatedExpenseIds: bookingDoc.relatedExpenseIds,
      noteIds: bookingDoc.noteIds,
      notes: bookingDoc.notes,
    });
  }

  async function changeBookingDocQuickFields(
    bookingDocId: string,
    patch: {
      confirmationCode?: string | null;
      providerName?: string | null;
    },
  ) {
    await queueBookingDocUpdate(bookingDocId, async () => {
      const bookingDoc = latestTripRef.current.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc) return;
      const providerName =
        patch.providerName !== undefined
          ? patch.providerName
          : bookingDoc.providerName;
      const confirmationCode =
        patch.confirmationCode !== undefined
          ? patch.confirmationCode
          : bookingDoc.confirmationCode;
      if (
        providerName === bookingDoc.providerName &&
        confirmationCode === bookingDoc.confirmationCode
      )
        return;
      await runBookingDocUpdate(bookingDoc.id, {
        type: bookingDoc.type,
        title: bookingDoc.title,
        status: bookingDoc.status,
        visibility: bookingDoc.visibility,
        ownerMemberId: bookingDoc.ownerMemberId,
        providerName,
        confirmationCode,
        startsAt: bookingDoc.startsAt,
        endsAt: bookingDoc.endsAt,
        timezone: bookingDoc.timezone,
        priceAmount: bookingDoc.priceAmount,
        currency: bookingDoc.currency,
        travelerIds: bookingDoc.travelerIds,
        externalLinks: bookingDoc.externalLinks,
        relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds,
        relatedTaskIds: bookingDoc.relatedTaskIds,
        relatedExpenseIds: bookingDoc.relatedExpenseIds,
        noteIds: bookingDoc.noteIds,
        notes: bookingDoc.notes,
      });
    });
  }

  async function deleteBookingDoc(bookingDocId: string) {
    if (!canEditBookings) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteBookingDoc(
        trip.id,
        bookingDocId,
        participantSession.sessionToken,
      );
      const nextTrip = {
        ...latestTripRef.current,
        bookingDocs: (latestTripRef.current.bookingDocs ?? []).filter(
          (bookingDoc) => bookingDoc.id !== bookingDocId,
        ),
      };
      latestTripRef.current = nextTrip;
      setTripState((current) => ({ ...current, trip: nextTrip }));
      return;
    }
    commitTrip((current) => ({
      ...current,
      bookingDocs: (current.bookingDocs ?? []).filter(
        (bookingDoc) => bookingDoc.id !== bookingDocId,
      ),
    }));
  }

  async function createPhotoAlbum(input: TripPhotoAlbumInput) {
    if (!canEditPhotoAlbums) return;
    const title = input.title.trim();
    const url = input.url.trim();
    if (!title || !url) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const photoAlbum = await resolvedApiClient.createPhotoAlbum(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("photo-album-create"),
          ...serializePhotoAlbumInputForApi({ ...input, title, url }),
        },
      );
      const nextTrip = {
        ...latestTripRef.current,
        photoAlbumLinks: [
          ...(latestTripRef.current.photoAlbumLinks ?? []),
          photoAlbum,
        ],
      };
      latestTripRef.current = nextTrip;
      setTripState((current) => ({ ...current, trip: nextTrip }));
      return;
    }
    const photoAlbum = createLocalPhotoAlbum(trip, input, {
      title,
      url,
      createdBy: currentMember.id,
      updatedAt: localMutationTimestamp,
      nextPhotoAlbumId: nextLocalPhotoAlbumId,
    });
    commitTrip((current) => ({
      ...current,
      photoAlbumLinks: [...(current.photoAlbumLinks ?? []), photoAlbum],
    }));
  }

  async function updatePhotoAlbum(
    albumId: string,
    input: TripPhotoAlbumInput,
  ) {
    if (!canEditPhotoAlbums) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const currentTrip = latestTripRef.current;
      const photoAlbum = currentTrip.photoAlbumLinks?.find(
        (candidate) => candidate.id === albumId,
      );
      if (!photoAlbum) return;
      try {
        const patchedPhotoAlbum = await resolvedApiClient.patchPhotoAlbum(
          trip.id,
          albumId,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("photo-album-patch"),
            expectedVersion: photoAlbum.version,
            patch: serializePhotoAlbumInputForApi(input),
          },
        );
        const nextTrip = {
          ...latestTripRef.current,
          photoAlbumLinks: (latestTripRef.current.photoAlbumLinks ?? []).map(
            (candidate) =>
              candidate.id === albumId ? patchedPhotoAlbum : candidate,
          ),
        };
        latestTripRef.current = nextTrip;
        setTripState((current) => ({ ...current, trip: nextTrip }));
      } catch (error) {
        if (
          error instanceof TripApiError &&
          error.code === "version_conflict"
        ) {
          const latest = await resolvedApiClient.loadTrip(
            trip.id,
            participantSession.sessionToken,
          );
          latestTripRef.current = latest.trip;
          setTripState({ trip: latest.trip, past: [], future: [] });
          return;
        }
        throw error;
      }
      return;
    }
    commitTrip((current) => ({
      ...current,
      photoAlbumLinks: (current.photoAlbumLinks ?? []).map((album) =>
        album.id === albumId
          ? updateLocalPhotoAlbum(album, input, {
              title: input.title.trim(),
              url: input.url.trim(),
              updatedAt: localMutationTimestamp,
            })
          : album,
      ),
    }));
  }

  async function deletePhotoAlbum(albumId: string) {
    if (!canEditPhotoAlbums) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deletePhotoAlbum(
        trip.id,
        albumId,
        participantSession.sessionToken,
      );
      const nextTrip = {
        ...latestTripRef.current,
        photoAlbumLinks: (latestTripRef.current.photoAlbumLinks ?? []).filter(
          (album) => album.id !== albumId,
        ),
      };
      latestTripRef.current = nextTrip;
      setTripState((current) => ({ ...current, trip: nextTrip }));
      return;
    }
    commitTrip((current) => ({
      ...current,
      photoAlbumLinks: (current.photoAlbumLinks ?? []).filter(
        (album) => album.id !== albumId,
      ),
    }));
  }

  async function toggleTaskStatus(taskId: string) {
    if (isApiMode && resolvedApiClient && participantSession) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      /* v8 ignore next */
      if (!task) return;
      const nextTask = await resolvedApiClient.patchTask(
        trip.id,
        taskId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("task-patch"),
          /* v8 ignore next */
          expectedVersion: task.version ?? 1,
          /* v8 ignore next */
          patch: { status: toggledTaskStatus(task) },
        },
      );
      /* v8 ignore next */
      setTasks((current) =>
        current.map((candidate) =>
          candidate.id === taskId ? nextTask : candidate,
        ),
      );
      return;
    }
    setTasks((current) =>
      toggleLocalTaskStatus(current, taskId),
    );
  }

  async function createStopNote(input: { itemId: string; body: string }) {
    const body = input.body.trim();
    /* v8 ignore next */
    if (!body || !canCreateStopNote) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const note = await resolvedApiClient.createStopNote(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("stop-note-create"),
          itineraryItemId: input.itemId,
          tripPlanId: tripPlanIdForRecord(
            trip,
            input.itemId,
            selectedTripPlanId,
          ),
          body,
        },
      );
      setStopNotes((current) => [...current, note]);
      return;
    }
    setStopNotes((current) => [
      ...current,
      createLocalStopNote(
        trip,
        current,
        {
          itemId: input.itemId,
          tripPlanId: tripPlanIdForRecord(
            trip,
            input.itemId,
            selectedTripPlanId,
          ),
          body,
        },
        {
          authorId: currentMember.id,
          createdAt: new Date().toISOString(),
          nextStopNoteId: nextLocalStopNoteId,
        },
      ),
    ]);
  }

  async function createItineraryNote(itemId: string, body: string) {
    if (!canCreateStopNote) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    await createStopNote({
      itemId: item.id,
      body,
    });
    setContextRailPreferredTab("notes");
    setSelectedItemId(item.id);
  }

  async function updateStopNote(input: { noteId: string; body: string }) {
    const body = input.body.trim();
    if (!body) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const existing = stopNotes.find((note) => note.id === input.noteId);
      if (!existing) return;
      const note = await resolvedApiClient.patchStopNote(
        trip.id,
        input.noteId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("stop-note-patch"),
          expectedVersion: existing.version ?? 1,
          body,
        },
      );
      setStopNotes((current) =>
        current.map((candidate) =>
          candidate.id === input.noteId ? note : candidate,
        ),
      );
      return;
    }
    setStopNotes((current) =>
      updateLocalStopNote(current, input.noteId, body, {
        currentMemberId: currentMember.id,
        canEdit,
      }),
    );
  }

  async function deleteStopNote(noteId: string) {
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteStopNote(
        trip.id,
        noteId,
        participantSession.sessionToken,
      );
      setStopNotes((current) => current.filter((note) => note.id !== noteId));
      return;
    }
    setStopNotes((current) =>
      deleteLocalStopNote(current, noteId, {
        currentMemberId: currentMember.id,
        canEdit,
      }),
    );
  }

  async function createExpense(input: {
    itemId: string | null;
    title: string;
    amount: number;
    tripPlanId?: string | null;
    paidBy: string;
    category: Expense["category"];
    currency?: string;
    exchangeRateToSettlementCurrency?: number;
    notes?: string;
    receiptUrl?: string | null;
    lineItems?: ExpenseLineItem[];
    comments?: ExpenseComment[];
    repeatCount?: number;
    splits?: Record<string, number>;
  }) {
    if (!canEditExpenses) return;
    const expenseDrafts = buildExpenseCreateDrafts(
      input,
      trip.members.map((member) => member.id),
    );

    if (isApiMode && resolvedApiClient && participantSession) {
      const createdExpenses: Expense[] = [];
      for (const expenseDraft of expenseDrafts) {
        const expense = await resolvedApiClient.createExpense(
          trip.id,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("expense-create"),
            title: expenseDraft.title,
            amountMinor: Math.round(expenseDraft.amount * 100),
            currency: expenseDraft.currency ?? "HKD",
            exchangeRateToSettlementCurrency:
              expenseDraft.exchangeRateToSettlementCurrency ?? 1,
            notes: expenseDraft.notes ?? "",
            receiptUrl: expenseDraft.receiptUrl ?? null,
            lineItems: expenseDraft.lineItems,
            comments: expenseDraft.comments ?? [],
            tripPlanId: tripPlanIdForRecord(
              trip,
              expenseDraft.itemId,
              expenseDraft.tripPlanId ?? selectedTripPlanId,
            ),
            paidBy: expenseDraft.paidBy,
            category: expenseDraft.category,
            splits: expenseSplitsToMinor(expenseDraft.splits),
            itineraryItemId: expenseDraft.itemId,
          },
        );
        createdExpenses.push(expense);
      }
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          expenses: [...current.trip.expenses, ...createdExpenses],
        },
      }));
      setBackendExpenseSummary(
        {
          tripPlanId: selectedTripPlanId,
          summary: await resolvedApiClient.getExpenseSummary(
            trip.id,
            participantSession.sessionToken,
            selectedTripPlanId,
          ),
        },
      );
      return;
    }

    commitTrip((current) => {
      return appendLocalExpensesToTrip(current, expenseDrafts, {
        selectedTripPlanId,
        nextExpenseId: nextLocalExpenseId,
        resolveTripPlanId: tripPlanIdForRecord,
      });
    });
  }

  async function deleteExpense(expenseId: string) {
    if (!canEditExpenses) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteExpense(
        trip.id,
        expenseId,
        participantSession.sessionToken,
      );
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          expenses: current.trip.expenses.filter(
            (expense) => expense.id !== expenseId,
          ),
        },
      }));
      setBackendExpenseSummary(
        {
          tripPlanId: selectedTripPlanId,
          summary: await resolvedApiClient.getExpenseSummary(
            trip.id,
            participantSession.sessionToken,
            selectedTripPlanId,
          ),
        },
      );
      return;
    }
    commitTrip((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== expenseId),
    }));
  }

  async function updateExpense(input: {
    expenseId: string;
    title: string;
    amount: number;
    paidBy: string;
    category: Expense["category"];
    currency?: string;
    exchangeRateToSettlementCurrency?: number;
    notes?: string;
    receiptUrl?: string | null;
    lineItems?: ExpenseLineItem[];
    comments?: ExpenseComment[];
    itemId?: string | null;
    tripPlanId?: string | null;
    splits?: Record<string, number>;
  }) {
    if (!canEditExpenses) return;
    const existing = trip.expenses.find(
      (expense) => expense.id === input.expenseId,
    );
    if (!existing) return;
    const expenseDraft = buildExpenseUpdateDraft(trip, existing, input, {
      selectedTripPlanId,
      resolveTripPlanId: tripPlanIdForRecord,
    });
    if (isApiMode && resolvedApiClient && participantSession) {
      const expense = await resolvedApiClient.patchExpense(
        trip.id,
        input.expenseId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("expense-patch"),
          expectedVersion: existing.version ?? 1,
          title: expenseDraft.title,
          amountMinor: expenseDraft.amountMinor,
          currency: expenseDraft.currency,
          exchangeRateToSettlementCurrency:
            expenseDraft.exchangeRateToSettlementCurrency,
          notes: expenseDraft.notes,
          receiptUrl: expenseDraft.receiptUrl,
          lineItems: expenseDraft.lineItems,
          comments: expenseDraft.comments,
          tripPlanId: expenseDraft.tripPlanId,
          paidBy: expenseDraft.paidBy,
          category: expenseDraft.category,
          splits: expenseSplitsToMinor(expenseDraft.splits),
          itineraryItemId: expenseDraft.itineraryItemId,
        },
      );
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          expenses: current.trip.expenses.map((candidate) =>
            candidate.id === input.expenseId ? expense : candidate,
          ),
        },
      }));
      setBackendExpenseSummary(
        {
          tripPlanId: selectedTripPlanId,
          summary: await resolvedApiClient.getExpenseSummary(
            trip.id,
            participantSession.sessionToken,
            selectedTripPlanId,
          ),
        },
      );
      return;
    }
    commitTrip((current) => updateLocalExpenseInTrip(current, expenseDraft));
  }

  async function duplicateExpenseAsEstimate(expense: Expense) {
    if (!canEditBookings) return;
    await createBookingDoc(
      bookingDocInputForExpenseEstimate(expense, {
        currentMemberId: currentMember.id,
        defaultTimezone: trip.defaultTimezone,
        members: trip.members,
        itineraryItems: trip.itineraryItems,
        selectedTripPlanId,
        mainTripPlanId: trip.mainTripPlanId,
        activePlanVariantId: trip.activePlanVariantId,
      }),
    );
  }

  async function recordPaybackReminder(suggestion: SettlementSuggestion) {
    const reminderRequest = expenseReminderRequestForSuggestion(suggestion);
    if (isApiMode && resolvedApiClient && participantSession) {
      setBackendExpenseSummary(
        {
          tripPlanId: selectedTripPlanId,
          summary: await resolvedApiClient.recordExpenseReminder(
            trip.id,
            participantSession.sessionToken,
            {
              clientMutationId: nextClientMutationId("expense-reminder"),
              ...reminderRequest,
            },
            selectedTripPlanId,
          ),
        },
      );
      return;
    }
    commitTrip((current) =>
      recordLocalExpenseReminderInTrip(current, suggestion, {
        tripPlanId: selectedTripPlanId,
        remindedAt: new Date().toISOString(),
      }),
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
              {
                fileName,
                contentType,
                mode: "auto",
                content,
              },
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
            {
              clientMutationId: nextClientMutationId("itinerary-import-create"),
              planVariantId: item.planVariantId,
              pathGroupId: item.pathGroupId,
              pathId: item.pathId,
              pathName: item.pathName,
              pathRole: item.pathRole,
              parentItemId: resolveCreatedImportId(item.parentItemId, [
                createdItemIdsByImportId,
                createdItemIdsByPreviewId,
              ]),
              itemKind: item.itemKind,
              timeMode: item.timeMode,
              isPlanBlock: item.isPlanBlock,
              status: item.status,
              priority: item.priority,
              day: item.day,
              startTime: item.startTime,
              endTime: item.endTime,
              endOffsetDays: item.endOffsetDays,
              activity: item.activity,
              activityType: item.activityType,
              activitySubtype: item.activitySubtype ?? null,
              place: item.place,
              mapLink: item.mapLink,
              address: item.address,
              coordinates: item.coordinates,
              durationMinutes: item.durationMinutes,
              transportation: item.transportation,
              details: item.details,
              note: item.note,
            },
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
        setTripState((current) => {
          const nextTrip = {
            ...current.trip,
            itineraryPaths: previewTrip.itineraryPaths,
            itineraryItems: [
              ...current.trip.itineraryItems.filter(
                (item) => !deletedIds.has(item.id),
              ),
              ...createdItems,
            ],
            bookingDocs: upsertById(
              current.trip.bookingDocs ?? [],
              createdPlanRecords.bookingDocs,
            ),
            expenses: upsertById(current.trip.expenses, createdPlanRecords.expenses),
          };
          latestTripRef.current = nextTrip;
          return { ...current, trip: nextTrip };
        });
        setTasks((current) => upsertById(current, createdPlanRecords.tasks));
        setStopNotes((current) =>
          upsertById(current, createdPlanRecords.stopNotes),
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
      setTasks((current) => upsertById(current, importedPlanRecords.tasks));
      setStopNotes((current) =>
        upsertById(current, importedPlanRecords.stopNotes),
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

  async function reviewSuggestion(
    suggestionId: string,
    decision: "approved" | "rejected",
  ) {
    /* v8 ignore next */
    if (!canReviewSuggestions) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      let suggestion: Suggestion;
      /* v8 ignore else */
      if (decision === "approved") {
        suggestion = await resolvedApiClient.approveSuggestion(
          trip.id,
          suggestionId,
          participantSession.sessionToken,
        );
      } else {
        /* v8 ignore next */
        suggestion = await resolvedApiClient.rejectSuggestion(
          trip.id,
          suggestionId,
          participantSession.sessionToken,
        );
      }
      setSuggestions((current) =>
        replaceSuggestionById(current, suggestionId, suggestion),
      );
    } else if (decision === "rejected") {
      setSuggestions((current) =>
        current.map((suggestion) =>
          suggestion.id === suggestionId
            ? { ...suggestion, status: "rejected" }
            : suggestion,
        ),
      );
      return;
    } else {
      const suggestion = suggestions.find(
        (candidate) => candidate.id === suggestionId,
      );
      /* v8 ignore next */
      if (!suggestion) return;
      const result = approveSuggestion(trip.itineraryItems, suggestion);
      /* v8 ignore next */
      if (result.status === "approved") {
        commitTrip((current) => ({ ...current, itineraryItems: result.items }));
      }
      setSuggestions((current) =>
        current.map((candidate) =>
          candidate.id === suggestionId ? result.suggestion : candidate,
        ),
      );
    }
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

  if (accessMode === "account-portal") {
    return (
      <AccountAccessPanel
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
        trip={trip}
        onAccountSessionChange={changeAccountSession}
        onAuthenticated={authenticateParticipant}
        onCockpitLoaded={replaceCockpitFromApi}
        onTripChange={replaceTripFromJoin}
      />
    );
  }

  if (isAccountOnlyAccessMode) {
    return (
      <AccountAccessPanel
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
        onAccountSessionChange={changeAccountSession}
        onAuthenticated={authenticateParticipant}
        onCockpitLoaded={replaceCockpitFromApi}
        onTripChange={replaceTripFromJoin}
      />
    );
  }

  if (requireJoin && !sessionMember) {
    if (routeTripId && !sessionRestored) {
      return <TripAccessLoadingFrame />;
    }
    if (routeTripId && accessMode === "trip-access") {
      return (
        <AccountAccessPanel
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
          onAccountSessionChange={changeAccountSession}
          onAuthenticated={authenticateParticipant}
          onCockpitLoaded={replaceCockpitFromApi}
          onTripChange={replaceTripFromJoin}
        />
      );
    }
    if (routeTripId) {
      return <TripAccessLoadingFrame />;
    }
    return (
      <AccountAccessPanel
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
      onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
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
            onDismiss={() => {
              setToastDismissing(true);
              setTimeout(() => setToastDismissed(true), 220);
            }}
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
                canRedo: tripState.future.length > 0,
                canRestructure: canEdit,
                canUndo: tripState.past.length > 0,
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
                selectedTripPathId:
                  pathSelection.tripPathId ?? mainItineraryPathId,
                dayPathOverrides: pathSelection.dayPathOverrides ?? {},
                showAllPaths: Boolean(pathSelection.showAll),
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
                onToggleContextRail: () =>
                  setContextRailVisibility(!contextRailOpen),
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
                onToggleContextRail: () =>
                  setContextRailVisibility(!contextRailOpen),
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
            currentTripPathId={pathSelection.tripPathId ?? mainItineraryPathId}
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
