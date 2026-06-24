import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";

export function stopFormValues(
  input: Partial<StopFormValues> = {},
): StopFormValues {
  return {
    day: "2026-06-20",
    pathId: "path-rain",
    parentItemId: null,
    itemKind: "activity",
    timeMode: "scheduled",
    isPlanBlock: false,
    status: "confirmed",
    priority: "normal",
    startTime: "10:00",
    endTime: "11:00",
    endOffsetDays: 0,
    activity: "Updated stop",
    activityType: "food",
    place: "Updated place",
    mapLink: "https://maps.example/updated",
    durationMinutes: 60,
    transportation: "Walk",
    details: { note: "details" },
    note: "Bring booking code",
    ...input,
  };
}

export const stopLocationFields = {
  address: "123 Updated Road",
  coordinates: { lat: 13.7563, lng: 100.5018 },
  mapLink: "https://maps.example/resolved",
};
