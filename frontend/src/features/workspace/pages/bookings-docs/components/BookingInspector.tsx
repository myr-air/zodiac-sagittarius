import { type findBookingDocRelations } from "@/src/trip/booking-docs";
import type { BookingDoc } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { Button, IconButton, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { type BookingCopy, formatEnumLabel } from "../BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { formatDateTime, statusBadgeClassName } from "../bookings-docs-page-support";

type BookingDocRelations = ReturnType<typeof findBookingDocRelations>;

interface BookingInspectorProps {
  booking: BookingDoc | null;
  canEdit: boolean;
  copy: BookingCopy;
  mobileOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  relations: BookingDocRelations | null;
}

export function BookingInspector({
  booking,
  canEdit,
  copy,
  mobileOpen,
  onClose,
  onDelete,
  onEdit,
  relations,
}: BookingInspectorProps) {
  if (!booking || !relations) {
    return (
      <WorkspaceSurface className={cn(bookingStyles.inspectorClassName, bookingStyles.mobileInspectorClosedClassName)} density="compact" aria-label={copy.bookingDetails}>
        <strong className="text-(--color-text)">{copy.noBookingSelected}</strong>
      </WorkspaceSurface>
    );
  }

  return (
    <WorkspaceSurface
      className={cn(bookingStyles.inspectorClassName, mobileOpen ? bookingStyles.mobileInspectorOpenClassName : bookingStyles.mobileInspectorClosedClassName)}
      density="compact"
      aria-label={copy.bookingDetails}
    >
      <div className="hidden max-[767px]:grid max-[767px]:grid-cols-[minmax(0,1fr)_auto] max-[767px]:items-center max-[767px]:gap-2">
        <span className="mx-auto h-1 w-10 rounded-full bg-(--color-border-strong)" aria-hidden="true" />
        <IconButton type="button" aria-label={copy.closeBookingPreview} onClick={onClose}><Icon name="x" /></IconButton>
      </div>
      <div className="grid gap-1">
        <span className={cn(bookingStyles.badgeClassName, statusBadgeClassName(booking.status))}>{formatEnumLabel(booking.status, copy)}</span>
        <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{booking.title}</h2>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{booking.notes ?? copy.noNotes}</p>
        {canEdit ? (
          <div className="mt-1 flex gap-1.5">
            <Button type="button" variant="secondary" onClick={onEdit}><Icon name="edit" /> {copy.editBooking}</Button>
            <IconButton type="button" aria-label={copy.deleteBooking} onClick={onDelete}><Icon name="trash" /></IconButton>
          </div>
        ) : null}
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.quickFacts}</strong>
        <span>{formatEnumLabel(booking.type, copy)}</span>
        <span>{booking.startsAt ? formatDateTime(booking.startsAt) : copy.noDate}</span>
        <span>{booking.providerName ?? copy.noProvider}</span>
        <span>{booking.confirmationCode ? `${copy.confirmation}: ${booking.confirmationCode}` : copy.noConfirmation}</span>
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.externalLinks}</strong>
        {booking.externalLinks.length ? booking.externalLinks.map((link) => (
          <a className="inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)" href={link.url} key={link.id} target="_blank" rel="noreferrer">
            <Icon name="external" /> {copy.openLink(link.label)}
          </a>
        )) : <span className="text-sm text-(--color-text-muted)">{copy.noExternalLinks}</span>}
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.tripContext}</strong>
        <span>{copy.itineraryLinks(relations.itineraryItems.length)}</span>
        <span>{copy.todos(relations.tasks.length)}</span>
        <span>{copy.expenses(relations.expenses.length)}</span>
        <span>{copy.notes(relations.notes.length)}</span>
        <span>{relations.travelers.map((member) => member.displayName).join(", ") || copy.noTravelers}</span>
      </div>
    </WorkspaceSurface>
  );
}
