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

export type MoveItemIntoPlanBlockCommand = (
  draggedItemId: string,
  planBlockItemId: string,
) => Promise<void>;

export type MoveItemToDayCommand = (
  draggedItemId: string,
  targetDay: string,
) => Promise<void>;
