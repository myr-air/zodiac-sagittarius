import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildSetMainTripPlanRequest,
  mergePublishedTripPlan,
  setLocalMainTripPlan,
} from "@/src/trip/trip-plans";
import { nextClientMutationId } from "@/src/trip/local-ids";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { runTripPlanApiCommand } from "./trip-plan-api-command";
import { useWorkspaceTripPlanCreateCommand } from "./use-workspace-trip-plan-create-command";
import { useWorkspaceTripPlanPatchCommands } from "./use-workspace-trip-plan-patch-commands";

interface UseWorkspaceTripPlanMutationCommandsParams {
  canManageTripPlans: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  reloadTripPlanConflict: (preferredTripPlanId?: string | null) => Promise<void>;
  rememberSelectedTripPlanId: (trip: Trip, tripPlanId: string) => void;
  resolvedApiClient?: TripApiClient;
  setIsTripPlanBusy: (busy: boolean) => void;
  setSelectedTripPlanId: (tripPlanId: string) => void;
  setTripPlanError: (error: string | null) => void;
  trip: Trip;
  tripPlanErrorMessage: string;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceTripPlanMutationCommands({
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
}: UseWorkspaceTripPlanMutationCommandsParams) {
  const createTripPlan = useWorkspaceTripPlanCreateCommand({
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

  const {
    renameTripPlan,
    updateTripPlanStatus,
  } = useWorkspaceTripPlanPatchCommands({
    canManageTripPlans,
    commitTrip,
    isApiMode,
    participantSession,
    reloadTripPlanConflict,
    resolvedApiClient,
    setIsTripPlanBusy,
    setTripPlanError,
    trip,
    tripPlanErrorMessage,
    updateApiTrip,
  });

  const setMainTripPlan = useCallback(async (tripPlanId: string): Promise<boolean> => {
    const mainTripPlanId = trip.mainTripPlanId || trip.activePlanVariantId;
    if (!canManageTripPlans || !tripPlanId || tripPlanId === mainTripPlanId) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      return runTripPlanApiCommand({
        command: async () => {
          const setMainTripPlanRequest =
            resolvedApiClient.setMainTripPlan ??
            resolvedApiClient.publishPlanVariant;
          const publishedTrip = await setMainTripPlanRequest(
            trip.id,
            tripPlanId,
            participantSession.sessionToken,
            buildSetMainTripPlanRequest(
              nextClientMutationId("trip-plan-set-main"),
            ),
          );
          updateApiTrip((current) =>
            mergePublishedTripPlan(current, publishedTrip, tripPlanId),
          );
          setSelectedTripPlanId(tripPlanId);
          rememberSelectedTripPlanId(publishedTrip, tripPlanId);
        },
        reloadOnConflict: () => reloadTripPlanConflict(null),
        setBusy: setIsTripPlanBusy,
        setError: setTripPlanError,
        errorMessage: tripPlanErrorMessage,
      });
    }

    commitTrip((current) => setLocalMainTripPlan(current, tripPlanId));
    setSelectedTripPlanId(tripPlanId);
    rememberSelectedTripPlanId(trip, tripPlanId);
    return true;
  }, [
    canManageTripPlans,
    isApiMode,
    participantSession,
    resolvedApiClient,
    trip,
    setTripPlanError,
    updateApiTrip,
    commitTrip,
    setIsTripPlanBusy,
    setSelectedTripPlanId,
    rememberSelectedTripPlanId,
    tripPlanErrorMessage,
    reloadTripPlanConflict,
  ]);

  return {
    createTripPlan,
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  };
}
