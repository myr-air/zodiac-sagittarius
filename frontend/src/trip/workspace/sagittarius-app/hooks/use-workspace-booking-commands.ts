import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { BookingDocInput } from "@/src/features/workspace/pages/bookings-docs";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib";
import {
  type ItineraryBookingTemplate,
  type ItineraryBookingTicketInput,
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingDocInputFromRecord,
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
import { TripApiError, type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import { nextLocalBookingDocId } from "@/src/trip/local-ids";
import type {
  BookingDoc,
  BookingDocType,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { tripPlanIdForBookingRecord } from "@/src/trip/workspace/trip-plan-records";
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
      await queueKeyedUpdate(bookingDocUpdateQueueRef.current, bookingDocId, update);
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

  const saveItineraryBookingTicket = useCallback(
    async (input: ItineraryBookingTicketInput) => {
      if (!canEditBookings) return;
      const currentTrip = latestTripRef.current;
      const item = currentTrip.itineraryItems.find(
        (candidate) => candidate.id === input.itemId,
      );
      if (!item) return;
      const relatedItineraryItemIds = uniqueStringIds([
        ...input.relatedItineraryItemIds,
        input.itemId,
      ]);
      const explicitBookingDoc = input.bookingDocId
        ? currentTrip.bookingDocs?.find(
            (candidate) => candidate.id === input.bookingDocId,
          )
        : null;
      const bookingDocInput: BookingDocInput = {
        tripPlanId: explicitBookingDoc?.tripPlanId,
        type: explicitBookingDoc?.type ?? input.type,
        title: input.title,
        status: explicitBookingDoc?.status ?? input.status,
        visibility: explicitBookingDoc?.visibility ?? input.visibility,
        ownerMemberId: explicitBookingDoc?.ownerMemberId ?? currentMemberId,
        providerName: input.providerName,
        confirmationCode: input.confirmationCode,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: explicitBookingDoc?.timezone ?? trip.defaultTimezone ?? null,
        priceAmount: explicitBookingDoc?.priceAmount ?? null,
        currency: explicitBookingDoc?.currency ?? null,
        travelerIds:
          explicitBookingDoc?.travelerIds.length || input.travelerIds.length
            ? explicitBookingDoc?.travelerIds.length
              ? explicitBookingDoc.travelerIds
              : input.travelerIds
            : trip.members.map((member) => member.id),
        externalLinks: explicitBookingDoc?.externalLinks ?? [],
        relatedItineraryItemIds,
        relatedTaskIds: explicitBookingDoc?.relatedTaskIds ?? [],
        relatedExpenseIds: explicitBookingDoc?.relatedExpenseIds ?? [],
        noteIds: explicitBookingDoc?.noteIds ?? [],
        notes: input.notes,
      };
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
