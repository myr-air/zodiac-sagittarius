import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
} from "@/src/trip/workspace/selected-trip-plan";
import type { TripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";
import type {
  ItineraryItem,
  Member,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useWorkspaceApiCockpitEffects } from "./use-workspace-api-cockpit-effects";
import { useWorkspaceCockpitReplacement } from "./use-workspace-cockpit-replacement";
import {
  useWorkspacePlanningRecordsContext,
  type WorkspacePlanningBackendExpenseSummary,
} from "./use-workspace-planning-records-context";
import { useWorkspaceSelectedTripPlanSync } from "./use-workspace-selected-trip-plan";
import { useWorkspaceTripPlanCommands } from "./use-workspace-trip-plans";

interface UseWorkspacePlanningContextParams {
  activePlanItems: ItineraryItem[];
  backendExpenseSummary: WorkspacePlanningBackendExpenseSummary;
  canCreateStopNote: boolean;
  canCreateSuggestion: boolean;
  canEdit: boolean;
  canManageTripPlans: boolean;
  canReviewSuggestions: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMember: Member;
  initialTrip: Trip;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  mainPlanItems: ItineraryItem[];
  participantSession: TripParticipantSession | null;
  planItems: ItineraryItem[];
  replaceDailyBriefings: Parameters<typeof useWorkspaceApiCockpitEffects>[0]["replaceDailyBriefings"];
  resetBackendExpenseSummary: () => void;
  resetDailyBriefings: Parameters<typeof useWorkspaceApiCockpitEffects>[0]["resetDailyBriefings"];
  resolvedApiClient?: TripApiClient;
  selectedItemId: string;
  selectedTripPlanId: string;
  sessionRestored: boolean;
  setAccessError: (error: string | null) => void;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  setIsCockpitLoaded: (loaded: boolean) => void;
  setIsTripPlanBusy: Dispatch<SetStateAction<boolean>>;
  setParticipantSession: (session: TripParticipantSession | null) => void;
  setSelectedItemId: Dispatch<SetStateAction<string>>;
  setSelectedTripPlanId: Dispatch<SetStateAction<string>>;
  setTripPlanError: Dispatch<SetStateAction<string | null>>;
  setTripState: Dispatch<SetStateAction<TripWorkspaceState>>;
  trip: Trip;
  tripPlanErrorMessage: string;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspacePlanningContext({
  activePlanItems,
  backendExpenseSummary,
  canCreateStopNote,
  canCreateSuggestion,
  canEdit,
  canManageTripPlans,
  canReviewSuggestions,
  commitTrip,
  currentMember,
  initialTrip,
  isApiMode,
  latestTripRef,
  mainPlanItems,
  participantSession,
  planItems,
  replaceDailyBriefings,
  resetBackendExpenseSummary,
  resetDailyBriefings,
  resolvedApiClient,
  selectedItemId,
  selectedTripPlanId,
  sessionRestored,
  setAccessError,
  setContextRailPreferredTab,
  setIsCockpitLoaded,
  setIsTripPlanBusy,
  setParticipantSession,
  setSelectedItemId,
  setSelectedTripPlanId,
  setTripPlanError,
  setTripState,
  trip,
  tripPlanErrorMessage,
  updateApiTrip,
}: UseWorkspacePlanningContextParams) {
  useWorkspaceSelectedTripPlanSync({
    isApiMode,
    sessionRestored,
    setSelectedTripPlanId,
    trip,
  });
  const records = useWorkspacePlanningRecordsContext({
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
  });
  const {
    createItineraryNote,
    createStopNote,
    createTask,
    deleteStopNote,
    replaceWorkspaceRecords,
    reviewSuggestion,
    setStopNotes,
    setTasks,
    stopNotes,
    suggestSelectedStop,
    tasks,
    toggleTaskStatus,
    updateStopNote,
  } = records;

  const replaceCockpitFromApi = useWorkspaceCockpitReplacement({
    replaceWorkspaceRecords,
    resetBackendExpenseSummary,
    setIsCockpitLoaded,
    setTripState,
  });

  const {
    createTripPlan,
    selectTripPlan,
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  } = useWorkspaceTripPlanCommands({
    canManageTripPlans,
    isApiMode,
    latestTripRef,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    resolveSelectedTripPlanId,
    selectedTripPlanId,
    setIsTripPlanBusy,
    setSelectedTripPlanId,
    setTripPlanError,
    trip,
    tripPlanErrorMessage,
    commitTrip,
    updateApiTrip,
    initialSelectedTripPlanId,
    resolvedApiClient,
  });

  useWorkspaceApiCockpitEffects({
    isApiMode,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    replaceDailyBriefings,
    resetDailyBriefings,
    resolvedApiClient,
    resolveSelectedTripPlanId,
    setAccessError,
    setIsCockpitLoaded,
    setParticipantSession,
    setSelectedTripPlanId,
    updateApiTrip,
  });

  return {
    createItineraryNote,
    createStopNote,
    createTask,
    createTripPlan,
    deleteStopNote,
    expenseSummary: records.expenseSummary,
    itineraryView: records.itineraryView,
    mainItineraryView: records.mainItineraryView,
    renameTripPlan,
    replaceCockpitFromApi,
    reviewSuggestion,
    scopedSuggestions: records.scopedSuggestions,
    scopedTripForRecords: records.scopedTripForRecords,
    scopedTripPlanRecords: records.scopedTripPlanRecords,
    selectTripPlan,
    selectedDay: records.selectedDay,
    selectedItem: records.selectedItem,
    selectedItemIdForView: records.selectedItemIdForView,
    setMainTripPlan,
    setStopNotes,
    setTasks,
    stopNotes,
    suggestSelectedStop,
    tasks,
    toggleTaskStatus,
    updateStopNote,
    updateTripPlanStatus,
  };
}
