import { useState } from "react";
import type {
  ItineraryItem,
  ItineraryTimeMode,
  PlaceResolutionCandidate,
} from "@/src/trip/types";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  type StopDetailType,
  type StopDetailValues,
} from "@/src/features/itinerary/domain/stop-details";
import {
  buildInitialStopDialogDraftState,
  buildStopDialogDraftSubmitValues,
  selectStopDialogPlaceCandidate,
  toggleStopDialogNextDayEnd,
  updateStopDialogActivity,
  updateStopDialogDetailType,
  updateStopDialogDetailValue,
  updateStopDialogEndTime,
  updateStopDialogStartTime,
  updateStopDialogTimeMode,
  updateStopDialogValue,
} from "./stop-dialog-draft-state";

interface UseStopDialogDraftStateArgs {
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  onDraftEdit: () => void;
  startDate?: string;
}

export function useStopDialogDraftState({
  initialDay,
  initialItem,
  initialParentItemId,
  onDraftEdit,
  startDate,
}: UseStopDialogDraftStateArgs) {
  const [draftState, setDraftState] = useState(() =>
    buildInitialStopDialogDraftState({
      initialDay,
      initialItem,
      initialParentItemId,
      startDate,
    }),
  );

  const isSubActivity = Boolean(draftState.values.parentItemId);
  const derivedDuration =
    draftState.values.timeMode === "flexible" || !draftState.values.endTime
      ? null
      : draftState.values.durationMinutes;

  function update<K extends keyof StopFormValues>(
    key: K,
    value: StopFormValues[K],
  ) {
    onDraftEdit();
    setDraftState((current) => updateStopDialogValue(current, key, value));
  }

  function updateStartTime(startTime: string) {
    setDraftState((current) => updateStopDialogStartTime(current, startTime));
  }

  function updateTimeMode(timeMode: ItineraryTimeMode) {
    onDraftEdit();
    setDraftState((current) => updateStopDialogTimeMode(current, timeMode));
  }

  function updateEndTime(nextEndTime: string) {
    setDraftState((current) => updateStopDialogEndTime(current, nextEndTime));
  }

  function toggleNextDayEnd() {
    setDraftState((current) => toggleStopDialogNextDayEnd(current));
  }

  function updateDetail<K extends keyof StopDetailValues>(
    key: K,
    value: StopDetailValues[K],
  ) {
    setDraftState((current) =>
      updateStopDialogDetailValue(current, key, value),
    );
  }

  function updateDetailType(nextDetailType: StopDetailType) {
    setDraftState((current) =>
      updateStopDialogDetailType(current, nextDetailType),
    );
  }

  function updateActivity(activity: string) {
    onDraftEdit();
    setDraftState((current) => updateStopDialogActivity(current, activity));
  }

  function buildSubmitValues(saveUnresolved: boolean): StopFormValues {
    return buildStopDialogDraftSubmitValues(draftState, saveUnresolved);
  }

  return {
    buildSubmitValues,
    derivedDuration,
    detailType: draftState.detailType,
    detailValues: draftState.detailValues,
    isSubActivity,
    selectedCandidate: draftState.selectedCandidate,
    setSelectedCandidate: (selectedCandidate: PlaceResolutionCandidate | undefined) =>
      setDraftState((current) =>
        selectStopDialogPlaceCandidate(current, selectedCandidate),
      ),
    toggleNextDayEnd,
    update,
    updateActivity,
    updateDetail,
    updateDetailType,
    updateEndTime,
    updateStartTime,
    updateTimeMode,
    values: draftState.values,
  };
}
