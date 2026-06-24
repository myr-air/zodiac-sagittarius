import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import { useDailyBriefings } from "@/src/trip/workspace/use-daily-briefings";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { useWorkspaceBackendExpenseSummary } from "./use-workspace-backend-expense-summary";
import { useWorkspacePhotoAlbums } from "./use-workspace-photo-albums";

interface UseWorkspaceDataContextOptions {
  apiClient?: TripApiClient;
  canEditPhotoAlbums: boolean;
  canViewExpenses: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  currentView: PlanningView;
  isApiMode: boolean;
  isCockpitLoaded: boolean;
  latestTripRef: MutableRefObject<Trip>;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (trip: Trip) => void;
  selectedTripPlanId: string;
  setAccessError: (error: "unauthenticated" | "forbidden" | null) => void;
  setParticipantSession: Dispatch<SetStateAction<TripParticipantSession | null>>;
  setTripState: (state: { trip: Trip; past: Trip[]; future: Trip[] }) => void;
  trip: Trip;
}

export function useWorkspaceDataContext({
  apiClient,
  canEditPhotoAlbums,
  canViewExpenses,
  commitTrip,
  currentMemberId,
  currentView,
  isApiMode,
  isCockpitLoaded,
  latestTripRef,
  participantSession,
  replaceApiTrip,
  selectedTripPlanId,
  setAccessError,
  setParticipantSession,
  setTripState,
  trip,
}: UseWorkspaceDataContextOptions) {
  const {
    replaceDailyBriefings,
    resetDailyBriefings,
    saveDailyBriefingOverrides,
    visibleDailyBriefings,
  } = useDailyBriefings({
    apiClient,
    isApiMode,
    participantSession,
    trip,
  });

  const {
    backendExpenseSummary,
    refreshBackendExpenseSummary,
    resetBackendExpenseSummary,
    setBackendExpenseSummary,
  } = useWorkspaceBackendExpenseSummary({
    apiClient,
    canViewExpenses,
    currentView,
    isApiMode,
    isCockpitLoaded,
    participantSession,
    selectedTripPlanId,
    setAccessError,
    setParticipantSession,
    trip,
  });

  const {
    createPhotoAlbum,
    deletePhotoAlbum,
    updatePhotoAlbum,
  } = useWorkspacePhotoAlbums({
    apiClient,
    canEditPhotoAlbums,
    commitTrip,
    currentMemberId,
    isApiMode,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    setTripState,
    trip,
  });

  return {
    backendExpenseSummary,
    createPhotoAlbum,
    deletePhotoAlbum,
    refreshBackendExpenseSummary,
    replaceDailyBriefings,
    resetBackendExpenseSummary,
    resetDailyBriefings,
    saveDailyBriefingOverrides,
    setBackendExpenseSummary,
    updatePhotoAlbum,
    visibleDailyBriefings,
  };
}
