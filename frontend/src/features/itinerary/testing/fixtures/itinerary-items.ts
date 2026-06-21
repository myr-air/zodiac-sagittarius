import type {
  BookingDoc,
  ItineraryItem,
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryTimeMode,
} from "@/src/trip/types";
import type { ItineraryPathOption } from "@/src/trip/itinerary";
import {
  mainPathOption,
  pathOptionStoryPlanA,
  pathPlanOneOption,
  storyRainPathOption,
} from "./path-options";
import { mainItineraryPathName } from "@/src/trip/itinerary-paths";

export const defaultSmartItineraryPathOptions = [
  mainPathOption,
  pathPlanOneOption,
  storyRainPathOption,
] as const satisfies ReadonlyArray<ItineraryPathOption>;

export const defaultPathOptionsForPanel = [
  mainPathOption,
  pathPlanOneOption,
  pathOptionStoryPlanA,
] as const satisfies ReadonlyArray<ItineraryPathOption>;

export const defaultDayPathOptions = [
  mainPathOption,
  pathOptionStoryPlanA,
] as const satisfies ReadonlyArray<ItineraryPathOption>;

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

export function buildItineraryItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    ...defaultItem,
    ...overrides,
  };
}
