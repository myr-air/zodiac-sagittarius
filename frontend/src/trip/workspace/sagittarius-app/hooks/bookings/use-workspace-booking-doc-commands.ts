import { useCallback } from "react";
import type { MutableRefObject } from "react";
import {
  type BookingDocInputLike,
  buildCreateBookingDocRequest,
  createLocalBookingDoc,
  removeBookingDocFromTrip,
} from "@/src/trip/booking-docs";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-client";
import { nextLocalBookingDocId } from "@/src/trip/identity";
import type {
  BookingDoc,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { buildWorkspaceBookingDocCreateInput } from "./booking-command-inputs";
import { useWorkspaceBookingDocUpdateCommands } from "./use-workspace-booking-doc-update-commands";

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
  const {
    changeBookingDocQuickFields,
    changeBookingDocType,
    updateBookingDoc,
  } = useWorkspaceBookingDocUpdateCommands({
    apiClient,
    canEditBookings,
    commitTrip,
    isApiMode,
    latestTripRef,
    nextClientMutationId,
    participantSession,
    replaceApiTrip,
    replaceCockpitFromApi,
  });

  const createBookingDoc = useCallback(
    async (input: BookingDocInputLike): Promise<BookingDoc | null> => {
      if (!canEditBookings) return null;
      const createInput = buildWorkspaceBookingDocCreateInput(input, {
        selectedTripPlanId,
        trip,
      });
      if (!createInput) return null;
      if (isApiMode && apiClient && participantSession) {
        const clientMutationId = nextClientMutationId("booking-doc-create");
        try {
          const bookingDoc = await apiClient.createBookingDoc(
            trip.id,
            participantSession.sessionToken,
            buildCreateBookingDocRequest(
              {
                ...input,
                title: createInput.title,
                tripPlanId: createInput.tripPlanId,
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
        title: createInput.title,
        tripPlanId: createInput.tripPlanId,
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
