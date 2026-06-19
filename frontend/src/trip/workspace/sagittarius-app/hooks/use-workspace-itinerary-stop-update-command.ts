import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { StopFormValues } from "@/src/features/itinerary/components";
import {
  buildUpdatedItineraryItem,
  mergeUpdatedItineraryBranchIntoTrip,
  replaceItineraryItem,
} from "@/src/trip/itinerary";
import { buildPatchItineraryItemRequest } from "@/src/trip/itinerary-api-requests";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import {
  applyItemToActivityBranch,
  applyManualActivityPath,
} from "@/src/trip/itinerary-paths";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths-api";
import {
  nextClientMutationId as nextClientMutationIdFactory,
} from "@/src/trip/local-ids";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";
import type { ItineraryDialogState } from "./itinerary-dialog-state";
import {
  resolveStopFormLocation,
  shouldResolveUpdatedStopPlace,
} from "./stop-place-resolution-command";

interface UseWorkspaceItineraryStopUpdateCommandParams {
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  dialogState: ItineraryDialogState;
  effectivePlaceResolver: PlaceResolver | null;
  isApiMode: boolean;
  nextClientMutationId: typeof nextClientMutationIdFactory;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

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
  return useCallback(
    async (values: StopFormValues) => {
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
            buildPatchItineraryItemRequest(
              { ...values, day: editDay },
              {
                address: locationFields.address,
                clientMutationId: nextClientMutationId("itinerary-patch"),
                coordinates: locationFields.coordinates,
                expectedVersion: place.version,
                mapLink: locationFields.mapLink,
              },
            ),
          )
        : undefined;

      if (isApiMode && patchedItem && resolvedApiClient && participantSession) {
        const patchedItemWithDay = {
          ...patchedItem,
          day: values.day || patchedItem.day,
        };
        const tripWithPatchedItem = replaceItineraryItem(trip, patchedItemWithDay);
        const pathPlacement = applyItemToActivityBranch(
          tripWithPatchedItem,
          patchedItemWithDay,
        );
        const branchPlacement = values.pathId
          ? applyManualActivityPath(pathPlacement.trip, itemId, values.pathId)
          : pathPlacement;
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
          const updatedItem = buildUpdatedItineraryItem(
            place,
            { ...values, day: editDay },
            {
              address: locationFields.address,
              coordinates: locationFields.coordinates,
              mapLink: locationFields.mapLink,
              updatedAt: workspaceLocalMutationTimestamp,
            },
          );
          const tripWithUpdatedItem = replaceItineraryItem(current, updatedItem);
          const pathPlacement = applyItemToActivityBranch(
            tripWithUpdatedItem,
            updatedItem,
          );
          return values.pathId
            ? applyManualActivityPath(
                pathPlacement.trip,
                itemId,
                values.pathId,
              ).trip
            : pathPlacement.trip;
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
}
