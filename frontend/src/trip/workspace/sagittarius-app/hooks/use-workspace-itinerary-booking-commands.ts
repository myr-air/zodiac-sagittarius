import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import {
  type BookingDocInputLike,
  type ItineraryBookingTemplate,
  type ItineraryBookingTicketInput,
  bookingDocInputFromRecord,
  clearItineraryBookingTicketDetails,
  findDuplicateBookingDoc,
  syncItineraryDetailsWithBookingTicket,
} from "@/src/trip/booking-docs";
import type { BookingDoc, Trip } from "@/src/trip/types";
import {
  buildItineraryBookingDraftInput,
  buildItineraryBookingTicketDocInput,
} from "./booking-command-inputs";

interface UseWorkspaceItineraryBookingCommandsOptions {
  canEditBookings: boolean;
  createBookingDoc: (input: BookingDocInputLike) => Promise<BookingDoc | null>;
  currentMemberId: string;
  latestTripRef: MutableRefObject<Trip>;
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  setSelectedItemId: Dispatch<SetStateAction<string>>;
  trip: Trip;
  updateBookingDoc: (
    bookingDocId: string,
    input: BookingDocInputLike,
  ) => Promise<void>;
  updateItineraryItemInline: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => Promise<void>;
}

export function useWorkspaceItineraryBookingCommands({
  canEditBookings,
  createBookingDoc,
  currentMemberId,
  latestTripRef,
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
  updateBookingDoc,
  updateItineraryItemInline,
}: UseWorkspaceItineraryBookingCommandsOptions) {
  const createItineraryBookingDraft = useCallback(
    async (
      itemId: string,
      template: ItineraryBookingTemplate = "recommended",
    ) => {
      if (!canEditBookings) return;
      const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
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
      setContextRailPreferredTab,
      setSelectedItemId,
      trip,
      latestTripRef,
    ],
  );

  const saveItineraryBookingTicket = useCallback(
    async (input: ItineraryBookingTicketInput) => {
      if (!canEditBookings) return;
      const currentTrip = latestTripRef.current;
      const item = currentTrip.itineraryItems.find(
        (candidate) => candidate.id === input.itemId,
      );
      if (!item) return;
      const explicitBookingDoc = input.bookingDocId
        ? currentTrip.bookingDocs?.find(
            (candidate) => candidate.id === input.bookingDocId,
          )
        : null;
      const bookingDocInput = buildItineraryBookingTicketDocInput(input, {
        currentMemberId,
        defaultTimezone: trip.defaultTimezone,
        existingBookingDoc: explicitBookingDoc,
        members: trip.members,
      });
      const relatedItineraryItemIds = bookingDocInput.relatedItineraryItemIds;
      const existingBookingDoc =
        explicitBookingDoc ??
        findDuplicateBookingDoc(currentTrip.bookingDocs ?? [], bookingDocInput);

      if (existingBookingDoc) {
        await updateBookingDoc(existingBookingDoc.id, bookingDocInput);
      } else {
        await createBookingDoc(bookingDocInput);
      }

      for (const relatedItemId of relatedItineraryItemIds) {
        const relatedItem = latestTripRef.current.itineraryItems.find(
          (candidate) => candidate.id === relatedItemId,
        );
        if (!relatedItem) continue;
        const nextDetails = syncItineraryDetailsWithBookingTicket(
          relatedItem,
          input,
        );
        await updateItineraryItemInline(relatedItem.id, {
          details: nextDetails,
        });
      }

      setContextRailPreferredTab("booking");
      setSelectedItemId(item.id);
      return input.title;
    },
    [
      canEditBookings,
      createBookingDoc,
      currentMemberId,
      latestTripRef,
      setContextRailPreferredTab,
      setSelectedItemId,
      trip.defaultTimezone,
      trip.members,
      updateBookingDoc,
      updateItineraryItemInline,
    ],
  );

  const unlinkBookingFromItineraryItem = useCallback(
    async (bookingDocId: string, itemId: string) => {
      if (!canEditBookings) return;
      const currentTrip = latestTripRef.current;
      const bookingDoc = currentTrip.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc || !bookingDoc.relatedItineraryItemIds.includes(itemId))
        return;
      await updateBookingDoc(bookingDoc.id, bookingDocInputFromRecord(bookingDoc, {
        relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds.filter(
          (relatedItemId) => relatedItemId !== itemId,
        ),
      }));
      const item = latestTripRef.current.itineraryItems.find(
        (candidate) => candidate.id === itemId,
      );
      if (item) {
        await updateItineraryItemInline(item.id, {
          details: clearItineraryBookingTicketDetails(item),
        });
      }
      setContextRailPreferredTab("booking");
      setSelectedItemId(itemId);
    },
    [
      canEditBookings,
      latestTripRef,
      setContextRailPreferredTab,
      setSelectedItemId,
      updateBookingDoc,
      updateItineraryItemInline,
    ],
  );

  return {
    createItineraryBookingDraft,
    saveItineraryBookingTicket,
    unlinkBookingFromItineraryItem,
  };
}
