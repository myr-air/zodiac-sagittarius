import { useCallback } from "react";
import { bookingDocInputFromRecord } from "@/src/trip/booking-docs";
import type {
  ChangeBookingDocTypeCommand,
  UpdateBookingDocCommand,
  UseWorkspaceBookingDocUpdateCommandsOptions,
} from "./workspace-booking-doc-update-command-types";

interface UseBookingDocTypeCommandOptions {
  latestTripRef: UseWorkspaceBookingDocUpdateCommandsOptions["latestTripRef"];
  updateBookingDoc: UpdateBookingDocCommand;
}

export function useBookingDocTypeCommand({
  latestTripRef,
  updateBookingDoc,
}: UseBookingDocTypeCommandOptions): ChangeBookingDocTypeCommand {
  return useCallback(
    async (bookingDocId, type) => {
      const bookingDoc = latestTripRef.current.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc || bookingDoc.type === type) return;
      await updateBookingDoc(
        bookingDoc.id,
        bookingDocInputFromRecord(bookingDoc, {
          type,
        }),
      );
    },
    [latestTripRef, updateBookingDoc],
  );
}
