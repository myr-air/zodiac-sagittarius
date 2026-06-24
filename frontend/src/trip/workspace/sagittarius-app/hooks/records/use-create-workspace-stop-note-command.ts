import { useCallback } from "react";
import { nextClientMutationId, nextLocalStopNoteId } from "@/src/trip/identity";
import {
  appendStopNote,
  buildCreateStopNoteRequest,
  createLocalStopNoteInList,
} from "@/src/trip/records";
import { buildWorkspaceStopNoteCreateInput } from "../../support/workspace-record-command-inputs";
import type {
  CreateStopNoteCommand,
  UseCreateWorkspaceStopNoteCommandParams,
} from "./workspace-stop-note-command-types";

export function useCreateWorkspaceStopNoteCommand({
  canCreateStopNote,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  selectedTripPlanId,
  setStopNotes,
  trip,
}: UseCreateWorkspaceStopNoteCommandParams): CreateStopNoteCommand {
  return useCallback(
    async (input) => {
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
          buildCreateStopNoteRequest(noteInput, {
            clientMutationId: nextClientMutationId("stop-note-create"),
            tripPlanId: noteInput.tripPlanId,
          }),
        );
        setStopNotes((current) => appendStopNote(current, note));
        return;
      }
      setStopNotes((current) =>
        createLocalStopNoteInList(trip, current, noteInput, {
          authorId: currentMemberId,
          createdAt: new Date().toISOString(),
          nextStopNoteId: nextLocalStopNoteId,
        }),
      );
    },
    [
      canCreateStopNote,
      currentMemberId,
      isApiMode,
      participantSession,
      resolveApiClient,
      selectedTripPlanId,
      setStopNotes,
      trip,
    ],
  );
}
