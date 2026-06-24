import { useMemo, useState } from "react";
import type { Trip } from "@/src/trip/types";
import {
  canSubmitTripSettings,
  hasInvalidTripSettingsDateRange,
} from "../model/trip-settings-form-model";
import {
  initialTripSettingsFormState,
  tripSettingsFormValueState,
} from "../model/trip-settings-form-state";
import { countStopsOutsideSettingsRange } from "../model/trip-settings-date-impact";
import type { TripSettingsFormValues } from "../TripSettingsPage.types";
import { useTripSettingsFormActions } from "./use-trip-settings-form-actions";

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

  const { submitSettings } = useTripSettingsFormActions({
    canSubmit,
    onSave,
    saveFailedMessage,
    setState,
    state,
  });

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
