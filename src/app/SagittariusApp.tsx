"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/src/components/AppShell";
import { CommandBar } from "@/src/components/CommandBar";
import { ContextRail } from "@/src/components/ContextRail";
import { SmartItineraryTable } from "@/src/components/SmartItineraryTable";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import type { ItineraryItem, Suggestion, TripRole } from "@/src/trip/types";

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

export function SagittariusApp() {
  const [trip, setTrip] = useState(seedTrip);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedDay, setSelectedDay] = useState("2025-05-16");
  const [selectedPlanVariantId, setSelectedPlanVariantId] = useState(seedTrip.activePlanVariantId);
  const [currentMemberId, setCurrentMemberId] = useState(seedTrip.members[0].id);
  const [selectedItemId, setSelectedItemId] = useState("item-dimdim");

  const currentMember = trip.members.find((member) => member.id === currentMemberId) ?? trip.members[0];
  const canEdit = canEditItinerary(currentMember.role);
  const planItems = useMemo(
    () => trip.itineraryItems.filter((item) => item.planVariantId === selectedPlanVariantId),
    [selectedPlanVariantId, trip.itineraryItems],
  );
  const selectedItem = planItems.find((item) => item.id === selectedItemId) ?? planItems[0];
  const expenseSummary = useMemo(() => buildExpenseSummary(trip.expenses, currentMember.id), [currentMember.id, trip.expenses]);

  function duplicateItem(itemId: string) {
    if (!canEdit) return;
    const source = planItems.find((item) => item.id === itemId);
    if (!source) return;
    const duplicate: ItineraryItem = {
      ...source,
      id: `item-copy-${Date.now()}`,
      activity: `${source.activity} copy`,
      sortOrder: source.sortOrder + 10,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    setTrip((current) => ({ ...current, itineraryItems: [...current.itineraryItems, duplicate] }));
  }

  function addStop() {
    if (!canEdit) return;
    const nextItem: ItineraryItem = {
      id: `item-new-${Date.now()}`,
      tripId: trip.id,
      planVariantId: selectedPlanVariantId,
      day: selectedDay,
      sortOrder: Date.now(),
      startTime: "16:30",
      activity: "New planning stop",
      activityType: "experience",
      place: "Add place",
      linkLabel: "แผนที่",
      mapLink: "",
      address: "",
      durationMinutes: 45,
      transportation: "Add route",
      advisories: [],
      note: "Draft row added locally before backend sync.",
      createdBy: currentMember.id,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    setTrip((current) => ({ ...current, itineraryItems: [...current.itineraryItems, nextItem] }));
    setSelectedItemId(nextItem.id);
  }

  return (
    <AppShell collapsed={sidebarCollapsed} currentMember={currentMember} trip={trip} onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}>
      <main className="workspace-shell">
        <CommandBar
          trip={trip}
          currentMemberId={currentMember.id}
          selectedDay={selectedDay}
          selectedPlanVariantId={selectedPlanVariantId}
          canEdit={canEdit}
          onChangeMember={setCurrentMemberId}
          onChangeDay={setSelectedDay}
          onChangePlan={setSelectedPlanVariantId}
          onAddStop={addStop}
        />
        <div className="workspace-grid">
          <SmartItineraryTable
            items={planItems}
            role={currentMember.role}
            startDate={trip.startDate}
            selectedItemId={selectedItem.id}
            onSelectItem={setSelectedItemId}
            onDuplicateItem={duplicateItem}
          />
          <ContextRail
            trip={trip}
            selectedItem={selectedItem}
            currentMember={currentMember}
            suggestions={seedSuggestions}
            expenseSummary={expenseSummary}
          />
        </div>
      </main>
    </AppShell>
  );
}

function canEditItinerary(role: TripRole): boolean {
  return role === "owner" || role === "organizer";
}
