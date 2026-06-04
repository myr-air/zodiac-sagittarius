"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, resolveViewFromPath } from "@/src/components/AppShell";
import { AccountAccessPanel } from "@/src/components/AccountAccessPanel";
import { ContextRail } from "@/src/components/ContextRail";
import { OverviewPage } from "@/src/components/OverviewPage";
import { RouteMapView } from "@/src/components/RouteMapView";
import { SmartItineraryTable } from "@/src/components/SmartItineraryTable";
import { StopDialog, type StopFormValues } from "@/src/components/StopDialog";
import { TimelineView } from "@/src/components/TimelineView";
import { TripMembersPage } from "@/src/components/TripMembersPage";
import { Button } from "@/src/components/ui";
import { Icon } from "@/src/components/icons";
import { appRoutes, decodeReturnTo } from "@/src/routes/app-routes";
import { createTripApiClient, type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import { createAccountApiClient, type AccountSession } from "@/src/account/api-client";
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
import { buildExpenseSummary } from "@/src/trip/expenses";
import { buildItineraryView } from "@/src/trip/itinerary";
import { tripFixtureStopNotes, tripFixtureSuggestions, tripFixtureTasks } from "@/src/demo/trip-fixtures";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { approveSuggestion } from "@/src/trip/suggestions";
import type { Expense, ExpenseSummary, ItineraryItem, StopNote, Suggestion, Trip, TripMemberAccessStatus, TripParticipantSession, TripRole, TripTask } from "@/src/trip/types";

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";
const accountSessionStorageKey = "sagittarius-account-session";
const workspaceToastClassName =
  "workspace-toast pointer-events-auto fixed left-1/2 top-5 z-[60] flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-route-border)] bg-[rgba(239,246,255,0.94)] px-4 py-3 shadow-[0_8px_32px_rgba(15,23,42,0.16)] backdrop-blur-[10px] max-[767px]:top-3";
const workspaceToastIconClassName = "mt-0.5 shrink-0 text-[var(--color-route)]";
const workspaceToastBodyClassName = "min-w-0 flex-1 [&_span]:block [&_span]:text-[12.5px] [&_span]:leading-5 [&_span]:text-[var(--color-text-muted)] [&_strong]:text-[13.5px] [&_strong]:font-[850] [&_strong]:text-[var(--color-route)]";
const workspaceToastActionsClassName = "flex shrink-0 items-center gap-2";
const workspaceToastDismissClassName =
  "ml-1 grid size-7 shrink-0 place-items-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]";
const accountClaimMessageClassName = "account-claim-message font-extrabold";
const rolePreviewToolbarClassName =
  "role-preview-toolbar mb-3 inline-flex w-fit items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-extrabold text-[var(--color-text-muted)] shadow-[var(--shadow-soft)] [&_select]:min-h-8 [&_select]:rounded-[var(--radius-sm)] [&_select]:border [&_select]:border-[var(--color-border-strong)] [&_select]:bg-[var(--color-surface)] [&_select]:px-2 [&_select]:font-[inherit] [&_select]:text-[var(--color-text)]";
const portalLoadingCardClassName =
  "account-card portal-loading-card grid min-h-[220px] gap-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[rgb(255_255_255_/_0.94)] p-4 shadow-[var(--shadow-panel)]";
const portalSkeletonBaseClassName =
  "portal-skeleton block overflow-hidden rounded-[var(--radius-md)] bg-[linear-gradient(90deg,var(--color-surface-subtle),rgb(226_232_240_/_0.72),var(--color-surface-subtle))] bg-[length:220%_100%] animate-[portal-skeleton-pulse_1.2s_ease-in-out_infinite] motion-reduce:animate-none";
const portalSkeletonTitleClassName = `${portalSkeletonBaseClassName} portal-skeleton--title h-7 w-[min(220px,48%)]`;
const portalSkeletonLineClassName = `${portalSkeletonBaseClassName} portal-skeleton--line h-4 w-[min(520px,72%)]`;
const portalSkeletonBlockClassName = `${portalSkeletonBaseClassName} portal-skeleton--block h-[132px] w-full`;
const workspaceShellClassName = "workspace-shell min-w-0 bg-transparent";
const workspaceGridClassName = "workspace-grid relative grid h-[calc(100vh-62px)] min-h-0 grid-cols-[minmax(0,1fr)] overflow-hidden data-[command-bar=hidden]:h-screen max-[1199px]:h-auto max-[1199px]:grid-cols-1 max-[1199px]:overflow-visible";
const planningMainClassName = "planning-main h-full min-h-0 min-w-0 overflow-y-auto scroll-smooth bg-[var(--color-page)] max-[1199px]:h-auto max-[1199px]:overflow-y-visible";

export type PlanningView = "overview" | "itinerary" | "map" | "timeline" | "members";
type PortalSection = "dashboard" | "trips" | "new-trip" | "explorer" | "todos" | "vault" | "settings" | "sign-out";

interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
  dataSource?: "api" | "demo";
  apiClient?: TripApiClient;
  routeTripId?: string;
  initialJoinCode?: string;
  accessMode?: "combined" | "account-login" | "account-register" | "account-portal" | "trip-access";
  accountSuccessRedirectHref?: string;
  portalSection?: PortalSection;
}

export function SagittariusApp({
  initialView = "overview",
  requireJoin = false,
  dataSource = "demo",
  apiClient,
  routeTripId,
  initialJoinCode,
  accessMode = "combined",
  accountSuccessRedirectHref,
  portalSection = "dashboard",
}: SagittariusAppProps) {
  /* v8 ignore next 3 */
  const resolvedApiClient = useMemo(
    () => apiClient ?? (dataSource === "api" ? createTripApiClient({ baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "" }) : undefined),
    [apiClient, dataSource],
  );
  const accountClient = useMemo(
    () => createAccountApiClient({ baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "" }),
    [],
  );
  const [tripState, setTripState] = useState<{ trip: Trip; past: Trip[]; future: Trip[] }>(() => ({
    trip: seedTrip,
    past: [],
    future: [],
  }));
  const [participantSession, setParticipantSession] = useState<TripParticipantSession | null>(null);
  const [isCockpitLoaded, setIsCockpitLoaded] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);
  const [accountSessionLoaded, setAccountSessionLoaded] = useState(false);
  const [accountClaimState, setAccountClaimState] = useState<{ status: "idle" | "saving"; message: string | null }>({ status: "idle", message: null });
  const [accountTripAccessDeniedRouteId, setAccountTripAccessDeniedRouteId] = useState<string | null>(null);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [toastDismissing, setToastDismissing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => tripFixtureSuggestions.map((suggestion) => ({ ...suggestion })));
  const [tasks, setTasks] = useState<TripTask[]>(() => tripFixtureTasks.map((task) => ({ ...task })));
  const [stopNotes, setStopNotes] = useState<StopNote[]>(() => tripFixtureStopNotes.map((note) => ({ ...note })));
  const [backendExpenseSummary, setBackendExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextRailOpen, setContextRailOpen] = useState(false);
  const [contextRailMounted, setContextRailMounted] = useState(false);
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
  const selectedPlanVariantId = tripState.trip.activePlanVariantId;
  const [currentMemberId, setCurrentMemberId] = useState(seedTrip.members[0].id);
  const [selectedItemId, setSelectedItemId] = useState("item-dimdim");
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; item: ItineraryItem } | null>(null);

  const trip = tripState.trip;
  const tripIdForPath = routeTripId ?? trip.id;
  const resolveCurrentView = useCallback(() => {
    if (typeof window === "undefined") return initialView;
    return resolveViewFromPath(window.location.pathname, tripIdForPath, initialView);
  }, [initialView, tripIdForPath]);
  const currentView = navigatedView ?? resolveCurrentView();
  const sessionMember = findSessionMember(trip, participantSession);
  const currentMember = sessionMember ?? trip.members.find((member) => member.id === currentMemberId) ?? trip.members[0];
  const isApiMode = dataSource === "api" && !isLocalParticipantSession(participantSession);
  const isTripLoading = isApiMode && Boolean(participantSession) && !isCockpitLoaded;
  const canEdit = canTripRole(currentMember.role, "editItinerary");
  const canCreateSuggestion = canTripRole(currentMember.role, "createSuggestion");
  const canReviewSuggestions = canTripRole(currentMember.role, "reviewSuggestions");
  const canEditExpenses = canTripRole(currentMember.role, "editExpenses");
  const canManagePeople = canTripRole(currentMember.role, "managePeople");
  const canCreateStopNote = canCreateSuggestion || canEdit;
  const supportsContextRail = currentView === "overview" || currentView === "itinerary" || currentView === "timeline";
  const planItems = useMemo(
    () => trip.itineraryItems.filter((item) => item.planVariantId === selectedPlanVariantId),
    [selectedPlanVariantId, trip.itineraryItems],
  );
  const itineraryView = useMemo(() => buildItineraryView(planItems), [planItems]);
  /* v8 ignore next */
  const selectedItem = planItems.find((item) => item.id === selectedItemId) ?? planItems[0];
  const selectedDay = selectedItem?.day ?? itineraryView.dayGroups[0]?.day ?? trip.startDate;
  const selectedItemIdForView = selectedItem?.id ?? "";
  const expenseSummary = useMemo(
    () => backendExpenseSummary ?? buildExpenseSummary(trip.expenses, currentMember.id),
    [backendExpenseSummary, currentMember.id, trip.expenses],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => setNavigatedView(resolveCurrentView());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resolveCurrentView]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const persistedTrip = loadPersistedTrip();
      const nextTrip = persistedTrip ?? seedTrip;
      const persistedSession = loadPersistedParticipantSession(requireJoin, nextTrip, isApiMode, routeTripId);

      if (persistedTrip) {
        setTripState({ trip: persistedTrip, past: [], future: [] });
      }
      if (persistedSession) {
        setParticipantSession(persistedSession);
        setCurrentMemberId(persistedSession.memberId);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isApiMode, requireJoin, routeTripId]);

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

  useEffect(() => {
    if (!isApiMode || !routeTripId || !accountSessionLoaded || !accountSession || participantSession) return undefined;
    let cancelled = false;

    void accountClient
      .createTripMemberSession(accountSession.sessionToken, routeTripId)
      .then((session) => {
        if (cancelled) return;
        setAccountTripAccessDeniedRouteId(null);
        setAccessError(null);
        setParticipantSession(session);
        setCurrentMemberId(session.memberId);
        persistParticipantSession(session, isApiMode);
      })
      .catch(() => {
        if (cancelled) return;
        setAccountTripAccessDeniedRouteId(routeTripId);
        clearParticipantSession(isApiMode);
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession, accountSessionLoaded, isApiMode, participantSession, routeTripId]);

  const changeAccountSession = useCallback((session: AccountSession | null) => {
    setAccountSession(session);
    persistAccountSession(session);
  }, []);

  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient) return undefined;
    let cancelled = false;

    void resolvedApiClient
      .loadTrip(participantSession.tripId, participantSession.sessionToken)
      .then((cockpit) => {
        if (cancelled) return;
        setTripState({ trip: cockpit.trip, past: [], future: [] });
        setSuggestions(cockpit.suggestions);
        setTasks(cockpit.tasks);
        setStopNotes(cockpit.stopNotes);
        setBackendExpenseSummary(cockpit.expenseSummary);
        setIsCockpitLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearParticipantSession(isApiMode);
        setParticipantSession(null);
        setAccessError("unauthenticated");
        setIsCockpitLoaded(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isApiMode, participantSession, resolvedApiClient]);

  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient) return undefined;
    let cancelled = false;

    void Promise.resolve(resolvedApiClient.updatePresence(participantSession.tripId, participantSession.sessionToken, {
      clientMutationId: nextClientMutationId("presence-online"),
      presence: "online",
    }))
      .then((member) => {
        if (cancelled || !member) return;
        setTripState((current) => ({
          ...current,
          trip: {
            ...current.trip,
            members: current.trip.members.map((candidate) => (candidate.id === member.id ? member : candidate)),
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

  const navigateWorkspaceView = useCallback((view: PlanningView, href: string) => {
    setNavigatedView(view);
    setContextRailVisibility(false);
    if (typeof window !== "undefined" && window.location.pathname !== href) {
      window.history.pushState(null, "", href);
    }
  }, [setContextRailVisibility]);

  useEffect(() => {
    if (!supportsContextRail || typeof window === "undefined") return;
    if (window.sessionStorage.getItem("sagittarius-open-expenses") !== trip.id) return;
    window.sessionStorage.removeItem("sagittarius-open-expenses");
    const timeout = window.setTimeout(() => setContextRailVisibility(true), 0);
    return () => window.clearTimeout(timeout);
  }, [setContextRailVisibility, supportsContextRail, trip.id]);

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

  function addStop() {
    /* v8 ignore next */
    if (!canEdit) return;
    setDialogState({ mode: "create" });
  }

  function selectItem(itemId: string) {
    setSelectedItemId(itemId);
    setContextRailVisibility(true);
  }

  async function moveItem(draggedItemId: string, targetItemId: string) {
    /* v8 ignore next */
    if (!canEdit || draggedItemId === targetItemId) return;

    const nextTrip = moveTripItem(trip, draggedItemId, targetItemId, selectedPlanVariantId);
    if (!nextTrip) return;

    if (isApiMode && resolvedApiClient && participantSession) {
      const targetItem = nextTrip.itineraryItems.find((item) => item.id === targetItemId);
      if (!targetItem) return;
      const orderedIds = nextTrip.itineraryItems
        .filter((item) => item.planVariantId === targetItem.planVariantId && item.day === targetItem.day)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime))
        .map((item) => item.id);
      const reorderedItems = await resolvedApiClient.reorderItineraryItems(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-reorder"),
        planVariantId: targetItem.planVariantId,
        day: targetItem.day,
        itemIds: orderedIds,
      });
      setTripState((current) => {
        const itemsById = new Map(reorderedItems.map((item) => [item.id, item]));
        return {
          ...current,
          trip: {
            ...current.trip,
            itineraryItems: current.trip.itineraryItems.map((item) => itemsById.get(item.id) ?? item),
          },
        };
      });
      setContextRailVisibility(true);
      return;
    }

    commitTrip(() => nextTrip, draggedItemId);
    setContextRailVisibility(true);
  }

  async function createStop(values: StopFormValues) {
    if (isApiMode && resolvedApiClient && participantSession) {
      const createdItem = await resolvedApiClient.createItineraryItem(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-create"),
        planVariantId: selectedPlanVariantId,
        day: selectedDay,
        startTime: values.startTime,
        activity: values.activity,
        activityType: values.activityType,
        place: values.place,
        mapLink: buildMapLink(values.place),
        durationMinutes: values.durationMinutes,
        transportation: values.transportation,
        note: values.note,
      });
      setTripState((current) => ({
        ...current,
        trip: { ...current.trip, itineraryItems: [...current.trip.itineraryItems, createdItem] },
      }));
      setSelectedItemId(createdItem.id);
      setContextRailVisibility(true);
      setDialogState(null);
      return;
    }

    const nextItem: ItineraryItem = {
      id: nextLocalItemId(trip.itineraryItems, "item-new"),
      tripId: trip.id,
      planVariantId: selectedPlanVariantId,
      day: selectedDay,
      sortOrder: getNextSortOrder(planItems, selectedDay),
      startTime: values.startTime,
      activity: values.activity,
      activityType: values.activityType,
      place: values.place,
      linkLabel: "แผนที่",
      mapLink: buildMapLink(values.place),
      address: values.place,
      durationMinutes: values.durationMinutes,
      transportation: values.transportation,
      advisories: [],
      note: values.note,
      createdBy: currentMember.id,
      updatedAt: localMutationTimestamp,
      version: 1,
    };
    commitTrip((current) => ({ ...current, itineraryItems: [...current.itineraryItems, nextItem] }), nextItem.id);
    setContextRailVisibility(true);
    setDialogState(null);
  }

  function moveTripItem(current: Trip, draggedItemId: string, targetItemId: string, planVariantId: string): Trip | null {
    const draggedItem = current.itineraryItems.find((item) => item.id === draggedItemId);
    const targetItem = current.itineraryItems.find((item) => item.id === targetItemId);

    /* v8 ignore next */
    if (!draggedItem || !targetItem || draggedItem.planVariantId !== planVariantId || targetItem.planVariantId !== planVariantId) return null;

    /* v8 ignore next 3 */
    const targetDayItems = current.itineraryItems
      .filter((item) => item.planVariantId === targetItem.planVariantId && item.day === targetItem.day && item.id !== draggedItemId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
    const targetIndex = targetDayItems.findIndex((item) => item.id === targetItemId);

    /* v8 ignore next */
    if (targetIndex < 0) return null;

    const nextDayItems = [
      ...targetDayItems.slice(0, targetIndex),
      {
        ...draggedItem,
        day: targetItem.day,
        updatedAt: localMutationTimestamp,
        version: draggedItem.version + 1,
      },
      ...targetDayItems.slice(targetIndex),
    ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
    const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

    return {
      ...current,
      itineraryItems: current.itineraryItems.map((item) => nextItemsById.get(item.id) ?? item),
    };
  }

  async function updateSelectedStop(values: StopFormValues) {
    /* v8 ignore next */
    if (dialogState?.mode !== "edit") return;
    const itemId = dialogState.item.id;
    if (isApiMode && resolvedApiClient && participantSession) {
      const patchedItem = await resolvedApiClient.patchItineraryItem(trip.id, itemId, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-patch"),
        expectedVersion: dialogState.item.version,
        patch: {
          startTime: values.startTime,
          activity: values.activity,
          activityType: values.activityType,
          place: values.place,
          /* v8 ignore next */
          mapLink: dialogState.item.mapLink || buildMapLink(values.place),
          durationMinutes: values.durationMinutes,
          transportation: values.transportation,
          note: values.note,
        },
      });
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          itineraryItems: current.trip.itineraryItems.map((item) => (item.id === itemId ? patchedItem : item)),
        },
      }));
      setSelectedItemId(itemId);
      setContextRailVisibility(true);
      setDialogState(null);
      return;
    }
    commitTrip((current) => ({
      ...current,
      itineraryItems: current.itineraryItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              startTime: values.startTime,
              activity: values.activity,
              activityType: values.activityType,
              place: values.place,
              /* v8 ignore next */
              mapLink: item.mapLink || buildMapLink(values.place),
              address: values.place,
              durationMinutes: values.durationMinutes,
              transportation: values.transportation,
              note: values.note,
              updatedAt: localMutationTimestamp,
              version: item.version + 1,
            }
          : item,
      ),
    }));
    setSelectedItemId(itemId);
    setContextRailVisibility(true);
    setDialogState(null);
  }

  async function deleteSelectedStop() {
    /* v8 ignore next */
    if (dialogState?.mode !== "edit" || !canEdit) return;
    const itemId = dialogState.item.id;
    const remainingItems = trip.itineraryItems.filter((item) => item.id !== itemId);
    const nextSelectedItemId = remainingItems[0]?.id ?? "";
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteItineraryItem(trip.id, itemId, participantSession.sessionToken);
      setTripState((current) => ({
        ...current,
        trip: {
          ...current.trip,
          itineraryItems: current.trip.itineraryItems.filter((item) => item.id !== itemId),
          expenses: current.trip.expenses.filter((expense) => expense.itineraryItemId !== itemId),
        },
      }));
      setSelectedItemId(nextSelectedItemId);
      setContextRailVisibility(Boolean(nextSelectedItemId));
      setDialogState(null);
      return;
    }
    commitTrip(
      (current) => ({
        ...current,
        itineraryItems: current.itineraryItems.filter((item) => item.id !== itemId),
        expenses: current.expenses.filter((expense) => expense.itineraryItemId !== itemId),
      }),
      nextSelectedItemId,
    );
    setContextRailVisibility(Boolean(nextSelectedItemId));
    setDialogState(null);
  }

  function commitTrip(updater: (current: Trip) => Trip, nextSelectedItemId?: string) {
    setTripState((current) => {
      const nextTrip = updater(current.trip);
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
    persistParticipantSession(session, dataSource === "api" && !isLocalParticipantSession(session));

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const returnToParam = searchParams.get("rt");
      const returnTo = returnToParam ? decodeReturnTo(returnToParam) : null;
      if (returnTo && (returnTo.startsWith("/") || returnTo.startsWith("/trips/"))) {
        window.location.href = returnTo;
      } else if (!routeTripId) {
        window.location.href = appRoutes.tripOverview(session.tripId);
      }
    }
  }

  function leaveParticipantSession() {
    setParticipantSession(null);
    setCurrentMemberId(seedTrip.members[0].id);
    setContextRailVisibility(false);
    clearParticipantSession(isApiMode);
    setIsCockpitLoaded(false);
  }

  function replaceTripFromJoin(nextTrip: Trip) {
    if (!isApiMode) persistTripDraft(nextTrip);
    setTripState({ trip: nextTrip, past: [], future: [] });
  }

  function replaceCockpitFromApi(cockpit: TripCockpit) {
    setTripState({ trip: cockpit.trip, past: [], future: [] });
    setSuggestions(cockpit.suggestions);
    setTasks(cockpit.tasks);
    setStopNotes(cockpit.stopNotes);
    setBackendExpenseSummary(cockpit.expenseSummary);
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
      const cockpit = await resolvedApiClient.loadTrip(participantSession.tripId, participantSession.sessionToken);
      replaceCockpitFromApi(cockpit);
      setAccountClaimState({ status: "idle", message: "ผูก temp identity เข้ากับ account แล้ว" });
    } catch (caught) {
      setAccountClaimState({ status: "idle", message: caught instanceof Error ? caught.message : "Claim account ไม่สำเร็จ" });
    }
  }

  async function transferOwnerToAccountMember(targetMemberId: string) {
    if (!accountSession || !participantSession || !resolvedApiClient) return;
    setAccountClaimState({ status: "saving", message: null });
    try {
      await accountClient.transferOwner(accountSession.sessionToken, participantSession.tripId, targetMemberId);
      const cockpit = await resolvedApiClient.loadTrip(participantSession.tripId, participantSession.sessionToken);
      replaceCockpitFromApi(cockpit);
      setAccountClaimState({ status: "idle", message: "โอนสิทธิ owner แล้ว trip ยังมี owner 1 คนเสมอ" });
    } catch (caught) {
      setAccountClaimState({ status: "idle", message: caught instanceof Error ? caught.message : "โอน owner ไม่สำเร็จ" });
    }
  }

  async function resetMemberClaim(memberId: string) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.resetMemberClaim(trip.id, memberId, participantSession.sessionToken);
      commitTrip((current) => ({ ...current, members: current.members.map((candidate) => (candidate.id === memberId ? member : candidate)) }));
      return;
    }
    commitTrip((current) => resetTripParticipantClaim(current, memberId));
  }

  async function changeMemberRole(memberId: string, role: Exclude<TripRole, "owner">) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.patchMember(trip.id, memberId, participantSession.sessionToken, { role });
      commitTrip((current) => ({ ...current, members: current.members.map((candidate) => (candidate.id === memberId ? member : candidate)) }));
      return;
    }
    commitTrip((current) => updateTripParticipantRole(current, memberId, role));
  }

  async function changeMemberAccessStatus(memberId: string, accessStatus: TripMemberAccessStatus) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.patchMember(trip.id, memberId, participantSession.sessionToken, { accessStatus });
      commitTrip((current) => ({ ...current, members: current.members.map((candidate) => (candidate.id === memberId ? member : candidate)) }));
      return;
    }
    commitTrip((current) => setTripParticipantAccessStatus(current, memberId, accessStatus));
  }

  async function changeMemberPassword(memberId: string, password: string) {
    /* v8 ignore next */
    if (!canManagePeople || memberId !== currentMember.id) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.patchMember(trip.id, memberId, participantSession.sessionToken, { participantPassword: password });
      commitTrip((current) => ({ ...current, members: current.members.map((candidate) => (candidate.id === memberId ? member : candidate)) }));
      return;
    }
    commitTrip((current) => setTripParticipantPassword(current, memberId, password));
  }

  async function createMember(input: { displayName: string; role: Exclude<TripRole, "owner"> }) {
    /* v8 ignore next */
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.createMember(trip.id, participantSession.sessionToken, {
        displayName: input.displayName,
        role: input.role,
        color: nextTripMemberColor(trip.members.length),
      });
      commitTrip((current) => ({ ...current, members: [...current.members, member] }));
      return;
    }
    commitTrip((current) => createTripParticipant(current, input));
  }

  async function suggestSelectedStop() {
    /* v8 ignore next */
    if (!canCreateSuggestion || !selectedItem) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const suggestion = await resolvedApiClient.createSuggestion(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("suggestion-create"),
        type: "edit",
        targetItemId: selectedItem.id,
        planVariantId: selectedItem.planVariantId,
        proposedPatch: { activity: selectedItem.activity },
        sourceVersion: selectedItem.version,
      });
      setSuggestions((current) => [...current, suggestion]);
      setContextRailVisibility(true);
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
    setContextRailVisibility(true);
  }

  async function createTask(input: { title: string; visibility: TripTask["visibility"]; assigneeId?: string | null }) {
    const title = input.title.trim();
    /* v8 ignore next */
    if (!title) return;
    const visibility = input.visibility;
    if (isApiMode && resolvedApiClient && participantSession) {
      const task = await resolvedApiClient.createTask(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("task-create"),
        title,
        visibility,
        kind: "prep",
        /* v8 ignore next */
        assigneeId: visibility === "shared" ? input.assigneeId || null : currentMember.id,
        relatedItemId: null,
      });
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
        createdBy: currentMember.id,
        /* v8 ignore next */
        assigneeId: visibility === "shared" ? input.assigneeId || null : currentMember.id,
      },
    ]);
  }

  async function toggleTaskStatus(taskId: string) {
    if (isApiMode && resolvedApiClient && participantSession) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      /* v8 ignore next */
      if (!task) return;
      const nextTask = await resolvedApiClient.patchTask(trip.id, taskId, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("task-patch"),
        /* v8 ignore next */
        expectedVersion: task.version ?? 1,
        /* v8 ignore next */
        patch: { status: task.status === "done" ? "open" : "done" },
      });
      /* v8 ignore next */
      setTasks((current) => current.map((candidate) => (candidate.id === taskId ? nextTask : candidate)));
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
      const note = await resolvedApiClient.createStopNote(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("stop-note-create"),
        itineraryItemId: input.itemId,
        body,
      });
      setStopNotes((current) => [...current, note]);
      return;
    }
    setStopNotes((current) => [
      ...current,
      {
        id: nextLocalStopNoteId(current),
        tripId: trip.id,
        itemId: input.itemId,
        authorId: currentMember.id,
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function updateStopNote(input: { noteId: string; body: string }) {
    const body = input.body.trim();
    if (!body) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const existing = stopNotes.find((note) => note.id === input.noteId);
      if (!existing) return;
      const note = await resolvedApiClient.patchStopNote(trip.id, input.noteId, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("stop-note-patch"),
        expectedVersion: existing.version ?? 1,
        body,
      });
      setStopNotes((current) => current.map((candidate) => (candidate.id === input.noteId ? note : candidate)));
      return;
    }
    setStopNotes((current) =>
      current.map((note) =>
        note.id === input.noteId && (note.authorId === currentMember.id || canEdit)
          ? { ...note, body }
          : note,
      ),
    );
  }

  async function deleteStopNote(noteId: string) {
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteStopNote(trip.id, noteId, participantSession.sessionToken);
      setStopNotes((current) => current.filter((note) => note.id !== noteId));
      return;
    }
    setStopNotes((current) => current.filter((note) => note.id !== noteId || (note.authorId !== currentMember.id && !canEdit)));
  }

  async function createExpense(input: { itemId: string; title: string; amount: number; paidBy: string; category: Expense["category"] }) {
    if (!canEditExpenses) return;
    const amountMinor = Math.round(input.amount * 100);
    const splits = equalExpenseSplits(amountMinor, trip.members.map((member) => member.id));
    if (isApiMode && resolvedApiClient && participantSession) {
      const expense = await resolvedApiClient.createExpense(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("expense-create"),
        title: input.title,
        amountMinor,
        currency: "HKD",
        paidBy: input.paidBy,
        category: input.category,
        splits,
        itineraryItemId: input.itemId,
      });
      setTripState((current) => ({
        ...current,
        trip: { ...current.trip, expenses: [...current.trip.expenses, expense] },
      }));
      setBackendExpenseSummary(await resolvedApiClient.getExpenseSummary(trip.id, participantSession.sessionToken));
      return;
    }

    const expense: Expense = {
      id: `expense-local-${Date.now().toString(36)}`,
      tripId: trip.id,
      title: input.title,
      amount: input.amount,
      amountMinor,
      currency: "HKD",
      paidBy: input.paidBy,
      category: input.category,
      splits,
      itineraryItemId: input.itemId,
      version: 1,
    };
    commitTrip((current) => ({ ...current, expenses: [...current.expenses, expense] }));
  }

  async function deleteExpense(expenseId: string) {
    if (!canEditExpenses) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      await resolvedApiClient.deleteExpense(trip.id, expenseId, participantSession.sessionToken);
      setTripState((current) => ({
        ...current,
        trip: { ...current.trip, expenses: current.trip.expenses.filter((expense) => expense.id !== expenseId) },
      }));
      setBackendExpenseSummary(await resolvedApiClient.getExpenseSummary(trip.id, participantSession.sessionToken));
      return;
    }
    commitTrip((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== expenseId) }));
  }

  async function updateExpense(input: { expenseId: string; title: string; amount: number; paidBy: string; category: Expense["category"] }) {
    if (!canEditExpenses) return;
    const existing = trip.expenses.find((expense) => expense.id === input.expenseId);
    if (!existing) return;
    const amountMinor = Math.round(input.amount * 100);
    const splits = equalExpenseSplits(amountMinor, trip.members.map((member) => member.id));
    if (isApiMode && resolvedApiClient && participantSession) {
      const expense = await resolvedApiClient.patchExpense(trip.id, input.expenseId, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("expense-patch"),
        expectedVersion: existing.version ?? 1,
        title: input.title,
        amountMinor,
        currency: existing.currency ?? "HKD",
        paidBy: input.paidBy,
        category: input.category,
        splits,
        itineraryItemId: existing.itineraryItemId ?? null,
      });
      setTripState((current) => ({
        ...current,
        trip: { ...current.trip, expenses: current.trip.expenses.map((candidate) => (candidate.id === input.expenseId ? expense : candidate)) },
      }));
      setBackendExpenseSummary(await resolvedApiClient.getExpenseSummary(trip.id, participantSession.sessionToken));
      return;
    }
    commitTrip((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === input.expenseId
          ? { ...expense, title: input.title, amount: input.amount, amountMinor, paidBy: input.paidBy, category: input.category, splits, version: (expense.version ?? 1) + 1 }
          : expense,
      ),
    }));
  }

  function openExpensesWorkspace() {
    if (supportsContextRail) {
      setContextRailVisibility(true);
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("sagittarius-open-expenses", trip.id);
      window.location.href = appRoutes.tripItinerary(trip.id);
    }
  }

  async function reviewSuggestion(suggestionId: string, decision: "approved" | "rejected") {
    /* v8 ignore next */
    if (!canReviewSuggestions) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      let suggestion: Suggestion;
      /* v8 ignore else */
      if (decision === "approved") {
        suggestion = await resolvedApiClient.approveSuggestion(trip.id, suggestionId, participantSession.sessionToken);
      } else {
        /* v8 ignore next */
        suggestion = await resolvedApiClient.rejectSuggestion(trip.id, suggestionId, participantSession.sessionToken);
      }
      setSuggestions((current) => replaceSuggestionById(current, suggestionId, suggestion));
    } else if (decision === "rejected") {
      setSuggestions((current) => current.map((suggestion) => (suggestion.id === suggestionId ? { ...suggestion, status: "rejected" } : suggestion)));
      return;
    } else {
      const suggestion = suggestions.find((candidate) => candidate.id === suggestionId);
      /* v8 ignore next */
      if (!suggestion) return;
      const result = approveSuggestion(trip.itineraryItems, suggestion);
      /* v8 ignore next */
      if (result.status === "approved") {
        commitTrip((current) => ({ ...current, itineraryItems: result.items }));
      }
      setSuggestions((current) => current.map((candidate) => (candidate.id === suggestionId ? result.suggestion : candidate)));
    }
  }

  const isAccountTripAccessPending =
    requireJoin &&
    isApiMode &&
    Boolean(routeTripId) &&
    !sessionMember &&
    (!accountSessionLoaded || Boolean(accountSession && accountTripAccessDeniedRouteId !== routeTripId));

  useEffect(() => {
    if (
      requireJoin &&
      routeTripId &&
      !sessionMember &&
      !isAccountTripAccessPending &&
      !isTripLoading &&
      typeof window !== "undefined"
    ) {
      const returnTo = window.location.pathname + window.location.search;
      const joinHref = appRoutes.join(undefined, returnTo);
      window.location.replace(joinHref);
    }
  }, [requireJoin, routeTripId, sessionMember, isAccountTripAccessPending, isTripLoading]);

  if (isAccountTripAccessPending || isTripLoading) {
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
        trip={trip}
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
      onLeaveParticipantSession={requireJoin ? leaveParticipantSession : undefined}
      onNavigateView={navigateWorkspaceView}
      onOpenExpenses={openExpensesWorkspace}
      trip={trip}
      onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
    >
      <main className={workspaceShellClassName}>
        {requireJoin && !toastDismissed ? (
          <WorkspaceToast
            accountSession={accountSession}
            memberUserId={currentMember.userId}
            claimState={accountClaimState}
            canClaim={Boolean(accountSession && participantSession && !currentMember.userId)}
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
        {dataSource === "demo" && (!requireJoin || canManagePeople) ? (
          <label className={rolePreviewToolbarClassName}>
            <span>ดูในบทบาท</span>
            <select aria-label="Role preview" value={currentMember.id} onChange={(event) => setCurrentMemberId(event.target.value)}>
              {trip.members.map((member) => (
                <option value={member.id} key={member.id}>{member.displayName} / {member.role}</option>
              ))}
            </select>
          </label>
        ) : null}
        <div className={workspaceGridClassName} data-context-rail={contextRailOpen ? "open" : "closed"} data-command-bar="hidden">
          <div className={planningMainClassName}>
            {currentView === "members" ? (
              <TripMembersPage
                trip={trip}
                currentMember={currentMember}
                canManagePeople={canManagePeople}
                onChangeMemberAccessStatus={changeMemberAccessStatus}
                onChangeMemberPassword={changeMemberPassword}
                onChangeMemberRole={changeMemberRole}
                onCreateMember={createMember}
                onResetMemberClaim={resetMemberClaim}
                onTransferOwnership={
                  currentMember.role === "owner" && accountSession && participantSession && resolvedApiClient
                    ? transferOwnerToAccountMember
                    : undefined
                }
              />
            ) : currentView === "overview" ? (
              <OverviewPage
                trip={trip}
                currentMemberId={currentMember.id}
                expenseSummary={expenseSummary}
                items={planItems}
                itineraryView={itineraryView}
                suggestions={suggestions}
                tasks={tasks}
                onOpenExpenses={openExpensesWorkspace}
                onCreateTask={createTask}
                onToggleTaskStatus={toggleTaskStatus}
              />
            ) : currentView === "itinerary" ? (
              <SmartItineraryTable
                canRedo={tripState.future.length > 0}
                canRestructure={canEdit}
                canUndo={tripState.past.length > 0}
                contextRailOpen={contextRailOpen}
                endDate={trip.endDate}
                items={planItems}
                itineraryView={itineraryView}
                role={currentMember.role}
                startDate={trip.startDate}
                selectedItemId={selectedItemIdForView}
                tripName={trip.name}
                onAddStop={addStop}
                onSelectItem={selectItem}
                onMoveItem={moveItem}
                onRedo={redo}
                onToggleContextRail={() => setContextRailVisibility(!contextRailOpen)}
                onUndo={undo}
              />
            ) : currentView === "map" ? (
              <RouteMapView
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
                onToggleContextRail={() => setContextRailVisibility(!contextRailOpen)}
              />
            )}
          </div>
          {supportsContextRail && contextRailMounted && selectedItem ? (
            <ContextRail
              trip={trip}
              selectedItem={selectedItem}
              suggestions={suggestions}
              stopNotes={stopNotes}
              tasks={tasks}
              currentMember={currentMember}
              expenseSummary={expenseSummary}
              canEdit={canEdit}
              canCreateNote={canCreateStopNote}
              canCreateSuggestion={canCreateSuggestion}
              canReviewSuggestions={canReviewSuggestions}
              canEditExpenses={canEditExpenses}
              open={contextRailOpen}
              onCreateNote={createStopNote}
              onCreateExpense={createExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onDeleteNote={deleteStopNote}
              onEditSelected={() => setDialogState({ mode: "edit", item: selectedItem })}
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
            key={dialogState.mode === "edit" ? `edit-${dialogState.item.id}` : "create-stop"}
            mode={dialogState.mode}
            initialItem={dialogState.mode === "edit" ? dialogState.item : undefined}
            onClose={() => setDialogState(null)}
            onDelete={dialogState.mode === "edit" ? deleteSelectedStop : undefined}
            onSubmit={dialogState.mode === "edit" ? updateSelectedStop : createStop}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

function getNextSortOrder(items: ItineraryItem[], day: string): number {
  const dayOrders = items.filter((item) => item.day === day).map((item) => item.sortOrder);
  /* v8 ignore next */
  return dayOrders.length ? Math.max(...dayOrders) + 100 : 100;
}

function buildMapLink(place: string): string {
  /* v8 ignore next */
  return place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : "";
}

function equalExpenseSplits(amountMinor: number, memberIds: string[]): Record<string, number> {
  const participantIds = memberIds.length ? memberIds : ["unknown-member"];
  const baseShare = Math.floor(amountMinor / participantIds.length);
  let remainder = amountMinor - baseShare * participantIds.length;
  return Object.fromEntries(
    participantIds.map((memberId) => {
      const share = baseShare + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return [memberId, share];
    }),
  );
}

export function nextLocalItemId(items: ItineraryItem[], prefix: string): string {
  const existingIds = new Set(items.map((item) => item.id));
  let index = items.filter((item) => item.id.startsWith(`${prefix}-`)).length + 1;
  let id = `${prefix}-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  return id;
}

export function nextLocalSuggestionId(suggestions: Suggestion[]): string {
  const existingIds = new Set(suggestions.map((suggestion) => suggestion.id));
  let index = suggestions.filter((suggestion) => suggestion.id.startsWith("suggestion-local-")).length + 1;
  let id = `suggestion-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `suggestion-local-${index}`;
  }

  return id;
}

export function nextLocalTaskId(tasks: TripTask[]): string {
  const existingIds = new Set(tasks.map((task) => task.id));
  let index = tasks.filter((task) => task.id.startsWith("task-local-")).length + 1;
  let id = `task-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `task-local-${index}`;
  }

  return id;
}

export function nextLocalStopNoteId(notes: StopNote[]): string {
  const existingIds = new Set(notes.map((note) => note.id));
  let index = notes.filter((note) => note.id.startsWith("note-local-")).length + 1;
  let id = `note-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `note-local-${index}`;
  }

  return id;
}

export function nextClientMutationId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

export function replaceSuggestionById(suggestions: Suggestion[], suggestionId: string, replacement: Suggestion): Suggestion[] {
  return suggestions.map((candidate) => (candidate.id === suggestionId ? replacement : candidate));
}

function TripAccessLoadingFrame() {
  return (
    <main className="account-page account-page--portal" aria-busy="true" aria-label="Opening trip">
      <section className={portalLoadingCardClassName}>
        <span className={portalSkeletonTitleClassName} />
        <span className={portalSkeletonLineClassName} />
        <span className={portalSkeletonBlockClassName} />
      </section>
    </main>
  );
}

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !("localStorage" in window) || !window.localStorage) return null;
  return window.localStorage;
}

function getBrowserSessionStorage(): Storage | null {
  if (typeof window === "undefined" || !("sessionStorage" in window) || !window.sessionStorage) return null;
  return window.sessionStorage;
}

function getParticipantSessionStorage(isApiMode: boolean): Storage | null {
  return isApiMode ? getBrowserSessionStorage() : getBrowserLocalStorage();
}

function isLocalParticipantSession(session: TripParticipantSession | null): boolean {
  return session?.sessionToken.startsWith("local-") ?? false;
}

function loadPersistedTrip(): Trip | null {
  const rawTrip = getBrowserLocalStorage()?.getItem(tripStorageKey);
  if (!rawTrip) return null;
  try {
    return JSON.parse(rawTrip) as Trip;
  } catch {
    getBrowserLocalStorage()?.removeItem(tripStorageKey);
    return null;
  }
}

function loadPersistedParticipantSession(requireJoin: boolean, trip: Trip, isApiMode = false, routeTripId?: string): TripParticipantSession | null {
  if (isApiMode) getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
  const storage = getParticipantSessionStorage(isApiMode);
  if (!requireJoin || !storage) return null;
  const rawSession = storage.getItem(tripParticipantSessionStorageKey);
  if (!rawSession) return null;
  try {
    const parsedSession = JSON.parse(rawSession) as TripParticipantSession;
    if (routeTripId && parsedSession.tripId !== routeTripId) {
      storage.removeItem(tripParticipantSessionStorageKey);
      return null;
    }
    /* v8 ignore next */
    return isApiMode || findSessionMember(trip, parsedSession) ? parsedSession : null;
  } catch {
    storage.removeItem(tripParticipantSessionStorageKey);
    return null;
  }
}

function persistParticipantSession(session: TripParticipantSession, isApiMode: boolean) {
  if (isApiMode) getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
  getParticipantSessionStorage(isApiMode)?.setItem(tripParticipantSessionStorageKey, JSON.stringify(session));
}

function clearParticipantSession(isApiMode: boolean) {
  getParticipantSessionStorage(isApiMode)?.removeItem(tripParticipantSessionStorageKey);
  if (isApiMode) getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
}

function loadPersistedAccountSession(): AccountSession | null {
  const storage = getBrowserLocalStorage();
  if (!storage) return null;
  const rawSession = storage.getItem(accountSessionStorageKey);
  if (!rawSession) return null;
  try {
    const session = JSON.parse(rawSession) as AccountSession;
    if (session.kind !== "trusted" || Date.parse(session.expiresAt) <= Date.now()) {
      storage.removeItem(accountSessionStorageKey);
      return null;
    }
    return session;
  } catch {
    storage.removeItem(accountSessionStorageKey);
    return null;
  }
}

function persistAccountSession(session: AccountSession | null) {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  if (session?.kind === "trusted") {
    storage.setItem(accountSessionStorageKey, JSON.stringify(session));
  } else {
    storage.removeItem(accountSessionStorageKey);
  }
}

function persistTripDraft(trip: Trip) {
  getBrowserLocalStorage()?.setItem(tripStorageKey, JSON.stringify(trip));
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
  const title = isClaimed ? "เชื่อมต่อ account แล้ว" : accountSession ? "ผูกตัวตนกับ account" : "เข้าแบบ temp";
  const detail = isClaimed
    ? "ตัวตนนี้ผูกกับ account แล้ว"
    : accountSession
      ? "ผูกตัวตน temp นี้กับ account เพื่อเก็บประวัติและสถิติ"
      : "เข้าสู่ระบบจากหน้า access เพื่อผูก identity นี้กับ account ภายหลัง";

  return (
    <div className={className} data-dismissing={dismissing ? "true" : undefined} role="status" aria-live="polite">
      <span className={iconClassName} aria-hidden="true">
        <Icon name={isClaimed ? "check" : "clock"} />
      </span>
      <div className={bodyClassName}>
        <strong>{title}</strong>
        <span>{detail}</span>
        {claimState.message ? <span className={messageClassName}>{claimState.message}</span> : null}
      </div>
      <div className={actionsClassName}>
        {canClaim ? (
          <Button type="button" variant="secondary" onClick={onClaim} disabled={claimState.status === "saving"}>
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
