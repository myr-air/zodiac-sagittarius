import { useCreateItineraryBookingDraftCommand } from "./use-create-itinerary-booking-draft-command";
import { useSaveItineraryBookingTicketCommand } from "./use-save-itinerary-booking-ticket-command";
import { useUnlinkItineraryBookingCommand } from "./use-unlink-itinerary-booking-command";
import type { UseWorkspaceItineraryBookingCommandsOptions } from "./workspace-itinerary-booking-command-types";

export function useWorkspaceItineraryBookingCommands({
  canEditBookings,
  createBookingDoc,
  currentMemberId,
  latestTripRef,
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
  updateBookingDoc,
  updateItineraryItemInline,
}: UseWorkspaceItineraryBookingCommandsOptions) {
  const createItineraryBookingDraft = useCreateItineraryBookingDraftCommand({
    canEditBookings,
    createBookingDoc,
    currentMemberId,
    latestTripRef,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip,
  });
  const saveItineraryBookingTicket = useSaveItineraryBookingTicketCommand({
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
  const unlinkBookingFromItineraryItem = useUnlinkItineraryBookingCommand({
    canEditBookings,
    latestTripRef,
    setContextRailPreferredTab,
    setSelectedItemId,
    updateBookingDoc,
    updateItineraryItemInline,
  });

  return {
    createItineraryBookingDraft,
    saveItineraryBookingTicket,
    unlinkBookingFromItineraryItem,
  };
}
