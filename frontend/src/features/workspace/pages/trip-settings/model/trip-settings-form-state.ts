import type { Trip } from "@/src/trip/types";
import type { TripSettingsFormValues } from "./trip-settings-form-model";
import { tripToSettingsForm } from "./trip-settings-form-model";

export type TripSettingsSaveStatus = "idle" | "saving" | "saved";

export interface TripSettingsFormState {
  error: string | null;
  form: TripSettingsFormValues;
  status: TripSettingsSaveStatus;
}

export function initialTripSettingsFormState(
  trip: Trip,
): TripSettingsFormState {
  return {
    error: null,
    form: tripToSettingsForm(trip),
    status: "idle",
  };
}

export function tripSettingsFormValueState(
  state: TripSettingsFormState,
  updater:
    | TripSettingsFormValues
    | ((current: TripSettingsFormValues) => TripSettingsFormValues),
): TripSettingsFormState {
  return {
    ...state,
    form: typeof updater === "function" ? updater(state.form) : updater,
  };
}

export function savingTripSettingsFormState(
  state: TripSettingsFormState,
): TripSettingsFormState {
  return {
    ...state,
    error: null,
    status: "saving",
  };
}

export function savedTripSettingsFormState(
  state: TripSettingsFormState,
): TripSettingsFormState {
  return {
    ...state,
    status: "saved",
  };
}

export function failedTripSettingsFormState(
  state: TripSettingsFormState,
  error: string,
): TripSettingsFormState {
  return {
    ...state,
    error,
    status: "idle",
  };
}
