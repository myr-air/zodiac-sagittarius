import { WorkspaceDialog } from "@/src/shared/components/workspace-dialog";
import type { BookingDoc, Trip, TripTask } from "@/src/trip/types";
import { Button } from "@/src/ui";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import type { SubmitBookingDocHandler } from "../BookingsDocsPage.types";
import { useBookingDialogState } from "../hooks/useBookingDialogState";
import { BookingDialogFields } from "./BookingDialogFields";
import { BookingDialogLinks } from "./BookingDialogLinks";

interface BookingDialogProps {
  booking: BookingDoc | null;
  copy: BookingCopy;
  trip: Trip;
  tasks: TripTask[];
  onCancel: () => void;
  onSubmit: SubmitBookingDocHandler;
}

export function BookingDialog({ booking, copy, trip, tasks, onCancel, onSubmit }: BookingDialogProps) {
  const state = useBookingDialogState({ booking, copy, trip, onSubmit });
  const title = booking ? copy.editBookingDialog : copy.addBookingDialog;

  return (
    <WorkspaceDialog
      className={bookingStyles.dialogClassName}
      closeAriaLabel={copy.closeBookingDialog}
      formClassName={bookingStyles.dialogFormClassName}
      onClose={onCancel}
      onSubmit={state.submit}
      title={title}
      titleId="booking-dialog-title"
    >
      <BookingDialogFields copy={copy} state={state} />
      <BookingDialogLinks copy={copy} state={state} tasks={tasks} trip={trip} />
      <div className={bookingStyles.dialogActionsClassName}>
        <Button type="button" variant="secondary" onClick={onCancel}>{copy.cancel}</Button>
        <Button type="submit">{copy.saveBooking}</Button>
      </div>
    </WorkspaceDialog>
  );
}
