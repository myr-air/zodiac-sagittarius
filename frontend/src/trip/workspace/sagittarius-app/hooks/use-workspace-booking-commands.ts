import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import {
  type ItineraryBookingTemplate,
  type ItineraryBookingTicketInput,
  bookingDocInputFromRecord,
  clearItineraryBookingTicketDetails,
  findDuplicateBookingDoc,
  syncItineraryDetailsWithBookingTicket,
} from "@/src/trip/booking-docs";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import {
  buildItineraryBookingDraftInput,
  buildItineraryBookingTicketDocInput,
} from "./booking-command-inputs";
import { useWorkspaceBookingDocCommands } from "./use-workspace-booking-doc-commands";

interface UseWorkspaceBookingCommandsOptions {
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
  setContextRailPreferredTab: (tab: "notes" | "booking") => void;
  setSelectedItemId: Dispatch<SetStateAction<string>>;
  trip: Trip;
  updateItineraryItemInline: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => Promise<void>;
  apiClient?: TripApiClient;
}

export function useWorkspaceBookingCommands({
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
  setContextRailPreferredTab,
  setSelectedItemId,
  trip,
  updateItineraryItemInline,
  apiClient,
}: UseWorkspaceBookingCommandsOptions) {
  const {
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    deleteBookingDoc,
    updateBookingDoc,
  } = useWorkspaceBookingDocCommands({
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
    changeBookingDocQuickFields,
    changeBookingDocType,
    createBookingDoc,
    createItineraryBookingDraft,
    deleteBookingDoc,
    saveItineraryBookingTicket,
    unlinkBookingFromItineraryItem,
    updateBookingDoc,
  };
}
