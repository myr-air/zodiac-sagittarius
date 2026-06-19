import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import {
  type BookingDocInputLike,
  type BookingDocQuickFieldsPatch,
  bookingDocInputFromRecord,
  bookingDocQuickFieldsInputFromRecord,
  buildPatchBookingDocRequest,
  normalizeBookingDocTitle,
  replaceBookingDocInTrip,
  updateLocalBookingDocInTrip,
} from "@/src/trip/booking-docs";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import type {
  BookingDocType,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { queueKeyedUpdate } from "../../support/queued-updates";

interface UseWorkspaceBookingDocUpdateCommandsOptions {
  apiClient?: TripApiClient;
  canEditBookings: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
}

export function useWorkspaceBookingDocUpdateCommands({
  apiClient,
  canEditBookings,
  commitTrip,
  isApiMode,
  latestTripRef,
  nextClientMutationId,
  participantSession,
  replaceApiTrip,
  replaceCockpitFromApi,
}: UseWorkspaceBookingDocUpdateCommandsOptions) {
  const bookingDocUpdateQueueRef = useRef<Map<string, Promise<void>>>(
    new Map(),
  );

  const runBookingDocUpdate = useCallback(
    async (bookingDocId: string, input: BookingDocInputLike) => {
      if (!canEditBookings) return;
      if (isApiMode && apiClient && participantSession) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const currentTrip = latestTripRef.current;
          const bookingDoc = currentTrip.bookingDocs?.find(
            (candidate) => candidate.id === bookingDocId,
          );
          if (!bookingDoc) return;
          try {
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
            return;
          } catch (error) {
            if (!isVersionConflict(error) || attempt > 0)
              throw error;
            const cockpit = await apiClient.loadTrip(
              currentTrip.id,
              participantSession.sessionToken,
            );
            replaceCockpitFromApi(cockpit);
            latestTripRef.current = cockpit.trip;
          }
        }
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

  const queueBookingDocUpdate = useCallback(
    async (bookingDocId: string, update: () => void | Promise<void>) => {
      await queueKeyedUpdate(bookingDocUpdateQueueRef.current, bookingDocId, update);
    },
    [],
  );

  const updateBookingDoc = useCallback(
    async (bookingDocId: string, input: BookingDocInputLike) => {
      await queueBookingDocUpdate(bookingDocId, () =>
        runBookingDocUpdate(bookingDocId, input),
      );
    },
    [queueBookingDocUpdate, runBookingDocUpdate],
  );

  const changeBookingDocType = useCallback(
    async (bookingDocId: string, type: BookingDocType) => {
      const bookingDoc = latestTripRef.current.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc || bookingDoc.type === type) return;
      await updateBookingDoc(bookingDoc.id, bookingDocInputFromRecord(bookingDoc, {
        type,
      }));
    },
    [latestTripRef, updateBookingDoc],
  );

  const changeBookingDocQuickFields = useCallback(
    async (
      bookingDocId: string,
      patch: BookingDocQuickFieldsPatch,
    ) => {
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
    [queueBookingDocUpdate, runBookingDocUpdate, latestTripRef],
  );

  return {
    changeBookingDocQuickFields,
    changeBookingDocType,
    updateBookingDoc,
  };
}
