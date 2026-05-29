"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/src/components/AppShell";
import { ContextRail } from "@/src/components/ContextRail";
import { OverviewPage } from "@/src/components/OverviewPage";
import { RouteMapView } from "@/src/components/RouteMapView";
import { SmartItineraryTable } from "@/src/components/SmartItineraryTable";
import { StopDialog, type StopFormValues } from "@/src/components/StopDialog";
import { TimelineView } from "@/src/components/TimelineView";
import { TripJoinGate } from "@/src/components/TripJoinGate";
import { TripMembersPage } from "@/src/components/TripMembersPage";
import { createTripApiClient, type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import {
  canTripRole,
  createTripParticipant,
  findSessionMember,
  resetTripParticipantClaim,
  setTripParticipantPassword,
  setTripParticipantAccessStatus,
  tripParticipantSessionStorageKey,
  updateTripParticipantRole,
} from "@/src/trip/auth";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { tripFixtureStopNotes, tripFixtureSuggestions, tripFixtureTasks } from "@/src/demo/trip-fixtures";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { approveSuggestion } from "@/src/trip/suggestions";
import type { ExpenseSummary, ItineraryItem, StopNote, Suggestion, Trip, TripMemberAccessStatus, TripParticipantSession, TripRole, TripTask } from "@/src/trip/types";

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";

export type PlanningView = "overview" | "itinerary" | "map" | "timeline" | "members";

interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
  dataSource?: "api" | "demo";
  apiClient?: TripApiClient;
}

export function SagittariusApp({ initialView = "overview", requireJoin = false, dataSource = "demo", apiClient }: SagittariusAppProps) {
  const resolvedApiClient = useMemo(
    () => apiClient ?? (dataSource === "api" ? createTripApiClient({ baseUrl: process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL ?? "" }) : undefined),
    [apiClient, dataSource],
  );
  const [tripState, setTripState] = useState<{ trip: Trip; past: Trip[]; future: Trip[] }>(() => ({
    trip: seedTrip,
    past: [],
    future: [],
  }));
  const [participantSession, setParticipantSession] = useState<TripParticipantSession | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => tripFixtureSuggestions.map((suggestion) => ({ ...suggestion })));
  const [tasks, setTasks] = useState<TripTask[]>(() => tripFixtureTasks.map((task) => ({ ...task })));
  const [stopNotes, setStopNotes] = useState<StopNote[]>(() => tripFixtureStopNotes.map((note) => ({ ...note })));
  const [backendExpenseSummary, setBackendExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextRailOpen, setContextRailOpen] = useState(false);
  const [contextRailMounted, setContextRailMounted] = useState(false);
  const selectedDay = "2025-05-16";
  const selectedPlanVariantId = tripState.trip.activePlanVariantId;
  const [currentMemberId, setCurrentMemberId] = useState(seedTrip.members[0].id);
  const [selectedItemId, setSelectedItemId] = useState("item-dimdim");
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; item: ItineraryItem } | null>(null);

  const trip = tripState.trip;
  const sessionMember = findSessionMember(trip, participantSession);
  const currentMember = sessionMember ?? trip.members.find((member) => member.id === currentMemberId) ?? trip.members[0];
  const isApiMode = dataSource === "api";
  const canEdit = canTripRole(currentMember.role, "editItinerary");
  const canCreateSuggestion = canTripRole(currentMember.role, "createSuggestion");
  const canReviewSuggestions = canTripRole(currentMember.role, "reviewSuggestions");
  const canEditExpenses = !isApiMode && canTripRole(currentMember.role, "editExpenses");
  const canManagePeople = !isApiMode && canTripRole(currentMember.role, "managePeople");
  const canCreateStopNote = !isApiMode && (canCreateSuggestion || canEdit);
  const planItems = useMemo(
    () => trip.itineraryItems.filter((item) => item.planVariantId === selectedPlanVariantId),
    [selectedPlanVariantId, trip.itineraryItems],
  );
  const selectedItem = planItems.find((item) => item.id === selectedItemId) ?? planItems[0];
  const expenseSummary = useMemo(
    () => backendExpenseSummary ?? buildExpenseSummary(trip.expenses, currentMember.id),
    [backendExpenseSummary, currentMember.id, trip.expenses],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const persistedTrip = loadPersistedTrip();
      const nextTrip = persistedTrip ?? seedTrip;
      const persistedSession = loadPersistedParticipantSession(requireJoin, nextTrip);

      if (persistedTrip) {
        setTripState({ trip: persistedTrip, past: [], future: [] });
      }
      if (persistedSession) {
        setParticipantSession(persistedSession);
        setCurrentMemberId(persistedSession.memberId);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [requireJoin]);

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
      });

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
    if (!canEdit) return;
    setDialogState({ mode: "create" });
  }

  function selectItem(itemId: string) {
    setSelectedItemId(itemId);
    setContextRailVisibility(true);
  }

  function moveItem(draggedItemId: string, targetItemId: string) {
    if (!canEdit || draggedItemId === targetItemId) return;

    commitTrip((current) => {
      const draggedItem = current.itineraryItems.find((item) => item.id === draggedItemId);
      const targetItem = current.itineraryItems.find((item) => item.id === targetItemId);

      if (!draggedItem || !targetItem || draggedItem.planVariantId !== selectedPlanVariantId || targetItem.planVariantId !== selectedPlanVariantId) {
        return current;
      }

      const targetDayItems = current.itineraryItems
        .filter((item) => item.planVariantId === targetItem.planVariantId && item.day === targetItem.day && item.id !== draggedItemId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
      const targetIndex = targetDayItems.findIndex((item) => item.id === targetItemId);

      if (targetIndex < 0) return current;

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
    }, draggedItemId);
    setContextRailVisibility(true);
  }

  function createStop(values: StopFormValues) {
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

  async function updateSelectedStop(values: StopFormValues) {
    if (dialogState?.mode !== "edit") return;
    const itemId = dialogState.item.id;
    if (dataSource === "api" && resolvedApiClient && participantSession) {
      const patchedItem = await resolvedApiClient.patchItineraryItem(itemId, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-patch"),
        expectedVersion: dialogState.item.version,
        patch: {
          startTime: values.startTime,
          activity: values.activity,
          activityType: values.activityType,
          place: values.place,
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
      if (!next) return current;
      return {
        trip: next,
        past: [...current.past, current.trip].slice(-20),
        future: current.future.slice(1),
      };
    });
  }

  function authenticateParticipant(session: TripParticipantSession) {
    setParticipantSession(session);
    setCurrentMemberId(session.memberId);
    getBrowserLocalStorage()?.setItem(tripParticipantSessionStorageKey, JSON.stringify(session));
  }

  function leaveParticipantSession() {
    setParticipantSession(null);
    setCurrentMemberId(seedTrip.members[0].id);
    setContextRailVisibility(false);
    getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
  }

  function replaceTripFromJoin(nextTrip: Trip) {
    if (dataSource !== "api") persistTripDraft(nextTrip);
    setTripState({ trip: nextTrip, past: [], future: [] });
  }

  function replaceCockpitFromApi(cockpit: TripCockpit) {
    setTripState({ trip: cockpit.trip, past: [], future: [] });
    setSuggestions(cockpit.suggestions);
    setTasks(cockpit.tasks);
    setStopNotes(cockpit.stopNotes);
    setBackendExpenseSummary(cockpit.expenseSummary);
  }

  function resetMemberClaim(memberId: string) {
    if (!canManagePeople) return;
    commitTrip((current) => resetTripParticipantClaim(current, memberId));
  }

  function changeMemberRole(memberId: string, role: Exclude<TripRole, "owner">) {
    if (!canManagePeople) return;
    commitTrip((current) => updateTripParticipantRole(current, memberId, role));
  }

  function changeMemberAccessStatus(memberId: string, accessStatus: TripMemberAccessStatus) {
    if (!canManagePeople) return;
    commitTrip((current) => setTripParticipantAccessStatus(current, memberId, accessStatus));
  }

  function changeMemberPassword(memberId: string, password: string) {
    if (!canManagePeople || memberId !== currentMember.id) return;
    commitTrip((current) => setTripParticipantPassword(current, memberId, password));
  }

  function createMember(input: { displayName: string; role: Exclude<TripRole, "owner"> }) {
    if (!canManagePeople) return;
    commitTrip((current) => createTripParticipant(current, input));
  }

  async function suggestSelectedStop() {
    if (!canCreateSuggestion || !selectedItem) return;
    if (dataSource === "api" && resolvedApiClient && participantSession) {
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
    if (!title) return;
    const visibility = input.visibility;
    if (dataSource === "api" && resolvedApiClient && participantSession) {
      const task = await resolvedApiClient.createTask(trip.id, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("task-create"),
        title,
        visibility,
        kind: "prep",
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
        assigneeId: visibility === "shared" ? input.assigneeId || null : currentMember.id,
      },
    ]);
  }

  async function toggleTaskStatus(taskId: string) {
    if (dataSource === "api" && resolvedApiClient && participantSession) {
      const task = tasks.find((candidate) => candidate.id === taskId);
      if (!task) return;
      const nextTask = await resolvedApiClient.patchTask(taskId, participantSession.sessionToken, {
        clientMutationId: nextClientMutationId("task-patch"),
        expectedVersion: task.version ?? 1,
        patch: { status: task.status === "done" ? "open" : "done" },
      });
      setTasks((current) => current.map((candidate) => (candidate.id === taskId ? nextTask : candidate)));
      return;
    }
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "done" ? "open" : "done",
            }
          : task,
      ),
    );
  }

  function createStopNote(input: { itemId: string; body: string }) {
    const body = input.body.trim();
    if (!body || !canCreateStopNote) return;
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

  async function reviewSuggestion(suggestionId: string, decision: "approved" | "rejected") {
    if (!canReviewSuggestions) return;
    if (dataSource === "api" && resolvedApiClient && participantSession) {
      const suggestion =
        decision === "approved"
          ? await resolvedApiClient.approveSuggestion(suggestionId, participantSession.sessionToken)
          : await resolvedApiClient.rejectSuggestion(suggestionId, participantSession.sessionToken);
      setSuggestions((current) => current.map((candidate) => (candidate.id === suggestionId ? suggestion : candidate)));
      return;
    }
    if (decision === "rejected") {
      setSuggestions((current) => current.map((suggestion) => (suggestion.id === suggestionId ? { ...suggestion, status: "rejected" } : suggestion)));
      return;
    }

    const suggestion = suggestions.find((candidate) => candidate.id === suggestionId);
    if (!suggestion) return;
    const result = approveSuggestion(trip.itineraryItems, suggestion);
    if (result.status === "approved") {
      commitTrip((current) => ({ ...current, itineraryItems: result.items }));
    }
    setSuggestions((current) => current.map((candidate) => (candidate.id === suggestionId ? result.suggestion : candidate)));
  }

  if (requireJoin && !sessionMember) {
    return (
      <TripJoinGate
        apiClient={resolvedApiClient}
        trip={resolvedApiClient ? undefined : trip}
        onTripChange={replaceTripFromJoin}
        onAuthenticated={authenticateParticipant}
        onCockpitLoaded={replaceCockpitFromApi}
      />
    );
  }

  const supportsContextRail = initialView === "itinerary" || initialView === "timeline";

  return (
    <AppShell
      activeView={initialView}
      collapsed={sidebarCollapsed}
      currentMember={currentMember}
      onLeaveParticipantSession={requireJoin ? leaveParticipantSession : undefined}
      trip={trip}
      onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
    >
      <main className="workspace-shell">
        {(!requireJoin || canManagePeople) ? (
          <label className="sr-only">
            Role preview
            <select value={currentMember.id} onChange={(event) => setCurrentMemberId(event.target.value)}>
              {trip.members.map((member) => (
                <option value={member.id} key={member.id}>{member.displayName} / {member.role}</option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="workspace-grid" data-context-rail={contextRailOpen ? "open" : "closed"} data-command-bar="hidden">
          <div className="planning-main">
            {initialView === "members" ? (
              <TripMembersPage
                trip={trip}
                currentMember={currentMember}
                canManagePeople={canManagePeople}
                onChangeMemberAccessStatus={changeMemberAccessStatus}
                onChangeMemberPassword={changeMemberPassword}
                onChangeMemberRole={changeMemberRole}
                onCreateMember={createMember}
                onResetMemberClaim={resetMemberClaim}
              />
            ) : initialView === "overview" ? (
              <OverviewPage
                trip={trip}
                currentMemberId={currentMember.id}
                expenseSummary={expenseSummary}
                items={planItems}
                suggestions={suggestions}
                tasks={tasks}
                onCreateTask={createTask}
                onToggleTaskStatus={toggleTaskStatus}
              />
            ) : initialView === "itinerary" ? (
              <SmartItineraryTable
                canRedo={tripState.future.length > 0}
                canRestructure={!isApiMode}
                canUndo={tripState.past.length > 0}
                contextRailOpen={contextRailOpen}
                endDate={trip.endDate}
                items={planItems}
                role={currentMember.role}
                startDate={trip.startDate}
                selectedItemId={selectedItem.id}
                tripName={trip.name}
                onAddStop={addStop}
                onSelectItem={selectItem}
                onMoveItem={moveItem}
                onRedo={redo}
                onToggleContextRail={() => setContextRailVisibility(!contextRailOpen)}
                onUndo={undo}
              />
            ) : initialView === "map" ? (
              <RouteMapView
                endDate={trip.endDate}
                items={planItems}
                startDate={trip.startDate}
                tripName={trip.name}
              />
            ) : (
              <TimelineView
                contextRailOpen={contextRailOpen}
                endDate={trip.endDate}
                items={planItems}
                selectedItemId={selectedItem.id}
                startDate={trip.startDate}
                tripName={trip.name}
                onSelectItem={selectItem}
                onToggleContextRail={() => setContextRailVisibility(!contextRailOpen)}
              />
            )}
          </div>
          {supportsContextRail && contextRailMounted ? (
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
              onEditSelected={() => setDialogState({ mode: "edit", item: selectedItem })}
              onReviewSuggestion={reviewSuggestion}
              onSuggestSelected={suggestSelectedStop}
              onToggleTaskStatus={toggleTaskStatus}
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
            onSubmit={dialogState.mode === "edit" ? updateSelectedStop : createStop}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

function getNextSortOrder(items: ItineraryItem[], day: string): number {
  const dayOrders = items.filter((item) => item.day === day).map((item) => item.sortOrder);
  return dayOrders.length ? Math.max(...dayOrders) + 100 : 100;
}

function buildMapLink(place: string): string {
  return place ? `https://maps.google.com/?q=${encodeURIComponent(place)}` : "";
}

function nextLocalItemId(items: ItineraryItem[], prefix: string): string {
  const existingIds = new Set(items.map((item) => item.id));
  let index = items.filter((item) => item.id.startsWith(`${prefix}-`)).length + 1;
  let id = `${prefix}-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `${prefix}-${index}`;
  }

  return id;
}

function nextLocalSuggestionId(suggestions: Suggestion[]): string {
  const existingIds = new Set(suggestions.map((suggestion) => suggestion.id));
  let index = suggestions.filter((suggestion) => suggestion.id.startsWith("suggestion-local-")).length + 1;
  let id = `suggestion-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `suggestion-local-${index}`;
  }

  return id;
}

function nextLocalTaskId(tasks: TripTask[]): string {
  const existingIds = new Set(tasks.map((task) => task.id));
  let index = tasks.filter((task) => task.id.startsWith("task-local-")).length + 1;
  let id = `task-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `task-local-${index}`;
  }

  return id;
}

function nextLocalStopNoteId(notes: StopNote[]): string {
  const existingIds = new Set(notes.map((note) => note.id));
  let index = notes.filter((note) => note.id.startsWith("note-local-")).length + 1;
  let id = `note-local-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `note-local-${index}`;
  }

  return id;
}

function nextClientMutationId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !("localStorage" in window) || !window.localStorage) return null;
  return window.localStorage;
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

function loadPersistedParticipantSession(requireJoin: boolean, trip: Trip): TripParticipantSession | null {
  const storage = getBrowserLocalStorage();
  if (!requireJoin || !storage) return null;
  const rawSession = storage.getItem(tripParticipantSessionStorageKey);
  if (!rawSession) return null;
  try {
    const parsedSession = JSON.parse(rawSession) as TripParticipantSession;
    return findSessionMember(trip, parsedSession) ? parsedSession : null;
  } catch {
    storage.removeItem(tripParticipantSessionStorageKey);
    return null;
  }
}

function persistTripDraft(trip: Trip) {
  getBrowserLocalStorage()?.setItem(tripStorageKey, JSON.stringify(trip));
}
