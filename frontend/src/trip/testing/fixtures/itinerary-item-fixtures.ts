import { mainItineraryPathName } from "../../itinerary-paths";
import type {
  BookingDoc,
  ItineraryItem,
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryTimeMode,
} from "../../types";

export function buildBookingDoc(
  overrides: Partial<BookingDoc> & Pick<BookingDoc, "id" | "type" | "title">,
): BookingDoc {
  return {
    tripId: "trip-id",
    tripPlanId: null,
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
    createdBy: "system",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

const defaultItem: Readonly<ItineraryItem> = {
  id: "item-id",
  tripId: "trip-id",
  planVariantId: "plan-id",
  day: "2026-06-19",
  sortOrder: 100,
  startTime: "09:00",
  endTime: null,
  endOffsetDays: 0,
  activity: "Test activity",
  activityType: "travel",
  place: "Test place",
  linkLabel: "",
  mapLink: "",
  transportation: "Walk",
  details: {},
  durationMinutes: 45,
  note: "",
  createdBy: "user",
  updatedAt: "2026-06-01T00:00:00.000Z",
  version: 1,
  status: "planned",
  priority: "normal" as ItineraryItemPriority,
  timeMode: "scheduled" as ItineraryTimeMode,
  itemKind: "travel" as ItineraryItemKind,
  isPlanBlock: false,
  pathGroupId: "group-id",
  pathRole: "main",
  pathName: mainItineraryPathName,
  address: "",
  coordinates: undefined,
  parentItemId: null,
};

export function buildItineraryItem(
  overrides: Partial<ItineraryItem> = {},
): ItineraryItem {
  return {
    ...defaultItem,
    ...overrides,
  };
}

export function buildFlightTravelItineraryItem(
  overrides: Partial<ItineraryItem> = {},
): ItineraryItem {
  const base = buildItineraryItem({
    id: "travel-flight-row",
    activity: "Airport transfer",
    activityType: "travel",
    itemKind: "travel",
    place: "HKG",
    transportation: "",
    startTime: "09:00",
    endTime: "11:30",
    details: {
      from: "BKK",
      mode: "flight",
      to: "HKG",
    },
  });
  return {
    ...base,
    ...overrides,
    details: {
      ...base.details,
      ...overrides.details,
    },
  };
}

export function buildBusTravelItineraryItem(
  overrides: Partial<ItineraryItem> = {},
): ItineraryItem {
  const base = buildItineraryItem({
    id: "bus-leg-row",
    activity: "Terminal shuttle",
    activityType: "travel",
    itemKind: "travel",
    details: {
      mode: "bus",
    },
  });
  return {
    ...base,
    ...overrides,
    details: {
      ...base.details,
      ...overrides.details,
    },
  };
}

export function buildSharedFlightBookingDoc(
  relatedItineraryItemIds: string[],
  overrides: Partial<BookingDoc> = {},
): BookingDoc {
  return buildBookingDoc({
    id: "booking-shared-flight",
    type: "flight",
    title: "CX shared flight ticket",
    status: "booked",
    providerName: "Cathay Pacific",
    confirmationCode: "CX1234",
    startsAt: "2026-06-19T09:00:00",
    endsAt: "2026-06-19T11:30:00",
    relatedItineraryItemIds,
    notes: "Shared ticket",
    ...overrides,
  });
}
