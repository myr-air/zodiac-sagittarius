import { WorkspaceConfirmDialog } from "@/src/shared/components/workspace-dialog";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";

interface BookingDeleteDialogProps {
  bookingTitle: string;
  copy: BookingCopy;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BookingDeleteDialog({ bookingTitle, copy, onCancel, onConfirm }: BookingDeleteDialogProps) {
  return (
    <WorkspaceConfirmDialog
      body={copy.deletePrompt(bookingTitle)}
      cancelLabel={copy.cancel}
      cancelVariant="secondary"
      confirmLabel={copy.deleteBooking}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={copy.deleteBooking}
      titleId="booking-delete-title"
      titleTone="danger"
    />
  );
}
