"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/src/components/AppShell";
import { CommandBar } from "@/src/components/CommandBar";
import { ContextRail } from "@/src/components/ContextRail";
import { RouteMapView } from "@/src/components/RouteMapView";
import { SmartItineraryTable } from "@/src/components/SmartItineraryTable";
import { StopDialog, type StopFormValues } from "@/src/components/StopDialog";
import { TimelineView } from "@/src/components/TimelineView";
import { TripJoinGate } from "@/src/components/TripJoinGate";
import { canTripRole, findSessionMember, resetTripParticipantClaim, tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import type { ItineraryItem, Suggestion, Trip, TripParticipantSession, TripRole } from "@/src/trip/types";

const seedSuggestions: Suggestion[] = [
  {
    id: "suggestion-rating",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "ร้านนี้ได้รับคะแนนสูง 4.3/5 จาก 8,332 รีวิว" },
    sourceVersion: 1,
    status: "pending",
    createdAt: "2026-05-27T13:00:00.000Z",
  },
  {
    id: "suggestion-booking",
    tripId: seedTrip.id,
    proposerId: "member-nam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์" },
    sourceVersion: 2,
    status: "conflicted",
    createdAt: "2026-05-27T14:00:00.000Z",
  },
];

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";

export type PlanningView = "itinerary" | "map" | "timeline";

interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
}

export function SagittariusApp({ initialView = "itinerary", requireJoin = false }: SagittariusAppProps) {
  const [tripState, setTripState] = useState<{ trip: Trip; past: Trip[]; future: Trip[] }>(() => ({
    trip: loadPersistedTrip() ?? seedTrip,
    past: [],
    future: [],
  }));
  const [participantSession, setParticipantSession] = useState<TripParticipantSession | null>(null);
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
  const canEdit = canEditItinerary(currentMember.role);
  const planItems = useMemo(
    () => trip.itineraryItems.filter((item) => item.planVariantId === selectedPlanVariantId),
    [selectedPlanVariantId, trip.itineraryItems],
  );
  const selectedItem = planItems.find((item) => item.id === selectedItemId) ?? planItems[0];
  const expenseSummary = useMemo(() => buildExpenseSummary(trip.expenses, currentMember.id), [currentMember.id, trip.expenses]);

  useEffect(() => {
    const storage = getBrowserLocalStorage();
    if (!requireJoin || !storage) return;
    const rawSession = storage.getItem(tripParticipantSessionStorageKey);
    if (!rawSession) return;
    try {
      const parsedSession = JSON.parse(rawSession) as TripParticipantSession;
      if (findSessionMember(trip, parsedSession)) {
        setParticipantSession(parsedSession);
        setCurrentMemberId(parsedSession.memberId);
      }
    } catch {
      storage.removeItem(tripParticipantSessionStorageKey);
    }
  }, [requireJoin, trip]);

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
      if (event.target.closest(".top-app-bar, .side-rail")) return;
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

  function updateSelectedStop(values: StopFormValues) {
    if (dialogState?.mode !== "edit") return;
    const itemId = dialogState.item.id;
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
    persistTripDraft(nextTrip);
    setTripState({ trip: nextTrip, past: [], future: [] });
  }

  function resetMemberClaim(memberId: string) {
    if (!canTripRole(currentMember.role, "managePeople")) return;
    commitTrip((current) => resetTripParticipantClaim(current, memberId));
  }

  if (requireJoin && !sessionMember) {
    return <TripJoinGate trip={trip} onTripChange={replaceTripFromJoin} onAuthenticated={authenticateParticipant} />;
  }

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
        <CommandBar
          trip={trip}
          currentMemberId={currentMember.id}
          canEdit={canEdit}
          canUndo={tripState.past.length > 0}
          canRedo={tripState.future.length > 0}
          contextRailOpen={contextRailOpen}
          showDetailsToggle={initialView !== "map"}
          canSwitchMember={!requireJoin || canTripRole(currentMember.role, "managePeople")}
          onChangeMember={setCurrentMemberId}
          onAddStop={addStop}
          onUndo={undo}
          onRedo={redo}
          onToggleContextRail={() => setContextRailVisibility(!contextRailOpen)}
        />
        <div className="workspace-grid" data-context-rail={contextRailOpen ? "open" : "closed"}>
          <div className="planning-main">
            {initialView === "itinerary" ? (
              <SmartItineraryTable
                items={planItems}
                role={currentMember.role}
                startDate={trip.startDate}
                selectedItemId={selectedItem.id}
                onSelectItem={selectItem}
                onMoveItem={moveItem}
              />
            ) : null}
            {initialView === "map" ? (
              <RouteMapView
                items={planItems}
                startDate={trip.startDate}
              />
            ) : null}
            {initialView === "timeline" ? (
              <TimelineView
                items={planItems}
                selectedItemId={selectedItem.id}
                startDate={trip.startDate}
                onSelectItem={selectItem}
              />
            ) : null}
          </div>
          {initialView !== "map" && contextRailMounted ? (
            <ContextRail
              trip={trip}
              selectedItem={selectedItem}
              currentMember={currentMember}
              suggestions={seedSuggestions}
              expenseSummary={expenseSummary}
              canEdit={canEdit}
              open={contextRailOpen}
              onEditSelected={() => setDialogState({ mode: "edit", item: selectedItem })}
              onResetMemberClaim={resetMemberClaim}
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

function canEditItinerary(role: TripRole): boolean {
  return role === "owner" || role === "organizer";
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

function persistTripDraft(trip: Trip) {
  getBrowserLocalStorage()?.setItem(tripStorageKey, JSON.stringify(trip));
}
