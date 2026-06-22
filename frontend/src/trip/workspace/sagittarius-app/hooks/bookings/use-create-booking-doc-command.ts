import { useCallback } from "react";
import {
  buildCreateBookingDocRequest,
  createLocalBookingDoc,
} from "@/src/trip/booking-docs";
import { isVersionConflict } from "@/src/trip/api-client";
import { nextLocalBookingDocId } from "@/src/trip/identity";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import { buildWorkspaceBookingDocCreateInput } from "./booking-command-inputs";
import type {
  CreateBookingDocCommand,
  UseCreateBookingDocCommandOptions,
} from "./workspace-booking-doc-command-types";

export function useCreateBookingDocCommand({
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
}: UseCreateBookingDocCommandOptions): CreateBookingDocCommand {
  return useCallback(
    async (input) => {
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
          if (!isVersionConflict(error)) throw error;
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
}
