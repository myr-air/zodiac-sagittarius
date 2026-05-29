import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import type { StopNote, Suggestion, Trip, TripTask } from "./types";

export type TripFixtureRole = "owner" | "organizer" | "traveler" | "viewer";

export const tripFixtureSuggestions: Suggestion[] = [
  {
    id: "suggestion-rating",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "ร้านนี้ได้รับคะแนนสูง 4.3/5 จาก 8,332 รีวิว" },
    sourceVersion: 4,
    status: "pending",
    createdAt: "2026-05-27T13:00:00.000Z",
  },
  {
    id: "suggestion-booking",
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { note: "แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์" },
    sourceVersion: 2,
    status: "conflicted",
    createdAt: "2026-05-27T14:00:00.000Z",
  },
];

export const tripFixtureTasks: TripTask[] = [
  { id: "task-esim", title: "ซื้อ eSIM", status: "open", visibility: "private", kind: "prep", createdBy: "member-aom", assigneeId: "member-aom" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-victoria-peak" },
  { id: "task-dimdim-booking", title: "ยืนยันคิว Dim Dim Sum", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-dimdim" },
  { id: "task-expenses", title: "สรุปค่าใช้จ่ายวันแรก", status: "open", visibility: "shared", kind: "prep", createdBy: "member-beam", assigneeId: "member-beam" },
];

export const tripFixtureStopNotes: StopNote[] = [
  {
    id: "note-dimdim-1",
    tripId: seedTrip.id,
    itemId: "item-dimdim",
    authorId: "member-beam",
    body: "ลองไปเช้าหน่อย ถ้าคิวยาวให้สลับกับ coffee break",
    createdAt: "2026-05-27T12:30:00.000Z",
  },
];

export const tripFixture = {
  trip: seedTrip,
  planItems: seedTrip.itineraryItems.filter((item) => item.planVariantId === seedTrip.activePlanVariantId),
  suggestions: tripFixtureSuggestions,
  tasks: tripFixtureTasks,
  stopNotes: tripFixtureStopNotes,
  currentMembers: {
    owner: seedTrip.members.find((member) => member.role === "owner") ?? seedTrip.members[0],
    organizer: seedTrip.members.find((member) => member.role === "organizer") ?? seedTrip.members[0],
    traveler: seedTrip.members.find((member) => member.role === "traveler") ?? seedTrip.members[0],
    viewer: seedTrip.members.find((member) => member.id === "member-family") ?? seedTrip.members[0],
  },
  expenseSummaries: {
    owner: buildExpenseSummary(seedTrip.expenses, "member-aom"),
    organizer: buildExpenseSummary(seedTrip.expenses, "member-beam"),
    traveler: buildExpenseSummary(seedTrip.expenses, "member-nam"),
    viewer: buildExpenseSummary(seedTrip.expenses, "member-family"),
  },
} as const;

export function getTripFixtureMember(role: TripFixtureRole) {
  return tripFixture.currentMembers[role];
}

export function buildEmptyTripFixture(): Trip {
  return {
    ...seedTrip,
    itineraryItems: [],
    expenses: [],
  };
}

export function buildDenseTripFixture(): Trip {
  const extraItems = seedTrip.itineraryItems.slice(0, 6).map((item, index) => ({
    ...item,
    id: `${item.id}-dense-${index + 1}`,
    day: "2025-05-17",
    sortOrder: 900 + index * 100,
    startTime: `${15 + index}:00`,
    version: item.version + 1,
  }));

  return {
    ...seedTrip,
    itineraryItems: [...seedTrip.itineraryItems.map((item) => ({ ...item })), ...extraItems],
  };
}
