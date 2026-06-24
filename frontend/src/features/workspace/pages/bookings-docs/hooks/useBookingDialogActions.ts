import type { FormEvent } from "react";
import type { BookingDoc } from "@/src/trip/types";
import type { SubmitBookingDocHandler } from "../BookingsDocsPage.types";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import {
  buildBookingDialogSubmitInput,
  type BookingDialogFields,
} from "../model/booking-dialog-fields";

interface UseBookingDialogActionsInput {
  booking: BookingDoc | null;
  copy: Pick<BookingCopy, "externalLinkLabel">;
  formFields: BookingDialogFields;
  onSubmit: SubmitBookingDocHandler;
}

export function useBookingDialogActions({
  booking,
  copy,
  formFields,
  onSubmit,
}: UseBookingDialogActionsInput) {
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
    submit,
  };
}
