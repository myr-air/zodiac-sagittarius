import type {
  BookingDoc,
  ItineraryItem,
  Member,
} from "@/src/trip/types";

export const bookingCommandMembers: Pick<Member, "id">[] = [
  { id: "member-owner" },
  { id: "member-traveler" },
];

export function itineraryItem(input: Partial<ItineraryItem>): ItineraryItem {
  return {
    id: "item-1",
    tripId: "trip-1",
    planVariantId: "plan-main",
    day: "2026-06-18",
    sortOrder: 1,
    startTime: "",
    endTime: "",
    activity: "Activity",
    activityType: "experience",
    place: "",
    linkLabel: "",
    mapLink: "",
    durationMinutes: null,
    transportation: "",
    details: {},
    note: "",
    createdBy: "member-owner",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
    ...input,
  };
}

export function bookingDoc(input: Partial<BookingDoc> = {}): BookingDoc {
  return {
    id: "booking-1",
    tripId: "trip-1",
    type: "other",
    title: "Booking",
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
