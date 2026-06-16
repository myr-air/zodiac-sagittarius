import { useWorkspaceRecordActions } from "./use-workspace-record-actions";
import { useWorkspaceRecordState } from "./use-workspace-record-state";
import type { ItineraryItem } from "@/src/trip/types";
import type { Trip } from "@/src/trip/types";
import type { Suggestion, StopNote, TripTask } from "@/src/trip/types";
import type { TripApiClient } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";

interface UseWorkspaceRecordsParams {
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
  initialTrip: {
    suggestions?: Suggestion[];
    stopNotes?: StopNote[];
    tasks?: TripTask[];
  };
  setSelectedItemId: (itemId: string) => void;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  commitTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceRecords({
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
  initialTrip,
  setContextRailPreferredTab,
  setSelectedItemId,
  commitTrip,
}: UseWorkspaceRecordsParams) {
  const {
    replaceWorkspaceRecords,
    setStopNotes,
    setSuggestions,
    setTasks,
    stopNotes,
    suggestions,
    tasks,
  } = useWorkspaceRecordState(initialTrip);

  return {
    ...useWorkspaceRecordActions({
      canCreateSuggestion,
      canReviewSuggestions,
      canCreateStopNote,
      canEdit,
      commitTrip,
      currentMemberId,
      isApiMode,
      participantSession,
      resolveApiClient,
      selectedItem,
      selectedTripPlanId,
      setContextRailPreferredTab,
      setSelectedItemId,
      setSuggestions,
      setStopNotes,
      setTasks,
      stopNotes,
      suggestions,
      tasks,
      trip,
    }),
    replaceWorkspaceRecords,
    setStopNotes,
    setSuggestions,
    setTasks,
    stopNotes,
    suggestions,
    tasks,
  };
}
