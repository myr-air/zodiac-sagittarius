import { useCallback } from "react";
import type { MapCoordinateResolutionResult } from "@/src/features/itinerary/components";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import {
  buildMapPlaceResolutionRequest,
  mapResolutionPlaceHint,
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
        const placeHint = mapResolutionPlaceHint(item);
        if (!placeHint) {
          result.skipped += 1;
          continue;
        }
        try {
          const response = await effectivePlaceResolver(
            buildMapPlaceResolutionRequest(item, trip, {
              clientMutationId: nextClientMutationId("map-place-resolve"),
              placeHint,
            }),
          );
          if (response.status !== "resolved") {
            result.skipped += 1;
            continue;
          }
          const candidate = response.candidates[0];
          if (!candidate) {
            result.skipped += 1;
            continue;
          }
          await updateItineraryItemInline(item.id, {
            address: candidate.address,
            coordinates: candidate.coordinates,
            mapLink: candidate.mapLink,
          });
          result.resolved += 1;
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
