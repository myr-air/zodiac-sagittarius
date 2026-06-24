import type { BookingDoc, Trip } from "@/src/trip/types";
import { WorkspaceEmptyState } from "@/src/shared/components/workspace-empty-state";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { BookingFileRow } from "./BookingFileRow";
import { BookingTypeLabel } from "./BookingTypeDisplay";

interface BookingFileListProps {
  canEditBookings: boolean;
  copy: BookingCopy;
  folderDocs: BookingDoc[];
  lockedDocs: BookingDoc[];
  selectedBookingId?: string;
  trip: Trip;
  onDeleteBooking: (booking: BookingDoc) => void;
  onEditBooking: (booking: BookingDoc) => void;
  onSelectBooking: (bookingDocId: string) => void;
}

export function BookingFileList({
  canEditBookings,
  copy,
  folderDocs,
  lockedDocs,
  selectedBookingId,
  trip,
  onDeleteBooking,
  onEditBooking,
  onSelectBooking,
}: BookingFileListProps) {
  return (
    <div className={bookingStyles.fileListClassName} aria-label={copy.fileList} tabIndex={0}>
      <div className={bookingStyles.fileHeaderClassName} aria-hidden="true">
        <span>{copy.columnName}</span>
        <span>{copy.columnDate}</span>
        <span>{copy.columnProvider}</span>
        <span>{copy.columnLinkedStop}</span>
        <span>{copy.columnStatus}</span>
        <span>{copy.columnOpen}</span>
      </div>
      {folderDocs.map((doc) => (
        <BookingFileRow
          key={doc.id}
          doc={doc}
          trip={trip}
          selected={selectedBookingId === doc.id}
          canEdit={canEditBookings}
          onSelect={() => onSelectBooking(doc.id)}
          onEdit={() => onEditBooking(doc)}
          onDelete={() => onDeleteBooking(doc)}
          copy={copy}
        />
      ))}
      {!folderDocs.length ? (
        <WorkspaceEmptyState
          title={copy.emptyTitle}
          detail={copy.emptyDetail}
          className="min-h-[180px] min-w-[720px] max-[1199px]:min-w-0 max-[1199px]:w-full max-[767px]:min-h-[220px] max-[767px]:px-4"
        />
      ) : null}
      {lockedDocs.map((doc) => (
        <div className={bookingStyles.lockedRowClassName} key={doc.id}>
          <span className="inline-flex items-center gap-2 font-extrabold text-(--color-text-muted)">
            <Icon name="eyeOff" /> {copy.lockedSensitiveRecord}
          </span>
          <BookingTypeLabel className="text-xs font-bold text-(--color-text-muted)" copy={copy} type={doc.type} />
        </div>
      ))}
    </div>
  );
}
