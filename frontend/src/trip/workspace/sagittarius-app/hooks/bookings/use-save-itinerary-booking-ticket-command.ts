import { useCallback } from "react";
import { syncItineraryDetailsWithBookingTicket } from "@/src/trip/booking-docs";
import { resolveItineraryBookingTicketCommandInput } from "./booking-command-ticket-inputs";
import type {
  SaveItineraryBookingTicketCommand,
  UseWorkspaceItineraryBookingCommandsOptions,
} from "./workspace-itinerary-booking-command-types";

type UseSaveItineraryBookingTicketCommandOptions =
  UseWorkspaceItineraryBookingCommandsOptions;

export function useSaveItineraryBookingTicketCommand({
  canEditBookings,
  createBookingDoc,
  currentMemberId,
  latestTripRef,
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
  updateBookingDoc,
  updateItineraryItemInline,
}: UseSaveItineraryBookingTicketCommandOptions): SaveItineraryBookingTicketCommand {
  return useCallback(
    async (input) => {
      if (!canEditBookings) return;
      const currentTrip = latestTripRef.current;
      const item = currentTrip.itineraryItems.find(
        (candidate) => candidate.id === input.itemId,
      );
      if (!item) return;
      const {
        bookingDocInput,
        existingBookingDoc,
      } = resolveItineraryBookingTicketCommandInput(input, {
        bookingDocs: currentTrip.bookingDocs ?? [],
        currentMemberId,
        defaultTimezone: trip.defaultTimezone,
        members: trip.members,
      });
      const relatedItineraryItemIds = bookingDocInput.relatedItineraryItemIds;

      if (existingBookingDoc) {
        await updateBookingDoc(existingBookingDoc.id, bookingDocInput);
      } else {
        await createBookingDoc(bookingDocInput);
      }

      for (const relatedItemId of relatedItineraryItemIds) {
        const relatedItem = latestTripRef.current.itineraryItems.find(
          (candidate) => candidate.id === relatedItemId,
        );
        if (!relatedItem) continue;
        const nextDetails = syncItineraryDetailsWithBookingTicket(
          relatedItem,
          input,
        );
        await updateItineraryItemInline(relatedItem.id, {
          details: nextDetails,
        });
      }

      setContextRailPreferredTab("booking");
      setSelectedItemId(item.id);
      return input.title;
    },
    [
      canEditBookings,
      createBookingDoc,
      currentMemberId,
      latestTripRef,
      setContextRailPreferredTab,
      setSelectedItemId,
      trip.defaultTimezone,
      trip.members,
      updateBookingDoc,
      updateItineraryItemInline,
    ],
  );
}
