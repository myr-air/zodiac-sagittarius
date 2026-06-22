import { useMemo, useState, type FormEvent } from "react";
import type { Trip } from "@/src/trip/types";
import {
  canSubmitTripSettings,
  hasInvalidTripSettingsDateRange,
  normalizeTripSettingsForm,
} from "../model/trip-settings-form-model";
import {
  failedTripSettingsFormState,
  initialTripSettingsFormState,
  savedTripSettingsFormState,
  savingTripSettingsFormState,
  tripSettingsFormValueState,
} from "../model/trip-settings-form-state";
import { countStopsOutsideSettingsRange } from "../model/trip-settings-date-impact";
import type { TripSettingsFormValues } from "../TripSettingsPage.types";

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
  const [state, setState] = useState(() => initialTripSettingsFormState(trip));
  const invalidDateRange = hasInvalidTripSettingsDateRange(state.form);
  const outsideStopCount = useMemo(
    () => countStopsOutsideSettingsRange(trip, state.form),
    [state.form, trip],
  );
  const canSubmit = canSubmitTripSettings({
    canEdit,
    form: state.form,
    invalidDateRange,
    status: state.status,
  });

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setState(savingTripSettingsFormState);
    try {
      await onSave(normalizeTripSettingsForm(state.form));
      setState(savedTripSettingsFormState);
    } catch {
      setState((current) =>
        failedTripSettingsFormState(current, saveFailedMessage),
      );
    }
  }

  return {
    canSubmit,
    error: state.error,
    form: state.form,
    invalidDateRange,
    outsideStopCount,
    setForm: (
      updater:
        | TripSettingsFormValues
        | ((current: TripSettingsFormValues) => TripSettingsFormValues),
    ) => {
      setState((current) => tripSettingsFormValueState(current, updater));
    },
    status: state.status,
    submitSettings,
  };
}
