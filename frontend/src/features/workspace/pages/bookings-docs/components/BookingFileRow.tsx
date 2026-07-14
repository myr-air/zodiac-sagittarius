import type { BookingDoc, Trip } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { bookingDocLinkedContext } from "../model/booking-list";
import {
  bookingConfirmationDisplay,
  bookingDateDisplay,
  bookingLinkedContextDisplay,
  bookingProviderDisplay,
} from "../model/booking-display";
import { BookingExternalLinkAction } from "./BookingExternalLinkAction";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingTypeLabel, BookingTypeMark } from "./BookingTypeDisplay";

interface BookingFileRowProps {
  doc: BookingDoc;
  copy: BookingCopy;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function BookingFileRow({ doc, copy, trip, selected, canEdit, onSelect, onEdit, onDelete }: BookingFileRowProps) {
  const linkedStop = bookingLinkedContextDisplay(bookingDocLinkedContext(doc, trip), copy);
  const provider = bookingProviderDisplay(doc.providerName, copy);
  const confirmation = doc.confirmationCode ? ` · ${bookingConfirmationDisplay(doc.confirmationCode, copy)}` : "";

  return (
    <article className={cn(bookingStyles.fileRowClassName, selected && bookingStyles.selectedFileRowClassName)}>
      <button type="button" className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 text-left max-[1199px]:col-start-1 max-[1199px]:row-start-1" onClick={onSelect} aria-label={copy.select(doc.title)}>
        <BookingTypeMark type={doc.type} />
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black text-(--color-text)">{doc.title}</strong>
          <span className="block truncate text-[11px] font-bold text-(--color-text-muted)">
            <BookingTypeLabel copy={copy} type={doc.type} />{confirmation}
          </span>
        </span>
      </button>
      <span className="text-xs font-bold tabular-nums text-(--color-text-muted) max-[1199px]:col-start-1 max-[1199px]:row-start-2 max-[1199px]:pl-[42px]">{bookingDateDisplay(doc.startsAt, copy)}</span>
      <span className="truncate text-xs font-bold text-(--color-text-muted) max-[1199px]:col-start-1 max-[1199px]:row-start-3 max-[1199px]:pl-[42px]">{provider}</span>
      <span className="truncate text-xs font-bold text-(--color-text-muted) max-[1199px]:hidden">{linkedStop}</span>
      <BookingStatusBadge
        className="max-[1199px]:col-start-2 max-[1199px]:row-start-1 max-[1199px]:justify-self-end"
        copy={copy}
        status={doc.status}
      />
      <span className="inline-flex justify-end gap-1 max-[1199px]:hidden">
        {doc.externalLinks[0] ? (
          <BookingExternalLinkAction
            link={doc.externalLinks[0]}
            openLabel={copy.openLink(doc.externalLinks[0].label)}
            variant="icon"
          />
        ) : <span className="grid size-8 place-items-center text-(--color-text-muted)" title={copy.noLink}>-</span>}
        {canEdit ? (
          <>
            <IconButton type="button" aria-label={copy.editBooking} onClick={onEdit}><Icon name="edit" /></IconButton>
            <IconButton type="button" aria-label={copy.deleteBooking} onClick={onDelete}><Icon name="trash" /></IconButton>
          </>
        ) : null}
      </span>
    </article>
  );
}
