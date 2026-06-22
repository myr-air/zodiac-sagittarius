import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  buildUpdatedItineraryItem,
  type BuildUpdatedItineraryItemOptions,
} from "@/src/trip/itinerary-core";
import {
  buildPatchItineraryItemRequest,
  type BuildPatchItineraryItemRequestOptions,
} from "@/src/trip/itinerary-items";
import type { ItineraryItem } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../../support/local-mutations";

type StopLocationFields = Pick<
  BuildPatchItineraryItemRequestOptions,
  "address" | "coordinates" | "mapLink"
>;

interface WorkspaceStopUpdateInputContext {
  editDay: string;
  item: ItineraryItem;
  locationFields: StopLocationFields;
  values: StopFormValues;
}

interface WorkspaceStopUpdatePatchRequestContext
  extends WorkspaceStopUpdateInputContext {
  clientMutationId: string;
}

function updateInputValues({
  editDay,
  values,
}: Pick<WorkspaceStopUpdateInputContext, "editDay" | "values">) {
  return { ...values, day: editDay };
}

function updateLocationOptions({
  locationFields,
}: Pick<WorkspaceStopUpdateInputContext, "locationFields">): Pick<
  BuildUpdatedItineraryItemOptions,
  "address" | "coordinates" | "mapLink"
> {
  return {
    address: locationFields.address,
    coordinates: locationFields.coordinates,
    mapLink: locationFields.mapLink,
  };
}

export function buildWorkspaceStopUpdatePatchRequest({
  clientMutationId,
  editDay,
  item,
  locationFields,
  values,
}: WorkspaceStopUpdatePatchRequestContext) {
  return buildPatchItineraryItemRequest(
    updateInputValues({ editDay, values }),
    {
      ...updateLocationOptions({ locationFields }),
      clientMutationId,
      expectedVersion: item.version,
    },
  );
}

export function buildWorkspaceUpdatedStop({
  editDay,
  item,
  locationFields,
  values,
}: WorkspaceStopUpdateInputContext): ItineraryItem {
  return buildUpdatedItineraryItem(
    item,
    updateInputValues({ editDay, values }),
    {
      ...updateLocationOptions({ locationFields }),
      updatedAt: workspaceLocalMutationTimestamp,
    },
  );
}
