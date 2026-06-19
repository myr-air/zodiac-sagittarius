import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import {
  type InitialTripState,
  useWorkspaceRecordState,
} from "./records/use-workspace-record-state";
import { useWorkspaceRecordActions } from "./records/use-workspace-record-actions";

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
  initialTrip: InitialTripState;
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

  const actions = useWorkspaceRecordActions({
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
  });

  return {
    ...actions,
    replaceWorkspaceRecords,
    setStopNotes,
    setSuggestions,
    setTasks,
    stopNotes,
    suggestions,
    tasks,
  };
}
