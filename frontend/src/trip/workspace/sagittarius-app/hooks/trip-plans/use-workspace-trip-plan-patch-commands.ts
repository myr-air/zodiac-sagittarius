import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildPatchTripPlanStatusRequest,
  buildRenameTripPlanRequest,
  legacyKindForPlanStatus,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { nextClientMutationId } from "@/src/trip/local-ids";
import type { PlanStatus, Trip, TripParticipantSession } from "@/src/trip/types";
import { runWorkspaceApiCommand } from "../../support/workspace-api-command";

interface UseWorkspaceTripPlanPatchCommandsParams {
  canManageTripPlans: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  reloadTripPlanConflict: (preferredTripPlanId?: string | null) => Promise<void>;
  resolvedApiClient?: TripApiClient;
  setIsTripPlanBusy: (busy: boolean) => void;
  setTripPlanError: (error: string | null) => void;
  trip: Trip;
  tripPlanErrorMessage: string;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceTripPlanPatchCommands({
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
}: UseWorkspaceTripPlanPatchCommandsParams) {
  const updateTripPlanStatus = useCallback(async (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ): Promise<boolean> => {
    if (!canManageTripPlans || !tripPlanId) return false;
    const currentPlan = trip.planVariants.find((plan) => plan.id === tripPlanId);
    if (!currentPlan || currentPlan.status === "main") return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      return runWorkspaceApiCommand({
        command: async () => {
          const patchTripPlanMutation =
            resolvedApiClient.patchTripPlan ??
            resolvedApiClient.patchPlanVariant;
          const updatedPlan = await patchTripPlanMutation(
            trip.id,
            tripPlanId,
            participantSession.sessionToken,
            buildPatchTripPlanStatusRequest(
              currentPlan,
              status,
              nextClientMutationId("trip-plan-status"),
            ),
          );
          updateApiTrip((current) => updateTripPlanInTrip(current, updatedPlan));
        },
        reloadOnConflict: reloadTripPlanConflict,
        setBusy: setIsTripPlanBusy,
        setError: setTripPlanError,
        errorMessage: tripPlanErrorMessage,
      });
    }

    commitTrip((current) =>
      updateTripPlanInTrip(current, {
        ...currentPlan,
        kind: legacyKindForPlanStatus(status),
        status,
        version: (currentPlan.version ?? 1) + 1,
      }),
    );
    return true;
  }, [
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
  ]);

  const renameTripPlan = useCallback(async (
    tripPlanId: string,
    name: string,
  ): Promise<boolean> => {
    if (!canManageTripPlans || !tripPlanId) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const currentPlan = trip.planVariants.find((plan) => plan.id === tripPlanId);
    if (!currentPlan || currentPlan.name === trimmedName) return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      return runWorkspaceApiCommand({
        command: async () => {
          const patchTripPlanMutation =
            resolvedApiClient.patchTripPlan ??
            resolvedApiClient.patchPlanVariant;
          const updatedPlan = await patchTripPlanMutation(
            trip.id,
            tripPlanId,
            participantSession.sessionToken,
            buildRenameTripPlanRequest(
              currentPlan,
              trimmedName,
              nextClientMutationId("trip-plan-rename"),
            ),
          );
          updateApiTrip((current) => updateTripPlanInTrip(current, updatedPlan));
        },
        reloadOnConflict: reloadTripPlanConflict,
        setBusy: setIsTripPlanBusy,
        setError: setTripPlanError,
        errorMessage: tripPlanErrorMessage,
      });
    }

    commitTrip((current) =>
      updateTripPlanInTrip(current, {
        ...currentPlan,
        name: trimmedName,
        version: (currentPlan.version ?? 1) + 1,
      }),
    );
    return true;
  }, [
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
  ]);

  return {
    renameTripPlan,
    updateTripPlanStatus,
  };
}
