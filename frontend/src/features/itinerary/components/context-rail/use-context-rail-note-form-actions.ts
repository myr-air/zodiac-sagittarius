import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import type {
  ContextRailCreateNoteInput,
  ContextRailUpdateNoteInput,
} from "./context-rail.types";
import {
  buildContextRailNoteCreateSubmission,
  buildContextRailNoteEditSubmission,
  clearContextRailEditingNote,
  clearContextRailNoteBody,
  type ContextRailNoteFormState,
} from "./context-rail-note-form-state";

interface UseContextRailNoteFormActionsOptions {
  itemId: ItineraryItem["id"] | undefined;
  onCreateNote: (input: ContextRailCreateNoteInput) => void;
  onUpdateNote: (input: ContextRailUpdateNoteInput) => void;
  setState: Dispatch<SetStateAction<ContextRailNoteFormState>>;
  state: ContextRailNoteFormState;
}

export function useContextRailNoteFormActions({
  itemId,
  onCreateNote,
  onUpdateNote,
  setState,
  state,
}: UseContextRailNoteFormActionsOptions) {
  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildContextRailNoteCreateSubmission(state);
    if (!submission || !itemId) return;
    onCreateNote({ itemId, body: submission.body });
    setState((current) => clearContextRailNoteBody(current));
  }

  function submitNoteEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildContextRailNoteEditSubmission(state);
    if (!submission) return;
    onUpdateNote(submission);
    setState((current) => clearContextRailEditingNote(current));
  }

  return {
    submitNote,
    submitNoteEdit,
  };
}
