import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useWorkspaceBookingDocCommands } from "./bookings/use-workspace-booking-doc-commands";
import { useWorkspaceItineraryBookingCommands } from "./bookings/use-workspace-itinerary-booking-commands";

interface UseWorkspaceBookingCommandsOptions {
  canEditBookings: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  selectedTripPlanId: string;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  setSelectedItemId: Dispatch<SetStateAction<string>>;
  trip: Trip;
  updateItineraryItemInline: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => Promise<void>;
  apiClient?: TripApiClient;
}

export function useWorkspaceBookingCommands({
  canEditBookings,
  commitTrip,
  currentMemberId,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  participantSession,
  replaceApiTrip,
  replaceCockpitFromApi,
  selectedTripPlanId,
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
  updateItineraryItemInline,
  apiClient,
}: UseWorkspaceBookingCommandsOptions) {
  const {
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    deleteBookingDoc,
    updateBookingDoc,
  } = useWorkspaceBookingDocCommands({
    apiClient,
    canEditBookings,
    commitTrip,
    currentMemberId,
    isApiMode,
    latestTripRef,
    nextClientMutationId,
    participantSession,
    replaceApiTrip,
    replaceCockpitFromApi,
    selectedTripPlanId,
    trip,
  });

  const {
    createItineraryBookingDraft,
    saveItineraryBookingTicket,
    unlinkBookingFromItineraryItem,
  } = useWorkspaceItineraryBookingCommands({
    canEditBookings,
    createBookingDoc,
    currentMemberId,
    latestTripRef,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip,
    updateBookingDoc,
    updateItineraryItemInline,
  });

  return {
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    createItineraryBookingDraft,
    deleteBookingDoc,
    saveItineraryBookingTicket,
    unlinkBookingFromItineraryItem,
    updateBookingDoc,
  };
}
