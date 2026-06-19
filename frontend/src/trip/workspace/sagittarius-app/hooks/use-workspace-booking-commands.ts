import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import {
  type BookingDocInputLike,
  type ItineraryBookingTemplate,
  type ItineraryBookingTicketInput,
  bookingDocInputFromRecord,
  buildCreateBookingDocRequest,
  buildPatchBookingDocRequest,
  clearItineraryBookingTicketDetails,
  createLocalBookingDoc,
  findDuplicateBookingDoc,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  syncItineraryDetailsWithBookingTicket,
  updateLocalBookingDocInTrip,
} from "@/src/trip/booking-docs";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import { nextLocalBookingDocId } from "@/src/trip/local-ids";
import type {
  BookingDoc,
  BookingDocType,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { tripPlanIdForBookingRecord } from "@/src/trip/workspace/trip-plan-records";
import {
  buildItineraryBookingDraftInput,
  buildItineraryBookingTicketDocInput,
} from "./booking-command-inputs";
import { workspaceLocalMutationTimestamp } from "../support/local-mutations";
import { queueKeyedUpdate } from "../support/queued-updates";

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
  const bookingDocUpdateQueueRef = useRef<Map<string, Promise<void>>>(
    new Map(),
  );

  const createBookingDoc = useCallback(
    async (input: BookingDocInputLike): Promise<BookingDoc | null> => {
      if (!canEditBookings) return null;
      const title = input.title.trim();
      if (!title) return null;
      if (isApiMode && apiClient && participantSession) {
        const clientMutationId = nextClientMutationId("booking-doc-create");
        try {
          const bookingDoc = await apiClient.createBookingDoc(
            trip.id,
            participantSession.sessionToken,
            buildCreateBookingDocRequest(
              {
                ...input,
                title,
                tripPlanId:
                  input.tripPlanId ??
                  tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
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
        title,
        tripPlanId:
          input.tripPlanId ??
          tripPlanIdForBookingRecord(trip, input, selectedTripPlanId),
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
      nextClientMutationId,
      participantSession,
      replaceApiTrip,
      replaceCockpitFromApi,
      selectedTripPlanId,
      trip,
      latestTripRef,
    ],
  );

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

  const runBookingDocUpdate = useCallback(
    async (bookingDocId: string, input: BookingDocInputLike) => {
      if (!canEditBookings) return;
      if (isApiMode && apiClient && participantSession) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const currentTrip = latestTripRef.current;
          const bookingDoc = currentTrip.bookingDocs?.find(
            (candidate) => candidate.id === bookingDocId,
          );
          if (!bookingDoc) return;
          try {
            const patchedBookingDoc = await apiClient.patchBookingDoc(
              currentTrip.id,
              bookingDocId,
              participantSession.sessionToken,
              buildPatchBookingDocRequest(
                {
                  ...input,
                  title: input.title.trim(),
                },
                {
                  clientMutationId: nextClientMutationId("booking-doc-patch"),
                  expectedVersion: bookingDoc.version,
                },
              ),
            );
            const nextTrip = replaceBookingDocInTrip(
              latestTripRef.current,
              patchedBookingDoc,
            );
            replaceApiTrip(nextTrip);
            return;
          } catch (error) {
            if (!isVersionConflict(error) || attempt > 0)
              throw error;
            const cockpit = await apiClient.loadTrip(
              currentTrip.id,
              participantSession.sessionToken,
            );
            replaceCockpitFromApi(cockpit);
            latestTripRef.current = cockpit.trip;
          }
        }
        return;
      }
      commitTrip((current) =>
        updateLocalBookingDocInTrip(current, bookingDocId, input, {
          title: input.title.trim(),
          updatedAt: workspaceLocalMutationTimestamp,
        }),
      );
    },
    [
      apiClient,
      canEditBookings,
      commitTrip,
      isApiMode,
      latestTripRef,
      nextClientMutationId,
      participantSession,
      replaceApiTrip,
      replaceCockpitFromApi,
    ],
  );

  const queueBookingDocUpdate = useCallback(
    async (bookingDocId: string, update: () => void | Promise<void>) => {
      await queueKeyedUpdate(bookingDocUpdateQueueRef.current, bookingDocId, update);
    },
    [],
  );

  const updateBookingDoc = useCallback(
    async (bookingDocId: string, input: BookingDocInputLike) => {
      await queueBookingDocUpdate(bookingDocId, () =>
        runBookingDocUpdate(bookingDocId, input),
      );
    },
    [queueBookingDocUpdate, runBookingDocUpdate],
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

  const changeBookingDocType = useCallback(
    async (bookingDocId: string, type: BookingDocType) => {
      const bookingDoc = latestTripRef.current.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc || bookingDoc.type === type) return;
      await updateBookingDoc(bookingDoc.id, bookingDocInputFromRecord(bookingDoc, {
        type,
      }));
    },
    [latestTripRef, updateBookingDoc],
  );

  const changeBookingDocQuickFields = useCallback(
    async (
      bookingDocId: string,
      patch: {
        confirmationCode?: string | null;
        providerName?: string | null;
      },
    ) => {
      await queueBookingDocUpdate(bookingDocId, async () => {
        const bookingDoc = latestTripRef.current.bookingDocs?.find(
          (candidate) => candidate.id === bookingDocId,
        );
        if (!bookingDoc) return;
        const providerName =
          patch.providerName !== undefined
            ? patch.providerName
            : bookingDoc.providerName;
        const confirmationCode =
          patch.confirmationCode !== undefined
            ? patch.confirmationCode
            : bookingDoc.confirmationCode;
        if (
          providerName === bookingDoc.providerName &&
          confirmationCode === bookingDoc.confirmationCode
        )
          return;
        await runBookingDocUpdate(bookingDoc.id, bookingDocInputFromRecord(bookingDoc, {
          providerName,
          confirmationCode,
        }));
      });
    },
    [queueBookingDocUpdate, runBookingDocUpdate, latestTripRef],
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
      participantSession,
      trip.id,
      replaceApiTrip,
      latestTripRef,
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
