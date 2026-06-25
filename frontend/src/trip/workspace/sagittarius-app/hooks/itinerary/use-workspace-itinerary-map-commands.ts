import { useCallback } from "react";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import {
  buildMapPlaceResolutionRequest,
  type MapCoordinateResolutionResult,
  mapResolutionPlaceHints,
  type PlaceResolver,
} from "@/src/trip/places";
import type { ItineraryItem, Trip } from "@/src/trip/types";

interface UseWorkspaceItineraryMapCommandsParams {
  canEdit: boolean;
  effectivePlaceResolver: PlaceResolver | null;
  nextClientMutationId: (purpose: string) => string;
  trip: Trip;
  updateItineraryItemInline: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => Promise<void>;
}

export function useWorkspaceItineraryMapCommands({
  canEdit,
  effectivePlaceResolver,
  nextClientMutationId,
  trip,
  updateItineraryItemInline,
}: UseWorkspaceItineraryMapCommandsParams) {
  const resolveMissingMapCoordinates = useCallback(
    async (itemsToResolve: ItineraryItem[]): Promise<MapCoordinateResolutionResult> => {
      const result: MapCoordinateResolutionResult = {
        attempted: 0,
        failed: 0,
        resolved: 0,
        skipped: 0,
      };
      if (!canEdit || !effectivePlaceResolver) return result;

      for (const item of itemsToResolve) {
        if (item.coordinates) continue;
        result.attempted += 1;
        const placeHints = mapResolutionPlaceHints(item);
        if (placeHints.length === 0) {
          result.skipped += 1;
          continue;
        }
        try {
          let resolved = false;
          for (const placeHint of placeHints) {
            const response = await effectivePlaceResolver(
              buildMapPlaceResolutionRequest(item, trip, {
                clientMutationId: nextClientMutationId("map-place-resolve"),
                placeHint,
              }),
            );
            if (response.status !== "resolved") continue;
            const candidate = response.candidates[0];
            if (!candidate) continue;
            await updateItineraryItemInline(item.id, {
              address: candidate.address,
              coordinates: candidate.coordinates,
              mapLink: candidate.mapLink,
            });
            result.resolved += 1;
            resolved = true;
            break;
          }
          if (!resolved) {
            result.skipped += 1;
          }
        } catch {
          result.failed += 1;
        }
      }
      return result;
    },
    [
      canEdit,
      effectivePlaceResolver,
      nextClientMutationId,
      trip,
      updateItineraryItemInline,
    ],
  );

  return { resolveMissingMapCoordinates };
}
