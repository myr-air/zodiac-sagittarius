import { type FormEvent, useState } from "react";
import type { Locale } from "@/src/i18n/types";
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
  type TicketFormMode,
} from "./booking-ticket-form";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";

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
  const [mode, setMode] = useState<TicketFormMode>(
    initiallyLinked ? "existing" : "new",
  );
  const [selectedBookingId, setSelectedBookingId] = useState(
    initiallyLinked?.id ?? existingCandidates[0]?.id ?? "",
  );
  const selectedBooking =
    existingCandidates.find((booking) => booking.id === selectedBookingId) ??
    null;
  const initialValues = buildTicketFormValues({
    booking: mode === "existing" ? selectedBooking : null,
    item,
    locale,
    type,
  });
  const [title, setTitle] = useState(initialValues.title);
  const [providerName, setProviderName] = useState(initialValues.providerName);
  const [confirmationCode, setConfirmationCode] = useState(
    initialValues.confirmationCode,
  );
  const [startsAt, setStartsAt] = useState(initialValues.startsAt);
  const [endsAt, setEndsAt] = useState(initialValues.endsAt);
  const [notes, setNotes] = useState(initialValues.notes);
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(
    initialValues.relatedItineraryItemIds,
  );
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  function hydrateTicketFields(booking: BookingDoc | null) {
    const nextValues = buildTicketFormValues({ booking, item, locale, type });
    setTitle(nextValues.title);
    setProviderName(nextValues.providerName);
    setConfirmationCode(nextValues.confirmationCode);
    setStartsAt(nextValues.startsAt);
    setEndsAt(nextValues.endsAt);
    setNotes(nextValues.notes);
    setRelatedItineraryItemIds(nextValues.relatedItineraryItemIds);
  }

  function selectNewTicketMode() {
    setMode("new");
    hydrateTicketFields(null);
  }

  function selectExistingTicketMode() {
    const booking = selectedBooking ?? existingCandidates[0] ?? null;
    setMode("existing");
    setSelectedBookingId(booking?.id ?? "");
    hydrateTicketFields(booking);
  }

  function selectExistingTicket(booking: BookingDoc) {
    setSelectedBookingId(booking.id);
    hydrateTicketFields(booking);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (saving || unlinking || !trimmedTitle) return;
    setSaving(true);
    try {
      await onSave(
        buildTicketSubmitInput({
          item,
          mode,
          selectedBooking,
          selectedBookingId,
          template,
          type,
          values: {
            title: trimmedTitle,
            providerName,
            confirmationCode,
            startsAt,
            endsAt,
            notes,
            relatedItineraryItemIds,
          },
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  async function unlinkCurrentBooking() {
    if (!currentLinkedBooking || !onUnlink || saving || unlinking) return;
    setUnlinking(true);
    try {
      await onUnlink(currentLinkedBooking.id);
    } finally {
      setUnlinking(false);
    }
  }

  return {
    confirmationCode,
    currentLinkedBooking,
    endsAt,
    existingCandidates,
    mode,
    notes,
    providerName,
    relatedItineraryItemIds,
    saving,
    selectExistingTicket,
    selectExistingTicketMode,
    selectNewTicketMode,
    selectedBookingId,
    setConfirmationCode,
    setEndsAt,
    setNotes,
    setProviderName,
    setRelatedItineraryItemIds,
    setStartsAt,
    setTitle,
    startsAt,
    submit,
    title,
    unlinkCurrentBooking,
    unlinking,
  };
}
