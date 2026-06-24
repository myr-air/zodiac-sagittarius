import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import { buildInlineItineraryItemPatchRequest } from "@/src/trip/itinerary-items";
import { buildInlineItineraryItemPatch } from "@/src/trip/itinerary-core";
import { buildMapLink } from "@/src/trip/places";
import type { ItineraryItem } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../../support/local-mutations";

interface WorkspaceInlinePatchRequestContext {
  clientMutationId: string;
  item: ItineraryItem;
  patch: InlineItineraryItemPatch;
}

export function buildWorkspaceInlinePatch(
  item: ItineraryItem,
  patch: InlineItineraryItemPatch,
) {
  return buildInlineItineraryItemPatch(item, patch);
}

export function buildWorkspaceInlinePatchRequest({
  clientMutationId,
  item,
  patch,
}: WorkspaceInlinePatchRequestContext) {
  const nextPatch = buildWorkspaceInlinePatch(item, patch);
  if (!nextPatch) return null;

  return buildInlineItineraryItemPatchRequest(nextPatch, {
    clientMutationId,
    expectedVersion: item.version,
  });
}

export function buildWorkspaceInlineUpdatedItem(
  item: ItineraryItem,
  patch: InlineItineraryItemPatch,
): ItineraryItem | null {
  const nextPatch = buildWorkspaceInlinePatch(item, patch);
  if (!nextPatch) return null;

  return {
    ...item,
    ...nextPatch,
    ...(nextPatch.place !== undefined
      ? {
          address: nextPatch.place,
          coordinates: undefined,
          mapLink: buildMapLink(nextPatch.place),
        }
      : {}),
    updatedAt: workspaceLocalMutationTimestamp,
    version: item.version + 1,
  };
}
