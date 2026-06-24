import { useState } from "react";
import type { ItineraryItem, StopNote } from "@/src/trip/types";
import type {
  ContextRailCreateNoteInput,
  ContextRailUpdateNoteInput,
} from "./context-rail.types";
import {
  cancelContextRailEditingNote,
  initialContextRailNoteFormState,
  startContextRailEditingNote,
  updateContextRailEditingNoteBody,
  updateContextRailNoteBody,
} from "./context-rail-note-form-state";
import { useContextRailNoteFormActions } from "./use-context-rail-note-form-actions";

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
  const { submitNote, submitNoteEdit } = useContextRailNoteFormActions({
    itemId,
    onCreateNote,
    onUpdateNote,
    setState,
    state,
  });

  function startEditingNote(note: StopNote) {
    setState((current) => startContextRailEditingNote(current, note));
  }

  function cancelEditingNote() {
    setState((current) => cancelContextRailEditingNote(current));
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
