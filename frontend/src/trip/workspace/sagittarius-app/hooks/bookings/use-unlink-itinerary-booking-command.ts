import { useCallback } from "react";
import {
  bookingDocInputFromRecord,
  clearItineraryBookingTicketDetails,
} from "@/src/trip/booking-docs";
import type {
  UnlinkItineraryBookingCommand,
  UseWorkspaceItineraryBookingCommandsOptions,
} from "./workspace-itinerary-booking-command-types";

type UseUnlinkItineraryBookingCommandOptions = Pick<
  UseWorkspaceItineraryBookingCommandsOptions,
  | "canEditBookings"
  | "latestTripRef"
  | "setContextRailPreferredTab"
  | "setSelectedItemId"
  | "updateBookingDoc"
  | "updateItineraryItemInline"
>;

export function useUnlinkItineraryBookingCommand({
  canEditBookings,
  latestTripRef,
  setContextRailPreferredTab,
  setSelectedItemId,
  updateBookingDoc,
  updateItineraryItemInline,
}: UseUnlinkItineraryBookingCommandOptions): UnlinkItineraryBookingCommand {
  return useCallback(
    async (bookingDocId, itemId) => {
      if (!canEditBookings) return;
      const currentTrip = latestTripRef.current;
      const bookingDoc = currentTrip.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc || !bookingDoc.relatedItineraryItemIds.includes(itemId))
        return;
      await updateBookingDoc(bookingDoc.id, bookingDocInputFromRecord(bookingDoc, {
        relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds.filter(
          (relatedItemId) => relatedItemId !== itemId,
        ),
      }));
      const item = latestTripRef.current.itineraryItems.find(
        (candidate) => candidate.id === itemId,
      );
      if (item) {
        await updateItineraryItemInline(item.id, {
          details: clearItineraryBookingTicketDetails(item),
        });
      }
      setContextRailPreferredTab("booking");
      setSelectedItemId(itemId);
    },
    [
      canEditBookings,
      latestTripRef,
      setContextRailPreferredTab,
      setSelectedItemId,
      updateBookingDoc,
      updateItineraryItemInline,
    ],
  );
}
