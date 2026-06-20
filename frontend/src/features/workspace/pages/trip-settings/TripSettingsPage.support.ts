import { daysBetweenIsoDates, shiftIsoDate } from "@/src/trip/itinerary-time";
import type { Trip } from "@/src/trip/types";
import type { TripSettingsFormValues } from "./TripSettingsPage.types";

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

export function tripToSettingsForm(trip: Trip): TripSettingsFormValues {
  return {
    name: trip.name,
    destinationLabel: trip.destinationLabel,
    startDate: trip.startDate,
    endDate: trip.endDate,
    partySize: trip.partySize ?? 1,
    defaultTimezone: trip.defaultTimezone ?? "Asia/Bangkok",
  };
}

export function hasInvalidTripSettingsDateRange(form: TripSettingsFormValues): boolean {
  return Boolean(form.startDate && form.endDate && form.endDate < form.startDate);
}

export function countStopsOutsideSettingsRange(trip: Trip, form: TripSettingsFormValues): number {
  if (!form.startDate || !form.endDate || hasInvalidTripSettingsDateRange(form)) return 0;

  const dayShift = daysBetweenIsoDates(trip.startDate, form.startDate);
  return trip.itineraryItems.filter((item) => {
    const shiftedDay = shiftIsoDate(item.day, dayShift);
    return shiftedDay < form.startDate || shiftedDay > form.endDate;
  }).length;
}

export function canSubmitTripSettings({
  canEdit,
  form,
  invalidDateRange,
  status,
}: {
  canEdit: boolean;
  form: TripSettingsFormValues;
  invalidDateRange: boolean;
  status: "idle" | "saving" | "saved";
}): boolean {
  return Boolean(
    canEdit &&
      !invalidDateRange &&
      form.name.trim() &&
      form.destinationLabel.trim() &&
      form.defaultTimezone.trim() &&
      Number.isFinite(form.partySize) &&
      form.partySize >= 1 &&
      status !== "saving",
  );
}

export function normalizeTripSettingsForm(form: TripSettingsFormValues): TripSettingsFormValues {
  return {
    name: form.name.trim(),
    destinationLabel: form.destinationLabel.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    partySize: Math.max(1, Math.floor(form.partySize || 1)),
    defaultTimezone: form.defaultTimezone.trim(),
  };
}
