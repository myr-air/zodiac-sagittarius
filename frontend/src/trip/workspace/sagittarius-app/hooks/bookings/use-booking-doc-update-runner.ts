import { useCallback, useRef } from "react";
import {
  buildPatchBookingDocRequest,
  normalizeBookingDocTitle,
  replaceBookingDocInTrip,
  updateLocalBookingDocInTrip,
} from "@/src/trip/booking-docs";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { queueKeyedUpdate } from "../../support/queued-updates";
import {
  reloadWorkspaceCockpitAfterConflict,
  runWorkspaceVersionConflictRetry,
} from "../../support/workspace-api-conflict-retry";
import type {
  QueueBookingDocUpdate,
  RunBookingDocUpdate,
  UpdateBookingDocCommand,
  UseWorkspaceBookingDocUpdateCommandsOptions,
} from "./workspace-booking-doc-update-command-types";

interface BookingDocUpdateRunner {
  queueBookingDocUpdate: QueueBookingDocUpdate;
  runBookingDocUpdate: RunBookingDocUpdate;
  updateBookingDoc: UpdateBookingDocCommand;
}

export function useBookingDocUpdateRunner({
  apiClient,
  canEditBookings,
  commitTrip,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  participantSession,
  replaceApiTrip,
  replaceCockpitFromApi,
}: UseWorkspaceBookingDocUpdateCommandsOptions): BookingDocUpdateRunner {
  const bookingDocUpdateQueueRef = useRef<Map<string, Promise<void>>>(
    new Map(),
  );

  const runBookingDocUpdate = useCallback<RunBookingDocUpdate>(
    async (bookingDocId, input) => {
      if (!canEditBookings) return;
      if (isApiMode && apiClient && participantSession) {
        await runWorkspaceVersionConflictRetry({
          getContext: () => latestTripRef.current,
          reloadOnConflict: async (currentTrip) => {
            await reloadWorkspaceCockpitAfterConflict({
              apiClient,
              currentTrip,
              latestTripRef,
              participantSession,
              replaceCockpitFromApi,
            });
          },
          run: async (currentTrip) => {
            const bookingDoc = currentTrip.bookingDocs?.find(
              (candidate) => candidate.id === bookingDocId,
            );
            if (!bookingDoc) return;
            const patchedBookingDoc = await apiClient.patchBookingDoc(
              currentTrip.id,
              bookingDocId,
              participantSession.sessionToken,
              buildPatchBookingDocRequest(
                {
                  ...input,
                  title: normalizeBookingDocTitle(input),
                },
                {
                  clientMutationId: nextClientMutationId("booking-doc-patch"),
                  expectedVersion: bookingDoc.version,
                },
              ),
            );
            const nextTrip = replaceBookingDocInTrip(
              latestTripRef.current,
              patchedBookingDoc,
            );
            replaceApiTrip(nextTrip);
          },
        });
        return;
      }
      commitTrip((current) =>
        updateLocalBookingDocInTrip(current, bookingDocId, input, {
          title: normalizeBookingDocTitle(input),
          updatedAt: workspaceLocalMutationTimestamp,
        }),
      );
    },
    [
      apiClient,
      canEditBookings,
      commitTrip,
      isApiMode,
      latestTripRef,
      nextClientMutationId,
      participantSession,
      replaceApiTrip,
      replaceCockpitFromApi,
    ],
  );

  const queueBookingDocUpdate = useCallback<QueueBookingDocUpdate>(
    async (bookingDocId, update) => {
      await queueKeyedUpdate(
        bookingDocUpdateQueueRef.current,
        bookingDocId,
        update,
      );
    },
    [],
  );

  const updateBookingDoc = useCallback<UpdateBookingDocCommand>(
    async (bookingDocId, input) => {
      await queueBookingDocUpdate(bookingDocId, () =>
        runBookingDocUpdate(bookingDocId, input),
      );
    },
    [queueBookingDocUpdate, runBookingDocUpdate],
  );

  return {
    queueBookingDocUpdate,
    runBookingDocUpdate,
    updateBookingDoc,
  };
}
