import type { FormEvent } from "react";
import { useState } from "react";
import type { ItineraryItem, StopNote } from "@/src/trip/types";

interface UseContextRailNoteFormOptions {
  itemId: ItineraryItem["id"] | undefined;
  onCreateNote: (input: { itemId: string; body: string }) => void;
  onUpdateNote: (input: { noteId: string; body: string }) => void;
}

export function useContextRailNoteForm({
  itemId,
  onCreateNote,
  onUpdateNote,
}: UseContextRailNoteFormOptions) {
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");

  function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body || !itemId) return;
    onCreateNote({ itemId, body });
    setNoteBody("");
  }

  function startEditingNote(note: StopNote) {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body);
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
  }

  function submitNoteEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = editingNoteBody.trim();
    if (!editingNoteId || !body) return;
    onUpdateNote({ noteId: editingNoteId, body });
    setEditingNoteId(null);
    setEditingNoteBody("");
  }

  return {
    cancelEditingNote,
    editingNoteBody,
    editingNoteId,
    noteBody,
    setEditingNoteBody,
    setNoteBody,
    startEditingNote,
    submitNote,
    submitNoteEdit,
  };
}
