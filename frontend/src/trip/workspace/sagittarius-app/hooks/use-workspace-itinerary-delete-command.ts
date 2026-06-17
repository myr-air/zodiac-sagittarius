import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { deleteItineraryItemFromTrip } from "@/src/trip/itinerary";
import type {
  ItineraryItem,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

interface ItineraryDialogStateEdit {
  mode: "edit";
  item: ItineraryItem;
}

type ItineraryDialogState = ItineraryDialogStateEdit | { mode: "create" } | null;

interface UseWorkspaceItineraryDeleteCommandParams {
  canEdit: boolean;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  selectedItemId: string;
  setContextRailVisibility: (open: boolean) => void;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryDeleteCommand({
  canEdit,
  commitTrip,
  isApiMode,
  participantSession,
  resolvedApiClient,
  selectedItemId,
  setContextRailVisibility,
  setDialogState,
  setSelectedItemId,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryDeleteCommandParams) {
  const deleteStop = useCallback(
    async (itemId: string) => {
      if (!canEdit) return;
      const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
      if (!item) return;
      const remainingItems = trip.itineraryItems.filter(
        (candidate) => candidate.id !== itemId,
      );
      const nextSelectedItemId =
        selectedItemId === itemId
          ? (remainingItems[0]?.id ?? "")
          : selectedItemId;

      if (isApiMode && resolvedApiClient && participantSession) {
        await resolvedApiClient.deleteItineraryItem(
          trip.id,
          itemId,
          participantSession.sessionToken,
        );
        updateApiTrip((current) => deleteItineraryItemFromTrip(current, itemId));
        setSelectedItemId(nextSelectedItemId);
        if (!nextSelectedItemId) setContextRailVisibility(false);
        setDialogState((current) =>
          current?.mode === "edit" && current.item.id === itemId ? null : current,
        );
        return;
      }

      commitTrip(
        (current) => deleteItineraryItemFromTrip(current, itemId),
        nextSelectedItemId,
      );
      if (!nextSelectedItemId) setContextRailVisibility(false);
      setDialogState((current) =>
        current?.mode === "edit" && current.item.id === itemId ? null : current,
      );
    },
    [
      canEdit,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      selectedItemId,
      setContextRailVisibility,
      setDialogState,
      setSelectedItemId,
      trip,
      updateApiTrip,
    ],
  );

  return { deleteStop };
}
