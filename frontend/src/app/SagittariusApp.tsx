"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AppShell, resolveViewFromPath } from "@/src/components/AppShell";
import { AccountAccessPanel } from "@/src/components/AccountAccessPanel";
import {
  BookingsDocsPage,
  type BookingDocInput,
} from "@/src/components/BookingsDocsPage";
import { ContextRail } from "@/src/components/ContextRail";
import { OverviewPage } from "@/src/components/OverviewPage";
import { RouteMapView } from "@/src/components/RouteMapView";
import {
  SmartItineraryTable,
  type ItineraryBookingTicketInput,
  type ItineraryBookingTemplate,
  type ItineraryCommitmentSummary,
  type InlineItineraryItemPatch,
} from "@/src/components/SmartItineraryTable";
import { StopDialog, type StopFormValues } from "@/src/components/StopDialog";
import { TimelineView } from "@/src/components/TimelineView";
import { TripExpensesPage } from "@/src/components/TripExpensesPage";
import { TripMembersPage } from "@/src/components/TripMembersPage";
import {
  TripPhotosPage,
  type TripPhotoAlbumInput,
} from "@/src/components/TripPhotosPage";
import {
  TripSettingsPage,
  type TripSettingsFormValues,
} from "@/src/components/TripSettingsPage";
import { Button } from "@/src/components/ui";
import { Icon } from "@/src/components/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { appRoutes, decodeReturnTo } from "@/src/routes/app-routes";
import {
  createTripApiClient,
  TripApiError,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import {
  createAccountApiClient,
  type AccountSession,
} from "@/src/account/api-client";
import {
  canTripRole,
  createTripParticipant,
  findSessionMember,
  nextTripMemberColor,
  resetTripParticipantClaim,
  setTripParticipantPassword,
  setTripParticipantAccessStatus,
  tripParticipantSessionStorageKey,
  updateTripParticipantRole,
} from "@/src/trip/auth";
import {
  buildExpenseSplits,
  buildExpenseSummary,
  expenseSplitsToMinor,
  filterExpenseRemindersForTripPlan,
  upsertExpenseReminder,
} from "@/src/trip/expenses";
import {
  buildItineraryView,
  deriveItineraryPathOptions,
  mainItineraryPathId,
  parseTime,
  resolveItineraryPathItems,
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import {
  applyImportedItemsToItineraryPath,
  applyItemToActivityBranch,
  applyManualActivityPath,
  deriveManualActivityPathOptions,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import {
  buildItineraryExport,
  parseItineraryImportDocument,
  type ItineraryExportItem,
  type ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import { buildFallbackBriefings } from "@/src/trip/weather-briefings";
import {
  tripFixtureStopNotes,
  tripFixtureSuggestions,
  tripFixtureTasks,
} from "@/src/trip/trip-fixtures";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { decodeTripId } from "@/src/trip/ids";
import { safeExternalHref } from "@/src/trip/safe-links";
import { approveSuggestion } from "@/src/trip/suggestions";
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
  PlanVariant,
  PlaceResolutionCandidate,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  SettlementSuggestion,
  StopNote,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
  TripTask,
  TripPhotoAlbumLink,
} from "@/src/trip/types";

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";
const accountSessionStorageKey = "sagittarius-account-session";
const selectedTripPlanQueryParam = "tripPlanId";
const selectedTripPlanSessionStoragePrefix = "sagittarius:selected-trip-plan:";
const workspaceToastClassName =
  "workspace-toast pointer-events-auto fixed left-1/2 top-5 z-[60] flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-(--radius-lg) border border-(--color-route-border) bg-(--color-route-soft) px-4 py-3 shadow-[0_10px_22px_rgb(15_23_42_/_0.1)] max-[767px]:top-3";
const workspaceToastIconClassName = "mt-0.5 shrink-0 text-(--color-route)";
const workspaceToastBodyClassName =
  "min-w-0 flex-1 [&_span]:block [&_span]:text-[12.5px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:text-[13.5px] [&_strong]:font-[850] [&_strong]:text-(--color-route)";
const workspaceToastActionsClassName = "flex shrink-0 items-center gap-2";
const workspaceToastDismissClassName =
  "ml-1 grid size-9 shrink-0 place-items-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-text)";
const appDeleteModalBackdropClassName =
  "modal-backdrop fixed inset-0 z-[80] grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const appDeleteDialogClassName =
  "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]";
const appDeleteDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-[#991b1b]";
const appDeleteDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const appDeleteDialogActionsClassName = "mt-1 flex justify-end gap-2";
const importDialogClassName =
  "import-options-dialog grid w-[min(520px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const importDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-(--color-text)";
const importDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const importDialogFieldsClassName =
  "grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label>span]:text-xs [&_label>span]:font-bold [&_label>span]:text-(--color-text-muted) [&_input]:min-h-9 [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-sm [&_select]:min-h-9 [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-2.5 [&_select]:text-sm";
const importErrorClassName =
  "mx-6 mt-3 rounded-(--radius-sm) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-sm font-bold text-(--color-danger) max-[767px]:mx-3";
const accountClaimMessageClassName = "account-claim-message font-extrabold";
const portalLoadingCardClassName =
  "account-card portal-loading-card grid min-h-[220px] gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-[rgb(255_255_255_/_0.94)] p-4 shadow-[var(--shadow-panel)]";

interface PendingItineraryImport {
  fileName: string;
  items: ItineraryExportItem[];
  records: ItineraryExportRecords;
}

function emptyItineraryExportRecords(): ItineraryExportRecords {
  return { bookingDocs: [], expenses: [], stopNotes: [], tasks: [] };
}
const portalSkeletonBaseClassName =
  "portal-skeleton block overflow-hidden rounded-(--radius-md) bg-[linear-gradient(90deg,var(--color-surface-subtle),rgb(226_232_240_/_0.72),var(--color-surface-subtle))] bg-[length:220%_100%] animate-[portal-skeleton-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none";
const portalSkeletonTitleClassName = `${portalSkeletonBaseClassName} portal-skeleton--title h-7 w-[min(220px,48%)]`;
const portalSkeletonLineClassName = `${portalSkeletonBaseClassName} portal-skeleton--line h-4 w-[min(520px,72%)]`;
const portalSkeletonBlockClassName = `${portalSkeletonBaseClassName} portal-skeleton--block h-[132px] w-full`;
const workspaceShellClassName = "workspace-shell min-w-0 bg-transparent";
const workspaceGridClassName =
  "workspace-grid relative grid h-screen min-h-0 grid-cols-[minmax(0,1fr)] overflow-hidden max-[1199px]:h-auto max-[1199px]:grid-cols-1 max-[1199px]:overflow-visible";
const planningMainClassName =
  "planning-main h-full min-h-0 min-w-0 overflow-y-auto scroll-smooth bg-(--color-page) transition-[padding] duration-200 max-[1199px]:h-auto max-[1199px]:overflow-y-visible";
const planningMainWithRailClassName = "pr-[380px] max-[1199px]:pr-0";

export type PlanningView =
  | "overview"
  | "itinerary"
  | "map"
  | "timeline"
  | "bookings"
  | "photos"
  | "members"
  | "expenses"
  | "settings";
type PortalSection =
  | "dashboard"
  | "trips"
  | "new-trip"
  | "explorer"
  | "todos"
  | "vault"
  | "settings"
  | "sign-out";
type PlaceResolver = (
  request: PlaceResolutionRequest,
) => Promise<PlaceResolutionResponse>;
type StopPlaceResolutionState = {
  state: "idle" | "resolving" | "ambiguous" | "unresolved";
  candidates: PlaceResolutionCandidate[];
};

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

export function resolveJoinPostAuthReturnTo(
  returnTo: string | null,
  tripId: string,
): string | null {
  if (!returnTo || !returnTo.startsWith("/")) return null;
  if (returnTo === appRoutes.trips()) return null;

  if (returnTo.startsWith("/trips/")) {
    const tripSegment = returnTo.slice("/trips/".length).split(/[/?#]/, 1)[0];
    const normalizedTripSegment = decodeTripId(tripSegment);
    if (normalizedTripSegment !== tripId) return null;
  }

  return returnTo;
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
  const itineraryView = useMemo(
    () => buildItineraryView(planItems),
    [planItems],
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
    setPathSelection((current) => ({
      ...current,
      tripPathId: pathId,
      showAll: false,
    }));
  }

  function changeDayPath(day: string, pathId: string) {
    setPathSelection((current) => ({
      ...current,
      showAll: false,
      dayPathOverrides: {
        ...(current.dayPathOverrides ?? {}),
        [day]: pathId === mainItineraryPathId ? undefined : pathId,
      },
    }));
  }

  function clearDayPath(day: string) {
    setPathSelection((current) => ({
      ...current,
      dayPathOverrides: {
        ...(current.dayPathOverrides ?? {}),
        [day]: undefined,
      },
    }));
  }

  function clearAllDayPaths() {
    setPathSelection((current) => ({ ...current, dayPathOverrides: {} }));
  }

  function toggleShowAllPaths(showAll: boolean) {
    setPathSelection((current) => ({ ...current, showAll }));
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
      const persistedTrip = loadPersistedTrip();
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
    participantSession,
    resolvedApiClient,
    selectedTripPlanId,
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

  function mergePublishedTripPlan(
    currentTrip: Trip,
    publishedTrip: Trip,
    fallbackActivePlanVariantId: string,
    createdVariant?: PlanVariant,
  ): Trip {
    const variantsById = new Map(
      currentTrip.planVariants.map((variant) => [variant.id, variant]),
    );
    for (const variant of publishedTrip.planVariants) {
      variantsById.set(variant.id, variant);
    }
    if (createdVariant) variantsById.set(createdVariant.id, createdVariant);
    return normalizeTripPlanAliases({
      ...currentTrip,
      activePlanVariantId:
        publishedTrip.activePlanVariantId || fallbackActivePlanVariantId,
      mainTripPlanId:
        publishedTrip.mainTripPlanId ||
        publishedTrip.activePlanVariantId ||
        fallbackActivePlanVariantId,
      planVariants: Array.from(variantsById.values()),
      tripPlans: publishedTrip.tripPlans ?? Array.from(variantsById.values()),
      version: publishedTrip.version ?? currentTrip.version,
    });
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
      const variant: PlanVariant = {
        id: nextLocalPlanVariantId(current.planVariants),
        tripId: current.id,
        name: trimmedName,
        kind: "draft",
        status: "draft",
        description: "",
        version: 1,
      };
      createdTripPlanId = variant.id;
      return {
        ...current,
        planVariants: [...current.planVariants, variant],
        tripPlans: [...(current.tripPlans ?? current.planVariants), variant],
      };
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
      const patchedBranchItems = await patchApiItineraryBranchItems(
        branchPlacement.changedExistingItems,
        resolvedApiClient,
        trip.id,
        participantSession.sessionToken,
      );
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
      const patchedBranchItems = await patchApiItineraryBranchItems(
        branchPlacement.changedExistingItems,
        resolvedApiClient,
        trip.id,
        participantSession.sessionToken,
      );
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

  function replaceItineraryItem(current: Trip, updatedItem: ItineraryItem): Trip {
    return {
      ...current,
      itineraryItems: current.itineraryItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    };
  }

  function moveTripItem(
    current: Trip,
    draggedItemId: string,
    targetItemId: string,
    planVariantId: string,
  ): Trip | null {
    const draggedItem = current.itineraryItems.find(
      (item) => item.id === draggedItemId,
    );
    const targetItem = current.itineraryItems.find(
      (item) => item.id === targetItemId,
    );

    /* v8 ignore next */
    if (
      !draggedItem ||
      !targetItem ||
      draggedItem.planVariantId !== planVariantId ||
      targetItem.planVariantId !== planVariantId
    )
      return null;
    const nextParentItemId = targetItem.parentItemId ?? null;
    if (
      nextParentItemId === draggedItem.id ||
      (draggedItem.isPlanBlock && nextParentItemId) ||
      hasDescendantItem(current.itineraryItems, draggedItem.id, targetItem.id)
    )
      return null;

    /* v8 ignore next 3 */
    const targetDayItems = current.itineraryItems
      .filter(
        (item) =>
          item.planVariantId === targetItem.planVariantId &&
          item.day === targetItem.day &&
          item.id !== draggedItemId,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime),
      );
    const targetIndex = targetDayItems.findIndex(
      (item) => item.id === targetItemId,
    );

    /* v8 ignore next */
    if (targetIndex < 0) return null;

    const nextDayItems = [
      ...targetDayItems.slice(0, targetIndex),
      {
        ...draggedItem,
        day: targetItem.day,
        parentItemId: nextParentItemId,
        updatedAt: localMutationTimestamp,
        version: draggedItem.version + 1,
      },
      ...targetDayItems.slice(targetIndex),
    ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
    const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

    return {
      ...current,
      itineraryItems: current.itineraryItems.map(
        (item) => nextItemsById.get(item.id) ?? item,
      ),
    };
  }

  function moveTripItemToDay(
    current: Trip,
    draggedItemId: string,
    targetDay: string,
    planVariantId: string,
  ): Trip | null {
    const draggedItem = current.itineraryItems.find(
      (item) => item.id === draggedItemId,
    );
    if (!draggedItem || draggedItem.planVariantId !== planVariantId)
      return null;

    const targetDayItems = current.itineraryItems
      .filter(
        (item) =>
          item.planVariantId === draggedItem.planVariantId &&
          item.day === targetDay &&
          item.id !== draggedItemId,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime),
      );
    const nextDayItems = [
      ...targetDayItems,
      {
        ...draggedItem,
        day: targetDay,
        parentItemId: null,
        updatedAt: localMutationTimestamp,
        version: draggedItem.version + 1,
      },
    ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
    const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

    return {
      ...current,
      itineraryItems: current.itineraryItems.map(
        (item) => nextItemsById.get(item.id) ?? item,
      ),
    };
  }

  function moveTripItemIntoPlanBlock(
    current: Trip,
    draggedItemId: string,
    planBlockItemId: string,
    planVariantId: string,
  ): Trip | null {
    const draggedItem = current.itineraryItems.find(
      (item) => item.id === draggedItemId,
    );
    const planBlock = current.itineraryItems.find(
      (item) => item.id === planBlockItemId,
    );
    if (
      !draggedItem ||
      !planBlock ||
      !planBlock.isPlanBlock ||
      draggedItem.isPlanBlock ||
      draggedItem.id === planBlock.id ||
      draggedItem.planVariantId !== planVariantId ||
      planBlock.planVariantId !== planVariantId ||
      hasDescendantItem(current.itineraryItems, draggedItem.id, planBlock.id)
    )
      return null;

    const targetDayItems = current.itineraryItems
      .filter(
        (item) =>
          item.planVariantId === planBlock.planVariantId &&
          item.day === planBlock.day &&
          item.id !== draggedItemId,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime),
      );
    const blockIndex = targetDayItems.findIndex(
      (item) => item.id === planBlockItemId,
    );
    if (blockIndex < 0) return null;
    const childCount = targetDayItems.filter(
      (item) => item.parentItemId === planBlockItemId,
    ).length;
    const insertIndex = blockIndex + childCount + 1;
    const nextDayItems = [
      ...targetDayItems.slice(0, insertIndex),
      {
        ...draggedItem,
        day: planBlock.day,
        parentItemId: planBlock.id,
        updatedAt: localMutationTimestamp,
        version: draggedItem.version + 1,
      },
      ...targetDayItems.slice(insertIndex),
    ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
    const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

    return {
      ...current,
      itineraryItems: current.itineraryItems.map(
        (item) => nextItemsById.get(item.id) ?? item,
      ),
    };
  }

  function hasDescendantItem(
    items: ItineraryItem[],
    parentItemId: string,
    candidateItemId: string,
  ): boolean {
    let currentItem = items.find((item) => item.id === candidateItemId);
    while (currentItem?.parentItemId) {
      if (currentItem.parentItemId === parentItemId) return true;
      currentItem = items.find((item) => item.id === currentItem?.parentItemId);
    }
    return false;
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
      const patchedBranchItems = await patchApiItineraryBranchItems(
        branchPlacement.changedExistingItems,
        resolvedApiClient,
        trip.id,
        participantSession.sessionToken,
      );
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
    function buildInlinePatch(
      item: ItineraryItem,
    ): InlineItineraryItemPatch | null {
      const nextPatch = normalizeInlineTimePatch(item, patch);
      if (nextPatch.activity !== undefined)
        nextPatch.activity = nextPatch.activity.trim();
      if (nextPatch.place !== undefined)
        nextPatch.place = nextPatch.place.trim();
      if (nextPatch.transportation !== undefined)
        nextPatch.transportation = nextPatch.transportation.trim();
      if (
        nextPatch.durationMinutes !== undefined &&
        nextPatch.durationMinutes !== null
      )
        nextPatch.durationMinutes = Math.max(
          1,
          Math.round(Number(nextPatch.durationMinutes) || 1),
        );
      if (nextPatch.activity !== undefined && nextPatch.activity.length === 0)
        return null;
      if (nextPatch.place !== undefined && nextPatch.place.length === 0)
        return null;
      const changedPatch = Object.fromEntries(
        Object.entries(nextPatch).filter(
          ([key, value]) =>
            item[key as keyof InlineItineraryItemPatch] !== value,
        ),
      ) as InlineItineraryItemPatch;
      return Object.keys(changedPatch).length > 0 ? changedPatch : null;
    }

    if (isApiMode && resolvedApiClient && participantSession) {
      let currentTrip = latestTripRef.current;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const item = currentTrip.itineraryItems.find(
          (candidate) => candidate.id === itemId,
        );
        if (!item) return;
        const nextPatch = buildInlinePatch(item);
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
      const nextPatch = buildInlinePatch(item);
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
        trip: {
          ...current.trip,
          itineraryItems: current.trip.itineraryItems.filter(
            (item) => item.id !== itemId,
          ),
          expenses: current.trip.expenses.filter(
            (expense) => expense.itineraryItemId !== itemId,
          ),
        },
      }));
      setSelectedItemId(nextSelectedItemId);
      if (!nextSelectedItemId) setContextRailVisibility(false);
      setDialogState((current) =>
        current?.mode === "edit" && current.item.id === itemId ? null : current,
      );
      return;
    }
    commitTrip(
      (current) => ({
        ...current,
        itineraryItems: current.itineraryItems.filter(
          (item) => item.id !== itemId,
        ),
        expenses: current.expenses.filter(
          (expense) => expense.itineraryItemId !== itemId,
        ),
      }),
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
      persistTripDraft(nextTrip);
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
    if (!isApiMode) persistTripDraft(normalizedTrip);
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
    const visibility = input.visibility;
    if (isApiMode && resolvedApiClient && participantSession) {
      const task = await resolvedApiClient.createTask(
        trip.id,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("task-create"),
          title,
          visibility,
          kind: "prep",
          tripPlanId: tripPlanIdForRecord(
            trip,
            input.relatedItemId ?? null,
            selectedTripPlanId,
          ),
          /* v8 ignore next */
          assigneeId:
            visibility === "shared"
              ? input.assigneeId || null
              : currentMember.id,
          relatedItemId: input.relatedItemId ?? null,
        },
      );
      setTasks((current) => [...current, task]);
      return;
    }
    setTasks((current) => [
      ...current,
      {
        id: nextLocalTaskId(current),
        title,
        status: "open",
        visibility,
        kind: "prep",
        tripPlanId: tripPlanIdForRecord(
          trip,
          input.relatedItemId ?? null,
          selectedTripPlanId,
        ),
        createdBy: currentMember.id,
        /* v8 ignore next */
        assigneeId:
          visibility === "shared" ? input.assigneeId || null : currentMember.id,
        relatedItemId: input.relatedItemId ?? null,
      },
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
        trip: {
          ...current.trip,
          name: patchedTrip.name,
          destinationLabel: patchedTrip.destinationLabel,
          countries: patchedTrip.countries,
          startDate: patchedTrip.startDate,
          endDate: patchedTrip.endDate,
          partySize: patchedTrip.partySize,
          defaultTimezone: patchedTrip.defaultTimezone,
          activePlanVariantId:
            patchedTrip.activePlanVariantId || current.trip.activePlanVariantId,
          itineraryItems: current.trip.itineraryItems.map(
            (item) => patchedItemsById.get(item.id) ?? item,
          ),
          version: patchedTrip.version,
        },
      }));
      return;
    }

    commitTrip((current) => ({
      ...current,
      name: values.name,
      destinationLabel: values.destinationLabel,
      countries: nextCountries,
      startDate: values.startDate,
      endDate: values.endDate,
      partySize: values.partySize,
      defaultTimezone: values.defaultTimezone,
      itineraryItems: shiftItineraryItemsToStartDate(
        current.itineraryItems,
        current.startDate,
        values.startDate,
      ),
      version: (current.version ?? 0) + 1,
    }));
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
    const bookingDoc: BookingDoc = {
      id: nextLocalBookingDocId(trip.bookingDocs ?? []),
      tripId: trip.id,
      tripPlanId:
        input.tripPlanId ??
        tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
      ...input,
      title,
      externalLinks: input.externalLinks.map((link, index) => ({
        ...link,
        id: link.id || `link-local-${index + 1}`,
      })),
      createdBy: currentMember.id,
      updatedAt: localMutationTimestamp,
      version: 1,
    };
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
    const photoAlbum: TripPhotoAlbumLink = {
      id: nextLocalPhotoAlbumId(trip.photoAlbumLinks ?? []),
      tripId: trip.id,
      ...input,
      title,
      url,
      description: input.description?.trim() || null,
      accessNote: input.accessNote?.trim() || null,
      createdBy: currentMember.id,
      updatedAt: localMutationTimestamp,
      version: 1,
    };
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
          ? {
              ...album,
              ...input,
              title: input.title.trim(),
              url: input.url.trim(),
              description: input.description?.trim() || null,
              accessNote: input.accessNote?.trim() || null,
              updatedAt: localMutationTimestamp,
              version: album.version + 1,
            }
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
          patch: { status: task.status === "done" ? "open" : "done" },
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
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              /* v8 ignore next */
              status: task.status === "done" ? "open" : "done",
            }
          : task,
      ),
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
      {
        id: nextLocalStopNoteId(current),
        tripId: trip.id,
        tripPlanId: tripPlanIdForRecord(trip, input.itemId, selectedTripPlanId),
        itemId: input.itemId,
        authorId: currentMember.id,
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function createItineraryNote(itemId: string) {
    if (!canCreateStopNote) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    await createStopNote({
      itemId: item.id,
      body: `Planning note for ${item.activity}`,
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
      current.map((note) =>
        note.id === input.noteId &&
        (note.authorId === currentMember.id || canEdit)
          ? { ...note, body }
          : note,
      ),
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
      current.filter(
        (note) =>
          note.id !== noteId ||
          (note.authorId !== currentMember.id && !canEdit),
      ),
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
    const repeatCount = normalizeExpenseRepeatCount(input.repeatCount);
    const splits =
      input.splits ??
      buildExpenseSplits({
        amount: input.amount,
        memberIds: trip.members.map((member) => member.id),
        mode: "equal",
      });
    const repeatedInputs = Array.from({ length: repeatCount }, (_, index) => ({
      ...input,
      title:
        repeatCount > 1
          ? `${input.title} (${index + 1}/${repeatCount})`
          : input.title,
      lineItems: repeatExpenseLineItems(input.lineItems, index, repeatCount),
    }));

    if (isApiMode && resolvedApiClient && participantSession) {
      const createdExpenses: Expense[] = [];
      for (const repeatedInput of repeatedInputs) {
        const expense = await resolvedApiClient.createExpense(
          trip.id,
          participantSession.sessionToken,
          {
            clientMutationId: nextClientMutationId("expense-create"),
            title: repeatedInput.title,
            amountMinor: Math.round(repeatedInput.amount * 100),
            currency: repeatedInput.currency ?? "HKD",
            exchangeRateToSettlementCurrency:
              repeatedInput.exchangeRateToSettlementCurrency ?? 1,
            notes: repeatedInput.notes ?? "",
            receiptUrl: repeatedInput.receiptUrl ?? null,
            lineItems: repeatedInput.lineItems,
            comments: repeatedInput.comments ?? [],
            tripPlanId: tripPlanIdForRecord(
              trip,
              repeatedInput.itemId,
              repeatedInput.tripPlanId ?? selectedTripPlanId,
            ),
            paidBy: repeatedInput.paidBy,
            category: repeatedInput.category,
            splits: expenseSplitsToMinor(splits),
            itineraryItemId: repeatedInput.itemId,
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
      const expenses = [...current.expenses];
      for (const repeatedInput of repeatedInputs) {
        expenses.push({
          id: nextLocalExpenseId(expenses),
          tripId: current.id,
          title: repeatedInput.title,
          amount: repeatedInput.amount,
          amountMinor: Math.round(repeatedInput.amount * 100),
          currency: repeatedInput.currency ?? "HKD",
          exchangeRateToSettlementCurrency:
            repeatedInput.exchangeRateToSettlementCurrency ?? 1,
          notes: repeatedInput.notes ?? "",
          receiptUrl: repeatedInput.receiptUrl ?? null,
          lineItems: repeatedInput.lineItems ?? [],
          comments: repeatedInput.comments ?? [],
          tripPlanId: tripPlanIdForRecord(
            current,
            repeatedInput.itemId,
            repeatedInput.tripPlanId ?? selectedTripPlanId,
          ),
          paidBy: repeatedInput.paidBy,
          category: repeatedInput.category,
          splits,
          itineraryItemId: repeatedInput.itemId,
          version: 1,
        });
      }
      return { ...current, expenses };
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
    const amountMinor = Math.round(input.amount * 100);
    const splits =
      input.splits ??
      buildExpenseSplits({
        amount: input.amount,
        memberIds: trip.members.map((member) => member.id),
        mode: "equal",
      });
    const itineraryItemId =
      input.itemId === undefined
        ? (existing.itineraryItemId ?? null)
        : input.itemId;
    const tripPlanId = tripPlanIdForRecord(
      trip,
      itineraryItemId,
      input.tripPlanId ?? existing.tripPlanId ?? selectedTripPlanId,
    );
    if (isApiMode && resolvedApiClient && participantSession) {
      const expense = await resolvedApiClient.patchExpense(
        trip.id,
        input.expenseId,
        participantSession.sessionToken,
        {
          clientMutationId: nextClientMutationId("expense-patch"),
          expectedVersion: existing.version ?? 1,
          title: input.title,
          amountMinor,
          currency: input.currency ?? existing.currency ?? "HKD",
          exchangeRateToSettlementCurrency:
            input.exchangeRateToSettlementCurrency ??
            existing.exchangeRateToSettlementCurrency ??
            1,
          notes: input.notes ?? existing.notes ?? "",
          receiptUrl: input.receiptUrl ?? existing.receiptUrl ?? null,
          lineItems: input.lineItems ?? existing.lineItems ?? [],
          comments: input.comments ?? existing.comments ?? [],
          tripPlanId,
          paidBy: input.paidBy,
          category: input.category,
          splits: expenseSplitsToMinor(splits),
          itineraryItemId,
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
    commitTrip((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === input.expenseId
          ? {
              ...expense,
              title: input.title,
              amount: input.amount,
              amountMinor,
              currency: input.currency ?? expense.currency,
              exchangeRateToSettlementCurrency:
                input.exchangeRateToSettlementCurrency ??
                expense.exchangeRateToSettlementCurrency ??
                1,
              notes: input.notes ?? expense.notes ?? "",
              receiptUrl: input.receiptUrl ?? expense.receiptUrl ?? null,
              lineItems: input.lineItems ?? expense.lineItems ?? [],
              comments: input.comments ?? expense.comments ?? [],
              tripPlanId,
              paidBy: input.paidBy,
              category: input.category,
              splits,
              itineraryItemId,
              version: (expense.version ?? 1) + 1,
            }
          : expense,
      ),
    }));
  }

  async function duplicateExpenseAsEstimate(expense: Expense) {
    if (!canEditBookings) return;
    const sourceTripPlanId =
      expense.tripPlanId ||
      selectedTripPlanId ||
      trip.mainTripPlanId ||
      trip.activePlanVariantId;
    const linkedItem = expense.itineraryItemId
      ? trip.itineraryItems.find((item) => item.id === expense.itineraryItemId)
      : null;
    await createBookingDoc({
      tripPlanId: sourceTripPlanId,
      type: bookingTypeForExpenseEstimate(expense),
      title: `Estimate: ${expense.title}`,
      status: "draft",
      visibility: "shared",
      ownerMemberId: currentMember.id,
      providerName: null,
      confirmationCode: null,
      startsAt: null,
      endsAt: null,
      timezone: trip.defaultTimezone ?? null,
      priceAmount: expense.amount,
      currency: expense.currency ?? "HKD",
      travelerIds: trip.members.map((member) => member.id),
      externalLinks: [],
      relatedItineraryItemIds: linkedItem ? [linkedItem.id] : [],
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: [
        "Plan estimate copied from an Actual Expense. This does not create or move real money.",
        `Source actual expense: ${expense.title}`,
      ].join("\n"),
    });
  }

  async function recordPaybackReminder(suggestion: SettlementSuggestion) {
    const amountMinor = Math.round(suggestion.amount * 100);
    if (isApiMode && resolvedApiClient && participantSession) {
      setBackendExpenseSummary(
        {
          tripPlanId: selectedTripPlanId,
          summary: await resolvedApiClient.recordExpenseReminder(
            trip.id,
            participantSession.sessionToken,
            {
              clientMutationId: nextClientMutationId("expense-reminder"),
              from: suggestion.from,
              to: suggestion.to,
              amountMinor,
            },
            selectedTripPlanId,
          ),
        },
      );
      return;
    }
    commitTrip((current) => ({
      ...current,
      expenseReminders: upsertExpenseReminder(current.expenseReminders ?? [], {
        tripPlanId: selectedTripPlanId,
        from: suggestion.from,
        to: suggestion.to,
        amount: suggestion.amount,
        lastRemindedAt: new Date().toISOString(),
      }),
    }));
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
      setPendingItineraryImport({
        fileName,
        items: document.items,
        records: document.records ?? emptyItineraryExportRecords(),
      });
      setItineraryImportError(null);
    } catch (caught) {
      setItineraryImportError(
        caught instanceof Error ? caught.message : "Import itinerary ไม่สำเร็จ",
      );
    }
  }

  function shouldUseApiItineraryImport({
    contentType,
    fileName,
  }: {
    contentType: string;
    fileName: string;
  }): boolean {
    const lowerName = fileName.toLowerCase();
    const lowerType = contentType.toLowerCase();
    if (
      lowerType.includes("csv") ||
      lowerType.includes("tab-separated") ||
      lowerName.endsWith(".csv") ||
      lowerName.endsWith(".tsv") ||
      lowerName.endsWith(".txt")
    ) {
      return false;
    }
    return true;
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
            className={workspaceToastClassName}
            iconClassName={workspaceToastIconClassName}
            bodyClassName={workspaceToastBodyClassName}
            actionsClassName={workspaceToastActionsClassName}
            dismissClassName={workspaceToastDismissClassName}
            messageClassName={accountClaimMessageClassName}
          />
        ) : null}
        {!sessionMember ? (
          <label className="sr-only">
            Role preview
            <select
              value={currentMember.id}
              onChange={(event) => setCurrentMemberId(event.target.value)}
            >
              {trip.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName} ({member.role})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div
          className={workspaceGridClassName}
          data-context-rail={contextRailOpen ? "open" : "closed"}
          data-command-bar="hidden"
        >
          <div
            className={`${planningMainClassName} ${contextRailOpen && supportsContextRail ? planningMainWithRailClassName : ""}`}
          >
            {currentView === "settings" ? (
              <TripSettingsPage
                canEdit={canManagePeople}
                currentMember={currentMember}
                trip={trip}
                onSave={saveTripSettings}
              />
            ) : currentView === "members" ? (
              <TripMembersPage
                trip={trip}
                currentMember={currentMember}
                canManagePeople={canManagePeople}
                joinInviteToken={joinInviteToken}
                onChangeMemberAccessStatus={changeMemberAccessStatus}
                onChangeMemberPassword={changeMemberPassword}
                onChangeMemberRole={changeMemberRole}
                onCreateMember={createMember}
                onRotateJoinInviteToken={
                  isApiMode ? rotateJoinInviteToken : undefined
                }
                onResetMemberClaim={resetMemberClaim}
                onTransferOwnership={
                  currentMember.role === "owner" &&
                  accountSession &&
                  participantSession &&
                  resolvedApiClient
                    ? transferOwnerToAccountMember
                    : undefined
                }
              />
            ) : currentView === "bookings" ? (
              <BookingsDocsPage
                trip={scopedTripForRecords}
                tasks={scopedTripPlanRecords.tasks}
                currentMember={currentMember}
                bookingDocs={scopedTripPlanRecords.bookingDocs}
                canEditBookings={canEditBookings}
                onCreateBookingDoc={async (input) => {
                  await createBookingDoc(input);
                }}
                onUpdateBookingDoc={updateBookingDoc}
                onDeleteBookingDoc={deleteBookingDoc}
              />
            ) : currentView === "photos" ? (
              <TripPhotosPage
                trip={trip}
                currentMember={currentMember}
                photoAlbumLinks={trip.photoAlbumLinks ?? []}
                canEditPhotoAlbums={canEditPhotoAlbums}
                onCreatePhotoAlbum={createPhotoAlbum}
                onUpdatePhotoAlbum={updatePhotoAlbum}
                onDeletePhotoAlbum={deletePhotoAlbum}
              />
            ) : currentView === "expenses" ? (
              <TripExpensesPage
                trip={scopedTripForRecords}
                currentMember={currentMember}
                expenseSummary={expenseSummary}
                canEditExpenses={canEditExpenses}
                selectedTripPlanId={selectedTripPlanId}
                apiBaseUrl={process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? ""}
                onCreateExpense={createExpense}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onDuplicateExpenseAsEstimate={duplicateExpenseAsEstimate}
                onRecordPaybackReminder={recordPaybackReminder}
              />
            ) : currentView === "overview" ? (
              <OverviewPage
                trip={scopedTripForRecords}
                currentMemberId={currentMember.id}
                expenseSummary={expenseSummary}
                items={planItems}
                itineraryView={itineraryView}
                suggestions={scopedSuggestions}
                tasks={scopedTripPlanRecords.tasks}
                dailyBriefings={visibleDailyBriefings}
                onOpenExpenses={openExpensesWorkspace}
                onCreateTask={createTask}
                onSaveDailyBriefingOverrides={saveDailyBriefingOverrides}
                onToggleTaskStatus={toggleTaskStatus}
              />
            ) : currentView === "itinerary" ? (
                <SmartItineraryTable
                  canRedo={tripState.future.length > 0}
                  canRestructure={canEdit}
                  canUndo={tripState.past.length > 0}
                  contextRailOpen={contextRailOpen}
                  endDate={trip.endDate}
                  graphItems={activePlanItems}
                  items={planItems}
                  commitmentsByItemId={itineraryCommitmentsByItemId}
                  dailyBriefings={visibleDailyBriefings}
                  itineraryView={itineraryView}
                  pathOptions={pathOptions}
                  tripPlans={trip.tripPlans ?? trip.planVariants}
                  selectedTripPlanId={selectedTripPlanId}
                  mainTripPlanId={trip.mainTripPlanId || trip.activePlanVariantId}
                  onChangeTripPlan={selectTripPlan}
                  onSetMainTripPlan={setMainTripPlan}
                  onChangeTripPlanStatus={updateTripPlanStatus}
                  onCreateTripPlan={createTripPlan}
                  onRenameTripPlan={renameTripPlan}
                  onSaveDayTitle={(date, version, title) =>
                    saveDailyBriefingOverrides(date, version, { dayTitle: title })
                  }
                  tripPlanError={tripPlanError}
                  isTripPlanBusy={isTripPlanBusy}
                  role={currentMember.role}
                  startDate={trip.startDate}
                  selectedItemId={selectedItemIdForView}
                  selectedTripPathId={
                    pathSelection.tripPathId ?? mainItineraryPathId
                  }
                  dayPathOverrides={pathSelection.dayPathOverrides ?? {}}
                  showAllPaths={Boolean(pathSelection.showAll)}
                  tripName={trip.name}
                  bookingDocs={scopedTripPlanRecords.bookingDocs}
                  onAddBookingForItem={createItineraryBookingDraft}
                  onSaveBookingForItem={saveItineraryBookingTicket}
                  onAddStop={addStop}
                  onAddSubActivity={addSubActivity}
                  onAddNoteForItem={(itemId) => void createItineraryNote(itemId)}
                  onAddTaskForItem={(itemId) => void createItineraryTask(itemId)}
                  onOpenItemDetails={openItemDetails}
                  onSelectItem={selectItem}
                  onMoveItem={moveItem}
                  onMoveItemIntoPlanBlock={moveItemIntoPlanBlock}
                  onMoveItemToDay={moveItemToDay}
                  onMoveItemToPath={moveItemToPath}
                  onUpdateItemInline={updateItineraryItemInline}
                  onEditItem={editItem}
                  onDeleteItem={deleteStop}
                  onExportItinerary={exportItinerary}
                  onImportItinerary={importItinerary}
                  onImportItineraryText={importItineraryText}
                  onChangeTripPath={changeTripPath}
                  onChangeDayPath={changeDayPath}
                  onClearDayPath={clearDayPath}
                  onClearAllDayPaths={clearAllDayPaths}
                  onToggleShowAllPaths={toggleShowAllPaths}
                  onRedo={redo}
                  onToggleContextRail={() =>
                    setContextRailVisibility(!contextRailOpen)
                  }
                  onUndo={undo}
                />
            ) : currentView === "map" ? (
              <RouteMapView
                countries={trip.countries ?? []}
                destinationLabel={trip.destinationLabel}
                endDate={trip.endDate}
                items={planItems}
                itineraryView={itineraryView}
                startDate={trip.startDate}
                tripName={trip.name}
              />
            ) : (
              <TimelineView
                contextRailOpen={contextRailOpen}
                endDate={trip.endDate}
                items={planItems}
                itineraryView={itineraryView}
                selectedItemId={selectedItemIdForView}
                startDate={trip.startDate}
                tripName={trip.name}
                onSelectItem={selectItem}
                onToggleContextRail={() =>
                  setContextRailVisibility(!contextRailOpen)
                }
              />
            )}
          </div>
          {itineraryImportError ? (
            <p className={importErrorClassName} role="alert">
              {itineraryImportError}
            </p>
          ) : null}
          {supportsContextRail && contextRailMounted ? (
            <ContextRail
              trip={scopedTripForRecords}
              selectedItem={selectedItem}
              suggestions={scopedSuggestions}
              stopNotes={scopedTripPlanRecords.stopNotes}
              tasks={scopedTripPlanRecords.tasks}
              bookingDocs={scopedTripPlanRecords.bookingDocs}
              currentMember={currentMember}
              expenseSummary={expenseSummary}
              canEdit={canEdit}
              canCreateNote={canCreateStopNote}
              canCreateSuggestion={canCreateSuggestion}
              canReviewSuggestions={canReviewSuggestions}
              canEditExpenses={canEditExpenses}
              open={contextRailOpen}
              preferredTab={contextRailPreferredTab}
              onChangeBookingDocType={changeBookingDocType}
              onChangeBookingDocQuickFields={changeBookingDocQuickFields}
              onCreateNote={createStopNote}
              onCreateExpense={createExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onDeleteNote={deleteStopNote}
              onEditSelected={() => {
                if (selectedItem) editItem(selectedItem.id);
              }}
              onReviewSuggestion={reviewSuggestion}
              onSuggestSelected={suggestSelectedStop}
              onToggleTaskStatus={toggleTaskStatus}
              onUpdateNote={updateStopNote}
              onClose={() => setContextRailVisibility(false)}
            />
          ) : null}
        </div>
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
          <ItineraryImportOptionsDialog
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
        {dialogDeleteItem ? (
          <div className={appDeleteModalBackdropClassName} role="presentation">
            <section
              className={appDeleteDialogClassName}
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-delete-dialog-title"
            >
              <h2
                className={appDeleteDialogTitleClassName}
                id="app-delete-dialog-title"
              >
                {t.itinerary.row.confirmDeleteTitle({
                  activity: dialogDeleteItem.activity,
                })}
              </h2>
              <p className={appDeleteDialogBodyClassName}>
                {t.itinerary.row.confirmDeleteBody({
                  activity: dialogDeleteItem.activity,
                })}
              </p>
              <div className={appDeleteDialogActionsClassName}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogDeleteItem(null)}
                >
                  {t.itinerary.row.confirmDeleteNo}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    const itemId = dialogDeleteItem.id;
                    setDialogDeleteItem(null);
                    await deleteStop(itemId);
                  }}
                >
                  {t.itinerary.row.confirmDeleteYes}
                </Button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}

function getNextSortOrder(items: ItineraryItem[], day: string): number {
  const dayOrders = items
    .filter((item) => item.day === day)
    .map((item) => item.sortOrder);
  /* v8 ignore next */
  return dayOrders.length ? Math.max(...dayOrders) + 100 : 100;
}

function getNextChildSortOrder(items: ItineraryItem[], parentItem: ItineraryItem): number {
  const siblingOrders = items
    .filter((item) => item.day === parentItem.day && item.parentItemId === parentItem.id)
    .map((item) => item.sortOrder);
  if (siblingOrders.length) return Math.max(...siblingOrders) + 10;
  return parentItem.sortOrder + 10;
}

function buildMapLink(place: string): string {
  /* v8 ignore next */
  return place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : "";
}

function normalizeExpenseRepeatCount(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.min(31, Math.max(1, Math.floor(value)));
}

function repeatExpenseLineItems(
  lineItems: ExpenseLineItem[] | undefined,
  repeatIndex: number,
  repeatCount: number,
): ExpenseLineItem[] | undefined {
  if (!lineItems) return undefined;
  if (repeatCount <= 1) return lineItems;
  return lineItems.map((lineItem) => ({
    ...lineItem,
    id: `${lineItem.id}-repeat-${repeatIndex + 1}`,
  }));
}

function nextLocalExpenseId(expenses: Expense[]): string {
  const existingIds = new Set(expenses.map((expense) => expense.id));
  let index =
    expenses.filter((expense) => expense.id.startsWith("expense-local-"))
      .length + 1;
  let id = `expense-local-${index}`;
  while (existingIds.has(id)) {
    index += 1;
    id = `expense-local-${index}`;
  }
  return id;
}

function deriveTripCountriesFromDestination(
  destinationLabel: string,
  fallbackCountries: string[],
): string[] {
  const destination = destinationLabel.toLowerCase();
  const knownCountries: Array<[string, string[]]> = [
    ["hong kong", ["Hong Kong", "China"]],
    ["shenzhen", ["Hong Kong", "China"]],
    ["macau", ["Macau", "China"]],
    ["thailand", ["Thailand"]],
    ["bangkok", ["Thailand"]],
    ["chiang mai", ["Thailand"]],
    ["japan", ["Japan"]],
    ["tokyo", ["Japan"]],
    ["osaka", ["Japan"]],
    ["south korea", ["South Korea"]],
    ["seoul", ["South Korea"]],
    ["taiwan", ["Taiwan"]],
    ["taipei", ["Taiwan"]],
    ["singapore", ["Singapore"]],
    ["malaysia", ["Malaysia"]],
    ["vietnam", ["Vietnam"]],
    ["indonesia", ["Indonesia"]],
    ["china", ["China"]],
  ];
  const countries = knownCountries.flatMap(([keyword, countries]) =>
    destination.includes(keyword) ? countries : [],
  );
  const uniqueCountries = Array.from(new Set(countries));
  return uniqueCountries.length ? uniqueCountries : fallbackCountries;
}

async function resolveStopPlace(
  values: StopFormValues,
  trip: Trip,
  resolver: PlaceResolver | null,
): Promise<{
  candidate: PlaceResolutionCandidate | null;
  state: StopPlaceResolutionState | null;
}> {
  if (values.resolvedPlace)
    return { candidate: values.resolvedPlace, state: null };
  if (safeExternalHref(values.mapLink))
    return { candidate: null, state: null };
  if (values.saveUnresolved || !resolver)
    return { candidate: null, state: null };
  try {
    const response = await resolver({
      clientMutationId: nextClientMutationId("place-resolve"),
      activity: values.activity,
      placeHint: values.place,
      destinationLabel: trip.destinationLabel,
      countries: trip.countries ?? [],
      day: values.day,
    });
    if (response.status === "resolved") {
      return { candidate: response.candidates[0] ?? null, state: null };
    }
    if (response.status === "ambiguous") {
      return {
        candidate: null,
        state: { state: "ambiguous", candidates: response.candidates },
      };
    }
    return { candidate: null, state: { state: "unresolved", candidates: [] } };
  } catch {
    return { candidate: null, state: { state: "unresolved", candidates: [] } };
  }
}

function locationFieldsFromCandidate(
  candidate: PlaceResolutionCandidate | null,
  place: string,
  mapLink?: string | null,
) {
  const explicitMapLink = safeExternalHref(mapLink);
  return candidate
    ? {
        address: candidate.address,
        coordinates: candidate.coordinates,
        mapLink: explicitMapLink || candidate.mapLink,
      }
    : {
        address: place,
        coordinates: undefined,
        mapLink: explicitMapLink || buildMapLink(place),
      };
}

export function nextLocalItemId(
  items: ItineraryItem[],
  prefix: string,
): string {
  const existingIds = new Set(items.map((item) => item.id));
  let index =
    items.filter((item) => item.id.startsWith(`${prefix}-`)).length + 1;
  let id = `${prefix}-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  return id;
}

function nextLocalPlanVariantId(planVariants: PlanVariant[]): string {
  const existingIds = new Set(planVariants.map((variant) => variant.id));
  let index =
    planVariants.filter((variant) =>
      variant.id.startsWith("plan-variant-local-"),
    ).length + 1;
  let id = `plan-variant-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `plan-variant-local-${index}`;
  }

  return id;
}

function normalizeTripPlanAliases(trip: Trip): Trip {
  const plansById = new Map<string, PlanVariant>();
  for (const plan of trip.tripPlans ?? []) plansById.set(plan.id, plan);
  for (const variant of trip.planVariants) plansById.set(variant.id, variant);

  const plans = Array.from(plansById.values());
  const mainTripPlanId =
    trip.mainTripPlanId || trip.activePlanVariantId || plans[0]?.id || "";
  const normalizedPlans = plans.map((plan) =>
    normalizeTripPlanSummary(plan, mainTripPlanId),
  );

  return {
    ...trip,
    activePlanVariantId: mainTripPlanId,
    mainTripPlanId,
    planVariants: normalizedPlans,
    tripPlans: normalizedPlans,
  };
}

function updateTripPlanInTrip(trip: Trip, updatedPlan: PlanVariant): Trip {
  const existingPlans = trip.tripPlans ?? trip.planVariants;
  const hasPlan = trip.planVariants.some((plan) => plan.id === updatedPlan.id);
  const mergePlan = (plan: PlanVariant) =>
    plan.id === updatedPlan.id ? { ...plan, ...updatedPlan } : plan;
  return normalizeTripPlanAliases({
    ...trip,
    planVariants: hasPlan
      ? trip.planVariants.map(mergePlan)
      : [...trip.planVariants, updatedPlan],
    tripPlans: existingPlans.some((plan) => plan.id === updatedPlan.id)
      ? existingPlans.map(mergePlan)
      : [...existingPlans, updatedPlan],
  });
}

function normalizeTripPlanSummary(
  plan: PlanVariant,
  mainTripPlanId: string,
): PlanVariant {
  const status =
    plan.id === mainTripPlanId
      ? "main"
      : plan.status === "main"
        ? "backup"
        : plan.status ?? planStatusForLegacyKind(plan.kind);
  return {
    ...plan,
    kind: legacyKindForPlanStatus(status),
    status,
  };
}

function normalizeStopHierarchyValues(values: StopFormValues): StopFormValues {
  return values.parentItemId ? { ...values, isPlanBlock: false } : values;
}

function planStatusForLegacyKind(
  kind: PlanVariant["kind"],
): NonNullable<PlanVariant["status"]> {
  return kind === "split" ? "proposal" : kind;
}

function legacyKindForPlanStatus(
  status: NonNullable<PlanVariant["status"]>,
): PlanVariant["kind"] {
  return status === "proposal" ? "split" : status;
}

export function nextLocalSuggestionId(suggestions: Suggestion[]): string {
  const existingIds = new Set(suggestions.map((suggestion) => suggestion.id));
  let index =
    suggestions.filter((suggestion) =>
      suggestion.id.startsWith("suggestion-local-"),
    ).length + 1;
  let id = `suggestion-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `suggestion-local-${index}`;
  }

  return id;
}

export function nextLocalTaskId(tasks: TripTask[]): string {
  const existingIds = new Set(tasks.map((task) => task.id));
  let index =
    tasks.filter((task) => task.id.startsWith("task-local-")).length + 1;
  let id = `task-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `task-local-${index}`;
  }

  return id;
}

export function nextLocalStopNoteId(notes: StopNote[]): string {
  const existingIds = new Set(notes.map((note) => note.id));
  let index =
    notes.filter((note) => note.id.startsWith("note-local-")).length + 1;
  let id = `note-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `note-local-${index}`;
  }

  return id;
}

export function nextLocalBookingDocId(bookingDocs: BookingDoc[]): string {
  const existingIds = new Set(bookingDocs.map((bookingDoc) => bookingDoc.id));
  let index =
    bookingDocs.filter((bookingDoc) =>
      bookingDoc.id.startsWith("booking-local-"),
    ).length + 1;
  let id = `booking-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `booking-local-${index}`;
  }

  return id;
}

function tripPlanIdForRecord(
  trip: Trip,
  itineraryItemId?: string | null,
  fallbackTripPlanId?: string | null,
): string | null {
  if (itineraryItemId) {
    const item = trip.itineraryItems.find(
      (candidate) => candidate.id === itineraryItemId,
    );
    if (item?.planVariantId) return item.planVariantId;
  }
  return (
    fallbackTripPlanId || trip.mainTripPlanId || trip.activePlanVariantId || null
  );
}

function initialSelectedTripPlanId(trip: Trip): string {
  return (
    trip.mainTripPlanId ||
    trip.activePlanVariantId ||
    trip.tripPlans?.[0]?.id ||
    trip.planVariants[0]?.id ||
    ""
  );
}

function resolveSelectedTripPlanId(
  trip: Trip,
  preferredTripPlanId?: string | null,
): string {
  if (preferredTripPlanId && tripHasPlan(trip, preferredTripPlanId)) {
    return preferredTripPlanId;
  }
  return browserSelectedTripPlanId(trip) ?? initialSelectedTripPlanId(trip);
}

function browserSelectedTripPlanId(trip: Trip): string | null {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const urlTripPlanId = searchParams.get(selectedTripPlanQueryParam);
  if (urlTripPlanId && tripHasPlan(trip, urlTripPlanId)) return urlTripPlanId;

  const storedTripPlanId = getBrowserSessionStorage()?.getItem(
    selectedTripPlanStorageKey(trip.id),
  );
  if (storedTripPlanId && tripHasPlan(trip, storedTripPlanId)) {
    return storedTripPlanId;
  }
  return null;
}

function rememberSelectedTripPlanId(trip: Trip, tripPlanId: string) {
  if (!tripPlanId || typeof window === "undefined") return;
  getBrowserSessionStorage()?.setItem(
    selectedTripPlanStorageKey(trip.id),
    tripPlanId,
  );

  const searchParams = new URLSearchParams(window.location.search);
  const defaultTripPlanId = initialSelectedTripPlanId(trip);
  if (tripPlanId === defaultTripPlanId) {
    searchParams.delete(selectedTripPlanQueryParam);
  } else {
    searchParams.set(selectedTripPlanQueryParam, tripPlanId);
  }
  const nextSearch = searchParams.toString();
  const nextHref = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  if (nextHref !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", nextHref);
  }
}

function selectedTripPlanStorageKey(tripId: string): string {
  return `${selectedTripPlanSessionStoragePrefix}${tripId}`;
}

function tripHasPlan(trip: Trip, tripPlanId: string): boolean {
  return [...trip.planVariants, ...(trip.tripPlans ?? [])].some(
    (plan) => plan.id === tripPlanId,
  );
}

function tripPlanIdForBookingRecord(
  trip: Trip,
  input: Pick<BookingDocInput, "relatedItineraryItemIds">,
  fallbackTripPlanId?: string | null,
): string | null {
  for (const itemId of input.relatedItineraryItemIds) {
    const tripPlanId = tripPlanIdForRecord(trip, itemId);
    if (tripPlanId) return tripPlanId;
  }
  return tripPlanIdForRecord(trip, null, fallbackTripPlanId);
}

function selectTripPlanRecords(
  trip: Trip,
  selectedTripPlanId: string,
  records: {
    stopNotes: StopNote[];
    tasks: TripTask[];
  },
): {
  bookingDocs: BookingDoc[];
  expenses: Expense[];
  stopNotes: StopNote[];
  tasks: TripTask[];
} {
  const fallbackTripPlanId =
    selectedTripPlanId || trip.mainTripPlanId || trip.activePlanVariantId;
  const itemPlanById = new Map(
    trip.itineraryItems.map((item) => [item.id, item.planVariantId]),
  );
  const belongsToSelectedPlan = (
    explicitTripPlanId?: string | null,
    linkedItemIds: Array<string | null | undefined> = [],
  ) => {
    if (explicitTripPlanId) return explicitTripPlanId === fallbackTripPlanId;

    for (const itemId of linkedItemIds) {
      if (!itemId) continue;
      const itemTripPlanId = itemPlanById.get(itemId);
      if (itemTripPlanId) return itemTripPlanId === fallbackTripPlanId;
    }

    return (
      fallbackTripPlanId === (trip.mainTripPlanId || trip.activePlanVariantId)
    );
  };

  return {
    bookingDocs: (trip.bookingDocs ?? []).filter((bookingDoc) =>
      belongsToSelectedPlan(
        bookingDoc.tripPlanId,
        bookingDoc.relatedItineraryItemIds,
      ),
    ),
    expenses: trip.expenses.filter((expense) =>
      belongsToSelectedPlan(expense.tripPlanId, [expense.itineraryItemId]),
    ),
    stopNotes: records.stopNotes.filter((note) =>
      belongsToSelectedPlan(note.tripPlanId, [note.itemId]),
    ),
    tasks: records.tasks.filter((task) =>
      belongsToSelectedPlan(task.tripPlanId, [task.relatedItemId]),
    ),
  };
}

function buildImportedPlanRecordsForTripPlan({
  appliedImportedItems,
  importedItems,
  records,
  targetTrip,
  tripPlanId,
}: {
  appliedImportedItems: ItineraryItem[];
  importedItems: ItineraryExportItem[];
  records: ItineraryExportRecords;
  targetTrip: Trip;
  tripPlanId: string;
}): {
  bookingDocs: BookingDoc[];
  expenses: Expense[];
  stopNotes: StopNote[];
  tasks: TripTask[];
} {
  const sourceItemIds = new Set(importedItems.map((item) => item.id));
  const itemIdMap = new Map(
    importedItems.map((item, index) => [
      item.id,
      appliedImportedItems[index]?.id ?? item.id,
    ]),
  );
  const mapItemId = (itemId: string) => itemIdMap.get(itemId) ?? itemId;
  const hasImportedItem = (itemId?: string | null) =>
    Boolean(itemId && sourceItemIds.has(itemId));

  const importedExpenses = records.expenses
    .filter((expense) => hasImportedItem(expense.itineraryItemId))
    .map((expense): Expense => ({
      ...expense,
      tripId: targetTrip.id,
      tripPlanId,
      itineraryItemId: expense.itineraryItemId
        ? mapItemId(expense.itineraryItemId)
        : expense.itineraryItemId,
    }));
  const importedBookingDocs = records.bookingDocs
    .filter((bookingDoc) =>
      bookingDoc.relatedItineraryItemIds.some((itemId) =>
        hasImportedItem(itemId),
      ),
    )
    .map((bookingDoc): BookingDoc => ({
      ...bookingDoc,
      tripId: targetTrip.id,
      tripPlanId,
      relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds.map(mapItemId),
    }));
  const importedStopNotes = records.stopNotes
    .filter((note) => hasImportedItem(note.itemId))
    .map((note): StopNote => ({
      ...note,
      tripId: targetTrip.id,
      tripPlanId,
      itemId: mapItemId(note.itemId),
    }));
  const importedTasks = records.tasks
    .filter((task) => hasImportedItem(task.relatedItemId))
    .map((task): TripTask => ({
      ...task,
      tripPlanId,
      relatedItemId: task.relatedItemId
        ? mapItemId(task.relatedItemId)
        : task.relatedItemId,
    }));

  return {
    bookingDocs: importedBookingDocs,
    expenses: importedExpenses,
    stopNotes: importedStopNotes,
    tasks: importedTasks,
  };
}

function mergeImportedRecordsIntoTripPlan(
  targetTrip: Trip,
  records: {
    bookingDocs: BookingDoc[];
    expenses: Expense[];
    stopNotes: StopNote[];
    tasks: TripTask[];
  },
): Trip {
  return {
    ...targetTrip,
    bookingDocs: upsertById(targetTrip.bookingDocs ?? [], records.bookingDocs),
    expenses: upsertById(targetTrip.expenses, records.expenses),
    stopNotes: upsertById(targetTrip.stopNotes ?? [], records.stopNotes),
    tasks: upsertById(targetTrip.tasks ?? [], records.tasks),
  };
}

async function createImportedPlanRecordsViaApi({
  apiClient,
  records,
  sessionToken,
  tripId,
}: {
  apiClient: TripApiClient;
  records: {
    bookingDocs: BookingDoc[];
    expenses: Expense[];
    stopNotes: StopNote[];
    tasks: TripTask[];
  };
  sessionToken: string;
  tripId: string;
}): Promise<{
  bookingDocs: BookingDoc[];
  expenses: Expense[];
  stopNotes: StopNote[];
  tasks: TripTask[];
}> {
  const taskIdMap = new Map<string, string>();
  const expenseIdMap = new Map<string, string>();
  const noteIdMap = new Map<string, string>();
  const createdTasks: TripTask[] = [];
  const createdExpenses: Expense[] = [];
  const createdStopNotes: StopNote[] = [];
  const createdBookingDocs: BookingDoc[] = [];

  for (const task of records.tasks) {
    let createdTask = await apiClient.createTask(tripId, sessionToken, {
      clientMutationId: nextClientMutationId("itinerary-import-task-create"),
      tripPlanId: task.tripPlanId,
      title: task.title,
      visibility: task.visibility,
      kind: task.kind,
      assigneeId: task.assigneeId,
      relatedItemId: task.relatedItemId,
    });
    if (task.status !== createdTask.status) {
      createdTask = await apiClient.patchTask(tripId, createdTask.id, sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-import-task-status"),
        expectedVersion: createdTask.version ?? 1,
        patch: { status: task.status },
      });
    }
    taskIdMap.set(task.id, createdTask.id);
    createdTasks.push(createdTask);
  }

  for (const expense of records.expenses) {
    const createdExpense = await apiClient.createExpense(tripId, sessionToken, {
      clientMutationId: nextClientMutationId("itinerary-import-expense-create"),
      tripPlanId: expense.tripPlanId,
      title: expense.title,
      amountMinor:
        expense.amountMinor ?? Math.round((expense.amount ?? 0) * 100),
      currency: expense.currency ?? "HKD",
      exchangeRateToSettlementCurrency:
        expense.exchangeRateToSettlementCurrency ?? 1,
      notes: expense.notes ?? null,
      receiptUrl: expense.receiptUrl ?? null,
      lineItems: expense.lineItems ?? [],
      comments: expense.comments ?? [],
      paidBy: expense.paidBy,
      category: expense.category,
      splits: expenseSplitsToMinor(expense.splits),
      itineraryItemId: expense.itineraryItemId ?? null,
    });
    expenseIdMap.set(expense.id, createdExpense.id);
    createdExpenses.push(createdExpense);
  }

  for (const note of records.stopNotes) {
    const createdNote = await apiClient.createStopNote(tripId, sessionToken, {
      clientMutationId: nextClientMutationId("itinerary-import-note-create"),
      tripPlanId: note.tripPlanId,
      itineraryItemId: note.itemId,
      body: note.body,
    });
    noteIdMap.set(note.id, createdNote.id);
    createdStopNotes.push(createdNote);
  }

  for (const bookingDoc of records.bookingDocs) {
    const createdBookingDoc = await apiClient.createBookingDoc(
      tripId,
      sessionToken,
      {
        clientMutationId: nextClientMutationId("itinerary-import-booking-create"),
        tripPlanId: bookingDoc.tripPlanId,
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
        relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds,
        relatedTaskIds: bookingDoc.relatedTaskIds.map(
          (taskId) => taskIdMap.get(taskId) ?? taskId,
        ),
        relatedExpenseIds: bookingDoc.relatedExpenseIds.map(
          (expenseId) => expenseIdMap.get(expenseId) ?? expenseId,
        ),
        noteIds: bookingDoc.noteIds.map((noteId) => noteIdMap.get(noteId) ?? noteId),
        notes: bookingDoc.notes,
      },
    );
    createdBookingDocs.push(createdBookingDoc);
  }

  return {
    bookingDocs: createdBookingDocs,
    expenses: createdExpenses,
    stopNotes: createdStopNotes,
    tasks: createdTasks,
  };
}

function upsertById<T extends { id: string }>(current: T[], next: T[]): T[] {
  if (next.length === 0) return current;
  const nextById = new Map(next.map((item) => [item.id, item]));
  const merged = current.map((item) => nextById.get(item.id) ?? item);
  const currentIds = new Set(current.map((item) => item.id));
  for (const item of next) {
    if (!currentIds.has(item.id)) merged.push(item);
  }
  return merged;
}

function buildItineraryCommitmentsByItemId({
  bookingDocs,
  expenses,
  stopNotes,
  tasks,
}: {
  bookingDocs: BookingDoc[];
  expenses: Expense[];
  stopNotes: StopNote[];
  tasks: TripTask[];
}): Record<string, ItineraryCommitmentSummary> {
  const commitments = new Map<string, ItineraryCommitmentSummary>();
  const ensure = (itemId: string) => {
    const current = commitments.get(itemId) ?? {};
    commitments.set(itemId, current);
    return current;
  };

  for (const booking of bookingDocs) {
    for (const itemId of booking.relatedItineraryItemIds) {
      const current = ensure(itemId);
      current.bookingCount = (current.bookingCount ?? 0) + 1;
    }
  }
  for (const expense of expenses) {
    if (!expense.itineraryItemId) continue;
    const current = ensure(expense.itineraryItemId);
    current.expenseCount = (current.expenseCount ?? 0) + 1;
  }
  for (const task of tasks) {
    if (!task.relatedItemId || task.status === "done") continue;
    const current = ensure(task.relatedItemId);
    current.openTaskCount = (current.openTaskCount ?? 0) + 1;
  }
  for (const note of stopNotes) {
    const current = ensure(note.itemId);
    current.noteCount = (current.noteCount ?? 0) + 1;
  }

  return Object.fromEntries(commitments);
}

function resolveCreatedImportId(
  id: string | null | undefined,
  idMaps: Map<string, string>[],
): string | null | undefined {
  if (typeof id !== "string") return id;
  for (const idMap of idMaps) {
    const mappedId = idMap.get(id);
    if (mappedId) return mappedId;
  }
  return id;
}

export function nextLocalPhotoAlbumId(photoAlbumLinks: TripPhotoAlbumLink[]): string {
  const existingIds = new Set(photoAlbumLinks.map((album) => album.id));
  let index =
    photoAlbumLinks.filter((album) =>
      album.id.startsWith("photo-album-local-"),
    ).length + 1;
  let id = `photo-album-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `photo-album-local-${index}`;
  }

  return id;
}

function serializeBookingDocInputForApi(
  input: BookingDocInput & { tripPlanId?: string | null },
) {
  return {
    ...input,
    title: input.title.trim(),
    startsAt: normalizeBookingDocDateTimeForApi(input.startsAt, input.timezone),
    endsAt: normalizeBookingDocDateTimeForApi(input.endsAt, input.timezone),
    providerName: input.providerName?.trim() || null,
    confirmationCode: input.confirmationCode?.trim() || null,
    timezone: input.timezone?.trim() || null,
    currency: input.currency?.trim() || null,
    notes: input.notes?.trim() || null,
    externalLinks: input.externalLinks.map((link) => ({
      ...(isUuid(link.id) ? { id: link.id } : {}),
      label: link.label.trim(),
      url: link.url.trim(),
      provider: link.provider?.trim() || null,
      accessNote: link.accessNote?.trim() || null,
    })),
  };
}

function normalizeBookingDocDateTimeForApi(
  value: string | null | undefined,
  timezone: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)) return trimmed;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return trimmed;
  const [, year, month, day, hour, minute, second = "00"] = match;
  const offsetMinutes = offsetMinutesForLocalDateTime({
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    month: Number(month),
    second: Number(second),
    timezone: timezone?.trim() || null,
    year: Number(year),
  });
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${formatUtcOffset(offsetMinutes)}`;
}

function offsetMinutesForLocalDateTime(input: {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  timezone: string | null;
  year: number;
}): number {
  if (!input.timezone) return 0;
  try {
    const utcGuess = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      input.second,
    );
    const firstOffset = offsetMinutesForInstant(input.timezone, new Date(utcGuess));
    const corrected = new Date(utcGuess - firstOffset * 60_000);
    return offsetMinutesForInstant(input.timezone, corrected);
  } catch {
    return 0;
  }
}

function offsetMinutesForInstant(timezone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((accumulator, part) => {
      if (part.type !== "literal") accumulator[part.type] = part.value;
      return accumulator;
    }, {});

  const localAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((localAsUtc - instant.getTime()) / 60_000);
}

function formatUtcOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "Z";
  const sign = offsetMinutes > 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

export function bookingTypeForItineraryItem(item: ItineraryItem): BookingDocType {
  const mode = typeof item.details?.mode === "string" ? item.details.mode.toLowerCase() : "";
  const transportation = item.transportation.toLowerCase();
  const activity = item.activity.toLowerCase();
  const haystack = `${mode} ${transportation} ${activity}`;
  if (/\bflight\b|\bplane\b|\bairline\b|เครื่องบิน|สายการบิน|(^|\s)บิน/.test(haystack))
    return "flight";
  if (/\btrain\b|\brail\b|\bmtr\b|รถไฟ|ราง|สถานีรถไฟ/.test(haystack)) return "train";
  if (/\bbus\b|\bferry\b|\bshuttle\b|\btram\b|\btaxi\b|รถบัส|บัส|เรือ|เฟอร์รี่|รถรับส่ง|แท็กซี่|รถราง/.test(haystack))
    return "public_transport";
  if (
    item.activityType === "stay" ||
    item.itemKind === "lodging" ||
    /โรงแรม|ที่พัก|พักค้างคืน|เช็คอิน|check[-\s]?in/.test(haystack)
  )
    return "hotel";
  if (item.activityType === "attraction" || item.itemKind === "activity") return "activity_ticket";
  return "other";
}

function syncItineraryDetailsWithBookingTicket(
  item: ItineraryItem,
  input: ItineraryBookingTicketInput,
): ItineraryItem["details"] {
  const nextDetails = { ...(item.details ?? {}) };
  const mode = itineraryTravelModeForTicket(item, input);
  if (mode) nextDetails.mode = mode;

  if (input.providerName?.trim()) nextDetails.provider = input.providerName.trim();
  else delete nextDetails.provider;

  if (input.confirmationCode?.trim()) {
    nextDetails.bookingRef = input.confirmationCode.trim();
    nextDetails.ticketRef = input.confirmationCode.trim();
  } else {
    delete nextDetails.bookingRef;
    delete nextDetails.ticketRef;
  }

  if (input.startsAt) nextDetails.ticketStartsAt = input.startsAt;
  else delete nextDetails.ticketStartsAt;
  if (input.endsAt) nextDetails.ticketEndsAt = input.endsAt;
  else delete nextDetails.ticketEndsAt;

  return nextDetails;
}

function itineraryTravelModeForTicket(
  item: ItineraryItem,
  input: ItineraryBookingTicketInput,
): string | null {
  if (item.activityType !== "travel") return null;
  const existingMode = readItineraryDetailString(item.details, "mode");
  if (input.itemId !== item.id && existingMode) return existingMode;
  if (input.template === "flight" || input.type === "flight") return "flight";
  if (input.template === "train" || input.type === "train") return "train";
  if (existingMode) return existingMode;
  if (input.type === "public_transport") return "transport";
  return null;
}

function uniqueStringIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function findDuplicateBookingDoc(
  bookingDocs: BookingDoc[],
  input: BookingDocInput,
): BookingDoc | null {
  const title = normalizeBookingMatchValue(input.title);
  const startsAt = normalizeBookingDateTimeMatchValue(input.startsAt);
  const endsAt = normalizeBookingDateTimeMatchValue(input.endsAt);
  const relatedItemIds = new Set(input.relatedItineraryItemIds);
  return (
    bookingDocs.find((bookingDoc) => {
      if (bookingDoc.type !== input.type) return false;
      if (normalizeBookingMatchValue(bookingDoc.title) !== title) return false;
      if (normalizeBookingDateTimeMatchValue(bookingDoc.startsAt) !== startsAt) return false;
      if (normalizeBookingDateTimeMatchValue(bookingDoc.endsAt) !== endsAt) return false;
      return bookingDoc.relatedItineraryItemIds.some((itemId) =>
        relatedItemIds.has(itemId),
      );
    }) ?? null
  );
}

function normalizeBookingMatchValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeBookingDateTimeMatchValue(
  value: string | null | undefined,
): string {
  return normalizeBookingMatchValue(value).replace(
    /(\d{2}:\d{2}):00(?=(?:[+-]\d\d:?\d\d|z)?$)/,
    "$1",
  );
}

function bookingTypeForBookingTemplate(
  template: Exclude<ItineraryBookingTemplate, "recommended">,
): BookingDocType {
  if (template === "activity_ticket") return "activity_ticket";
  return template;
}

function bookingDraftTitleForItineraryItem(
  item: ItineraryItem,
  bookingType: BookingDocType,
): string {
  const suffixByType: Partial<Record<BookingDocType, string>> = {
    activity_ticket: "ticket draft",
    flight: "flight ticket draft",
    hotel: "hotel booking draft",
    public_transport: "transport booking draft",
    train: "train ticket draft",
  };
  return `${item.activity} ${suffixByType[bookingType] ?? "booking draft"}`;
}

function bookingTypeForExpenseEstimate(expense: Expense): BookingDocType {
  if (expense.category === "stay") return "hotel";
  if (expense.category === "tickets") return "activity_ticket";
  if (expense.category === "transport") return "public_transport";
  return "other";
}

function bookingDraftDetailsForItineraryItem(item: ItineraryItem): {
  confirmationCode: string | null;
  notes: string;
  providerName: string | null;
} {
  const providerName =
    readItineraryDetailString(item.details, "provider") ||
    readItineraryDetailString(item.details, "mode") ||
    null;
  const confirmationCode =
    readItineraryDetailString(item.details, "bookingRef") ||
    readItineraryDetailString(item.details, "ticketRef") ||
    null;
  const notes = [
    item.place ? `Draft from itinerary: ${item.place}` : "Draft from itinerary",
    readItineraryDetailString(item.details, "entryWindow"),
    readItineraryDetailString(item.details, "costNote"),
    readItineraryDetailString(item.details, "detail"),
  ].filter((value): value is string => Boolean(value));

  return {
    confirmationCode,
    notes: notes.join("\n"),
    providerName,
  };
}

function bookingDraftTimeWindowForItineraryItem(item: ItineraryItem): {
  endsAt: string | null;
  startsAt: string | null;
} {
  const startTime = item.startTime?.trim();
  const endTime = item.endTime?.trim();
  return {
    startsAt: startTime ? itineraryDateTime(item.day, startTime) : null,
    endsAt: endTime
      ? itineraryDateTime(
          shiftIsoDate(item.day, item.endOffsetDays ?? 0),
          endTime,
        )
      : null,
  };
}

function itineraryDateTime(day: string, time: string): string {
  return `${day}T${time}:00`;
}

function readItineraryDetailString(
  details: ItineraryItem["details"] | null | undefined,
  key: string,
): string {
  const value = details?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function serializePhotoAlbumInputForApi(input: TripPhotoAlbumInput) {
  return {
    ...input,
    title: input.title.trim(),
    url: input.url.trim(),
    description: input.description?.trim() || null,
    accessNote: input.accessNote?.trim() || null,
    coverUrl: input.coverUrl?.trim() || null,
    day: input.day?.trim() || null,
  };
}

function isUuid(value: string | undefined): boolean {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function nextClientMutationId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

async function patchApiItineraryBranchItems(
  items: ItineraryItem[],
  apiClient: TripApiClient,
  tripId: string,
  sessionToken: string,
): Promise<ItineraryItem[]> {
  const patchedItems: ItineraryItem[] = [];
  const changedItemIds = new Set(items.map((item) => item.id));
  const itemsToPatch = items.filter(
    (item) => !item.parentItemId || !changedItemIds.has(item.parentItemId),
  );
  for (const item of itemsToPatch) {
    patchedItems.push(
      await apiClient.patchItineraryItem(tripId, item.id, sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-branch"),
        expectedVersion: item.version,
        patch: {
          pathGroupId: item.pathGroupId,
          pathId: item.pathId,
          pathName: item.pathName,
          pathRole: item.pathRole,
        },
      }),
    );
  }
  return patchedItems;
}

export function replaceSuggestionById(
  suggestions: Suggestion[],
  suggestionId: string,
  replacement: Suggestion,
): Suggestion[] {
  return suggestions.map((candidate) =>
    candidate.id === suggestionId ? replacement : candidate,
  );
}

function TripAccessLoadingFrame() {
  return (
    <main
      className="account-page account-page--portal"
      aria-busy="true"
      aria-label="Opening trip"
    >
      <section className={portalLoadingCardClassName}>
        <span className={portalSkeletonTitleClassName} />
        <span className={portalSkeletonLineClassName} />
        <span className={portalSkeletonBlockClassName} />
      </section>
    </main>
  );
}

function getBrowserLocalStorage(): Storage | null {
  if (
    typeof window === "undefined" ||
    !("localStorage" in window) ||
    !window.localStorage
  )
    return null;
  return window.localStorage;
}

function getBrowserSessionStorage(): Storage | null {
  if (
    typeof window === "undefined" ||
    !("sessionStorage" in window) ||
    !window.sessionStorage
  )
    return null;
  return window.sessionStorage;
}

function getParticipantSessionStorage(): Storage | null {
  return getBrowserSessionStorage();
}

function isLocalParticipantSession(
  session: TripParticipantSession | null,
): boolean {
  return session?.sessionToken.startsWith("local-") ?? false;
}

function loadPersistedTrip(): Trip | null {
  const rawTrip = getBrowserLocalStorage()?.getItem(tripStorageKey);
  if (!rawTrip) return null;
  try {
    return normalizeTripPlanAliases(JSON.parse(rawTrip) as Trip);
  } catch {
    getBrowserLocalStorage()?.removeItem(tripStorageKey);
    return null;
  }
}

function loadPersistedParticipantSession(
  requireJoin: boolean,
  trip: Trip,
  isApiMode = false,
  routeTripId?: string,
): TripParticipantSession | null {
  const storage = getParticipantSessionStorage();
  if (!requireJoin || !storage) return null;
  const legacyLocalStorage = getBrowserLocalStorage();
  const rawSession =
    storage.getItem(tripParticipantSessionStorageKey) ??
    legacyLocalStorage?.getItem(tripParticipantSessionStorageKey);
  if (!rawSession) return null;
  try {
    const parsedSession = JSON.parse(rawSession) as TripParticipantSession;
    if (routeTripId && parsedSession.tripId !== routeTripId) {
      storage.removeItem(tripParticipantSessionStorageKey);
      legacyLocalStorage?.removeItem(tripParticipantSessionStorageKey);
      return null;
    }
    if (
      legacyLocalStorage?.getItem(tripParticipantSessionStorageKey) ===
      rawSession
    ) {
      storage.setItem(tripParticipantSessionStorageKey, rawSession);
      legacyLocalStorage.removeItem(tripParticipantSessionStorageKey);
    }
    /* v8 ignore next */
    return isApiMode || findSessionMember(trip, parsedSession)
      ? parsedSession
      : null;
  } catch {
    storage.removeItem(tripParticipantSessionStorageKey);
    legacyLocalStorage?.removeItem(tripParticipantSessionStorageKey);
    return null;
  }
}

function persistParticipantSession(session: TripParticipantSession) {
  getParticipantSessionStorage()?.setItem(
    tripParticipantSessionStorageKey,
    JSON.stringify(session),
  );
  getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
}

function clearParticipantSession() {
  getParticipantSessionStorage()?.removeItem(tripParticipantSessionStorageKey);
  getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
}

function isUnauthenticated(caught: unknown): boolean {
  return caught instanceof TripApiError && caught.status === 401;
}

function isForbidden(caught: unknown): boolean {
  return caught instanceof TripApiError && caught.status === 403;
}

function isAuthFailure(caught: unknown): boolean {
  return isUnauthenticated(caught) || isForbidden(caught);
}

function loadPersistedAccountSession(): AccountSession | null {
  const storage = getBrowserSessionStorage();
  if (!storage) return null;
  const legacyStorage = getBrowserLocalStorage();
  const rawSession =
    storage.getItem(accountSessionStorageKey) ??
    legacyStorage?.getItem(accountSessionStorageKey);
  if (!rawSession) return null;
  try {
    const session = JSON.parse(rawSession) as AccountSession;
    if (
      session.kind !== "trusted" ||
      Date.parse(session.expiresAt) <= Date.now()
    ) {
      storage.removeItem(accountSessionStorageKey);
      legacyStorage?.removeItem(accountSessionStorageKey);
      return null;
    }
    if (legacyStorage?.getItem(accountSessionStorageKey) === rawSession) {
      storage.setItem(accountSessionStorageKey, rawSession);
      legacyStorage.removeItem(accountSessionStorageKey);
    }
    return session;
  } catch {
    storage.removeItem(accountSessionStorageKey);
    legacyStorage?.removeItem(accountSessionStorageKey);
    return null;
  }
}

function persistAccountSession(session: AccountSession | null) {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  if (session?.kind === "trusted") {
    storage.setItem(accountSessionStorageKey, JSON.stringify(session));
  } else {
    storage.removeItem(accountSessionStorageKey);
  }
  getBrowserLocalStorage()?.removeItem(accountSessionStorageKey);
}

function persistTripDraft(trip: Trip) {
  getBrowserLocalStorage()?.setItem(
    tripStorageKey,
    JSON.stringify(normalizeTripPlanAliases(trip)),
  );
}

function shiftItineraryItemsToStartDate(
  items: ItineraryItem[],
  currentStartDate: string,
  nextStartDate: string,
): ItineraryItem[] {
  const dayShift = daysBetweenIsoDates(currentStartDate, nextStartDate);
  if (!dayShift) return items;
  return items.map((item) => ({
    ...item,
    day: shiftIsoDate(item.day, dayShift),
  }));
}

function daysBetweenIsoDates(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function selectedItineraryPathIdForDay(
  day: string,
  selection: ItineraryPathSelection,
): string {
  if (selection.showAll) return mainItineraryPathId;
  return (
    selection.dayPathOverrides?.[day] ||
    selection.tripPathId ||
    mainItineraryPathId
  );
}

function itineraryItemPathFieldsForTarget(
  pathGroupId: string,
  pathId: string,
  pathName?: string,
): Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole"> {
  if (pathId === mainItineraryPathId) {
    return { pathGroupId, pathRole: "main" };
  }
  return { pathGroupId, pathId, pathName, pathRole: "alternative" };
}

function ItineraryImportOptionsDialog({
  importedItems,
  memberId,
  pathOptions,
  records,
  startDate,
  currentTripPathId,
  tripPlanOptions,
  tripPlanId,
  onApply,
  onClose,
}: {
  importedItems: ItineraryExportItem[];
  memberId: string;
  pathOptions: ItineraryPathOption[];
  records: ItineraryExportRecords;
  startDate: string;
  currentTripPathId: string;
  tripPlanOptions: PlanVariant[];
  tripPlanId: string;
  onApply: (target: ItineraryImportApplyTarget) => void;
  onClose: () => void;
}) {
  const recordCount =
    records.expenses.length +
    records.bookingDocs.length +
    records.stopNotes.length +
    records.tasks.length;
  const currentPathName =
    pathOptions.find((option) => option.id === currentTripPathId)?.name ??
    "Main";
  const [pathNameInput, setPathNameInput] = useState(currentPathName);
  const [scope, setScope] = useState<"trip" | "day">("trip");
  const [day, setDay] = useState(importedItems[0]?.day ?? startDate);
  const [mode, setMode] =
    useState<ItineraryImportApplyTarget["mode"]>("replace-target");
  const [recordMode, setRecordMode] =
    useState<ItineraryImportApplyTarget["recordMode"]>("clone-linked");
  const [targetTripPlanId, setTargetTripPlanId] = useState(tripPlanId);
  const previewLabel = importedItems[0]?.activity ?? "No activities";

  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pathName = pathNameInput.trim() || "Main";
    const targetDay = scope === "day" ? day.trim() : undefined;
    if (scope === "day" && !targetDay) return;
    onApply(
      buildItineraryImportApplyTarget({
        day: targetDay,
        memberId,
        mode,
        pathName,
        pathOptions,
        recordMode,
        scope,
        tripPlanId: targetTripPlanId,
      }),
    );
  }

  return (
    <div className={appDeleteModalBackdropClassName} role="presentation">
      <form
        className={importDialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="itinerary-import-options-title"
        onSubmit={submitImport}
      >
        <h2
          className={importDialogTitleClassName}
          id="itinerary-import-options-title"
        >
          ตั้งค่า import itinerary
        </h2>
        <p className={importDialogBodyClassName}>
          {previewLabel} · {importedItems.length} activities
        </p>
        {recordCount > 0 ? (
          <p className={importDialogBodyClassName}>
            Records detected: {records.expenses.length} expenses,{" "}
            {records.bookingDocs.length} bookings, {records.stopNotes.length}{" "}
            notes, {records.tasks.length} tasks. Linked records will be
            imported only when record handling is set to clone.
          </p>
        ) : null}
        <div className={importDialogFieldsClassName}>
          <label>
            <span>Target Trip Plan</span>
            <select
              value={targetTripPlanId}
              onChange={(event) => setTargetTripPlanId(event.target.value)}
            >
              {tripPlanOptions.map((plan) => (
                <option value={plan.id} key={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>ชื่อ path</span>
            <input
              value={pathNameInput}
              onChange={(event) => setPathNameInput(event.target.value)}
            />
          </label>
          <label>
            <span>Scope</span>
            <select
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as "trip" | "day")
              }
            >
              <option value="trip">Whole trip</option>
              <option value="day">This day only</option>
            </select>
          </label>
          {scope === "day" ? (
            <label>
              <span>Target day</span>
              <input
                value={day}
                onChange={(event) => setDay(event.target.value)}
              />
            </label>
          ) : null}
          <label>
            <span>Mode</span>
            <select
              value={mode}
              onChange={(event) =>
                setMode(
                  event.target.value as ItineraryImportApplyTarget["mode"],
                )
              }
            >
              <option value="replace-target">Replace target path</option>
              <option value="keep-alternatives">
                Keep both as alternatives
              </option>
            </select>
          </label>
          {recordCount > 0 ? (
            <label>
              <span>Record handling</span>
              <select
                value={recordMode}
                onChange={(event) =>
                  setRecordMode(
                    event.target.value as ItineraryImportApplyTarget["recordMode"],
                  )
                }
              >
                <option value="clone-linked">Clone linked records</option>
                <option value="activities-only">Activities only</option>
              </select>
            </label>
          ) : null}
        </div>
        <div className={appDeleteDialogActionsClassName}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Import itinerary</Button>
        </div>
      </form>
    </div>
  );
}

function buildItineraryImportApplyTarget({
  day,
  memberId,
  mode,
  pathName,
  pathOptions,
  recordMode,
  scope,
  tripPlanId,
}: {
  day?: string;
  memberId: string;
  mode: ItineraryImportApplyTarget["mode"];
  pathName: string;
  pathOptions: ItineraryPathOption[];
  recordMode: ItineraryImportApplyTarget["recordMode"];
  scope: ItineraryImportApplyTarget["scope"];
  tripPlanId: string;
}): ItineraryImportApplyTarget {
  const existingPath = pathOptions.find(
    (option) =>
      option.name.toLowerCase() === pathName.toLowerCase() ||
      option.id === pathName,
  );
  const pathId =
    pathName.toLowerCase() === "main"
      ? mainItineraryPathId
      : (existingPath?.id ??
        `path-${slugifyFilePart(pathName) || Date.now().toString(36)}`);
  const normalizedPathName =
    pathId === mainItineraryPathId ? "Main" : (existingPath?.name ?? pathName);
  return {
    memberId,
    tripPlanId,
    pathId,
    pathName: normalizedPathName,
    scope,
    day,
    mode,
    recordMode,
  };
}

function slugifyFilePart(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "trip"
  );
}

export function normalizeInlineTimePatch(
  item: ItineraryItem,
  patch: InlineItineraryItemPatch,
): InlineItineraryItemPatch {
  const nextPatch: InlineItineraryItemPatch = { ...patch };
  const hasStartTime = nextPatch.startTime !== undefined;
  const hasEndTime = nextPatch.endTime !== undefined;
  const hasEndOffsetDays = nextPatch.endOffsetDays !== undefined;
  if (!hasStartTime && !hasEndTime && !hasEndOffsetDays) return nextPatch;

  const startTime = hasStartTime ? nextPatch.startTime : item.startTime;
  const endTime = hasEndTime ? nextPatch.endTime : item.endTime;
  if (!endTime) {
    if (hasEndTime) {
      nextPatch.endOffsetDays = 0;
      nextPatch.durationMinutes = null;
    }
    return nextPatch;
  }

  const start = parseTime(startTime ?? "");
  const end = parseTime(endTime);
  if (start === null || end === null) return nextPatch;

  const minimumEndOffsetDays = end <= start ? 1 : 0;
  const endOffsetDays = hasEndOffsetDays
    ? Math.max(nextPatch.endOffsetDays ?? 0, minimumEndOffsetDays)
    : minimumEndOffsetDays;
  if (endOffsetDays !== (nextPatch.endOffsetDays ?? item.endOffsetDays ?? 0)) {
    nextPatch.endOffsetDays = endOffsetDays;
  }
  const durationMinutes = end + endOffsetDays * 24 * 60 - start;
  if (durationMinutes > 0) {
    nextPatch.durationMinutes = durationMinutes;
  }
  return nextPatch;
}

interface WorkspaceToastProps {
  accountSession: AccountSession | null;
  memberUserId: string | null | undefined;
  claimState: { status: "idle" | "saving"; message: string | null };
  canClaim: boolean;
  dismissing: boolean;
  onClaim: () => void;
  onDismiss: () => void;
  className: string;
  iconClassName: string;
  bodyClassName: string;
  actionsClassName: string;
  dismissClassName: string;
  messageClassName: string;
}

function WorkspaceToast({
  accountSession,
  memberUserId,
  claimState,
  canClaim,
  dismissing,
  onClaim,
  onDismiss,
  className,
  iconClassName,
  bodyClassName,
  actionsClassName,
  dismissClassName,
  messageClassName,
}: WorkspaceToastProps) {
  const isClaimed = Boolean(accountSession && memberUserId);
  const title = isClaimed
    ? "เชื่อมต่อ account แล้ว"
    : accountSession
      ? "ผูกตัวตนกับ account"
      : "เข้าแบบ temp";
  const detail = isClaimed
    ? "ตัวตนนี้ผูกกับ account แล้ว"
    : accountSession
      ? "ผูกตัวตน temp นี้กับ account เพื่อเก็บประวัติและสถิติ"
      : "เข้าสู่ระบบจากหน้า access เพื่อผูก identity นี้กับ account ภายหลัง";

  return (
    <div
      className={className}
      data-dismissing={dismissing ? "true" : undefined}
      role="status"
      aria-live="polite"
    >
      <span className={iconClassName} aria-hidden="true">
        <Icon name={isClaimed ? "check" : "clock"} />
      </span>
      <div className={bodyClassName}>
        <strong>{title}</strong>
        <span>{detail}</span>
        {claimState.message ? (
          <span className={messageClassName}>{claimState.message}</span>
        ) : null}
      </div>
      <div className={actionsClassName}>
        {canClaim ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onClaim}
            disabled={claimState.status === "saving"}
          >
            <Icon name="check" />
            ผูกตัวตน
          </Button>
        ) : null}
        <button
          type="button"
          className={dismissClassName}
          aria-label="ปิดการแจ้งเตือน"
          onClick={onDismiss}
        >
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
