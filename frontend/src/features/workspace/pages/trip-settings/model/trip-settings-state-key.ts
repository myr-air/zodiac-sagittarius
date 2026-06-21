import type { Trip } from "@/src/trip/types";

export function tripSettingsStateKey(trip: Trip): string {
  return [
    trip.id,
    trip.name,
    trip.destinationLabel,
    trip.startDate,
    trip.endDate,
    trip.partySize,
    trip.defaultTimezone,
  ].join(":");
}
