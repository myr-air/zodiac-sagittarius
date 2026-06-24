import type { MutableRefObject } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { useTripWorkspaceRecords } from "@/src/trip/workspace/use-trip-workspace-records";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";
import type { ItineraryItem, Member, Trip, TripParticipantSession } from "@/src/trip/types";
import { useWorkspaceItineraryViewModel } from "./use-workspace-itinerary-view-model";
import { useWorkspaceRecords } from "./use-workspace-records";

export type WorkspacePlanningBackendExpenseSummary =
  Parameters<typeof useTripWorkspaceRecords>[0]["backendExpenseSummary"];

interface UseWorkspacePlanningRecordsContextParams {
  activePlanItems: ItineraryItem[];
  backendExpenseSummary: WorkspacePlanningBackendExpenseSummary;
  canCreateStopNote: boolean;
  canCreateSuggestion: boolean;
  canEdit: boolean;
  canReviewSuggestions: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMember: Member;
  initialTrip: Trip;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  mainPlanItems: ItineraryItem[];
  participantSession: TripParticipantSession | null;
  planItems: ItineraryItem[];
  resolvedApiClient?: TripApiClient;
  selectedItemId: string;
  selectedTripPlanId: string;
  setContextRailPreferredTab: (tab: WorkspaceContextRailPrimaryTab) => void;
  setSelectedItemId: (value: string | ((current: string) => string)) => void;
  trip: Trip;
}

export function useWorkspacePlanningRecordsContext({
  activePlanItems,
  backendExpenseSummary,
  canCreateStopNote,
  canCreateSuggestion,
  canEdit,
  canReviewSuggestions,
  commitTrip,
  currentMember,
  initialTrip,
  isApiMode,
  latestTripRef,
  mainPlanItems,
  participantSession,
  planItems,
  resolvedApiClient,
  selectedItemId,
  selectedTripPlanId,
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
}: UseWorkspacePlanningRecordsContextParams) {
  const {
    itineraryView,
    mainItineraryView,
    selectedDay,
    selectedItem,
    selectedItemIdForView,
  } = useWorkspaceItineraryViewModel({
    activePlanItems,
    latestTripRef,
    mainPlanItems,
    planItems,
    selectedItemId,
    trip,
  });

  const {
    createItineraryNote,
    createStopNote,
    createTask,
    deleteStopNote,
    reviewSuggestion,
    replaceWorkspaceRecords,
    setStopNotes,
    setTasks,
    stopNotes,
    suggestions,
    suggestSelectedStop,
    tasks,
    toggleTaskStatus,
    updateStopNote,
  } = useWorkspaceRecords({
    canCreateSuggestion,
    canReviewSuggestions,
    canCreateStopNote,
    canEdit,
    commitTrip,
    currentMemberId: currentMember.id,
    initialTrip,
    isApiMode,
    participantSession,
    resolveApiClient: resolvedApiClient,
    selectedItem: selectedItem ?? null,
    selectedTripPlanId,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip,
  });

  const {
    expenseSummary,
    scopedSuggestions,
    scopedTripForRecords,
    scopedTripPlanRecords,
  } = useTripWorkspaceRecords({
    activePlanItems,
    backendExpenseSummary,
    currentMemberId: currentMember.id,
    selectedTripPlanId,
    stopNotes,
    suggestions,
    tasks,
    trip,
  });

  return {
    createItineraryNote,
    createStopNote,
    createTask,
    deleteStopNote,
    expenseSummary,
    itineraryView,
    mainItineraryView,
    replaceWorkspaceRecords,
    reviewSuggestion,
    scopedSuggestions,
    scopedTripForRecords,
    scopedTripPlanRecords,
    selectedDay,
    selectedItem,
    selectedItemIdForView,
    setStopNotes,
    setTasks,
    stopNotes,
    suggestSelectedStop,
    tasks,
    toggleTaskStatus,
    updateStopNote,
  };
}

export type WorkspacePlanningRecordsContext = ReturnType<
  typeof useWorkspacePlanningRecordsContext
>;
