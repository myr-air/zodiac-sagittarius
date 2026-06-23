import { useCallback } from "react";
import { findDuplicateBookingDoc } from "@/src/trip/booking-docs";
import { findItineraryItemById } from "@/src/trip/itinerary-items";
import { buildItineraryBookingDraftInput } from "./booking-command-draft-inputs";
import type {
  CreateItineraryBookingDraftCommand,
  UseWorkspaceItineraryBookingCommandsOptions,
} from "./workspace-itinerary-booking-command-types";

type UseCreateItineraryBookingDraftCommandOptions = Pick<
  UseWorkspaceItineraryBookingCommandsOptions,
  | "canEditBookings"
  | "createBookingDoc"
  | "currentMemberId"
  | "latestTripRef"
  | "setContextRailPreferredTab"
  | "setSelectedItemId"
  | "trip"
>;

export function useCreateItineraryBookingDraftCommand({
  canEditBookings,
  createBookingDoc,
  currentMemberId,
  latestTripRef,
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
}: UseCreateItineraryBookingDraftCommandOptions): CreateItineraryBookingDraftCommand {
  return useCallback(
    async (itemId, template = "recommended") => {
      if (!canEditBookings) return;
      const item = findItineraryItemById(trip.itineraryItems, itemId);
      if (!item) return;
      const bookingDocInput = buildItineraryBookingDraftInput({
        currentMemberId,
        defaultTimezone: trip.defaultTimezone,
        item,
        members: trip.members,
        template,
      });
      const matchingDraft = findDuplicateBookingDoc(
        latestTripRef.current.bookingDocs ?? [],
        bookingDocInput,
      );
      if (matchingDraft) {
        setContextRailPreferredTab("booking");
        setSelectedItemId(item.id);
        return matchingDraft.title;
      }
      const bookingDoc = await createBookingDoc({
        ...bookingDocInput,
      });
      setContextRailPreferredTab("booking");
      setSelectedItemId(item.id);
      return bookingDoc?.title;
    },
    [
      canEditBookings,
      createBookingDoc,
      currentMemberId,
      latestTripRef,
      setContextRailPreferredTab,
      setSelectedItemId,
      trip,
    ],
  );
}
