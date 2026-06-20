import type { BookingDoc, Trip, TripTask } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import type { BookingDocInput } from "../BookingsDocsPage.types";
import { BookingDialogFields } from "./BookingDialogFields";
import { BookingDialogLinks } from "./BookingDialogLinks";
import { useBookingDialogState } from "./useBookingDialogState";

interface BookingDialogProps {
  booking: BookingDoc | null;
  copy: BookingCopy;
  trip: Trip;
  tasks: TripTask[];
  onCancel: () => void;
  onSubmit: (input: BookingDocInput) => void | Promise<void>;
}

export function BookingDialog({ booking, copy, trip, tasks, onCancel, onSubmit }: BookingDialogProps) {
  const state = useBookingDialogState({ booking, copy, trip, onSubmit });

  return (
    <div className={bookingStyles.dialogBackdropClassName} role="presentation">
      <section className={bookingStyles.dialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
        <div className={bookingStyles.dialogHeaderClassName}>
          <h2 id="booking-dialog-title">{booking ? copy.editBookingDialog : copy.addBookingDialog}</h2>
          <IconButton type="button" aria-label={copy.closeBookingDialog} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={bookingStyles.dialogFormClassName} onSubmit={state.submit}>
          <BookingDialogFields copy={copy} state={state} />
          <BookingDialogLinks copy={copy} state={state} tasks={tasks} trip={trip} />
          <div className={bookingStyles.dialogActionsClassName}>
            <Button type="button" variant="secondary" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveBooking}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
