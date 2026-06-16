import type { ItineraryItem, Trip } from "@/src/trip/types";
import { shiftItineraryItemsToStartDate } from "@/src/trip/itinerary-time";

export interface TripSettingsValues {
  name: string;
  destinationLabel: string;
  countries: string[];
  startDate: string;
  endDate: string;
  partySize: number;
  defaultTimezone: string;
}

export function applyTripSettingsToTrip(
  current: Trip,
  values: TripSettingsValues,
): Trip {
  return {
    ...current,
    name: values.name,
    destinationLabel: values.destinationLabel,
    countries: values.countries,
    startDate: values.startDate,
    endDate: values.endDate,
    partySize: values.partySize,
    defaultTimezone: values.defaultTimezone,
    itineraryItems: shiftItineraryItemsToStartDate(
      current.itineraryItems,
      current.startDate,
      values.startDate,
    ),
    version: (current.version ?? 0) + 1,
  };
}

export function mergePatchedTripSettings(
  current: Trip,
  patchedTrip: Trip,
  patchedItemsById: Map<string, ItineraryItem>,
): Trip {
  return {
    ...current,
    name: patchedTrip.name,
    destinationLabel: patchedTrip.destinationLabel,
    countries: patchedTrip.countries,
    startDate: patchedTrip.startDate,
    endDate: patchedTrip.endDate,
    partySize: patchedTrip.partySize,
    defaultTimezone: patchedTrip.defaultTimezone,
    activePlanVariantId:
      patchedTrip.activePlanVariantId || current.activePlanVariantId,
    itineraryItems: current.itineraryItems.map(
      (item) => patchedItemsById.get(item.id) ?? item,
    ),
    version: patchedTrip.version,
  };
}
