import type { BookingDoc, Trip, TripTask } from "@/src/trip/types";
import { BookingDeleteDialog } from "./BookingDeleteDialog";
import { BookingDialog } from "./BookingDialog";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import type { SubmitBookingDocHandler } from "../BookingsDocsPage.types";

interface BookingDialogLayerProps {
  copy: BookingCopy;
  deleteBooking: BookingDoc | null;
  dialogBooking: BookingDoc | "new" | null;
  tasks: TripTask[];
  trip: Trip;
  onCancelDelete: () => void;
  onCancelDialog: () => void;
  onConfirmDelete: () => void;
  onSubmitBooking: SubmitBookingDocHandler;
}

export function BookingDialogLayer({
  copy,
  deleteBooking,
  dialogBooking,
  tasks,
  trip,
  onCancelDelete,
  onCancelDialog,
  onConfirmDelete,
  onSubmitBooking,
}: BookingDialogLayerProps) {
  return (
    <>
      {dialogBooking ? (
        <BookingDialog
          booking={dialogBooking === "new" ? null : dialogBooking}
          trip={trip}
          tasks={tasks}
          onCancel={onCancelDialog}
          onSubmit={onSubmitBooking}
          copy={copy}
        />
      ) : null}

      {deleteBooking ? (
        <BookingDeleteDialog
          bookingTitle={deleteBooking.title}
          copy={copy}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </>
  );
}
