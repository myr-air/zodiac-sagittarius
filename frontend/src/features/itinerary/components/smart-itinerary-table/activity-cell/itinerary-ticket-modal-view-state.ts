import type { TicketFormMode } from "@/src/features/itinerary/domain/booking-ticket-form";
import {
  beginItineraryTicketModalSave,
  beginItineraryTicketModalUnlink,
  completeItineraryTicketModalSubmit,
  initialItineraryTicketModalSubmitState,
  isItineraryTicketModalSubmitting,
  type ItineraryTicketModalSubmitState,
} from "./itinerary-ticket-modal-submit-state";

export interface ItineraryTicketModalViewState {
  mode: TicketFormMode;
  selectedBookingId: string;
  submitState: ItineraryTicketModalSubmitState;
}

interface InitialItineraryTicketModalViewStateInput {
  firstCandidateId?: string;
  initiallyLinkedId?: string;
}

export function buildInitialItineraryTicketModalViewState({
  firstCandidateId = "",
  initiallyLinkedId,
}: InitialItineraryTicketModalViewStateInput): ItineraryTicketModalViewState {
  return {
    mode: initiallyLinkedId ? "existing" : "new",
    selectedBookingId: initiallyLinkedId ?? firstCandidateId,
    submitState: initialItineraryTicketModalSubmitState,
  };
}

export function selectNewItineraryTicketMode(
  state: ItineraryTicketModalViewState,
): ItineraryTicketModalViewState {
  return {
    ...state,
    mode: "new",
  };
}

export function selectExistingItineraryTicketMode(
  state: ItineraryTicketModalViewState,
  bookingId: string,
): ItineraryTicketModalViewState {
  return {
    ...state,
    mode: "existing",
    selectedBookingId: bookingId,
  };
}

export function selectExistingItineraryTicket(
  state: ItineraryTicketModalViewState,
  bookingId: string,
): ItineraryTicketModalViewState {
  return {
    ...state,
    selectedBookingId: bookingId,
  };
}

export function beginItineraryTicketModalViewSave(
  state: ItineraryTicketModalViewState,
): ItineraryTicketModalViewState {
  return {
    ...state,
    submitState: beginItineraryTicketModalSave(),
  };
}

export function beginItineraryTicketModalViewUnlink(
  state: ItineraryTicketModalViewState,
): ItineraryTicketModalViewState {
  return {
    ...state,
    submitState: beginItineraryTicketModalUnlink(),
  };
}

export function completeItineraryTicketModalViewSubmit(
  state: ItineraryTicketModalViewState,
): ItineraryTicketModalViewState {
  return {
    ...state,
    submitState: completeItineraryTicketModalSubmit(),
  };
}

export function isItineraryTicketModalViewSubmitting(
  state: ItineraryTicketModalViewState,
): boolean {
  return isItineraryTicketModalSubmitting(state.submitState);
}
