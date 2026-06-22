import type { StopFormValues } from "@/src/features/itinerary/components";
import {
  buildItineraryItemDraft,
  type BuildItineraryItemDraftOptions,
} from "@/src/trip/itinerary-core";
import { findItineraryItemById } from "@/src/trip/itinerary-items";
import {
  selectedItineraryPathIdForDay,
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary-paths";
import { nextLocalItemId } from "@/src/trip/identity";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../../support/local-mutations";

type StopLocationFields = Pick<
  BuildItineraryItemDraftOptions,
  "address" | "coordinates" | "mapLink"
>;

interface WorkspaceStopCreateInputContext {
  currentMemberId: string;
  day: string;
  locationFields: StopLocationFields;
  pathOptions: ItineraryPathOption[];
  pathSelection: ItineraryPathSelection;
  planItems: ItineraryItem[];
  selectedTripPlanId: string;
  trip: Trip;
  values: StopFormValues;
}

interface WorkspaceCreatedStopInput {
  draftItem: ItineraryItem;
  hasParentItem: boolean;
  targetPathId: string;
}

export function buildWorkspaceCreatedStop({
  currentMemberId,
  day,
  locationFields,
  pathOptions,
  pathSelection,
  planItems,
  selectedTripPlanId,
  trip,
  values,
}: WorkspaceStopCreateInputContext): WorkspaceCreatedStopInput {
  const parentItem = findItineraryItemById(
    trip.itineraryItems,
    values.parentItemId,
  );
  const targetPathId = selectedItineraryPathIdForDay(day, pathSelection);
  const targetPathName = pathOptions.find(
    (option) => option.id === targetPathId,
  )?.name;
  const nextItemId = nextLocalItemId(trip.itineraryItems, "item-new");

  return {
    draftItem: buildItineraryItemDraft(
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
    ),
    hasParentItem: Boolean(parentItem),
    targetPathId,
  };
}
