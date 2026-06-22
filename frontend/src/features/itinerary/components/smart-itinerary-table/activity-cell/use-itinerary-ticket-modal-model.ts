import { type FormEvent, useState } from "react";
import type { Locale } from "@/src/i18n/types";
import { updateFieldState } from "@/src/shared/form-state";
import type { ItineraryBookingTicketInput } from "@/src/trip/booking-docs";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import {
  bookingDocTypeForItemTemplate,
  bookingTemplateForItem,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  buildTicketFormValues,
  buildTicketSubmitInput,
  findLinkedTicket,
  findTicketCandidates,
  type TicketFormValues,
} from "@/src/features/itinerary/domain/booking-ticket-form";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  beginItineraryTicketModalViewSave,
  beginItineraryTicketModalViewUnlink,
  buildInitialItineraryTicketModalViewState,
  completeItineraryTicketModalViewSubmit,
  isItineraryTicketModalViewSubmitting,
  selectExistingItineraryTicket,
  selectExistingItineraryTicketMode,
  selectNewItineraryTicketMode,
} from "./itinerary-ticket-modal-view-state";

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
  const initialFormValues = buildTicketFormValues({
    booking: viewState.mode === "existing" ? selectedBooking : null,
    item,
    locale,
    type,
  });
  const [formValues, setFormValues] = useState<TicketFormValues>(
    initialFormValues,
  );

  function hydrateTicketFields(booking: BookingDoc | null) {
    setFormValues(buildTicketFormValues({ booking, item, locale, type }));
  }

  function updateTicketField<Field extends keyof TicketFormValues>(
    field: Field,
    value: TicketFormValues[Field],
  ) {
    setFormValues((current) => updateFieldState(current, field, value));
  }

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = formValues.title.trim();
    if (isItineraryTicketModalViewSubmitting(viewState) || !trimmedTitle) return;
    setViewState((current) => beginItineraryTicketModalViewSave(current));
    try {
      await onSave(
        buildTicketSubmitInput({
          item,
          mode: viewState.mode,
          selectedBooking,
          selectedBookingId: viewState.selectedBookingId,
          template,
          type,
          values: {
            ...formValues,
            title: trimmedTitle,
          },
        }),
      );
    } finally {
      setViewState((current) => completeItineraryTicketModalViewSubmit(current));
    }
  }

  async function unlinkCurrentBooking() {
    if (
      !currentLinkedBooking ||
      !onUnlink ||
      isItineraryTicketModalViewSubmitting(viewState)
    ) {
      return;
    }
    setViewState((current) => beginItineraryTicketModalViewUnlink(current));
    try {
      await onUnlink(currentLinkedBooking.id);
    } finally {
      setViewState((current) => completeItineraryTicketModalViewSubmit(current));
    }
  }

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
    setConfirmationCode: (confirmationCode: string) =>
      updateTicketField("confirmationCode", confirmationCode),
    setEndsAt: (endsAt: string) => updateTicketField("endsAt", endsAt),
    setNotes: (notes: string) => updateTicketField("notes", notes),
    setProviderName: (providerName: string) =>
      updateTicketField("providerName", providerName),
    setRelatedItineraryItemIds: (updater: (current: string[]) => string[]) =>
      setFormValues((current) =>
        updateFieldState(
          current,
          "relatedItineraryItemIds",
          updater(current.relatedItineraryItemIds),
        ),
      ),
    setStartsAt: (startsAt: string) => updateTicketField("startsAt", startsAt),
    setTitle: (title: string) => updateTicketField("title", title),
    startsAt: formValues.startsAt,
    submit,
    title: formValues.title,
    unlinkCurrentBooking,
    unlinking: viewState.submitState.unlinking,
  };
}
