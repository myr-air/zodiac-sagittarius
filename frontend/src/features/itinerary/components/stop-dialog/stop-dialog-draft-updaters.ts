import type {
  ItineraryTimeMode,
  PlaceResolutionCandidate,
} from "@/src/trip/types";
import {
  applyStopActivityInput,
  applyStopDetailType,
  applyStopEndTime,
  applyStopStartTime,
  applyStopTimeMode,
  toggleStopNextDayEnd,
} from "@/src/features/itinerary/domain/stop-form-model";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import type {
  StopDetailType,
  StopDetailValues,
} from "@/src/features/itinerary/domain/stop-details";
import type { StopDialogDraftState } from "./stop-dialog-draft.types";

export function updateStopDialogValue<K extends keyof StopFormValues>(
  state: StopDialogDraftState,
  key: K,
  value: StopFormValues[K],
): StopDialogDraftState {
  return {
    ...state,
    values: {
      ...state.values,
      [key]: value,
    },
  };
}

export function updateStopDialogStartTime(
  state: StopDialogDraftState,
  startTime: string,
): StopDialogDraftState {
  return {
    ...state,
    values: applyStopStartTime(state.values, startTime),
  };
}

export function updateStopDialogTimeMode(
  state: StopDialogDraftState,
  timeMode: ItineraryTimeMode,
): StopDialogDraftState {
  return {
    ...state,
    values: applyStopTimeMode(state.values, timeMode),
  };
}

export function updateStopDialogEndTime(
  state: StopDialogDraftState,
  endTime: string,
): StopDialogDraftState {
  return {
    ...state,
    values: applyStopEndTime(state.values, endTime),
  };
}

export function toggleStopDialogNextDayEnd(
  state: StopDialogDraftState,
): StopDialogDraftState {
  return {
    ...state,
    values: toggleStopNextDayEnd(state.values),
  };
}

export function updateStopDialogDetailValue<
  K extends keyof StopDetailValues,
>(
  state: StopDialogDraftState,
  key: K,
  value: StopDetailValues[K],
): StopDialogDraftState {
  return {
    ...state,
    detailValues: {
      ...state.detailValues,
      [key]: value,
    },
  };
}

export function updateStopDialogDetailType(
  state: StopDialogDraftState,
  detailType: StopDetailType,
): StopDialogDraftState {
  return {
    ...state,
    detailType,
    values: applyStopDetailType(state.values, detailType),
  };
}

export function updateStopDialogActivity(
  state: StopDialogDraftState,
  activity: string,
): StopDialogDraftState {
  const result = applyStopActivityInput({
    activity,
    detailValues: state.detailValues,
    values: state.values,
  });

  return {
    ...state,
    detailType: result.detailType ?? state.detailType,
    detailValues: result.detailValues ?? state.detailValues,
    values: result.values,
  };
}

export function selectStopDialogPlaceCandidate(
  state: StopDialogDraftState,
  selectedCandidate: PlaceResolutionCandidate | undefined,
): StopDialogDraftState {
  return {
    ...state,
    selectedCandidate,
  };
}
