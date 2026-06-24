import type { StopNote } from "@/src/trip/types";

export interface ContextRailNoteFormState {
  editingNoteBody: string;
  editingNoteId: string | null;
  noteBody: string;
}

export interface ContextRailNoteCreateSubmission {
  body: string;
}

export interface ContextRailNoteEditSubmission {
  body: string;
  noteId: string;
}

export const initialContextRailNoteFormState: ContextRailNoteFormState = {
  editingNoteBody: "",
  editingNoteId: null,
  noteBody: "",
};

export function updateContextRailNoteBody(
  state: ContextRailNoteFormState,
  noteBody: string,
): ContextRailNoteFormState {
  return { ...state, noteBody };
}

export function updateContextRailEditingNoteBody(
  state: ContextRailNoteFormState,
  editingNoteBody: string,
): ContextRailNoteFormState {
  return { ...state, editingNoteBody };
}

export function startContextRailEditingNote(
  state: ContextRailNoteFormState,
  note: StopNote,
): ContextRailNoteFormState {
  return {
    ...state,
    editingNoteBody: note.body,
    editingNoteId: note.id,
  };
}

export function cancelContextRailEditingNote(
  state: ContextRailNoteFormState,
): ContextRailNoteFormState {
  return { ...state, editingNoteId: null };
}

export function buildContextRailNoteCreateSubmission(
  state: ContextRailNoteFormState,
): ContextRailNoteCreateSubmission | null {
  const body = state.noteBody.trim();
  return body ? { body } : null;
}

export function buildContextRailNoteEditSubmission(
  state: ContextRailNoteFormState,
): ContextRailNoteEditSubmission | null {
  const body = state.editingNoteBody.trim();
  return state.editingNoteId && body
    ? { body, noteId: state.editingNoteId }
    : null;
}

export function clearContextRailNoteBody(
  state: ContextRailNoteFormState,
): ContextRailNoteFormState {
  return { ...state, noteBody: "" };
}

export function clearContextRailEditingNote(
  state: ContextRailNoteFormState,
): ContextRailNoteFormState {
  return {
    ...state,
    editingNoteBody: "",
    editingNoteId: null,
  };
}
