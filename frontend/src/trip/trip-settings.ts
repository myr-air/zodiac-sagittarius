import type { PatchTripApiRequest } from "@/src/trip/api-client";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import { shiftItineraryItemsToStartDate } from "@/src/trip/itinerary-core";
import { buildShiftItineraryItemDayRequest } from "@/src/trip/itinerary-items";
import type { PatchItineraryItemApiRequest } from "@/src/trip/api-client";

export interface TripSettingsValues {
  name: string;
  destinationLabel: string;
  countries: string[];
  startDate: string;
  endDate: string;
  partySize: number;
  defaultTimezone: string;
}

export function buildPatchTripSettingsRequest(
  values: TripSettingsValues,
  options: {
    clientMutationId: string;
    expectedVersion: number;
  },
): PatchTripApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    name: values.name,
    destinationLabel: values.destinationLabel,
    countries: values.countries,
    startDate: values.startDate,
    endDate: values.endDate,
    partySize: values.partySize,
    defaultTimezone: values.defaultTimezone,
  };
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

export interface ShiftedItineraryItemDayRequest {
  itemId: string;
  request: PatchItineraryItemApiRequest;
}

export function buildShiftedItineraryItemDayRequests(
  items: ItineraryItem[],
  currentStartDate: string,
  nextStartDate: string,
  nextClientMutationId: (prefix: string) => string,
): ShiftedItineraryItemDayRequest[] {
  const shiftedItems = shiftItineraryItemsToStartDate(
    items,
    currentStartDate,
    nextStartDate,
  );
  return shiftedItems.flatMap((shiftedItem, index) => {
    const currentItem = items[index];
    if (!currentItem || currentItem.day === shiftedItem.day) return [];
    return [
      {
        itemId: shiftedItem.id,
        request: buildShiftItineraryItemDayRequest({
          clientMutationId: nextClientMutationId("itinerary-day-shift"),
          expectedVersion: shiftedItem.version,
          shiftedDay: shiftedItem.day,
        }),
      },
    ];
  });
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
