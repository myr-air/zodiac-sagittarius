import type { Trip } from "@/src/trip/types";
import type { TripSettingsFormValues } from "../TripSettingsPage.types";

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
