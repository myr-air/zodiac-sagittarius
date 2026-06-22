import { useState, type FormEvent } from "react";
import { toggleId } from "@/src/shared/collection";
import type {
  BookingDoc,
  Trip,
} from "@/src/trip/types";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import type { SubmitBookingDocHandler } from "../BookingsDocsPage.types";
import {
  buildBookingDialogSubmitInput,
  initialBookingDialogFields,
} from "../model/booking-dialog-fields";

interface BookingDialogStateInput {
  booking: BookingDoc | null;
  copy: Pick<BookingCopy, "externalLinkLabel">;
  trip: Trip;
  onSubmit: SubmitBookingDocHandler;
}

export function useBookingDialogState({
  booking,
  copy,
  trip,
  onSubmit,
}: BookingDialogStateInput) {
  const initialFields = initialBookingDialogFields({ booking, trip });
  const [title, setTitle] = useState(initialFields.title);
  const [type, setType] = useState(initialFields.type);
  const [status, setStatus] = useState(initialFields.status);
  const [visibility, setVisibility] = useState(initialFields.visibility);
  const [providerName, setProviderName] = useState(initialFields.providerName);
  const [confirmationCode, setConfirmationCode] = useState(initialFields.confirmationCode);
  const [startsAt, setStartsAt] = useState(initialFields.startsAt);
  const [endsAt, setEndsAt] = useState(initialFields.endsAt);
  const [priceAmount, setPriceAmount] = useState(initialFields.priceAmount);
  const [currency, setCurrency] = useState(initialFields.currency);
  const [externalUrl, setExternalUrl] = useState(initialFields.externalUrl);
  const [notes, setNotes] = useState(initialFields.notes);
  const [travelerIds, setTravelerIds] = useState(() => initialFields.travelerIds);
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(
    () => initialFields.relatedItineraryItemIds,
  );
  const [relatedTaskIds, setRelatedTaskIds] = useState(() => initialFields.relatedTaskIds);
  const [relatedExpenseIds, setRelatedExpenseIds] = useState(
    () => initialFields.relatedExpenseIds,
  );
  const [noteIds, setNoteIds] = useState(() => initialFields.noteIds);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildBookingDialogSubmitInput({
      booking,
      externalLinkLabel: copy.externalLinkLabel,
      fields: {
        confirmationCode,
        currency,
        endsAt,
        externalUrl,
        noteIds,
        notes,
        priceAmount,
        providerName,
        relatedExpenseIds,
        relatedItineraryItemIds,
        relatedTaskIds,
        startsAt,
        status,
        title,
        travelerIds,
        type,
        visibility,
      },
    });
    if (input) onSubmit(input);
  }

  return {
    confirmationCode,
    currency,
    endsAt,
    externalUrl,
    noteIds,
    notes,
    priceAmount,
    providerName,
    relatedExpenseIds,
    relatedItineraryItemIds,
    relatedTaskIds,
    setConfirmationCode,
    setCurrency,
    setEndsAt,
    setExternalUrl,
    setNotes,
    setPriceAmount,
    setProviderName,
    setStartsAt,
    setStatus,
    setTitle,
    setType,
    setVisibility,
    startsAt,
    status,
    submit,
    title,
    toggleExpense: (expenseId: string) =>
      setRelatedExpenseIds((current) => toggleId(current, expenseId)),
    toggleItineraryItem: (itemId: string) =>
      setRelatedItineraryItemIds((current) => toggleId(current, itemId)),
    toggleNote: (noteId: string) =>
      setNoteIds((current) => toggleId(current, noteId)),
    toggleTask: (taskId: string) =>
      setRelatedTaskIds((current) => toggleId(current, taskId)),
    toggleTraveler: (memberId: string) =>
      setTravelerIds((current) => toggleId(current, memberId)),
    travelerIds,
    type,
    visibility,
  };
}

export type BookingDialogState = ReturnType<typeof useBookingDialogState>;
