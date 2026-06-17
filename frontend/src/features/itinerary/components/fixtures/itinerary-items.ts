import type {
  ItineraryItem,
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryTimeMode,
} from "@/src/trip/types";

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
  pathName: "Main",
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

