import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { StopFormValues } from "@/src/features/itinerary/components";
import {
  mergeCreatedItineraryItemIntoTrip,
} from "@/src/trip/itinerary-items";
import {
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary-paths";
import { buildCreateItineraryItemRequest } from "@/src/trip/itinerary-items";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/places";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths";
import {
  nextClientMutationId as nextClientMutationIdFactory,
} from "@/src/trip/identity";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary-dialog-state";
import { resolveStopFormLocation } from "./stop-place-resolution-command";
import { buildWorkspaceCreatedStop } from "./command-inputs/workspace-itinerary-stop-create-inputs";
import { placeCreatedWorkspaceStop } from "./workspace-itinerary-stop-placement";

interface UseWorkspaceItineraryStopCreateCommandParams {
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  currentMemberId: string;
  effectivePlaceResolver: PlaceResolver | null;
  isApiMode: boolean;
  nextClientMutationId: typeof nextClientMutationIdFactory;
  participantSession: TripParticipantSession | null;
  pathOptions: ItineraryPathOption[];
  pathSelection: ItineraryPathSelection;
  planItems: ItineraryItem[];
  resolvedApiClient?: TripApiClient;
  selectedDay: string;
  selectedTripPlanId: string;
  setContextRailVisibility: (open: boolean) => void;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryStopCreateCommand({
  commitTrip,
  currentMemberId,
  effectivePlaceResolver,
  isApiMode,
  nextClientMutationId,
  participantSession,
  pathOptions,
  pathSelection,
  planItems,
  resolvedApiClient,
  selectedDay,
  selectedTripPlanId,
  setContextRailVisibility,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryStopCreateCommandParams) {
  return useCallback(
    async (values: StopFormValues) => {
      const day = values.day || selectedDay;
      const resolvedLocation = await resolveStopFormLocation({
        day,
        effectivePlaceResolver,
        nextClientMutationId,
        setStopPlaceResolution,
        trip,
        values,
      });
      if (!resolvedLocation) return;
      values = resolvedLocation.values;
      const locationFields = resolvedLocation.locationFields;
      const { draftItem, hasParentItem, targetPathId } =
        buildWorkspaceCreatedStop({
          currentMemberId,
          day,
          locationFields,
          pathOptions,
          pathSelection,
          planItems,
          selectedTripPlanId,
          trip,
          values,
        });
      const branchPlacement = placeCreatedWorkspaceStop(trip, draftItem, {
        hasParentItem,
        targetPathId,
      });

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        const createdItem = await resolvedApiClient.createItineraryItem(
          trip.id,
          participantSession.sessionToken,
          buildCreateItineraryItemRequest(
            branchPlacement.item,
            nextClientMutationId("itinerary-create"),
          ),
        );
        updateApiTrip((current) =>
          mergeCreatedItineraryItemIntoTrip(
            current,
            createdItem,
            branchPlacement,
            patchedBranchItems,
          ),
        );
        setSelectedItemId(createdItem.id);
        setContextRailVisibility(false);
        setDialogState(null);
        return;
      }

      commitTrip(
        (current) =>
          placeCreatedWorkspaceStop(current, draftItem, {
            hasParentItem,
            targetPathId,
          }).trip,
        draftItem.id,
      );
      setContextRailVisibility(false);
      setDialogState(null);
    },
    [
      commitTrip,
      currentMemberId,
      effectivePlaceResolver,
      isApiMode,
      nextClientMutationId,
      participantSession,
      pathOptions,
      pathSelection,
      planItems,
      resolvedApiClient,
      selectedDay,
      selectedTripPlanId,
      setContextRailVisibility,
      setDialogState,
      setStopPlaceResolution,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );
}
