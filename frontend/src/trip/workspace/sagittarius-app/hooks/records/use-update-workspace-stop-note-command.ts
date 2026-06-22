import { useCallback } from "react";
import { nextClientMutationId } from "@/src/trip/identity";
import {
  buildPatchStopNoteRequest,
  replaceStopNote,
  updateLocalStopNote,
} from "@/src/trip/records";
import type {
  UpdateStopNoteCommand,
  UseUpdateWorkspaceStopNoteCommandParams,
} from "./workspace-stop-note-command-types";

export function useUpdateWorkspaceStopNoteCommand({
  canEdit,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  setStopNotes,
  stopNotes,
  trip,
}: UseUpdateWorkspaceStopNoteCommandParams): UpdateStopNoteCommand {
  return useCallback(
    async (input) => {
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
    },
    [
      canEdit,
      currentMemberId,
      isApiMode,
      participantSession,
      resolveApiClient,
      setStopNotes,
      stopNotes,
      trip.id,
    ],
  );
}
