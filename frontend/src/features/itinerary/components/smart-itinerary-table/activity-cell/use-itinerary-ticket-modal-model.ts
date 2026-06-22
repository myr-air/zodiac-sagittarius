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
  type TicketFormValues,
  type TicketFormMode,
} from "@/src/features/itinerary/domain/booking-ticket-form";
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
  const initialFormValues = buildTicketFormValues({
    booking: mode === "existing" ? selectedBooking : null,
    item,
    locale,
    type,
  });
  const [formValues, setFormValues] = useState<TicketFormValues>(
    initialFormValues,
  );
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  function hydrateTicketFields(booking: BookingDoc | null) {
    setFormValues(buildTicketFormValues({ booking, item, locale, type }));
  }

  function updateTicketField<Field extends keyof TicketFormValues>(
    field: Field,
    value: TicketFormValues[Field],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
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
    const trimmedTitle = formValues.title.trim();
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
            ...formValues,
            title: trimmedTitle,
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
    confirmationCode: formValues.confirmationCode,
    currentLinkedBooking,
    endsAt: formValues.endsAt,
    existingCandidates,
    mode,
    notes: formValues.notes,
    providerName: formValues.providerName,
    relatedItineraryItemIds: formValues.relatedItineraryItemIds,
    saving,
    selectExistingTicket,
    selectExistingTicketMode,
    selectNewTicketMode,
    selectedBookingId,
    setConfirmationCode: (confirmationCode: string) =>
      updateTicketField("confirmationCode", confirmationCode),
    setEndsAt: (endsAt: string) => updateTicketField("endsAt", endsAt),
    setNotes: (notes: string) => updateTicketField("notes", notes),
    setProviderName: (providerName: string) =>
      updateTicketField("providerName", providerName),
    setRelatedItineraryItemIds: (updater: (current: string[]) => string[]) =>
      setFormValues((current) => ({
        ...current,
        relatedItineraryItemIds: updater(current.relatedItineraryItemIds),
      })),
    setStartsAt: (startsAt: string) => updateTicketField("startsAt", startsAt),
    setTitle: (title: string) => updateTicketField("title", title),
    startsAt: formValues.startsAt,
    submit,
    title: formValues.title,
    unlinkCurrentBooking,
    unlinking,
  };
}
