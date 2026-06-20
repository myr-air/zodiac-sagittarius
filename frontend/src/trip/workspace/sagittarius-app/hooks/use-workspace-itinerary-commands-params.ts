import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  TripApiClient,
  TripCockpit,
} from "@/src/trip/api-client";
import type {
  ItineraryPathOption,
  ItineraryPathSelection,
} from "@/src/trip/itinerary";
import type {
  PlaceResolver,
  StopPlaceResolutionState,
} from "@/src/trip/place-resolution";
import type { nextClientMutationId as nextClientMutationIdFactory } from "@/src/trip/local-ids";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary/itinerary-dialog-state";

export interface UseWorkspaceItineraryCommandsParams {
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
