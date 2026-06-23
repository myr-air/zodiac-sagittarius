import type { Dispatch, FormEvent, SetStateAction } from "react";
import { normalizeTripSettingsForm } from "../model/trip-settings-form-model";
import {
  failedTripSettingsFormState,
  savedTripSettingsFormState,
  savingTripSettingsFormState,
  type TripSettingsFormState,
} from "../model/trip-settings-form-state";
import type { TripSettingsFormValues } from "../TripSettingsPage.types";

interface UseTripSettingsFormActionsInput {
  canSubmit: boolean;
  onSave: (values: TripSettingsFormValues) => Promise<void>;
  saveFailedMessage: string;
  setState: Dispatch<SetStateAction<TripSettingsFormState>>;
  state: TripSettingsFormState;
}

export function useTripSettingsFormActions({
  canSubmit,
  onSave,
  saveFailedMessage,
  setState,
  state,
}: UseTripSettingsFormActionsInput) {
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
    submitSettings,
  };
}
