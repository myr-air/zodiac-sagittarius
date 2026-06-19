import { useCallback } from "react";
import { nextClientMutationId, nextLocalStopNoteId } from "@/src/trip/local-ids";
import {
  appendStopNote,
  buildCreateStopNoteRequest,
  buildPatchStopNoteRequest,
  createLocalStopNoteInList,
  deleteLocalStopNote,
  removeStopNote,
  replaceStopNote,
  updateLocalStopNote,
} from "@/src/trip/stop-notes";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  StopNote,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { buildWorkspaceStopNoteCreateInput } from "./workspace-record-command-inputs";

interface UseWorkspaceStopNoteActionsParams {
  canCreateStopNote: boolean;
  canEdit: boolean;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  selectedTripPlanId: string;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  setSelectedItemId: (itemId: string) => void;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  stopNotes: StopNote[];
  trip: Trip;
}

export function useWorkspaceStopNoteActions({
  canCreateStopNote,
  canEdit,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  selectedTripPlanId,
  setContextRailPreferredTab,
  setSelectedItemId,
  setStopNotes,
  stopNotes,
  trip,
}: UseWorkspaceStopNoteActionsParams) {
  const createStopNote = useCallback(async (input: { itemId: string; body: string }) => {
    if (!canCreateStopNote) return;
    const noteInput = buildWorkspaceStopNoteCreateInput(input, {
      selectedTripPlanId,
      trip,
    });
    if (!noteInput) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const note = await resolveApiClient.createStopNote(
        trip.id,
        participantSession.sessionToken,
        buildCreateStopNoteRequest(
          noteInput,
          {
            clientMutationId: nextClientMutationId("stop-note-create"),
            tripPlanId: noteInput.tripPlanId,
          },
        ),
      );
      setStopNotes((current) => appendStopNote(current, note));
      return;
    }
    setStopNotes((current) =>
      createLocalStopNoteInList(
        trip,
        current,
        noteInput,
        {
          authorId: currentMemberId,
          createdAt: new Date().toISOString(),
          nextStopNoteId: nextLocalStopNoteId,
        },
      ),
    );
  }, [
    canCreateStopNote,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedTripPlanId,
    setStopNotes,
    trip,
  ]);

  const createItineraryNote = useCallback(async (itemId: string, body: string) => {
    if (!canCreateStopNote) return;
    const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
    if (!item) return;
    await createStopNote({ itemId: item.id, body });
    setContextRailPreferredTab("notes");
    setSelectedItemId(item.id);
  }, [
    canCreateStopNote,
    createStopNote,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip.itineraryItems,
  ]);

  const updateStopNote = useCallback(async (input: { noteId: string; body: string }) => {
    const body = input.body.trim();
    if (!body) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const existing = stopNotes.find((note) => note.id === input.noteId);
      if (!existing) return;
      const note = await resolveApiClient.patchStopNote(
        trip.id,
        input.noteId,
        participantSession.sessionToken,
        buildPatchStopNoteRequest(existing, body, {
          clientMutationId: nextClientMutationId("stop-note-patch"),
        }),
      );
      setStopNotes((current) => replaceStopNote(current, note));
      return;
    }
    setStopNotes((current) =>
      updateLocalStopNote(current, input.noteId, body, {
        currentMemberId,
        canEdit,
      }),
    );
  }, [
    canEdit,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    setStopNotes,
    stopNotes,
    trip.id,
  ]);

  const deleteStopNote = useCallback(async (noteId: string) => {
    if (isApiMode && resolveApiClient && participantSession) {
      await resolveApiClient.deleteStopNote(
        trip.id,
        noteId,
        participantSession.sessionToken,
      );
      setStopNotes((current) => removeStopNote(current, noteId));
      return;
    }
    setStopNotes((current) =>
      deleteLocalStopNote(current, noteId, {
        currentMemberId,
        canEdit,
      }),
    );
  }, [
    canEdit,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    setStopNotes,
    trip.id,
  ]);

  return {
    createItineraryNote,
    createStopNote,
    deleteStopNote,
    updateStopNote,
  };
}
