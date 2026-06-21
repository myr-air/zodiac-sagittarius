import type { BookingDoc, Trip } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import { formatEnumLabel } from "../model/booking-options";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { bookingDocLinkedContext } from "../model/booking-list";
import {
  bookingTypeIcon,
  formatDateTime,
  statusBadgeClassName,
  typeIconClassName,
} from "../model/booking-display";

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
  const linkedStop = bookingDocLinkedContext(doc, trip) || copy.noLinkedStop;
  const provider = doc.providerName ?? copy.noProvider;

  return (
    <article className={cn(bookingStyles.fileRowClassName, selected && bookingStyles.selectedFileRowClassName)}>
      <button type="button" className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2 text-left max-[1199px]:col-start-1 max-[1199px]:row-start-1" onClick={onSelect} aria-label={copy.select(doc.title)}>
        <span className={cn("grid size-8 place-items-center rounded-(--radius-sm) border", typeIconClassName(doc.type))}>
          <Icon name={bookingTypeIcon(doc.type)} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-black text-(--color-text)">{doc.title}</strong>
          <span className="block truncate text-[11px] font-bold text-(--color-text-muted)">
            {formatEnumLabel(doc.type, copy)}{doc.confirmationCode ? ` · ${copy.confirmation}: ${doc.confirmationCode}` : ""}
          </span>
        </span>
      </button>
      <span className="truncate text-xs font-bold tabular-nums text-(--color-text-muted) max-[1199px]:col-start-1 max-[1199px]:row-start-2 max-[1199px]:pl-[42px]">{doc.startsAt ? formatDateTime(doc.startsAt) : copy.noDate}</span>
      <span className="truncate text-xs font-bold text-(--color-text-muted) max-[1199px]:col-start-1 max-[1199px]:row-start-3 max-[1199px]:pl-[42px]">{provider}</span>
      <span className="truncate text-xs font-bold text-(--color-text-muted) max-[1199px]:hidden">{linkedStop}</span>
      <span className={cn(bookingStyles.badgeClassName, statusBadgeClassName(doc.status), "max-[1199px]:col-start-2 max-[1199px]:row-start-1 max-[1199px]:justify-self-end")}>{formatEnumLabel(doc.status, copy)}</span>
      <span className="inline-flex justify-end gap-1 max-[1199px]:hidden">
        {doc.externalLinks[0] ? (
          <a className="grid size-8 place-items-center rounded-(--radius-sm) text-(--color-primary-strong) hover:bg-(--color-primary-soft)" href={doc.externalLinks[0].url} target="_blank" rel="noreferrer" aria-label={copy.openLink(doc.externalLinks[0].label)}>
            <Icon name="external" />
          </a>
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
