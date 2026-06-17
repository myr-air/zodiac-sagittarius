import { Button } from "@/src/ui";
import type { BookingCopy } from "../BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";

interface BookingDeleteDialogProps {
  bookingTitle: string;
  copy: BookingCopy;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BookingDeleteDialog({ bookingTitle, copy, onCancel, onConfirm }: BookingDeleteDialogProps) {
  return (
    <div className={bookingStyles.dialogBackdropClassName} role="presentation">
      <section className={bookingStyles.deleteDialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-delete-title">
        <h2 id="booking-delete-title" className="m-0 text-base font-extrabold text-(--color-danger)">{copy.deleteBooking}</h2>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{copy.deletePrompt(bookingTitle)}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>{copy.cancel}</Button>
          <Button type="button" variant="danger" onClick={onConfirm}>{copy.deleteBooking}</Button>
        </div>
      </section>
    </div>
  );
}
