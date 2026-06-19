import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildCreateTripPlanRequest,
  buildPatchTripPlanStatusRequest,
  buildRenameTripPlanRequest,
  buildSetMainTripPlanRequest,
  createLocalTripPlan,
  legacyKindForPlanStatus,
  mergePublishedTripPlan,
  setLocalMainTripPlan,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { nextClientMutationId, nextLocalPlanVariantId } from "@/src/trip/local-ids";
import type { PlanStatus, Trip } from "@/src/trip/types";
import type { TripCockpit } from "@/src/trip/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { runTripPlanApiCommand } from "./trip-plan-api-command";

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
    const reloadedTripPlanId =
      preferredTripPlanId === null
        ? initialSelectedTripPlanId(cockpit.trip)
        : resolveSelectedTripPlanId(cockpit.trip, preferredTripPlanId);
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
    if (!tripPlanId || !trip.planVariants.some((plan) => plan.id === tripPlanId)) {
      return false;
    }
    setSelectedTripPlanId(tripPlanId);
    rememberSelectedTripPlanId(trip, tripPlanId);
    return true;
  }, [trip, rememberSelectedTripPlanId, setSelectedTripPlanId]);

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

  const updateTripPlanStatus = useCallback(async (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ): Promise<boolean> => {
    if (!canManageTripPlans || !tripPlanId) return false;
    const currentPlan = trip.planVariants.find((plan) => plan.id === tripPlanId);
    if (!currentPlan || currentPlan.status === "main") return false;
    setTripPlanError(null);

    if (isApiMode && resolvedApiClient && participantSession) {
      return runTripPlanApiCommand({
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
      return runTripPlanApiCommand({
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

  const createTripPlan = useCallback(async (name: string): Promise<boolean> => {
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

  return {
    createTripPlan,
    reloadTripPlanConflict,
    selectTripPlan,
    setMainTripPlan,
    updateTripPlanStatus,
    renameTripPlan,
  };
}
