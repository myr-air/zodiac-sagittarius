import { useMemo, useState, type FormEvent } from "react";
import type { Trip } from "@/src/trip/types";
import {
  canSubmitTripSettings,
  hasInvalidTripSettingsDateRange,
  normalizeTripSettingsForm,
  tripToSettingsForm,
} from "./trip-settings-form-model";
import { countStopsOutsideSettingsRange } from "./trip-settings-date-impact";
import type { TripSettingsFormValues } from "./TripSettingsPage.types";

interface TripSettingsFormStateInput {
  canEdit: boolean;
  saveFailedMessage: string;
  trip: Trip;
  onSave: (values: TripSettingsFormValues) => Promise<void>;
}

export function useTripSettingsFormState({
  canEdit,
  saveFailedMessage,
  trip,
  onSave,
}: TripSettingsFormStateInput) {
  const [form, setForm] = useState<TripSettingsFormValues>(() =>
    tripToSettingsForm(trip),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const invalidDateRange = hasInvalidTripSettingsDateRange(form);
  const outsideStopCount = useMemo(
    () => countStopsOutsideSettingsRange(trip, form),
    [form, trip],
  );
  const canSubmit = canSubmitTripSettings({
    canEdit,
    form,
    invalidDateRange,
    status,
  });

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setError(null);
    try {
      await onSave(normalizeTripSettingsForm(form));
      setStatus("saved");
    } catch {
      setStatus("idle");
      setError(saveFailedMessage);
    }
  }

  return {
    canSubmit,
    error,
    form,
    invalidDateRange,
    outsideStopCount,
    setForm,
    status,
    submitSettings,
  };
}
