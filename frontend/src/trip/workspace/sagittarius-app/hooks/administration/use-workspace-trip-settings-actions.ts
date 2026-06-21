import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { deriveTripCountriesFromDestination } from "@/src/trip/metadata";
import {
  applyTripSettingsToTrip,
  buildShiftedItineraryItemDayRequests,
  buildPatchTripSettingsRequest,
  mergePatchedTripSettings,
} from "@/src/trip/trip-settings";
import { nextClientMutationId } from "@/src/trip/local-ids";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { TripSettingsFormValues } from "@/src/features/workspace/pages/trip-settings";

interface UseWorkspaceTripSettingsActionsOptions {
  canManagePeople: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceTripSettingsActions({
  canManagePeople,
  commitTrip,
  isApiMode,
  participantSession,
  resolvedApiClient,
  trip,
  updateApiTrip,
}: UseWorkspaceTripSettingsActionsOptions) {
  return useCallback(
    async (values: TripSettingsFormValues) => {
      if (!canManagePeople) return;
      const nextCountries = deriveTripCountriesFromDestination(
        values.destinationLabel,
        trip.countries ?? [],
      );

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedTrip = await resolvedApiClient.patchTrip(
          trip.id,
          participantSession.sessionToken,
          buildPatchTripSettingsRequest(
            { ...values, countries: nextCountries },
            {
              clientMutationId: nextClientMutationId("trip-settings"),
              expectedVersion: trip.version ?? 0,
            },
          ),
        );
        const shiftedItemRequests = buildShiftedItineraryItemDayRequests(
          trip.itineraryItems,
          trip.startDate,
          values.startDate,
          nextClientMutationId,
        );
        const patchedItems = await Promise.all(
          shiftedItemRequests.map(({ itemId, request }) =>
            resolvedApiClient.patchItineraryItem(
              trip.id,
              itemId,
              participantSession.sessionToken,
              request,
            ),
          ),
        );
        const patchedItemsById = new Map(
          patchedItems.map((item) => [item.id, item]),
        );
        updateApiTrip((current) =>
          mergePatchedTripSettings(current, patchedTrip, patchedItemsById),
        );
        return;
      }

      commitTrip((current) =>
        applyTripSettingsToTrip(current, { ...values, countries: nextCountries }),
      );
    },
    [
      canManagePeople,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
      updateApiTrip,
    ],
  );
}
