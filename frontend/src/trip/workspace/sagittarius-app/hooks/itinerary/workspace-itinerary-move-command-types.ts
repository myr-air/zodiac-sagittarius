import type { TripApiClient } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

export interface UseWorkspaceItineraryMoveCommandsParams {
  canEdit: boolean;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  resolvedApiClient?: TripApiClient;
  selectedTripPlanId: string;
  setSelectedItemId: (itemId: string) => void;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export type UseWorkspaceItineraryReorderCommandParams =
  UseWorkspaceItineraryMoveCommandsParams;

export type UseWorkspaceItineraryBlockMoveCommandParams = Omit<
  UseWorkspaceItineraryMoveCommandsParams,
  "updateApiTrip"
>;

export type UseWorkspaceItineraryDayMoveCommandParams = Omit<
  UseWorkspaceItineraryMoveCommandsParams,
  "updateApiTrip"
>;

export type UseWorkspaceItineraryPathMoveCommandParams = Omit<
  UseWorkspaceItineraryMoveCommandsParams,
  "replaceApiTrip" | "selectedTripPlanId"
>;

export type MoveItemCommand = (
  draggedItemId: string,
  targetItemId: string,
) => Promise<void>;

export type MoveItemIntoPlanBlockCommand = (
  draggedItemId: string,
  planBlockItemId: string,
) => Promise<void>;

export type MoveItemToDayCommand = (
  draggedItemId: string,
  targetDay: string,
) => Promise<void>;

export type MoveItemToPathCommand = (
  itemId: string,
  pathId: string,
) => Promise<void>;
