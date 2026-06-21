import type { ItineraryItem } from "@/src/trip/types";

export function overviewItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return {
    id: "sample",
    tripId: "t1",
    planVariantId: "p1",
    day: "2026-06-19",
    sortOrder: 100,
    startTime: "09:00",
    activity: "Sample",
    activityType: "food",
    place: "Place",
    linkLabel: "Map",
    mapLink: "https://maps.example",
    durationMinutes: 60,
    transportation: "Walk",
    details: {},
    note: "",
    createdBy: "m1",
    updatedAt: "2026-06-19",
    version: 1,
    ...overrides,
  };
}
