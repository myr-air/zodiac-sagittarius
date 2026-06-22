import { useCallback } from "react";
import { deriveTripCountriesFromDestination } from "@/src/trip/metadata";
import {
  applyTripSettingsToTrip,
  buildShiftedItineraryItemDayRequests,
  buildPatchTripSettingsRequest,
  mergePatchedTripSettings,
} from "@/src/trip/settings";
import { nextClientMutationId } from "@/src/trip/identity";
import type { TripSettingsFormValues } from "@/src/features/workspace/pages/trip-settings/model/trip-settings-form-model";
import type { UseWorkspaceTripSettingsActionsOptions } from "./workspace-administration-command-types";

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
