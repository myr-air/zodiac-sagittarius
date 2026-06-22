import { useCallback } from "react";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";
import type { TripApiClient } from "@/src/trip/api-client";
import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type {
  StopNote,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useCreateWorkspaceStopNoteCommand } from "./use-create-workspace-stop-note-command";
import { useDeleteWorkspaceStopNoteCommand } from "./use-delete-workspace-stop-note-command";
import { useUpdateWorkspaceStopNoteCommand } from "./use-update-workspace-stop-note-command";

interface UseWorkspaceStopNoteActionsParams {
  canCreateStopNote: boolean;
  canEdit: boolean;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  selectedTripPlanId: string;
  setContextRailPreferredTab: (tab: WorkspaceContextRailPrimaryTab) => void;
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
  const createStopNote = useCreateWorkspaceStopNoteCommand({
    canCreateStopNote,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedTripPlanId,
    setStopNotes,
    trip,
  });

  const createItineraryNote = useCallback(async (itemId: string, body: string) => {
    if (!canCreateStopNote) return;
    const item = findItineraryItemById(trip.itineraryItems, itemId);
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

  const updateStopNote = useUpdateWorkspaceStopNoteCommand({
    canEdit,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    setStopNotes,
    stopNotes,
    trip,
  });

  const deleteStopNote = useDeleteWorkspaceStopNoteCommand({
    canEdit,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    setStopNotes,
    trip,
  });

  return {
    createItineraryNote,
    createStopNote,
    deleteStopNote,
    updateStopNote,
  };
}
