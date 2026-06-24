import { useCallback } from "react";
import { removeBookingDocFromTrip } from "@/src/trip/booking-docs";
import type {
  DeleteBookingDocCommand,
  UseDeleteBookingDocCommandOptions,
} from "./workspace-booking-doc-command-types";

export function useDeleteBookingDocCommand({
  apiClient,
  canEditBookings,
  commitTrip,
  isApiMode,
  latestTripRef,
  participantSession,
  replaceApiTrip,
  trip,
}: UseDeleteBookingDocCommandOptions): DeleteBookingDocCommand {
  return useCallback(
    async (bookingDocId) => {
      if (!canEditBookings) return;
      if (isApiMode && apiClient && participantSession) {
        await apiClient.deleteBookingDoc(
          trip.id,
          bookingDocId,
          participantSession.sessionToken,
        );
        const nextTrip = removeBookingDocFromTrip(
          latestTripRef.current,
          bookingDocId,
        );
        replaceApiTrip(nextTrip);
        return;
      }
      commitTrip((current) =>
        removeBookingDocFromTrip(current, bookingDocId),
      );
    },
    [
      apiClient,
      canEditBookings,
      commitTrip,
      isApiMode,
      latestTripRef,
      participantSession,
      replaceApiTrip,
      trip.id,
    ],
  );
}
