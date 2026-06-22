import { useCallback } from "react";
import {
  buildCreateItineraryItemRequest,
  mergeCreatedItineraryItemIntoTrip,
} from "@/src/trip/itinerary-items";
import {
  patchApiItineraryBranchItems,
} from "@/src/trip/itinerary-paths";
import { resolveStopFormLocation } from "./stop-place-resolution-command";
import { buildWorkspaceCreatedStop } from "./command-inputs/workspace-itinerary-stop-create-inputs";
import { placeCreatedWorkspaceStop } from "./workspace-itinerary-stop-placement";
import type {
  CreateWorkspaceItineraryStopCommand,
  UseWorkspaceItineraryStopCreateCommandParams,
} from "./workspace-itinerary-stop-command-types";

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
  const createStop: CreateWorkspaceItineraryStopCommand = useCallback(
    async (values) => {
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
  return createStop;
}
