import type {
  CreateStopNoteApiRequest,
  PatchStopNoteApiRequest,
} from "../api-client";
import type { StopNote, Trip } from "../types";

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

export interface BuildCreateStopNoteRequestOptions {
  clientMutationId: string;
  tripPlanId?: string | null;
}

export interface BuildPatchStopNoteRequestOptions {
  clientMutationId: string;
}

export function buildCreateStopNoteRequest(
  input: Pick<LocalStopNoteCreateInput, "itemId" | "body">,
  options: BuildCreateStopNoteRequestOptions,
): CreateStopNoteApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    itineraryItemId: input.itemId,
    tripPlanId: options.tripPlanId,
    body: input.body,
  };
}

export function buildPatchStopNoteRequest(
  note: StopNote,
  body: string,
  options: BuildPatchStopNoteRequestOptions,
): PatchStopNoteApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: note.version ?? 1,
    body,
  };
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

export function appendStopNote(notes: StopNote[], note: StopNote): StopNote[] {
  return [...notes, note];
}

export function createLocalStopNoteInList(
  trip: Pick<Trip, "id">,
  notes: StopNote[],
  input: LocalStopNoteCreateInput,
  options: LocalStopNoteCreateOptions,
): StopNote[] {
  return appendStopNote(notes, createLocalStopNote(trip, notes, input, options));
}

export function replaceStopNote(notes: StopNote[], note: StopNote): StopNote[] {
  return notes.map((candidate) =>
    candidate.id === note.id ? note : candidate,
  );
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

export function removeStopNote(notes: StopNote[], noteId: string): StopNote[] {
  return notes.filter((note) => note.id !== noteId);
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
