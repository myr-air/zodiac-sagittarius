import { useState } from "react";
import type { BookingDoc } from "@/src/trip/types";
import type {
  BookingDocInput,
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "../BookingsDocsPage.types";
import {
  initialBookingModalState,
  updateBookingModalState,
  type BookingModalState,
} from "../model/booking-page-state";

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
    deleteBooking: modalState.deleteBooking,
    dialogBooking: modalState.dialogBooking,
    setDeleteBooking: (deleteBooking: BookingDoc | null) =>
      updateModalState("deleteBooking", deleteBooking),
    setDialogBooking: (dialogBooking: BookingDoc | "new" | null) =>
      updateModalState("dialogBooking", dialogBooking),
    submitBooking,
  };
}
