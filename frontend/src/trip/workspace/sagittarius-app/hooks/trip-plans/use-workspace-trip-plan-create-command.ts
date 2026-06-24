import { useCallback } from "react";
import {
  buildCreateTripPlanRequest,
  createLocalTripPlan,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { nextClientMutationId, nextLocalPlanVariantId } from "@/src/trip/identity";
import { runWorkspaceApiCommand } from "../../support/workspace-api-command";
import type {
  CreateTripPlanCommand,
  UseWorkspaceTripPlanCreateCommandParams,
} from "./workspace-trip-plan-command-types";

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
}: UseWorkspaceTripPlanCreateCommandParams): CreateTripPlanCommand {
  return useCallback(async (name: string): Promise<boolean> => {
    if (!canManageTripPlans) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      return runWorkspaceApiCommand({
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
