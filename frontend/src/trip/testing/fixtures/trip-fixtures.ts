import { buildExpenseSummary } from "../../expenses";
import { seedTrip } from "../../seed";
import type { ItineraryItem, Member, StopNote, Suggestion, Trip, TripRole, TripTask } from "../../types";
import { buildItineraryItem } from "./itinerary-item-fixtures";
export { buildDenseTripFixture } from "./dense-trip-fixture";
export {
  buildBookingDoc,
  buildBusTravelItineraryItem,
  buildFlightTravelItineraryItem,
  buildItineraryItem,
  buildSharedFlightBookingDoc,
} from "./itinerary-item-fixtures";

export type TripFixtureRole = TripRole;

function requireTripFixtureMember(
  predicate: (member: Member) => boolean,
  description: string,
): Member {
  const member = seedTrip.members.find(predicate);
  if (!member) {
    throw new Error(`Missing member test fixture: ${description}`);
  }
  return member;
}

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

export function buildTripFixtureSuggestion(
  overrides: Partial<Suggestion> & Pick<Suggestion, "id">,
): Suggestion {
  return {
    tripId: seedTrip.id,
    proposerId: "member-beam",
    type: "edit",
    targetItemId: "item-dimdim",
    planVariantId: seedTrip.activePlanVariantId,
    proposedPatch: { activity: "Dim Dim Sum" },
    sourceVersion: 1,
    status: "pending",
    createdAt: "2026-06-18T00:00:00.000Z",
    ...overrides,
  };
}

export const tripFixtureTasks: TripTask[] = [
  { id: "task-esim", title: "ซื้อ eSIM", status: "open", visibility: "private", kind: "prep", createdBy: "member-aom", assigneeId: "member-aom" },
  { id: "task-passport-nam", title: "เพิ่มชื่อ passport ของ Explorer Friend", status: "open", visibility: "shared", kind: "booking", createdBy: "member-nam", assigneeId: "member-nam", relatedItemId: "item-flight-bkk-hkg" },
  { id: "task-hotel-names", title: "ยืนยันรายชื่อผู้เข้าพักโรงแรม", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-hotel-checkin" },
  { id: "task-peak-tram", title: "จอง Peak Tram", status: "done", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-victoria-peak" },
  { id: "task-dimdim-booking", title: "ยืนยันคิว Dim Dim Sum", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-dimdim" },
  { id: "task-expenses", title: "สรุปค่าใช้จ่ายวันแรก", status: "open", visibility: "shared", kind: "prep", createdBy: "member-beam", assigneeId: "member-beam" },
];

export function buildTripFixtureTask(
  overrides: Partial<TripTask> & Pick<TripTask, "id">,
): TripTask {
  return {
    title: "Task",
    status: "open",
    visibility: "shared",
    kind: "prep",
    createdBy: "member-aom",
    ...overrides,
  };
}

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
    owner: requireTripFixtureMember(
      (member) => member.role === "owner",
      "owner",
    ),
    organizer: requireTripFixtureMember(
      (member) => member.role === "organizer",
      "organizer",
    ),
    traveler: requireTripFixtureMember(
      (member) => member.role === "traveler",
      "traveler",
    ),
    viewer: requireTripFixtureMember(
      (member) => member.id === "member-family",
      "member-family",
    ),
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

export function getTripFixtureMemberById(id: string): Member {
  return requireTripFixtureMember((member) => member.id === id, id);
}

export function getTripFixtureItineraryItem(id: string): ItineraryItem {
  const item = seedTrip.itineraryItems.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`Missing itinerary item test fixture: ${id}`);
  }
  return item;
}

export function buildTripFixtureItineraryItem(
  overrides: Partial<ItineraryItem> = {},
): ItineraryItem {
  return buildItineraryItem({
    tripId: tripFixture.trip.id,
    planVariantId: tripFixture.trip.activePlanVariantId,
    ...overrides,
  });
}

export function buildEmptyTripFixture(): Trip {
  return {
    ...seedTrip,
    itineraryItems: [],
    expenses: [],
  };
}
