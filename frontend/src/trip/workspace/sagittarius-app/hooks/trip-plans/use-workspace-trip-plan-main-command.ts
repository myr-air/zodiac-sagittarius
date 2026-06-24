import { useCallback } from "react";
import {
  buildSetMainTripPlanRequest,
  defaultTripPlanId,
  mergePublishedTripPlan,
  setLocalMainTripPlan,
} from "@/src/trip/trip-plans";
import { nextClientMutationId } from "@/src/trip/identity";
import { runWorkspaceApiCommand } from "../../support/workspace-api-command";
import type {
  SetMainTripPlanCommand,
  UseWorkspaceTripPlanMainCommandParams,
} from "./workspace-trip-plan-command-types";

export function useWorkspaceTripPlanMainCommand({
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
}: UseWorkspaceTripPlanMainCommandParams): SetMainTripPlanCommand {
  return useCallback(
    async (tripPlanId) => {
      const mainTripPlanId = defaultTripPlanId(trip);
      if (!canManageTripPlans || !tripPlanId || tripPlanId === mainTripPlanId)
        return false;
      setTripPlanError(null);

      if (isApiMode && resolvedApiClient && participantSession) {
        return runWorkspaceApiCommand({
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
    },
    [
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
    ],
  );
}
