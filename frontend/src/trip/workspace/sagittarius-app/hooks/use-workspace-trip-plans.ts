import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { Trip } from "@/src/trip/types";
import type { TripCockpit } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import {
  canSelectWorkspaceTripPlan,
  resolveReloadedTripPlanSelection,
} from "./trip-plans/workspace-trip-plan-selection";
import { useWorkspaceTripPlanMutationCommands } from "./trip-plans/use-workspace-trip-plan-mutation-commands";

interface UseWorkspaceTripPlanCommandsParams {
  canManageTripPlans: boolean;
  isApiMode: boolean;
  selectedTripPlanId: string;
  trip: Trip;
  participantSession: TripParticipantSession | null;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  resolvedApiClient?: TripApiClient;
  rememberSelectedTripPlanId: (trip: Trip, tripPlanId: string) => void;
  resolveSelectedTripPlanId: (trip: Trip, preferredTripPlanId?: string | null) => string;
  initialSelectedTripPlanId: (trip: Trip) => string;
  latestTripRef: MutableRefObject<Trip>;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
  setSelectedTripPlanId: (tripPlanId: string) => void;
  setTripPlanError: (error: string | null) => void;
  setIsTripPlanBusy: (busy: boolean) => void;
  tripPlanErrorMessage: string;
}

export function useWorkspaceTripPlanCommands({
  canManageTripPlans,
  isApiMode,
  selectedTripPlanId,
  trip,
  participantSession,
  replaceCockpitFromApi,
  resolvedApiClient,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
  initialSelectedTripPlanId,
  latestTripRef,
  commitTrip,
  updateApiTrip,
  setSelectedTripPlanId,
  setTripPlanError,
  setIsTripPlanBusy,
  tripPlanErrorMessage,
}: UseWorkspaceTripPlanCommandsParams) {
  const reloadTripPlanConflict = useCallback(async (
    preferredTripPlanId: string | null = selectedTripPlanId,
  ) => {
    if (!resolvedApiClient || !participantSession) return;
    const cockpit = await resolvedApiClient.loadTrip(
      trip.id,
      participantSession.sessionToken,
    );
    replaceCockpitFromApi(cockpit);
    const reloadedTripPlanId = resolveReloadedTripPlanSelection({
      initialSelectedTripPlanId,
      preferredTripPlanId,
      resolveSelectedTripPlanId,
      trip: cockpit.trip,
    });
    setSelectedTripPlanId(reloadedTripPlanId);
    rememberSelectedTripPlanId(cockpit.trip, reloadedTripPlanId);
    latestTripRef.current = cockpit.trip;
  }, [
    initialSelectedTripPlanId,
    latestTripRef,
    participantSession,
    resolveSelectedTripPlanId,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    resolvedApiClient,
    selectedTripPlanId,
    setSelectedTripPlanId,
    trip.id,
  ]);

  const selectTripPlan = useCallback((tripPlanId: string): boolean => {
    if (!canSelectWorkspaceTripPlan(trip, tripPlanId)) return false;
    setSelectedTripPlanId(tripPlanId);
    rememberSelectedTripPlanId(trip, tripPlanId);
    return true;
  }, [trip, rememberSelectedTripPlanId, setSelectedTripPlanId]);

  const {
    createTripPlan,
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  } = useWorkspaceTripPlanMutationCommands({
    canManageTripPlans,
    commitTrip,
    isApiMode,
    participantSession,
    reloadTripPlanConflict,
    rememberSelectedTripPlanId,
    resolvedApiClient,
    setIsTripPlanBusy,
    setSelectedTripPlanId,
    setTripPlanError,
    trip,
    tripPlanErrorMessage,
    updateApiTrip,
  });

  return {
    createTripPlan,
    reloadTripPlanConflict,
    selectTripPlan,
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  };
}
