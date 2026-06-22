import { useCallback } from "react";
import { mergeUpdatedItineraryBranchIntoTrip } from "@/src/trip/itinerary-items";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths";
import {
  resolveStopFormLocation,
  shouldResolveUpdatedStopPlace,
} from "./stop-place-resolution-command";
import { placeUpdatedWorkspaceStop } from "./workspace-itinerary-stop-placement";
import {
  buildWorkspaceStopUpdatePatchRequest,
  buildWorkspaceUpdatedStop,
} from "./command-inputs/workspace-itinerary-stop-update-inputs";
import type {
  UpdateWorkspaceItineraryStopCommand,
  UseWorkspaceItineraryStopUpdateCommandParams,
} from "./workspace-itinerary-stop-command-types";

export function useWorkspaceItineraryStopUpdateCommand({
  commitTrip,
  dialogState,
  effectivePlaceResolver,
  isApiMode,
  nextClientMutationId,
  participantSession,
  resolvedApiClient,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryStopUpdateCommandParams) {
  const updateSelectedStop: UpdateWorkspaceItineraryStopCommand = useCallback(
    async (values) => {
      if (dialogState?.mode !== "edit") return;
      const place = dialogState.item;
      const itemId = place.id;
      const editDay = values.day || place.day;
      const shouldResolvePlace = shouldResolveUpdatedStopPlace(values, place);
      const resolvedLocation = await resolveStopFormLocation({
        day: editDay,
        effectivePlaceResolver,
        fallbackLocationFields: {
          address: place.address ?? place.place,
          coordinates: place.coordinates,
          mapLink: place.mapLink,
        },
        nextClientMutationId,
        setStopPlaceResolution,
        shouldResolvePlace,
        trip,
        values,
      });
      if (!resolvedLocation) return;
      values = resolvedLocation.values;
      const locationFields = resolvedLocation.locationFields;

      const patchedItem = isApiMode && resolvedApiClient && participantSession
        ? await resolvedApiClient.patchItineraryItem(
            trip.id,
            itemId,
            participantSession.sessionToken,
            buildWorkspaceStopUpdatePatchRequest({
              clientMutationId: nextClientMutationId("itinerary-patch"),
              editDay,
              item: place,
              locationFields,
              values,
            }),
          )
        : undefined;

      if (isApiMode && patchedItem && resolvedApiClient && participantSession) {
        const patchedItemWithDay = {
          ...patchedItem,
          day: values.day || patchedItem.day,
        };
        const branchPlacement = placeUpdatedWorkspaceStop(
          trip,
          patchedItemWithDay,
          values.pathId,
        );
        const patchedBranchItems = await patchApiItineraryBranchItems({
          apiClient: resolvedApiClient,
          items: branchPlacement.changedExistingItems,
          nextClientMutationId,
          sessionToken: participantSession.sessionToken,
          tripId: trip.id,
        });
        updateApiTrip((current) =>
          mergeUpdatedItineraryBranchIntoTrip(
            current,
            itemId,
            branchPlacement,
            patchedBranchItems,
          ),
        );
        setSelectedItemId(itemId);
        setDialogState(null);
        return;
      }

      if (!isApiMode) {
        commitTrip((current) => {
          const updatedItem = buildWorkspaceUpdatedStop({
            editDay,
            item: place,
            locationFields,
            values,
          });
          return placeUpdatedWorkspaceStop(
            current,
            updatedItem,
            values.pathId,
          ).trip;
        });
        setSelectedItemId(itemId);
        setDialogState(null);
      }
    },
    [
      isApiMode,
      dialogState,
      effectivePlaceResolver,
      nextClientMutationId,
      participantSession,
      resolvedApiClient,
      setDialogState,
      setSelectedItemId,
      setStopPlaceResolution,
      trip,
      updateApiTrip,
      commitTrip,
    ],
  );
  return updateSelectedStop;
}
