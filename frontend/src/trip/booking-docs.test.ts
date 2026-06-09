import { describe, expect, it } from "vitest";
import {
  buildBookingDocsSummary,
  canViewBookingDoc,
  filterBookingDocs,
  findBookingDocRelations,
} from "./booking-docs";
import type { BookingDoc, Expense, ItineraryItem, Member, StopNote, Trip } from "./types";

const members: Member[] = [
  { id: "member-owner", displayName: "Owner", role: "owner", presence: "online", color: "#0f766e" },
  { id: "member-organizer", displayName: "Organizer", role: "organizer", presence: "online", color: "#2563eb" },
  { id: "member-traveler", displayName: "Traveler", role: "traveler", presence: "away", color: "#f97316" },
  { id: "member-viewer", displayName: "Viewer", role: "viewer", presence: "offline", color: "#64748b" },
];

const docs: BookingDoc[] = [
  bookingDoc({
    id: "booking-flight",
    type: "flight",
    title: "BKK to HKG flight",
    status: "confirmed",
    startsAt: "2026-06-18T09:00:00+07:00",
    priceAmount: 2180,
    currency: "HKD",
    travelerIds: ["member-owner", "member-traveler"],
    relatedItineraryItemIds: ["item-flight"],
    relatedExpenseIds: ["expense-flight"],
    relatedTaskIds: ["task-flight"],
  }),
  bookingDoc({
    id: "booking-passport",
    type: "passport",
    title: "Traveler passport",
    status: "needs_action",
    visibility: "sensitive",
    ownerMemberId: "member-traveler",
    startsAt: "2026-06-01T00:00:00+07:00",
    travelerIds: ["member-traveler"],
    relatedTaskIds: ["task-passport"],
  }),
  bookingDoc({
    id: "booking-hotel",
    type: "hotel",
    title: "Tsim Sha Tsui hotel",
    status: "paid",
    providerName: "Joii Stay",
    startsAt: "2026-06-18T15:00:00+08:00",
    endsAt: "2026-06-21T11:00:00+08:00",
    priceAmount: 5600,
    currency: "HKD",
    travelerIds: ["member-owner", "member-organizer", "member-traveler"],
    relatedItineraryItemIds: ["item-hotel"],
    relatedExpenseIds: ["expense-hotel-deposit", "expense-hotel-balance"],
  }),
];

describe("booking docs helpers", () => {
  it("summarizes booking cost, action items, sensitive readiness, and next upcoming item", () => {
    const summary = buildBookingDocsSummary(docs, members, "2026-06-10T00:00:00.000Z");

    expect(summary.totalCostByCurrency).toEqual({ HKD: 7780 });
    expect(summary.needsActionCount).toBe(1);
    expect(summary.sensitiveDocsTotal).toBe(1);
    expect(summary.sensitiveDocsReady).toBe(0);
    expect(summary.upcoming?.id).toBe("booking-flight");
  });

  it("applies role-aware visibility for shared, sensitive, and private records", () => {
    const passport = docs[1];
    const privateOwnerDoc = bookingDoc({
      id: "booking-private",
      title: "Owner-only cloud folder",
      visibility: "private",
      ownerMemberId: "member-owner",
      createdBy: "member-owner",
    });

    expect(canViewBookingDoc(docs[0], members[3])).toBe(true);
    expect(canViewBookingDoc(passport, members[0])).toBe(true);
    expect(canViewBookingDoc(passport, members[1])).toBe(true);
    expect(canViewBookingDoc(passport, members[2])).toBe(true);
    expect(canViewBookingDoc(passport, members[3])).toBe(false);
    expect(canViewBookingDoc(privateOwnerDoc, members[0])).toBe(true);
    expect(canViewBookingDoc(privateOwnerDoc, members[1])).toBe(false);
  });

  it("filters by search, type, status, traveler, date, and visibility", () => {
    const trip = tripFixture(docs);

    expect(filterBookingDocs(docs, { query: "hotel" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-hotel"]);
    expect(filterBookingDocs(docs, { type: "flight" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-flight"]);
    expect(filterBookingDocs(docs, { status: "needs_action" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-passport"]);
    expect(filterBookingDocs(docs, { travelerId: "member-organizer" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-hotel"]);
    expect(filterBookingDocs(docs, { day: "2026-06-18" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-flight", "booking-hotel"]);
    expect(filterBookingDocs(docs, {}, trip, members[3]).map((doc) => doc.id)).toEqual(["booking-flight", "booking-hotel"]);
  });

  it("resolves linked itinerary items, tasks, expenses, notes, and travelers", () => {
    const trip = tripFixture(docs);
    const relations = findBookingDocRelations(docs[0], trip, [
      { id: "task-flight", title: "Check in online", status: "open", visibility: "shared", kind: "booking", createdBy: "member-owner" },
      { id: "task-passport", title: "Add passport number", status: "open", visibility: "shared", kind: "booking", createdBy: "member-organizer" },
    ]);

    expect(relations.itineraryItems.map((item) => item.id)).toEqual(["item-flight"]);
    expect(relations.tasks.map((task) => task.id)).toEqual(["task-flight"]);
    expect(relations.expenses.map((expense) => expense.id)).toEqual(["expense-flight"]);
    expect(relations.notes.map((note) => note.id)).toEqual(["note-flight"]);
    expect(relations.travelers.map((member) => member.id)).toEqual(["member-owner", "member-traveler"]);
  });
});

function bookingDoc(input: Partial<BookingDoc> & Pick<BookingDoc, "id" | "title">): BookingDoc {
  return {
    tripId: "trip-1",
    type: "other",
    status: "draft",
    visibility: "shared",
    ownerMemberId: null,
    providerName: null,
    confirmationCode: null,
    startsAt: null,
    endsAt: null,
    timezone: null,
    priceAmount: null,
    currency: null,
    travelerIds: [],
    externalLinks: [],
    relatedItineraryItemIds: [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: null,
    createdBy: "member-owner",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
    ...input,
  };
}

function tripFixture(bookingDocs: BookingDoc[]): Trip {
  const itineraryItems: ItineraryItem[] = [
    itineraryItem("item-flight", "BKK to HKG flight", "2026-06-18"),
    itineraryItem("item-hotel", "Hotel check-in", "2026-06-18"),
  ];
  const expenses: Expense[] = [
    { id: "expense-flight", title: "Flight fare", amount: 2180, paidBy: "member-owner", splits: {}, category: "transport" },
    { id: "expense-hotel-deposit", title: "Hotel deposit", amount: 1200, paidBy: "member-organizer", splits: {}, category: "stay" },
    { id: "expense-hotel-balance", title: "Hotel balance", amount: 4400, paidBy: "member-owner", splits: {}, category: "stay" },
  ];
  const stopNotes: StopNote[] = [
    { id: "note-flight", tripId: "trip-1", itemId: "item-flight", authorId: "member-owner", body: "Keep passport in carry-on.", createdAt: "2026-06-01T00:00:00.000Z" },
  ];

  return {
    id: "trip-1",
    joinId: "TRIP-1",
    joinPasswordHash: "hash",
    name: "Test trip",
    destinationLabel: "Hong Kong",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
    activePlanVariantId: "plan-main",
    planVariants: [{ id: "plan-main", tripId: "trip-1", name: "Main", kind: "main", description: "Main plan" }],
    members,
    itineraryItems,
    expenses,
    expenseReminders: [],
    bookingDocs,
    stopNotes,
  };
}

function itineraryItem(id: string, activity: string, day: string): ItineraryItem {
  return {
    id,
    tripId: "trip-1",
    planVariantId: "plan-main",
    day,
    sortOrder: 100,
    startTime: "09:00",
    activity,
    activityType: "travel",
    place: "Hong Kong",
    linkLabel: "Map",
    mapLink: "https://maps.example.com",
    durationMinutes: 60,
    transportation: "Train",
    details: {},
    note: "",
    createdBy: "member-owner",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
  };
}
