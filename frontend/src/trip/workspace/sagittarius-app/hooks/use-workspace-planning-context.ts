import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
} from "@/src/trip/workspace/selected-trip-plan";
import type { TripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";
import { useTripWorkspaceRecords } from "@/src/trip/workspace/use-trip-workspace-records";
import type {
  ItineraryItem,
  Member,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useWorkspaceApiCockpitEffects } from "./use-workspace-api-cockpit-effects";
import { useWorkspaceCockpitReplacement } from "./use-workspace-cockpit-replacement";
import { useWorkspaceItineraryViewModel } from "./use-workspace-itinerary-view-model";
import { useWorkspaceRecords } from "./use-workspace-records";
import { useWorkspaceSelectedTripPlanSync } from "./use-workspace-selected-trip-plan";
import { useWorkspaceTripPlanCommands } from "./use-workspace-trip-plans";

interface UseWorkspacePlanningContextParams {
  activePlanItems: ItineraryItem[];
  backendExpenseSummary: Parameters<typeof useTripWorkspaceRecords>[0]["backendExpenseSummary"];
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
    expenseSummary,
    itineraryView,
    mainItineraryView,
    renameTripPlan,
    replaceCockpitFromApi,
    reviewSuggestion,
    scopedSuggestions,
    scopedTripForRecords,
    scopedTripPlanRecords,
    selectTripPlan,
    selectedDay,
    selectedItem,
    selectedItemIdForView,
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
