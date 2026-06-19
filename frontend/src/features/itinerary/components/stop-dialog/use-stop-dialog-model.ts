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
} from "./stop-dialog.form";
import type { StopFormValues } from "./stop-dialog.types";
import {
  type StopDetailType,
  type StopDetailValues,
  detailTypeFromItem,
} from "./stop-dialog.utils";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubActivity = Boolean(values.parentItemId);
  const derivedDuration =
    values.timeMode === "flexible" || !values.endTime
      ? null
      : values.durationMinutes;

  function update<K extends keyof StopFormValues>(
    key: K,
    value: StopFormValues[K],
  ) {
    setSubmitError(null);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateStartTime(startTime: string) {
    setValues((current) => applyStopStartTime(current, startTime));
  }

  function updateTimeMode(timeMode: ItineraryTimeMode) {
    setSubmitError(null);
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
    setSubmitError(null);
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
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(buildSubmitValues(saveUnresolved));
    } catch {
      setSubmitError(saveFailedMessage);
    } finally {
      setIsSubmitting(false);
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
    isSubmitting,
    selectedCandidate,
    setSelectedCandidate,
    submitError,
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
