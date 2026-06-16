import type { StopNote, Trip } from "./types";

export interface LocalStopNoteCreateInput {
  itemId: string;
  body: string;
  tripPlanId?: string | null;
}

export interface LocalStopNoteCreateOptions {
  authorId: string;
  createdAt: string;
  nextStopNoteId: (notes: StopNote[]) => string;
}

export function createLocalStopNote(
  trip: Pick<Trip, "id">,
  notes: StopNote[],
  input: LocalStopNoteCreateInput,
  options: LocalStopNoteCreateOptions,
): StopNote {
  return {
    id: options.nextStopNoteId(notes),
    tripId: trip.id,
    tripPlanId: input.tripPlanId,
    itemId: input.itemId,
    authorId: options.authorId,
    body: input.body,
    createdAt: options.createdAt,
  };
}

export function updateLocalStopNote(
  notes: StopNote[],
  noteId: string,
  body: string,
  options: {
    currentMemberId: string;
    canEdit: boolean;
  },
): StopNote[] {
  return notes.map((note) =>
    note.id === noteId &&
    (note.authorId === options.currentMemberId || options.canEdit)
      ? { ...note, body }
      : note,
  );
}

export function deleteLocalStopNote(
  notes: StopNote[],
  noteId: string,
  options: {
    currentMemberId: string;
    canEdit: boolean;
  },
): StopNote[] {
  return notes.filter(
    (note) =>
      note.id !== noteId ||
      (note.authorId !== options.currentMemberId && !options.canEdit),
  );
}
