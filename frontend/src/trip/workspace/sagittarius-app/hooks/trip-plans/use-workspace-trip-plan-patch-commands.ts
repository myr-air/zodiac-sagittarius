import { useCallback } from "react";
import {
  buildPatchTripPlanStatusRequest,
  buildRenameTripPlanRequest,
  findTripPlanById,
  legacyKindForPlanStatus,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { nextClientMutationId } from "@/src/trip/identity";
import { runWorkspaceApiCommand } from "../../support/workspace-api-command";
import type {
  RenameTripPlanCommand,
  UpdateTripPlanStatusCommand,
  UseWorkspaceTripPlanPatchCommandsParams,
} from "./workspace-trip-plan-command-types";

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
  const updateTripPlanStatus = useCallback<UpdateTripPlanStatusCommand>(async (
    tripPlanId,
    status,
  ) => {
    if (!canManageTripPlans || !tripPlanId) return false;
    const currentPlan = findTripPlanById(trip, tripPlanId);
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

  const renameTripPlan = useCallback<RenameTripPlanCommand>(async (
    tripPlanId,
    name,
  ) => {
    if (!canManageTripPlans || !tripPlanId) return false;
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const currentPlan = findTripPlanById(trip, tripPlanId);
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
