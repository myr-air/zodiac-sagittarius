import type { TripApiClient } from "@/src/trip/api-client";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";
import type {
  ItineraryItem,
  StopNote,
  Suggestion,
  Trip,
  TripParticipantSession,
  TripTask,
} from "@/src/trip/types";
import { useWorkspaceStopNoteActions } from "./use-workspace-stop-note-actions";
import { useWorkspaceSuggestionActions } from "./use-workspace-suggestion-actions";
import { useWorkspaceTaskActions } from "./use-workspace-task-actions";

interface UseWorkspaceRecordActionsParams {
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  canCreateStopNote: boolean;
  canEdit: boolean;
  isApiMode: boolean;
  resolveApiClient?: TripApiClient;
  participantSession: TripParticipantSession | null;
  trip: Trip;
  currentMemberId: string;
  selectedItem: ItineraryItem | null;
  selectedTripPlanId: string;
  suggestions: Suggestion[];
  tasks: TripTask[];
  stopNotes: StopNote[];
  setSuggestions: (updater: (current: Suggestion[]) => Suggestion[]) => void;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  setSelectedItemId: (itemId: string) => void;
  setContextRailPreferredTab: (tab: WorkspaceContextRailPrimaryTab) => void;
  commitTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceRecordActions({
  canCreateSuggestion,
  canReviewSuggestions,
  canCreateStopNote,
  canEdit,
  isApiMode,
  resolveApiClient,
  participantSession,
  trip,
  currentMemberId,
  selectedItem,
  selectedTripPlanId,
  suggestions,
  tasks,
  stopNotes,
  setSuggestions,
  setTasks,
  setStopNotes,
  setSelectedItemId,
  setContextRailPreferredTab,
  commitTrip,
}: UseWorkspaceRecordActionsParams) {
  const {
    reviewSuggestion,
    suggestSelectedStop,
  } = useWorkspaceSuggestionActions({
    canCreateSuggestion,
    canReviewSuggestions,
    commitTrip,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedItem,
    setSuggestions,
    suggestions,
    trip,
  });

  const {
    createItineraryTask,
    createTask,
    toggleTaskStatus,
  } = useWorkspaceTaskActions({
    canEdit,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedTripPlanId,
    setContextRailPreferredTab,
    setSelectedItemId,
    setTasks,
    tasks,
    trip,
  });

  const {
    createItineraryNote,
    createStopNote,
    deleteStopNote,
    updateStopNote,
  } = useWorkspaceStopNoteActions({
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
  });

  return {
    createItineraryNote,
    createItineraryTask,
    createStopNote,
    createTask,
    deleteStopNote,
    reviewSuggestion,
    suggestSelectedStop,
    toggleTaskStatus,
    updateStopNote,
  };
}
