import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { StopFormValues } from "@/src/features/itinerary/components";
import {
  buildItineraryItemDraft,
  mergeCreatedItineraryItemIntoTrip,
  selectedItineraryPathIdForDay,
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import { buildCreateItineraryItemRequest } from "@/src/trip/itinerary-api-requests";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import { patchApiItineraryBranchItems } from "@/src/trip/itinerary-paths-api";
import {
  nextClientMutationId as nextClientMutationIdFactory,
  nextLocalItemId,
} from "@/src/trip/local-ids";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import type { ItineraryDialogState } from "./itinerary-dialog-state";
import { resolveStopFormLocation } from "./stop-place-resolution-command";
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
      const parentItem = values.parentItemId
        ? trip.itineraryItems.find((item) => item.id === values.parentItemId)
        : undefined;
      const targetPathId = selectedItineraryPathIdForDay(day, pathSelection);
      const targetPathName = pathOptions.find(
        (option) => option.id === targetPathId,
      )?.name;
      const nextItemId = nextLocalItemId(trip.itineraryItems, "item-new");
      const draftItem = buildItineraryItemDraft(
        { ...values, day },
        {
          address: locationFields.address,
          coordinates: locationFields.coordinates,
          createdBy: currentMemberId,
          mapLink: locationFields.mapLink,
          nextItemId,
          pathId: targetPathId,
          pathName: targetPathName,
          planItems,
          selectedTripPlanId,
          trip,
          updatedAt: workspaceLocalMutationTimestamp,
        },
      );
      const branchPlacement = placeCreatedWorkspaceStop(trip, draftItem, {
        hasParentItem: Boolean(parentItem),
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
            hasParentItem: Boolean(parentItem),
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
