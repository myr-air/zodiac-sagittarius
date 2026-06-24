import type { TripApiClient } from "@/src/trip/api-client";
import type { StopNote, Trip, TripParticipantSession } from "@/src/trip/types";

export interface WorkspaceStopNoteCommandBaseParams {
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  trip: Trip;
}

export interface UseCreateWorkspaceStopNoteCommandParams
  extends WorkspaceStopNoteCommandBaseParams {
  canCreateStopNote: boolean;
  selectedTripPlanId: string;
}

export interface UseUpdateWorkspaceStopNoteCommandParams
  extends WorkspaceStopNoteCommandBaseParams {
  canEdit: boolean;
  stopNotes: StopNote[];
}

export interface UseDeleteWorkspaceStopNoteCommandParams
  extends WorkspaceStopNoteCommandBaseParams {
  canEdit: boolean;
}

export type CreateStopNoteCommand = (input: {
  itemId: string;
  body: string;
}) => Promise<void>;

export type UpdateStopNoteCommand = (input: {
  noteId: string;
  body: string;
}) => Promise<void>;

export type DeleteStopNoteCommand = (noteId: string) => Promise<void>;
