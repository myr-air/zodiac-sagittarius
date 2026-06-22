import { useCreateBookingDocCommand } from "./use-create-booking-doc-command";
import { useDeleteBookingDocCommand } from "./use-delete-booking-doc-command";
import { useWorkspaceBookingDocUpdateCommands } from "./use-workspace-booking-doc-update-commands";
import type { UseWorkspaceBookingDocCommandsOptions } from "./workspace-booking-doc-command-types";

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
  const createBookingDoc = useCreateBookingDocCommand({
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
  });
  const deleteBookingDoc = useDeleteBookingDocCommand({
    apiClient,
    canEditBookings,
    commitTrip,
    isApiMode,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    trip,
  });

  return {
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    deleteBookingDoc,
    updateBookingDoc,
  };
}
