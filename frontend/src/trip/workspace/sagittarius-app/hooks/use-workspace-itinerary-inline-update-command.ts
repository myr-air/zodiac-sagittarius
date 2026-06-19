import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type {
  TripApiClient,
  TripCockpit,
} from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import { replaceItineraryItem } from "@/src/trip/itinerary";
import { buildInlineItineraryItemPatch } from "@/src/trip/itinerary-time";
import { buildInlineItineraryItemPatchRequest } from "@/src/trip/itinerary-api-requests";
import { buildMapLink } from "@/src/trip/place-resolution";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";
import { queueKeyedUpdate } from "../support/queued-updates";

interface UseWorkspaceItineraryInlineUpdateCommandParams {
  canEdit: boolean;
  canSaveItineraryErrorMessage: string;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  resolvedApiClient?: TripApiClient;
  setSelectedItemId: (itemId: string) => void;
  setTripPlanError: (message: string | null) => void;
}

export function useWorkspaceItineraryInlineUpdateCommand({
  canEdit,
  canSaveItineraryErrorMessage,
  commitTrip,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  participantSession,
  replaceApiTrip,
  replaceCockpitFromApi,
  resolvedApiClient,
  setSelectedItemId,
  setTripPlanError,
}: UseWorkspaceItineraryInlineUpdateCommandParams) {
  const inlineUpdateQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const runItineraryItemInlineUpdate = useCallback(
    async (itemId: string, patch: InlineItineraryItemPatch) => {
      if (isApiMode && resolvedApiClient && participantSession) {
        let currentTrip = latestTripRef.current;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const item = currentTrip.itineraryItems.find(
            (candidate) => candidate.id === itemId,
          );
          if (!item) return;
          const nextPatch = buildInlineItineraryItemPatch(item, patch);
          if (!nextPatch) return;
          try {
            const patchedItem = await resolvedApiClient.patchItineraryItem(
              currentTrip.id,
              itemId,
              participantSession.sessionToken,
              buildInlineItineraryItemPatchRequest(nextPatch, {
                clientMutationId: nextClientMutationId(
                  "itinerary-inline-patch",
                ),
                expectedVersion: item.version,
              }),
            );
            const nextTrip = replaceItineraryItem(
              latestTripRef.current,
              patchedItem,
            );
            replaceApiTrip(nextTrip);
            setSelectedItemId(itemId);
            return;
          } catch (error) {
            if (!isVersionConflict(error) || attempt > 0) {
              throw error;
            }
            const cockpit = await resolvedApiClient.loadTrip(
              currentTrip.id,
              participantSession.sessionToken,
            );
            replaceCockpitFromApi(cockpit);
            latestTripRef.current = cockpit.trip;
            currentTrip = cockpit.trip;
          }
        }
        return;
      }

      commitTrip((current) => {
        const item = current.itineraryItems.find(
          (candidate) => candidate.id === itemId,
        );
        if (!item) return current;
        const nextPatch = buildInlineItineraryItemPatch(item, patch);
        if (!nextPatch) return current;
        const updatedItem = {
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
        return {
          ...current,
          itineraryItems: current.itineraryItems.map((candidate) =>
            candidate.id === itemId ? updatedItem : candidate,
          ),
        };
      }, itemId);
    },
    [
      isApiMode,
      latestTripRef,
      nextClientMutationId,
      participantSession,
      replaceCockpitFromApi,
      replaceApiTrip,
      resolvedApiClient,
      setSelectedItemId,
      commitTrip,
    ],
  );

  return useCallback(
    async (itemId: string, patch: InlineItineraryItemPatch) => {
      if (!canEdit) return;
      try {
        await queueKeyedUpdate(inlineUpdateQueueRef.current, itemId, () =>
          runItineraryItemInlineUpdate(itemId, patch),
        );
        setTripPlanError(null);
      } catch {
        setTripPlanError(canSaveItineraryErrorMessage);
      }
    },
    [
      canEdit,
      canSaveItineraryErrorMessage,
      runItineraryItemInlineUpdate,
      setTripPlanError,
    ],
  );
}
