import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  beginStopDialogSubmit,
  completeStopDialogSubmit,
  failStopDialogSubmit,
  type StopDialogSubmitState,
} from "./stop-dialog-submit-state";

interface UseStopDialogActionsOptions {
  buildSubmitValues: (saveUnresolved: boolean) => StopFormValues;
  onSubmit: (values: StopFormValues) => void | Promise<void>;
  saveFailedMessage: string;
  setSubmitState: Dispatch<SetStateAction<StopDialogSubmitState>>;
}

export function useStopDialogActions({
  buildSubmitValues,
  onSubmit,
  saveFailedMessage,
  setSubmitState,
}: UseStopDialogActionsOptions) {
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
    handleSubmit,
    submitUnresolved,
  };
}
