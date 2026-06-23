import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import type { BookingDoc, BookingDocType, ItineraryItem } from "@/src/trip/types";
import {
  buildTicketSubmitInput,
  type TicketFormValues,
} from "@/src/features/itinerary/domain/booking-ticket-form";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  beginItineraryTicketModalViewSave,
  beginItineraryTicketModalViewUnlink,
  completeItineraryTicketModalViewSubmit,
  isItineraryTicketModalViewSubmitting,
  type ItineraryTicketModalViewState,
} from "./itinerary-ticket-modal-view-state";

interface UseItineraryTicketModalActionsInput {
  currentLinkedBooking: BookingDoc | null;
  formValues: TicketFormValues;
  item: ItineraryItem;
  onSave: (input: ItineraryBookingTicketInput) => ItineraryAsyncVoidResult;
  onUnlink?: (bookingDocId: string) => ItineraryAsyncVoidResult;
  selectedBooking: BookingDoc | null;
  setViewState: Dispatch<SetStateAction<ItineraryTicketModalViewState>>;
  template: ItineraryBookingTemplate;
  type: BookingDocType;
  viewState: ItineraryTicketModalViewState;
}

export function useItineraryTicketModalActions({
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
}: UseItineraryTicketModalActionsInput) {
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
    submit,
    unlinkCurrentBooking,
  };
}
