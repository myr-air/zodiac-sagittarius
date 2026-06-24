import { useCallback } from "react";
import {
  deleteLocalStopNote,
  removeStopNote,
} from "@/src/trip/records";
import type {
  DeleteStopNoteCommand,
  UseDeleteWorkspaceStopNoteCommandParams,
} from "./workspace-stop-note-command-types";

export function useDeleteWorkspaceStopNoteCommand({
  canEdit,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  setStopNotes,
  trip,
}: UseDeleteWorkspaceStopNoteCommandParams): DeleteStopNoteCommand {
  return useCallback(
    async (noteId) => {
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
    },
    [
      canEdit,
      currentMemberId,
      isApiMode,
      participantSession,
      resolveApiClient,
      setStopNotes,
      trip.id,
    ],
  );
}
