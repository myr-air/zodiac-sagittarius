import type { BookingDocRelations } from "@/src/trip/booking-docs";
import type { BookingDoc } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { Button, IconButton, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import {
  bookingConfirmationDisplay,
  bookingDateDisplay,
  bookingNotesDisplay,
  bookingProviderDisplay,
  bookingTravelerNamesDisplay,
} from "../model/booking-display";
import { BookingExternalLinkAction } from "./BookingExternalLinkAction";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingTypeLabel } from "./BookingTypeDisplay";

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
      <WorkspaceSurface
        className={bookingStyles.desktopInspectorClassName}
        density="compact"
        aria-label={copy.bookingDetails}
      >
        <strong className="text-(--color-text)">{copy.noBookingSelected}</strong>
      </WorkspaceSurface>
    );
  }

  return (
    <>
      <WorkspaceSurface
        className={bookingStyles.desktopInspectorClassName}
        density="compact"
        aria-label={copy.bookingDetails}
      >
        <BookingInspectorContent
          booking={booking}
          canEdit={canEdit}
          copy={copy}
          onDelete={onDelete}
          onEdit={onEdit}
          relations={relations}
        />
      </WorkspaceSurface>
      {mobileOpen ? (
        <WorkspaceSurface
          className={cn(bookingStyles.inspectorClassName, bookingStyles.mobileInspectorOpenClassName)}
          density="compact"
          aria-label={`${copy.bookingDetails} preview`}
        >
          <div className="hidden max-[767px]:grid max-[767px]:grid-cols-[minmax(0,1fr)_auto] max-[767px]:items-center max-[767px]:gap-2">
            <span className="mx-auto h-1 w-10 rounded-full bg-(--color-border-strong)" aria-hidden="true" />
            <IconButton type="button" aria-label={copy.closeBookingPreview} onClick={onClose}><Icon name="x" /></IconButton>
          </div>
          <BookingInspectorContent
            booking={booking}
            canEdit={canEdit}
            copy={copy}
            onDelete={onDelete}
            onEdit={onEdit}
            relations={relations}
          />
        </WorkspaceSurface>
      ) : null}
    </>
  );
}

interface BookingInspectorContentProps {
  booking: BookingDoc;
  canEdit: boolean;
  copy: BookingCopy;
  onDelete: () => void;
  onEdit: () => void;
  relations: BookingDocRelations;
}

function BookingInspectorContent({
  booking,
  canEdit,
  copy,
  onDelete,
  onEdit,
  relations,
}: BookingInspectorContentProps) {
  return (
    <>
      <div className="grid gap-1">
        <BookingStatusBadge copy={copy} status={booking.status} />
        <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{booking.title}</h2>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{bookingNotesDisplay(booking.notes, copy)}</p>
        {canEdit ? (
          <div className="mt-1 flex gap-1.5">
            <Button type="button" variant="secondary" onClick={onEdit}><Icon name="edit" /> {copy.editBooking}</Button>
            <IconButton type="button" aria-label={copy.deleteBooking} onClick={onDelete}><Icon name="trash" /></IconButton>
          </div>
        ) : null}
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.quickFacts}</strong>
        <BookingTypeLabel copy={copy} type={booking.type} />
        <span>{bookingDateDisplay(booking.startsAt, copy)}</span>
        <span>{bookingProviderDisplay(booking.providerName, copy)}</span>
        <span>{bookingConfirmationDisplay(booking.confirmationCode, copy)}</span>
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.externalLinks}</strong>
        {booking.externalLinks.length ? booking.externalLinks.map((link) => (
          <BookingExternalLinkAction
            key={link.id}
            link={link}
            openLabel={copy.openLink(link.label)}
            variant="inline"
          />
        )) : <span className="text-sm text-(--color-text-muted)">{copy.noExternalLinks}</span>}
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.tripContext}</strong>
        <span>{copy.itineraryLinks(relations.itineraryItems.length)}</span>
        <span>{copy.todos(relations.tasks.length)}</span>
        <span>{copy.expenses(relations.expenses.length)}</span>
        <span>{copy.notes(relations.notes.length)}</span>
        <span>{bookingTravelerNamesDisplay(relations.travelers, copy)}</span>
      </div>
    </>
  );
}
