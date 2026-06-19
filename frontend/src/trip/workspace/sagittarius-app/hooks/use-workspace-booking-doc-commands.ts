import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import {
  type BookingDocInputLike,
  bookingDocInputFromRecord,
  buildCreateBookingDocRequest,
  buildPatchBookingDocRequest,
  createLocalBookingDoc,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  updateLocalBookingDocInTrip,
} from "@/src/trip/booking-docs";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import { nextLocalBookingDocId } from "@/src/trip/local-ids";
import type {
  BookingDoc,
  BookingDocType,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { tripPlanIdForBookingRecord } from "@/src/trip/workspace/trip-plan-records";
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";
import { queueKeyedUpdate } from "../support/queued-updates";

interface UseWorkspaceBookingDocCommandsOptions {
  apiClient?: TripApiClient;
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
  trip: Trip;
}

export function useWorkspaceBookingDocCommands({
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
}: UseWorkspaceBookingDocCommandsOptions) {
  const bookingDocUpdateQueueRef = useRef<Map<string, Promise<void>>>(
    new Map(),
  );

  const createBookingDoc = useCallback(
    async (input: BookingDocInputLike): Promise<BookingDoc | null> => {
      if (!canEditBookings) return null;
      const title = input.title.trim();
      if (!title) return null;
      if (isApiMode && apiClient && participantSession) {
        const clientMutationId = nextClientMutationId("booking-doc-create");
        try {
          const bookingDoc = await apiClient.createBookingDoc(
            trip.id,
            participantSession.sessionToken,
            buildCreateBookingDocRequest(
              {
                ...input,
                title,
                tripPlanId:
                  input.tripPlanId ??
                  tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
              },
              { clientMutationId },
            ),
          );
          const nextTrip = {
            ...latestTripRef.current,
            bookingDocs: [
              ...(latestTripRef.current.bookingDocs ?? []),
              bookingDoc,
            ],
          };
          replaceApiTrip(nextTrip);
          return bookingDoc;
        } catch (error) {
          if (!isVersionConflict(error))
            throw error;
          const cockpit = await apiClient.loadTrip(
            trip.id,
            participantSession.sessionToken,
          );
          replaceCockpitFromApi(cockpit);
          latestTripRef.current = cockpit.trip;
        }
        return null;
      }

      const bookingDoc = createLocalBookingDoc(trip, input, {
        title,
        tripPlanId:
          input.tripPlanId ??
          tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
        createdBy: currentMemberId,
        updatedAt: workspaceLocalMutationTimestamp,
        nextBookingDocId: nextLocalBookingDocId,
      });
      commitTrip((current) => ({
        ...current,
        bookingDocs: [...(current.bookingDocs ?? []), bookingDoc],
      }));
      return bookingDoc;
    },
    [
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
    ],
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
                  title: input.title.trim(),
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
          title: input.title.trim(),
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
      patch: {
        confirmationCode?: string | null;
        providerName?: string | null;
      },
    ) => {
      await queueBookingDocUpdate(bookingDocId, async () => {
        const bookingDoc = latestTripRef.current.bookingDocs?.find(
          (candidate) => candidate.id === bookingDocId,
        );
        if (!bookingDoc) return;
        const providerName =
          patch.providerName !== undefined
            ? patch.providerName
            : bookingDoc.providerName;
        const confirmationCode =
          patch.confirmationCode !== undefined
            ? patch.confirmationCode
            : bookingDoc.confirmationCode;
        if (
          providerName === bookingDoc.providerName &&
          confirmationCode === bookingDoc.confirmationCode
        )
          return;
        await runBookingDocUpdate(bookingDoc.id, bookingDocInputFromRecord(bookingDoc, {
          providerName,
          confirmationCode,
        }));
      });
    },
    [queueBookingDocUpdate, runBookingDocUpdate, latestTripRef],
  );

  const deleteBookingDoc = useCallback(
    async (bookingDocId: string) => {
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

  return {
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    deleteBookingDoc,
    updateBookingDoc,
  };
}
