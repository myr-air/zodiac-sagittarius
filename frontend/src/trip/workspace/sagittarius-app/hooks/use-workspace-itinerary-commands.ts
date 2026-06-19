import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import {
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import {
  nextClientMutationId as nextClientMutationIdFactory,
} from "@/src/trip/local-ids";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary-dialog-state";
import { useWorkspaceItineraryDeleteCommand } from "./use-workspace-itinerary-delete-command";
import { useWorkspaceItineraryInlineUpdateCommand } from "./use-workspace-itinerary-inline-update-command";
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
  const addStop = useCallback(
    (day?: string, parentItemId?: string | null) => {
      if (!canEdit) return;
      setStopPlaceResolution({ state: "idle", candidates: [] });
      setContextRailVisibility(false);
      setDialogState({ mode: "create", day, parentItemId: parentItemId ?? null });
    },
    [canEdit, setContextRailVisibility, setDialogState, setStopPlaceResolution],
  );

  const updateItineraryItemInline = useWorkspaceItineraryInlineUpdateCommand({
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
  });

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
