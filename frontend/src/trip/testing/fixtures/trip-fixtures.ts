import { buildExpenseSummary } from "../../expenses";
import { seedTrip } from "../../seed";
import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "../../itinerary-path-identifiers";
import { expenseCategoryValues } from "../../trip-record-types";
import type { Expense, ItineraryItem, ItineraryPath, Member, StopNote, Suggestion, Trip, TripRole, TripTask } from "../../types";

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

export const tripFixtureTasks: TripTask[] = [
  { id: "task-esim", title: "ซื้อ eSIM", status: "open", visibility: "private", kind: "prep", createdBy: "member-aom", assigneeId: "member-aom" },
  { id: "task-passport-nam", title: "เพิ่มชื่อ passport ของ Explorer Friend", status: "open", visibility: "shared", kind: "booking", createdBy: "member-nam", assigneeId: "member-nam", relatedItemId: "item-flight-bkk-hkg" },
  { id: "task-hotel-names", title: "ยืนยันรายชื่อผู้เข้าพักโรงแรม", status: "open", visibility: "shared", kind: "booking", createdBy: "member-beam", assigneeId: "member-beam", relatedItemId: "item-hotel-checkin" },
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

export function buildEmptyTripFixture(): Trip {
  return {
    ...seedTrip,
    itineraryItems: [],
    expenses: [],
  };
}

export function buildDenseTripFixture(): Trip {
  const denseDays = Array.from({ length: 12 }, (_, index) => dateOffset(seedTrip.startDate, index));
  const pathBranches: Array<Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole">> = [
    { pathId: mainItineraryPathId, pathName: mainItineraryPathName, pathRole: "main" },
    { pathGroupId: "dense-morning", pathId: "dense-plan-a", pathName: "Plan A", pathRole: "alternative" },
    { pathGroupId: "dense-morning", pathId: "dense-plan-b", pathName: "Plan B", pathRole: "alternative" },
  ];
  const densePaths: ItineraryPath[] = [
    ...(seedTrip.itineraryPaths ?? []),
    {
      id: "dense-plan-a",
      tripId: seedTrip.id,
      name: "Plan A",
      scope: "trip",
      createdBy: "member-aom",
      createdAt: "2026-05-27T00:00:00.000Z",
      updatedAt: "2026-05-27T00:00:00.000Z",
    },
    {
      id: "dense-plan-b",
      tripId: seedTrip.id,
      name: "Plan B",
      scope: "trip",
      createdBy: "member-aom",
      createdAt: "2026-05-27T00:00:00.000Z",
      updatedAt: "2026-05-27T00:00:00.000Z",
    },
  ];
  const denseItems = Array.from({ length: 120 }, (_, index) => {
    const base = seedTrip.itineraryItems[index % seedTrip.itineraryItems.length];
    const day = denseDays[index % denseDays.length];
    const branch = pathBranches[index % pathBranches.length];
    const hour = 7 + (index % 13);
    const minute = (index % 2) * 30;

    return {
      ...base,
      ...branch,
      id: `${base.id}-dense-${index + 1}`,
      day,
      sortOrder: Math.floor(index / denseDays.length) * 100 + (index % denseDays.length) * 10,
      startTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      activity: `${base.activity} · dense stop ${index + 1}`,
      place: `${base.place} · area ${((index % 18) + 1).toString().padStart(2, "0")}`,
      version: (base.version ?? 1) + 1,
    };
  });
  const denseMembers: Member[] = [
    ...seedTrip.members.map((member) => ({ ...member })),
    ...Array.from({ length: 24 }, (_, index): Member => ({
      id: `member-dense-${index + 1}`,
      displayName: `Dense Traveler ${String(index + 1).padStart(2, "0")} / นักเดินทางรายละเอียดยาว`,
      role: index % 5 === 0 ? "viewer" : index % 3 === 0 ? "organizer" : "traveler",
      presence: index % 4 === 0 ? "online" : index % 4 === 1 ? "away" : "offline",
      color: ["#0f766e", "#2563eb", "#f97316", "#64748b", "#db2777", "#0891b2"][index % 6],
      accessStatus: "active",
    })),
  ];
  const splitMemberIds = denseMembers.slice(0, 8).map((member) => member.id);
  const denseExpenses: Expense[] = Array.from({ length: 72 }, (_, index) => {
    const amount = 180 + index * 17;
    return {
      id: `expense-dense-${index + 1}`,
      tripId: seedTrip.id,
      title: `Shared meal and transfer ${index + 1}`,
      amount,
      amountMinor: amount * 100,
      currency: "HKD",
      paidBy: denseMembers[index % denseMembers.length].id,
      splits: Object.fromEntries(splitMemberIds.map((memberId) => [memberId, Math.round((amount / splitMemberIds.length) * 100) / 100])),
      category: expenseCategoryValues[index % expenseCategoryValues.length],
      itineraryItemId: denseItems[index % denseItems.length].id,
      version: 1,
    };
  });

  return {
    ...seedTrip,
    itineraryPaths: densePaths,
    members: denseMembers,
    itineraryItems: denseItems,
    expenses: denseExpenses,
  };
}

function dateOffset(date: string, offsetDays: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + offsetDays);
  return parsed.toISOString().slice(0, 10);
}
