import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildCreateTripPlanRequest,
  createLocalTripPlan,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { nextClientMutationId, nextLocalPlanVariantId } from "@/src/trip/local-ids";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { runTripPlanApiCommand } from "./trip-plan-api-command";

interface UseWorkspaceTripPlanCreateCommandParams {
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

export function useWorkspaceTripPlanCreateCommand({
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
}: UseWorkspaceTripPlanCreateCommandParams) {
  return useCallback(async (name: string): Promise<boolean> => {
    if (!canManageTripPlans) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      return runTripPlanApiCommand({
        command: async () => {
          const createTripPlanMutation =
            resolvedApiClient.createTripPlan ??
            resolvedApiClient.createPlanVariant;
          const createdVariant = await createTripPlanMutation(
            trip.id,
            participantSession.sessionToken,
            buildCreateTripPlanRequest(
              trimmedName,
              nextClientMutationId("trip-plan-create"),
            ),
          );
          updateApiTrip((current) =>
            updateTripPlanInTrip(current, createdVariant),
          );
          setSelectedTripPlanId(createdVariant.id);
          rememberSelectedTripPlanId(trip, createdVariant.id);
        },
        reloadOnConflict: reloadTripPlanConflict,
        setBusy: setIsTripPlanBusy,
        setError: setTripPlanError,
        errorMessage: tripPlanErrorMessage,
      });
    }

    let createdTripPlanId = "";
    commitTrip((current) => {
      const result = createLocalTripPlan(
        current,
        trimmedName,
        nextLocalPlanVariantId,
      );
      createdTripPlanId = result.tripPlanId;
      return result.trip;
    });
    if (createdTripPlanId) {
      setSelectedTripPlanId(createdTripPlanId);
      rememberSelectedTripPlanId(trip, createdTripPlanId);
    }
    return true;
  }, [
    canManageTripPlans,
    commitTrip,
    isApiMode,
    participantSession,
    resolvedApiClient,
    rememberSelectedTripPlanId,
    reloadTripPlanConflict,
    setIsTripPlanBusy,
    setSelectedTripPlanId,
    setTripPlanError,
    trip,
    tripPlanErrorMessage,
    updateApiTrip,
  ]);
}
