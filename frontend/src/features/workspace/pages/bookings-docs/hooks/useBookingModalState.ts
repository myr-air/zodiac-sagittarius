import { useFormFields } from "@/src/shared/hooks/use-form-fields";
import type { BookingDoc } from "@/src/trip/types";
import type {
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "../BookingsDocsPage.types";
import {
  initialBookingModalState,
  type BookingModalState,
} from "../model/booking-page-state";
import { useBookingModalActions } from "./useBookingModalActions";

interface UseBookingModalStateInput {
  onCreateBookingDoc: CreateBookingDocHandler;
  onDeleteBookingDoc: DeleteBookingDocHandler;
  onUpdateBookingDoc: UpdateBookingDocHandler;
}

export function useBookingModalState({
  onCreateBookingDoc,
  onDeleteBookingDoc,
  onUpdateBookingDoc,
}: UseBookingModalStateInput) {
  const {
    fields: modalState,
    updateField: updateModalState,
  } = useFormFields<BookingModalState>(initialBookingModalState);

  const { confirmDelete, submitBooking } = useBookingModalActions({
    modalState,
    onCreateBookingDoc,
    onDeleteBookingDoc,
    onUpdateBookingDoc,
    updateModalState,
  });

  return {
    confirmDelete,
    deleteBooking: modalState.deleteBooking,
    dialogBooking: modalState.dialogBooking,
    setDeleteBooking: (deleteBooking: BookingDoc | null) =>
      updateModalState("deleteBooking", deleteBooking),
    setDialogBooking: (dialogBooking: BookingDoc | "new" | null) =>
      updateModalState("dialogBooking", dialogBooking),
    submitBooking,
  };
}
