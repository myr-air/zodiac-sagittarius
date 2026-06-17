import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import {
  replaceItineraryItem,
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import { buildInlineItineraryItemPatch } from "@/src/trip/itinerary-time";
import {
  buildInlineItineraryItemPatchRequest,
} from "@/src/trip/itinerary-api-requests";
import {
  buildMapLink,
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import {
  nextClientMutationId as nextClientMutationIdFactory,
} from "@/src/trip/local-ids";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";
import { queueKeyedUpdate } from "../support/queued-updates";
import type { ItineraryDialogState } from "./itinerary-dialog-state";
import { useWorkspaceItineraryDeleteCommand } from "./use-workspace-itinerary-delete-command";
import { useWorkspaceItineraryMapCommands } from "./use-workspace-itinerary-map-commands";
import { useWorkspaceItineraryMoveCommands } from "./use-workspace-itinerary-move-commands";
import { useWorkspaceItineraryStopSaveCommands } from "./use-workspace-itinerary-stop-save-commands";

interface UseWorkspaceItineraryCommandsParams {
  canEdit: boolean;
  canSaveItineraryErrorMessage: string;
  currentMemberId: string;
  dialogState: ItineraryDialogState;
  effectivePlaceResolver: PlaceResolver | null;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: typeof nextClientMutationIdFactory;
  pathOptions: ItineraryPathOption[];
  pathSelection: ItineraryPathSelection;
  planItems: ItineraryItem[];
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  selectedDay: string;
  selectedItemId: string;
  selectedTripPlanId: string;
  setContextRailVisibility: (open: boolean) => void;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  setTripPlanError: (message: string | null) => void;
  tripPlanErrorMessage: string;
  trip: Trip;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryCommands({
  canEdit,
  canSaveItineraryErrorMessage,
  currentMemberId,
  dialogState,
  effectivePlaceResolver,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  pathOptions,
  pathSelection,
  planItems,
  participantSession,
  resolvedApiClient,
  replaceApiTrip,
  replaceCockpitFromApi,
  selectedDay,
  selectedItemId,
  selectedTripPlanId,
  setContextRailVisibility,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  setTripPlanError,
  tripPlanErrorMessage,
  trip,
  commitTrip,
  updateApiTrip,
}: UseWorkspaceItineraryCommandsParams) {
  const inlineUpdateQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const addStop = useCallback(
    (day?: string, parentItemId?: string | null) => {
      if (!canEdit) return;
      setStopPlaceResolution({ state: "idle", candidates: [] });
      setContextRailVisibility(false);
      setDialogState({ mode: "create", day, parentItemId: parentItemId ?? null });
    },
    [canEdit, setContextRailVisibility, setDialogState, setStopPlaceResolution],
  );

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

  const updateItineraryItemInline = useCallback(
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

  const addSubActivity = useCallback(
    async (parentItemId: string) => {
      const parentItem = trip.itineraryItems.find((item) => item.id === parentItemId);
      if (!parentItem) return;
      if (!parentItem.isPlanBlock) {
        try {
          setTripPlanError(null);
          await updateItineraryItemInline(parentItem.id, { isPlanBlock: true });
        } catch {
          setTripPlanError(tripPlanErrorMessage);
          return;
        }
      }
      addStop(parentItem.day, parentItem.id);
    },
    [addStop, setTripPlanError, trip, tripPlanErrorMessage, updateItineraryItemInline],
  );

  const {
    moveItem,
    moveItemIntoPlanBlock,
    moveItemToDay,
    moveItemToPath,
  } = useWorkspaceItineraryMoveCommands({
    canEdit,
    commitTrip,
    isApiMode,
    nextClientMutationId,
    participantSession,
    replaceApiTrip,
    resolvedApiClient,
    selectedTripPlanId,
    setSelectedItemId,
    trip,
    updateApiTrip,
  });

  const { createStop, updateSelectedStop } =
    useWorkspaceItineraryStopSaveCommands({
      commitTrip,
      currentMemberId,
      dialogState,
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
    });

  const { resolveMissingMapCoordinates } = useWorkspaceItineraryMapCommands({
    canEdit,
    effectivePlaceResolver,
    nextClientMutationId,
    trip,
    updateItineraryItemInline,
  });

  const { deleteStop } = useWorkspaceItineraryDeleteCommand({
    canEdit,
    commitTrip,
    isApiMode,
    participantSession,
    resolvedApiClient,
    selectedItemId,
    setContextRailVisibility,
    setDialogState,
    setSelectedItemId,
    trip,
    updateApiTrip,
  });

  return {
    addStop,
    addSubActivity,
    createStop,
    moveItem,
    moveItemIntoPlanBlock,
    moveItemToDay,
    moveItemToPath,
    resolveMissingMapCoordinates,
    updateItineraryItemInline,
    updateSelectedStop,
    deleteStop,
  };
}
