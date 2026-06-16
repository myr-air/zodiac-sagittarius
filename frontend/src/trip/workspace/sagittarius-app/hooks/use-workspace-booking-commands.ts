import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { BookingDocInput } from "@/src/components/BookingsDocsPage";
import type { ItineraryBookingTicketInput, ItineraryBookingTemplate } from "@/src/components/SmartItineraryTable";
import {
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingTypeForBookingTemplate,
  bookingTypeForItineraryItem,
  buildCreateBookingDocRequest,
  buildPatchBookingDocRequest,
  clearItineraryBookingTicketDetails,
  createLocalBookingDoc,
  findDuplicateBookingDoc,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  syncItineraryDetailsWithBookingTicket,
  updateLocalBookingDocInTrip,
  uniqueStringIds,
} from "@/src/trip/booking-docs";
import { TripApiError, type TripApiClient } from "@/src/trip/api-client";
import { nextLocalBookingDocId } from "@/src/trip/local-ids";
import type {
  BookingDoc,
  BookingDocType,
  InlineItineraryItemPatch,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { tripPlanIdForBookingRecord } from "@/src/trip/workspace/trip-plan-records";

interface UseWorkspaceBookingCommandsOptions {
  canEditBookings: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: { trip: Trip }) => void;
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
    async (input: BookingDocInput): Promise<BookingDoc | null> => {
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
          if (
            !(error instanceof TripApiError) ||
            error.code !== "version_conflict"
          )
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
        updatedAt: "2026-05-28T00:00:00.000Z",
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
      const draftDetails = bookingDraftDetailsForItineraryItem(item);
      const timeWindow = bookingDraftTimeWindowForItineraryItem(item);
      const bookingType =
        template === "recommended"
          ? bookingTypeForItineraryItem(item)
          : bookingTypeForBookingTemplate(template);
      const bookingDocInput: BookingDocInput = {
        type: bookingType,
        title: bookingDraftTitleForItineraryItem(item, bookingType),
        status: "draft",
        visibility: "shared",
        ownerMemberId: currentMemberId,
        providerName: draftDetails.providerName,
        confirmationCode: draftDetails.confirmationCode,
        startsAt: timeWindow.startsAt,
        endsAt: timeWindow.endsAt,
        timezone: trip.defaultTimezone ?? null,
        priceAmount: null,
        currency: null,
        travelerIds: trip.members.map((member) => member.id),
        externalLinks: [],
        relatedItineraryItemIds: [item.id],
        relatedTaskIds: [],
        relatedExpenseIds: [],
        noteIds: [],
        notes: draftDetails.notes,
      };
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
    async (bookingDocId: string, input: BookingDocInput) => {
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
            if (
              !(error instanceof TripApiError) ||
              error.code !== "version_conflict" ||
              attempt > 0
            )
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
          updatedAt: "2026-05-28T00:00:00.000Z",
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
      const previousUpdate =
        bookingDocUpdateQueueRef.current.get(bookingDocId) ?? Promise.resolve();
      const queuedUpdate = previousUpdate
        .catch(() => undefined)
        .then(() => update());
      bookingDocUpdateQueueRef.current.set(bookingDocId, queuedUpdate);
      try {
        await queuedUpdate;
      } finally {
        if (bookingDocUpdateQueueRef.current.get(bookingDocId) === queuedUpdate) {
          bookingDocUpdateQueueRef.current.delete(bookingDocId);
        }
      }
    },
    [],
  );

  const updateBookingDoc = useCallback(
    async (bookingDocId: string, input: BookingDocInput) => {
      await queueBookingDocUpdate(bookingDocId, () =>
        runBookingDocUpdate(bookingDocId, input),
      );
    },
    [queueBookingDocUpdate, runBookingDocUpdate],
  );

  const changeBookingDocType = useCallback(
    async (bookingDocId: string, type: BookingDocType) => {
      const bookingDoc = latestTripRef.current.bookingDocs?.find(
        (candidate) => candidate.id === bookingDocId,
      );
      if (!bookingDoc || bookingDoc.type === type) return;
      await updateBookingDoc(bookingDoc.id, {
        type,
        title: bookingDoc.title,
        status: bookingDoc.status,
        visibility: bookingDoc.visibility,
        ownerMemberId: bookingDoc.ownerMemberId,
        providerName: bookingDoc.providerName,
        confirmationCode: bookingDoc.confirmationCode,
        startsAt: bookingDoc.startsAt,
        endsAt: bookingDoc.endsAt,
        timezone: bookingDoc.timezone,
        priceAmount: bookingDoc.priceAmount,
        currency: bookingDoc.currency,
        travelerIds: bookingDoc.travelerIds,
        externalLinks: bookingDoc.externalLinks,
        relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds,
        relatedTaskIds: bookingDoc.relatedTaskIds,
        relatedExpenseIds: bookingDoc.relatedExpenseIds,
        noteIds: bookingDoc.noteIds,
        notes: bookingDoc.notes,
      });
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
        await runBookingDocUpdate(bookingDoc.id, {
          type: bookingDoc.type,
          title: bookingDoc.title,
          status: bookingDoc.status,
          visibility: bookingDoc.visibility,
          ownerMemberId: bookingDoc.ownerMemberId,
          providerName,
          confirmationCode,
          startsAt: bookingDoc.startsAt,
          endsAt: bookingDoc.endsAt,
          timezone: bookingDoc.timezone,
          priceAmount: bookingDoc.priceAmount,
          currency: bookingDoc.currency,
          travelerIds: bookingDoc.travelerIds,
          externalLinks: bookingDoc.externalLinks,
          relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds,
          relatedTaskIds: bookingDoc.relatedTaskIds,
          relatedExpenseIds: bookingDoc.relatedExpenseIds,
          noteIds: bookingDoc.noteIds,
          notes: bookingDoc.notes,
        });
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
