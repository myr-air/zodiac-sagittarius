import { daysBetweenIsoDates, shiftIsoDate } from "@/src/trip/itinerary-core";
import type { Trip } from "@/src/trip/types";
import type { TripSettingsFormValues } from "../TripSettingsPage.types";
import { hasInvalidTripSettingsDateRange } from "./trip-settings-form-model";

export function countStopsOutsideSettingsRange(trip: Trip, form: TripSettingsFormValues): number {
  if (!form.startDate || !form.endDate || hasInvalidTripSettingsDateRange(form)) return 0;

  const dayShift = daysBetweenIsoDates(trip.startDate, form.startDate);
  return trip.itineraryItems.filter((item) => {
    const shiftedDay = shiftIsoDate(item.day, dayShift);
    return shiftedDay < form.startDate || shiftedDay > form.endDate;
  }).length;
}
