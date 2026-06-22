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
  type BookingDialogFields,
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
  const [formFields, setFormFields] =
    useState<BookingDialogFields>(initialFields);

  function updateFormField<Field extends keyof BookingDialogFields>(
    field: Field,
    value: BookingDialogFields[Field],
  ) {
    setFormFields((current) => ({ ...current, [field]: value }));
  }

  function toggleFormFieldId<Field extends keyof Pick<
    BookingDialogFields,
    | "noteIds"
    | "relatedExpenseIds"
    | "relatedItineraryItemIds"
    | "relatedTaskIds"
    | "travelerIds"
  >>(field: Field, id: string) {
    setFormFields((current) => ({
      ...current,
      [field]: toggleId(current[field], id),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildBookingDialogSubmitInput({
      booking,
      externalLinkLabel: copy.externalLinkLabel,
      fields: formFields,
    });
    if (input) onSubmit(input);
  }

  return {
    confirmationCode: formFields.confirmationCode,
    currency: formFields.currency,
    endsAt: formFields.endsAt,
    externalUrl: formFields.externalUrl,
    noteIds: formFields.noteIds,
    notes: formFields.notes,
    priceAmount: formFields.priceAmount,
    providerName: formFields.providerName,
    relatedExpenseIds: formFields.relatedExpenseIds,
    relatedItineraryItemIds: formFields.relatedItineraryItemIds,
    relatedTaskIds: formFields.relatedTaskIds,
    setConfirmationCode: (confirmationCode: string) =>
      updateFormField("confirmationCode", confirmationCode),
    setCurrency: (currency: string) => updateFormField("currency", currency),
    setEndsAt: (endsAt: string) => updateFormField("endsAt", endsAt),
    setExternalUrl: (externalUrl: string) =>
      updateFormField("externalUrl", externalUrl),
    setNotes: (notes: string) => updateFormField("notes", notes),
    setPriceAmount: (priceAmount: string) =>
      updateFormField("priceAmount", priceAmount),
    setProviderName: (providerName: string) =>
      updateFormField("providerName", providerName),
    setStartsAt: (startsAt: string) => updateFormField("startsAt", startsAt),
    setStatus: (status: BookingDialogFields["status"]) =>
      updateFormField("status", status),
    setTitle: (title: string) => updateFormField("title", title),
    setType: (type: BookingDialogFields["type"]) =>
      updateFormField("type", type),
    setVisibility: (visibility: BookingDialogFields["visibility"]) =>
      updateFormField("visibility", visibility),
    startsAt: formFields.startsAt,
    status: formFields.status,
    submit,
    title: formFields.title,
    toggleExpense: (expenseId: string) =>
      toggleFormFieldId("relatedExpenseIds", expenseId),
    toggleItineraryItem: (itemId: string) =>
      toggleFormFieldId("relatedItineraryItemIds", itemId),
    toggleNote: (noteId: string) => toggleFormFieldId("noteIds", noteId),
    toggleTask: (taskId: string) => toggleFormFieldId("relatedTaskIds", taskId),
    toggleTraveler: (memberId: string) =>
      toggleFormFieldId("travelerIds", memberId),
    travelerIds: formFields.travelerIds,
    type: formFields.type,
    visibility: formFields.visibility,
  };
}

export type BookingDialogState = ReturnType<typeof useBookingDialogState>;
