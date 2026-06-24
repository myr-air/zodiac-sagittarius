import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  buildItineraryNoteModalSubmission,
  setItineraryNoteModalSaving,
  type ItineraryNoteModalState,
} from "./itinerary-note-modal-state";

interface UseItineraryNoteModalActionsOptions {
  onSave: (body: string) => ItineraryAsyncVoidResult;
  setState: Dispatch<SetStateAction<ItineraryNoteModalState>>;
  state: ItineraryNoteModalState;
}

export function useItineraryNoteModalActions({
  onSave,
  setState,
  state,
}: UseItineraryNoteModalActionsOptions) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildItineraryNoteModalSubmission(state);
    if (!submission) return;
    setState((current) => setItineraryNoteModalSaving(current, true));
    try {
      await onSave(submission.body);
    } finally {
      setState((current) => setItineraryNoteModalSaving(current, false));
    }
  }

  return {
    submit,
  };
}
