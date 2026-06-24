import type { Dispatch, SetStateAction } from "react";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  nextClientMutationId as nextClientMutationIdFactory,
} from "@/src/trip/identity";
import type {
  ItineraryPathOption,
  ItineraryPathSelection,
} from "@/src/trip/itinerary-paths";
import type {
  PlaceResolver,
  StopPlaceResolutionState,
} from "@/src/trip/places";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary-dialog-state";

export interface WorkspaceItineraryStopCommandBaseParams {
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  effectivePlaceResolver: PlaceResolver | null;
  isApiMode: boolean;
  nextClientMutationId: typeof nextClientMutationIdFactory;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export interface UseWorkspaceItineraryStopCreateCommandParams
  extends WorkspaceItineraryStopCommandBaseParams {
  currentMemberId: string;
  pathOptions: ItineraryPathOption[];
  pathSelection: ItineraryPathSelection;
  planItems: ItineraryItem[];
  selectedDay: string;
  selectedTripPlanId: string;
  setContextRailVisibility: (open: boolean) => void;
}

export interface UseWorkspaceItineraryStopUpdateCommandParams
  extends WorkspaceItineraryStopCommandBaseParams {
  dialogState: ItineraryDialogState;
}

export interface UseWorkspaceItineraryStopSaveCommandsParams
  extends UseWorkspaceItineraryStopCreateCommandParams {
  dialogState: ItineraryDialogState;
}

export type CreateWorkspaceItineraryStopCommand = (
  values: StopFormValues,
) => Promise<void>;

export type UpdateWorkspaceItineraryStopCommand = (
  values: StopFormValues,
) => Promise<void>;
