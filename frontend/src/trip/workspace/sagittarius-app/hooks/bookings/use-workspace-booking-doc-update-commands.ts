import { useBookingDocQuickFieldCommand } from "./use-booking-doc-quick-field-command";
import { useBookingDocTypeCommand } from "./use-booking-doc-type-command";
import { useBookingDocUpdateRunner } from "./use-booking-doc-update-runner";
import type { UseWorkspaceBookingDocUpdateCommandsOptions } from "./workspace-booking-doc-update-command-types";

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
  const {
    queueBookingDocUpdate,
    runBookingDocUpdate,
    updateBookingDoc,
  } = useBookingDocUpdateRunner({
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
  const changeBookingDocType = useBookingDocTypeCommand({
    latestTripRef,
    updateBookingDoc,
  });
  const changeBookingDocQuickFields = useBookingDocQuickFieldCommand({
    latestTripRef,
    queueBookingDocUpdate,
    runBookingDocUpdate,
  });

  return {
    changeBookingDocQuickFields,
    changeBookingDocType,
    updateBookingDoc,
  };
}
