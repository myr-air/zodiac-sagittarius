import { useWorkspaceTripPlanCreateCommand } from "./use-workspace-trip-plan-create-command";
import { useWorkspaceTripPlanMainCommand } from "./use-workspace-trip-plan-main-command";
import { useWorkspaceTripPlanPatchCommands } from "./use-workspace-trip-plan-patch-commands";
import type { UseWorkspaceTripPlanMutationCommandsParams } from "./workspace-trip-plan-command-types";

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

  const setMainTripPlan = useWorkspaceTripPlanMainCommand({
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
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  };
}
