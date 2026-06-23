import { useState } from "react";
import type { BookingDoc } from "@/src/trip/types";
import type {
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "../BookingsDocsPage.types";
import {
  initialBookingModalState,
  updateBookingModalState,
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
  const [modalState, setModalState] = useState<BookingModalState>(
    initialBookingModalState,
  );

  function updateModalState<Field extends keyof BookingModalState>(
    field: Field,
    value: BookingModalState[Field],
  ) {
    setModalState((current) => updateBookingModalState(current, field, value));
  }

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
