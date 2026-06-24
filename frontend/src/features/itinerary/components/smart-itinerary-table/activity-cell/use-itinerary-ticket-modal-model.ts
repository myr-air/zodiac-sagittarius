import { useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryBookingTicketInput } from "@/src/trip/booking-docs";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import {
  bookingDocTypeForItemTemplate,
  bookingTemplateForItem,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  findLinkedTicket,
  findTicketCandidates,
} from "@/src/features/itinerary/domain/booking-ticket-form";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  buildInitialItineraryTicketModalViewState,
  selectExistingItineraryTicket,
  selectExistingItineraryTicketMode,
  selectNewItineraryTicketMode,
} from "./itinerary-ticket-modal-view-state";
import { useItineraryTicketModalActions } from "./use-itinerary-ticket-modal-actions";
import { useItineraryTicketFormValues } from "./use-itinerary-ticket-form-values";

interface UseItineraryTicketModalModelOptions {
  bookingDocs: BookingDoc[];
  item: ItineraryItem;
  locale: Locale;
  onSave: (input: ItineraryBookingTicketInput) => ItineraryAsyncVoidResult;
  onUnlink?: (bookingDocId: string) => ItineraryAsyncVoidResult;
}

export function useItineraryTicketModalModel({
  bookingDocs,
  item,
  locale,
  onSave,
  onUnlink,
}: UseItineraryTicketModalModelOptions) {
  const template = bookingTemplateForItem(item);
  const type = bookingDocTypeForItemTemplate(item, template);
  const existingCandidates = findTicketCandidates(bookingDocs, item, type);
  const initiallyLinked = findLinkedTicket(existingCandidates, item.id);
  const currentLinkedBooking = findLinkedTicket(bookingDocs, item.id);
  const [viewState, setViewState] = useState(() =>
    buildInitialItineraryTicketModalViewState({
      firstCandidateId: existingCandidates[0]?.id,
      initiallyLinkedId: initiallyLinked?.id,
    }),
  );
  const selectedBooking =
    existingCandidates.find(
      (booking) => booking.id === viewState.selectedBookingId,
    ) ??
    null;
  const {
    formValues,
    hydrateTicketFields,
    setConfirmationCode,
    setEndsAt,
    setNotes,
    setProviderName,
    setRelatedItineraryItemIds,
    setStartsAt,
    setTitle,
  } = useItineraryTicketFormValues({
    booking: viewState.mode === "existing" ? selectedBooking : null,
    item,
    locale,
    type,
  });

  function selectNewTicketMode() {
    setViewState((current) => selectNewItineraryTicketMode(current));
    hydrateTicketFields(null);
  }

  function selectExistingTicketMode() {
    const booking = selectedBooking ?? existingCandidates[0] ?? null;
    setViewState((current) =>
      selectExistingItineraryTicketMode(current, booking?.id ?? ""),
    );
    hydrateTicketFields(booking);
  }

  function selectExistingTicket(booking: BookingDoc) {
    setViewState((current) => selectExistingItineraryTicket(current, booking.id));
    hydrateTicketFields(booking);
  }

  const { submit, unlinkCurrentBooking } = useItineraryTicketModalActions({
    currentLinkedBooking,
    formValues,
    item,
    onSave,
    onUnlink,
    selectedBooking,
    setViewState,
    template,
    type,
    viewState,
  });

  return {
    confirmationCode: formValues.confirmationCode,
    currentLinkedBooking,
    endsAt: formValues.endsAt,
    existingCandidates,
    mode: viewState.mode,
    notes: formValues.notes,
    providerName: formValues.providerName,
    relatedItineraryItemIds: formValues.relatedItineraryItemIds,
    saving: viewState.submitState.saving,
    selectExistingTicket,
    selectExistingTicketMode,
    selectNewTicketMode,
    selectedBookingId: viewState.selectedBookingId,
    setConfirmationCode,
    setEndsAt,
    setNotes,
    setProviderName,
    setRelatedItineraryItemIds,
    setStartsAt,
    setTitle,
    startsAt: formValues.startsAt,
    submit,
    title: formValues.title,
    unlinkCurrentBooking,
    unlinking: viewState.submitState.unlinking,
  };
}
