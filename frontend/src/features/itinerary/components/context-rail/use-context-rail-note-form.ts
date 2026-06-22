import type { FormEvent } from "react";
import { useState } from "react";
import type { ItineraryItem, StopNote } from "@/src/trip/types";
import type {
  ContextRailCreateNoteInput,
  ContextRailUpdateNoteInput,
} from "./context-rail.types";
import {
  buildContextRailNoteCreateSubmission,
  buildContextRailNoteEditSubmission,
  cancelContextRailEditingNote,
  clearContextRailEditingNote,
  clearContextRailNoteBody,
  initialContextRailNoteFormState,
  startContextRailEditingNote,
  updateContextRailEditingNoteBody,
  updateContextRailNoteBody,
} from "./context-rail-note-form-state";

interface UseContextRailNoteFormOptions {
  itemId: ItineraryItem["id"] | undefined;
  onCreateNote: (input: ContextRailCreateNoteInput) => void;
  onUpdateNote: (input: ContextRailUpdateNoteInput) => void;
}

export function useContextRailNoteForm({
  itemId,
  onCreateNote,
  onUpdateNote,
}: UseContextRailNoteFormOptions) {
  const [state, setState] = useState(initialContextRailNoteFormState);

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildContextRailNoteCreateSubmission(state);
    if (!submission || !itemId) return;
    onCreateNote({ itemId, body: submission.body });
    setState((current) => clearContextRailNoteBody(current));
  }

  function startEditingNote(note: StopNote) {
    setState((current) => startContextRailEditingNote(current, note));
  }

  function cancelEditingNote() {
    setState((current) => cancelContextRailEditingNote(current));
  }

  function submitNoteEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submission = buildContextRailNoteEditSubmission(state);
    if (!submission) return;
    onUpdateNote(submission);
    setState((current) => clearContextRailEditingNote(current));
  }

  return {
    cancelEditingNote,
    editingNoteBody: state.editingNoteBody,
    editingNoteId: state.editingNoteId,
    noteBody: state.noteBody,
    setEditingNoteBody: (editingNoteBody: string) =>
      setState((current) =>
        updateContextRailEditingNoteBody(current, editingNoteBody),
      ),
    setNoteBody: (noteBody: string) =>
      setState((current) => updateContextRailNoteBody(current, noteBody)),
    startEditingNote,
    submitNote,
    submitNoteEdit,
  };
}
