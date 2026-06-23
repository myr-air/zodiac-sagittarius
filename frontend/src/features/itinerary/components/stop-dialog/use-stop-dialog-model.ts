import { useState } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  clearStopDialogSubmitError,
  initialStopDialogSubmitState,
} from "./stop-dialog-submit-state";
import { useStopDialogActions } from "./use-stop-dialog-actions";
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
  const actions = useStopDialogActions({
    buildSubmitValues: draftState.buildSubmitValues,
    onSubmit,
    saveFailedMessage,
    setSubmitState,
  });

  return {
    derivedDuration: draftState.derivedDuration,
    detailType: draftState.detailType,
    detailValues: draftState.detailValues,
    handleSubmit: actions.handleSubmit,
    isSubActivity: draftState.isSubActivity,
    isSubmitting: submitState.isSubmitting,
    selectedCandidate: draftState.selectedCandidate,
    setSelectedCandidate: draftState.setSelectedCandidate,
    submitError: submitState.submitError,
    submitUnresolved: actions.submitUnresolved,
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
