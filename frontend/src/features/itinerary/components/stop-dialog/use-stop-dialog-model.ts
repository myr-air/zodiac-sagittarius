import { useState, type FormEvent } from "react";
import type {
  ItineraryItem,
  ItineraryTimeMode,
  PlaceResolutionCandidate,
} from "@/src/trip/types";
import {
  applyStopActivityInput,
  applyStopDetailType,
  applyStopEndTime,
  applyStopStartTime,
  applyStopTimeMode,
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
  buildStopSubmitValues,
  toggleStopNextDayEnd,
} from "@/src/features/itinerary/domain/stop-form-model";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  type StopDetailType,
  type StopDetailValues,
  detailTypeFromItem,
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
  const [values, setValues] = useState<StopFormValues>(() =>
    buildInitialStopFormValues({
      initialDay,
      initialItem,
      initialParentItemId,
      startDate,
    }),
  );
  const [detailType, setDetailType] = useState<StopDetailType>(() =>
    detailTypeFromItem(initialItem),
  );
  const [detailValues, setDetailValues] = useState<StopDetailValues>(() =>
    buildInitialStopDetailValues(initialItem),
  );
  const [selectedCandidate, setSelectedCandidate] =
    useState<PlaceResolutionCandidate>();
  const [submitState, setSubmitState] = useState(initialStopDialogSubmitState);

  const isSubActivity = Boolean(values.parentItemId);
  const derivedDuration =
    values.timeMode === "flexible" || !values.endTime
      ? null
      : values.durationMinutes;

  function update<K extends keyof StopFormValues>(
    key: K,
    value: StopFormValues[K],
  ) {
    setSubmitState((current) => clearStopDialogSubmitError(current));
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateStartTime(startTime: string) {
    setValues((current) => applyStopStartTime(current, startTime));
  }

  function updateTimeMode(timeMode: ItineraryTimeMode) {
    setSubmitState((current) => clearStopDialogSubmitError(current));
    setValues((current) => applyStopTimeMode(current, timeMode));
  }

  function updateEndTime(nextEndTime: string) {
    setValues((current) => applyStopEndTime(current, nextEndTime));
  }

  function toggleNextDayEnd() {
    setValues((current) => toggleStopNextDayEnd(current));
  }

  function updateDetail<K extends keyof StopDetailValues>(
    key: K,
    value: StopDetailValues[K],
  ) {
    setDetailValues((current) => ({ ...current, [key]: value }));
  }

  function updateDetailType(nextDetailType: StopDetailType) {
    setDetailType(nextDetailType);
    setValues((current) => applyStopDetailType(current, nextDetailType));
  }

  function updateActivity(activity: string) {
    setSubmitState((current) => clearStopDialogSubmitError(current));
    const result = applyStopActivityInput({ activity, detailValues, values });
    if (result.detailType) setDetailType(result.detailType);
    if (result.detailValues) setDetailValues(result.detailValues);
    setValues(result.values);
  }

  function buildSubmitValues(saveUnresolved: boolean): StopFormValues {
    return buildStopSubmitValues({
      detailType,
      detailValues,
      saveUnresolved,
      selectedCandidate,
      values,
    });
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
    detailType,
    detailValues,
    handleSubmit,
    isSubActivity,
    isSubmitting: submitState.isSubmitting,
    selectedCandidate,
    setSelectedCandidate,
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
    values,
  };
}

export type StopDialogModel = ReturnType<typeof useStopDialogModel>;
