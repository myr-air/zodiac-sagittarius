import { useCallback } from "react";
import { bookingDocQuickFieldsInputFromRecord } from "@/src/trip/booking-docs";
import type {
  ChangeBookingDocQuickFieldsCommand,
  QueueBookingDocUpdate,
  RunBookingDocUpdate,
  UseWorkspaceBookingDocUpdateCommandsOptions,
} from "./workspace-booking-doc-update-command-types";

interface UseBookingDocQuickFieldCommandOptions {
  latestTripRef: UseWorkspaceBookingDocUpdateCommandsOptions["latestTripRef"];
  queueBookingDocUpdate: QueueBookingDocUpdate;
  runBookingDocUpdate: RunBookingDocUpdate;
}

export function useBookingDocQuickFieldCommand({
  latestTripRef,
  queueBookingDocUpdate,
  runBookingDocUpdate,
}: UseBookingDocQuickFieldCommandOptions): ChangeBookingDocQuickFieldsCommand {
  return useCallback(
    async (bookingDocId, patch) => {
      await queueBookingDocUpdate(bookingDocId, async () => {
        const bookingDoc = latestTripRef.current.bookingDocs?.find(
          (candidate) => candidate.id === bookingDocId,
        );
        if (!bookingDoc) return;
        const input = bookingDocQuickFieldsInputFromRecord(bookingDoc, patch);
        if (!input) return;
        await runBookingDocUpdate(bookingDoc.id, input);
      });
    },
    [latestTripRef, queueBookingDocUpdate, runBookingDocUpdate],
  );
}
