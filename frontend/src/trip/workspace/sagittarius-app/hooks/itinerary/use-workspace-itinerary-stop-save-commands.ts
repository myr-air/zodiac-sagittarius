import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  type ItineraryPathOption,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary-paths";
import {
  type PlaceResolver,
  type StopPlaceResolutionState,
} from "@/src/trip/places";
import {
  nextClientMutationId as nextClientMutationIdFactory,
} from "@/src/trip/identity";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary-dialog-state";
import { useWorkspaceItineraryStopCreateCommand } from "./use-workspace-itinerary-stop-create-command";
import { useWorkspaceItineraryStopUpdateCommand } from "./use-workspace-itinerary-stop-update-command";

interface UseWorkspaceItineraryStopSaveCommandsParams {
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  currentMemberId: string;
  dialogState: ItineraryDialogState;
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

export function useWorkspaceItineraryStopSaveCommands({
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
}: UseWorkspaceItineraryStopSaveCommandsParams) {
  const createStop = useWorkspaceItineraryStopCreateCommand({
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
  });

  const updateSelectedStop = useWorkspaceItineraryStopUpdateCommand({
    commitTrip,
    dialogState,
    effectivePlaceResolver,
    isApiMode,
    nextClientMutationId,
    participantSession,
    resolvedApiClient,
    setDialogState,
    setSelectedItemId,
    setStopPlaceResolution,
    trip,
    updateApiTrip,
  });

  return {
    createStop,
    updateSelectedStop,
  };
}
