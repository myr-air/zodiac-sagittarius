import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { StopFormValues } from "@/src/features/itinerary/components";
import {
  appendItineraryItemPlacement,
  appendItineraryItemToTrip,
  buildItineraryItemDraft,
  mainItineraryPathId,
  mergeCreatedItineraryItemIntoTrip,
  normalizeStopHierarchyValues,
  selectedItineraryPathIdForDay,
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import { buildCreateItineraryItemRequest } from "@/src/trip/itinerary-api-requests";
import {
  locationFieldsFromCandidate,
  resolveStopPlace,
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import { applyItemToActivityBranch } from "@/src/trip/itinerary-paths";
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
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";
import type { ItineraryDialogState } from "./itinerary-dialog-state";

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
      values = normalizeStopHierarchyValues(values);
      const day = values.day || selectedDay;
      setStopPlaceResolution(
        effectivePlaceResolver && !values.resolvedPlace && !values.saveUnresolved
          ? { state: "resolving", candidates: [] }
          : { state: "idle", candidates: [] },
      );

      const placeResolution = await resolveStopPlace(
        { ...values, day },
        trip,
        effectivePlaceResolver,
        nextClientMutationId,
      );
      if (placeResolution.state) {
        setStopPlaceResolution(placeResolution.state);
        return;
      }

      setStopPlaceResolution({ state: "idle", candidates: [] });
      const locationFields = locationFieldsFromCandidate(
        placeResolution.candidate,
        values.place,
        values.mapLink,
      );
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
      const branchPlacement =
        parentItem
          ? appendItineraryItemPlacement(trip, draftItem)
          : targetPathId === mainItineraryPathId
            ? applyItemToActivityBranch(trip, draftItem)
            : appendItineraryItemPlacement(trip, draftItem);

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
          parentItem
            ? appendItineraryItemToTrip(current, draftItem)
            : targetPathId === mainItineraryPathId
              ? applyItemToActivityBranch(current, draftItem).trip
              : appendItineraryItemToTrip(current, draftItem),
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
