import type { BookingDoc, Expense, ItineraryItem, Member, StopNote, Trip } from "./types";

export const bookingDocTestMembers: Member[] = [
  { id: "member-owner", displayName: "Owner", role: "owner", presence: "online", color: "#0f766e" },
  { id: "member-organizer", displayName: "Organizer", role: "organizer", presence: "online", color: "#2563eb" },
  { id: "member-traveler", displayName: "Traveler", role: "traveler", presence: "away", color: "#f97316" },
  { id: "member-viewer", displayName: "Viewer", role: "viewer", presence: "offline", color: "#64748b" },
];

export const bookingDocTestDocs: BookingDoc[] = [
  createBookingDocFixture({
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
  createBookingDocFixture({
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
  createBookingDocFixture({
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

export function createBookingDocFixture(
  input: Partial<BookingDoc> = {},
): BookingDoc {
  return {
    id: "booking",
    tripId: "trip-1",
    title: "Booking",
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

export function createBookingDocTripFixture(bookingDocs: BookingDoc[]): Trip {
  const itineraryItems: ItineraryItem[] = [
    createItineraryItemFixture("item-flight", "BKK to HKG flight", "2026-06-18"),
    createItineraryItemFixture("item-hotel", "Hotel check-in", "2026-06-18"),
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
    members: bookingDocTestMembers,
    itineraryItems,
    expenses,
    expenseReminders: [],
    bookingDocs,
    stopNotes,
  };
}

export function createItineraryItemFixture(id: string, activity: string, day: string): ItineraryItem {
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
