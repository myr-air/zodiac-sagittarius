import type {
  BookingDocInput,
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "../BookingsDocsPage.types";
import type { BookingModalState } from "../model/booking-page-state";

type UpdateBookingModalState = <Field extends keyof BookingModalState>(
  field: Field,
  value: BookingModalState[Field],
) => void;

interface UseBookingModalActionsInput {
  modalState: BookingModalState;
  onCreateBookingDoc: CreateBookingDocHandler;
  onDeleteBookingDoc: DeleteBookingDocHandler;
  onUpdateBookingDoc: UpdateBookingDocHandler;
  updateModalState: UpdateBookingModalState;
}

export function useBookingModalActions({
  modalState,
  onCreateBookingDoc,
  onDeleteBookingDoc,
  onUpdateBookingDoc,
  updateModalState,
}: UseBookingModalActionsInput) {
  async function submitBooking(input: BookingDocInput) {
    if (modalState.dialogBooking === "new") {
      await onCreateBookingDoc(input);
    } else if (modalState.dialogBooking) {
      await onUpdateBookingDoc(modalState.dialogBooking.id, input);
    }
    updateModalState("dialogBooking", null);
  }

  async function confirmDelete() {
    if (!modalState.deleteBooking) return;
    await onDeleteBookingDoc(modalState.deleteBooking.id);
    updateModalState("deleteBooking", null);
  }

  return {
    confirmDelete,
    submitBooking,
  };
}
