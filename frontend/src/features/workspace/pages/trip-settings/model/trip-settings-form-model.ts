import type { Trip } from "@/src/trip/types";
import {
  isValidTripPartySize,
  normalizeTripPartySize,
} from "@/src/trip/settings";

export interface TripSettingsFormValues {
  name: string;
  destinationLabel: string;
  startDate: string;
  endDate: string;
  partySize: number;
  defaultTimezone: string;
}

export function tripToSettingsForm(trip: Trip): TripSettingsFormValues {
  return {
    name: trip.name,
    destinationLabel: trip.destinationLabel,
    startDate: trip.startDate,
    endDate: trip.endDate,
    partySize: normalizeTripPartySize(trip.partySize),
    defaultTimezone: trip.defaultTimezone ?? "Asia/Bangkok",
  };
}

export function hasInvalidTripSettingsDateRange(form: TripSettingsFormValues): boolean {
  return Boolean(form.startDate && form.endDate && form.endDate < form.startDate);
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
      isValidTripPartySize(form.partySize) &&
      status !== "saving",
  );
}

export function normalizeTripSettingsForm(form: TripSettingsFormValues): TripSettingsFormValues {
  return {
    name: form.name.trim(),
    destinationLabel: form.destinationLabel.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    partySize: normalizeTripPartySize(form.partySize),
    defaultTimezone: form.defaultTimezone.trim(),
  };
}
