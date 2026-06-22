import { useState, type FormEvent } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  beginStopDialogSubmit,
  clearStopDialogSubmitError,
  completeStopDialogSubmit,
  failStopDialogSubmit,
  initialStopDialogSubmitState,
} from "./stop-dialog-submit-state";
import { useStopDialogDraftState } from "./use-stop-dialog-draft-state";

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
  const [submitState, setSubmitState] = useState(initialStopDialogSubmitState);
  const draftState = useStopDialogDraftState({
    initialDay,
    initialItem,
    initialParentItemId,
    onDraftEdit: () =>
      setSubmitState((current) => clearStopDialogSubmitError(current)),
    startDate,
  });

  async function submitValues(saveUnresolved: boolean) {
    setSubmitState(beginStopDialogSubmit());
    try {
      await onSubmit(draftState.buildSubmitValues(saveUnresolved));
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
    derivedDuration: draftState.derivedDuration,
    detailType: draftState.detailType,
    detailValues: draftState.detailValues,
    handleSubmit,
    isSubActivity: draftState.isSubActivity,
    isSubmitting: submitState.isSubmitting,
    selectedCandidate: draftState.selectedCandidate,
    setSelectedCandidate: draftState.setSelectedCandidate,
    submitError: submitState.submitError,
    submitUnresolved,
    toggleNextDayEnd: draftState.toggleNextDayEnd,
    update: draftState.update,
    updateActivity: draftState.updateActivity,
    updateDetail: draftState.updateDetail,
    updateDetailType: draftState.updateDetailType,
    updateEndTime: draftState.updateEndTime,
    updateStartTime: draftState.updateStartTime,
    updateTimeMode: draftState.updateTimeMode,
    values: draftState.values,
  };
}

export type StopDialogModel = ReturnType<typeof useStopDialogModel>;
