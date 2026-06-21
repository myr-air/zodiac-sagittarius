import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type {
  TripApiClient,
  TripCockpit,
} from "@/src/trip/api-client";
import { replaceItineraryItem } from "@/src/trip/itinerary";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { queueKeyedUpdate } from "../../support/queued-updates";
import { runWorkspaceVersionConflictRetry } from "../../support/workspace-api-conflict-retry";
import {
  buildWorkspaceInlinePatchRequest,
  buildWorkspaceInlineUpdatedItem,
} from "./workspace-itinerary-inline-update-inputs";

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
        await runWorkspaceVersionConflictRetry({
          getContext: () => latestTripRef.current,
          reloadOnConflict: async (currentTrip) => {
            const cockpit = await resolvedApiClient.loadTrip(
              currentTrip.id,
              participantSession.sessionToken,
            );
            replaceCockpitFromApi(cockpit);
            latestTripRef.current = cockpit.trip;
          },
          run: async (currentTrip) => {
            const item = currentTrip.itineraryItems.find(
              (candidate) => candidate.id === itemId,
            );
            if (!item) return;
            const patchRequest = buildWorkspaceInlinePatchRequest({
              clientMutationId: nextClientMutationId(
                "itinerary-inline-patch",
              ),
              item,
              patch,
            });
            if (!patchRequest) return;
            const patchedItem = await resolvedApiClient.patchItineraryItem(
              currentTrip.id,
              itemId,
              participantSession.sessionToken,
              patchRequest,
            );
            const nextTrip = replaceItineraryItem(
              latestTripRef.current,
              patchedItem,
            );
            replaceApiTrip(nextTrip);
            setSelectedItemId(itemId);
          },
        });
        return;
      }

      commitTrip((current) => {
        const item = current.itineraryItems.find(
          (candidate) => candidate.id === itemId,
        );
        if (!item) return current;
        const updatedItem = buildWorkspaceInlineUpdatedItem(item, patch);
        if (!updatedItem) return current;
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
