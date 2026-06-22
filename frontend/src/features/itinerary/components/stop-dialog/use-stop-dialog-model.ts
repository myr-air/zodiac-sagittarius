import { useState, type FormEvent } from "react";
import type {
  ItineraryItem,
  ItineraryTimeMode,
  PlaceResolutionCandidate,
} from "@/src/trip/types";
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
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  type StopDetailType,
  type StopDetailValues,
} from "@/src/features/itinerary/domain/stop-details";
import {
  beginStopDialogSubmit,
  clearStopDialogSubmitError,
  completeStopDialogSubmit,
  failStopDialogSubmit,
  initialStopDialogSubmitState,
} from "./stop-dialog-submit-state";

interface UseStopDialogModelArgs {
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  onSubmit: (values: StopFormValues) => void | Promise<void>;
  saveFailedMessage: string;
  startDate?: string;
}

export function useStopDialogModel({
  initialDay,
  initialItem,
  initialParentItemId,
  onSubmit,
  saveFailedMessage,
  startDate,
}: UseStopDialogModelArgs) {
  const [draftState, setDraftState] = useState(() =>
    buildInitialStopDialogDraftState({
      initialDay,
      initialItem,
      initialParentItemId,
      startDate,
    }),
  );
  const [submitState, setSubmitState] = useState(initialStopDialogSubmitState);

  const isSubActivity = Boolean(draftState.values.parentItemId);
  const derivedDuration =
    draftState.values.timeMode === "flexible" || !draftState.values.endTime
      ? null
      : draftState.values.durationMinutes;

  function update<K extends keyof StopFormValues>(
    key: K,
    value: StopFormValues[K],
  ) {
    setSubmitState((current) => clearStopDialogSubmitError(current));
    setDraftState((current) => updateStopDialogValue(current, key, value));
  }

  function updateStartTime(startTime: string) {
    setDraftState((current) => updateStopDialogStartTime(current, startTime));
  }

  function updateTimeMode(timeMode: ItineraryTimeMode) {
    setSubmitState((current) => clearStopDialogSubmitError(current));
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
    setSubmitState((current) => clearStopDialogSubmitError(current));
    setDraftState((current) => updateStopDialogActivity(current, activity));
  }

  function buildSubmitValues(saveUnresolved: boolean): StopFormValues {
    return buildStopDialogDraftSubmitValues(draftState, saveUnresolved);
  }

  async function submitValues(saveUnresolved: boolean) {
    setSubmitState(beginStopDialogSubmit());
    try {
      await onSubmit(buildSubmitValues(saveUnresolved));
    } catch {
      setSubmitState(failStopDialogSubmit(saveFailedMessage));
      return;
    } finally {
      setSubmitState((current) =>
        current.isSubmitting ? completeStopDialogSubmit() : current,
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitValues(false);
  }

  function submitUnresolved() {
    void submitValues(true);
  }

  return {
    derivedDuration,
    detailType: draftState.detailType,
    detailValues: draftState.detailValues,
    handleSubmit,
    isSubActivity,
    isSubmitting: submitState.isSubmitting,
    selectedCandidate: draftState.selectedCandidate,
    setSelectedCandidate: (selectedCandidate: PlaceResolutionCandidate | undefined) =>
      setDraftState((current) =>
        selectStopDialogPlaceCandidate(current, selectedCandidate),
      ),
    submitError: submitState.submitError,
    submitUnresolved,
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

export type StopDialogModel = ReturnType<typeof useStopDialogModel>;
