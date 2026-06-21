import type { BookingDoc, Trip } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { WorkspaceEmptyState } from "@/src/shared/components/workspace-empty-state";
import { WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { BookingCopy } from "../BookingsDocsPage.copy";
import { bookingStatusFilterValues, formatEnumLabel, type BookingStatusFilter } from "../model/booking-options";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { BookingFileRow } from "./BookingFileRow";

interface BookingFilePanelProps {
  activeFolderDescription: string;
  activeFolderTitle: string;
  canEditBookings: boolean;
  copy: BookingCopy;
  folderDocs: BookingDoc[];
  lockedDocs: BookingDoc[];
  query: string;
  selectedBookingId?: string;
  statusFilter: BookingStatusFilter;
  statusMenuOpen: boolean;
  trip: Trip;
  onDeleteBooking: (booking: BookingDoc) => void;
  onEditBooking: (booking: BookingDoc) => void;
  onQueryChange: (query: string) => void;
  onSelectBooking: (bookingDocId: string) => void;
  onStatusFilterChange: (status: BookingStatusFilter) => void;
  onToggleStatusMenu: () => void;
}

export function BookingFilePanel({
  activeFolderDescription,
  activeFolderTitle,
  canEditBookings,
  copy,
  folderDocs,
  lockedDocs,
  query,
  selectedBookingId,
  statusFilter,
  statusMenuOpen,
  trip,
  onDeleteBooking,
  onEditBooking,
  onQueryChange,
  onSelectBooking,
  onStatusFilterChange,
  onToggleStatusMenu,
}: BookingFilePanelProps) {
  return (
    <WorkspaceSurface className={bookingStyles.filePanelClassName} aria-label={copy.fileList}>
      <div className={bookingStyles.fileToolbarClassName}>
        <div className={bookingStyles.toolbarControlsClassName}>
          <label className="min-w-0">
            <span className="sr-only">{copy.searchPlaceholder}</span>
            <input
              className={bookingStyles.searchInputClassName}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={copy.searchPlaceholder}
              type="search"
            />
          </label>
          <div className={bookingStyles.statusFilterWrapClassName}>
            <button
              aria-controls="booking-status-filter-menu"
              aria-expanded={statusMenuOpen}
              aria-haspopup="listbox"
              aria-label={`${copy.statusFilter}: ${statusFilter === "all" ? copy.allStatuses : formatEnumLabel(statusFilter, copy)}`}
              className={bookingStyles.statusFilterButtonClassName}
              onClick={onToggleStatusMenu}
              type="button"
            >
              <span className="truncate">{statusFilter === "all" ? copy.allStatuses : formatEnumLabel(statusFilter, copy)}</span>
              <Icon name="chevronRight" className={cn("size-3.5 transition-transform", statusMenuOpen && "rotate-90")} />
            </button>
            {statusMenuOpen ? (
              <div className={bookingStyles.statusFilterMenuClassName} id="booking-status-filter-menu" role="listbox" aria-label={copy.statusFilter}>
                {bookingStatusFilterValues.map((status) => {
                  const selected = statusFilter === status;
                  return (
                    <button
                      aria-selected={selected}
                      className={cn(bookingStyles.statusFilterOptionClassName, selected && bookingStyles.statusFilterOptionActiveClassName)}
                      key={status}
                      onClick={() => onStatusFilterChange(status)}
                      role="option"
                      type="button"
                    >
                      <span>{selected ? <Icon name="check" className="size-3.5" /> : null}</span>
                      <span className="truncate">{status === "all" ? copy.allStatuses : formatEnumLabel(status, copy)}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={bookingStyles.activeFolderBarClassName} aria-label={copy.bookingSummary}>
        <div className="grid gap-0.5">
          <strong className="text-[15px] font-extrabold text-(--color-text)">{activeFolderTitle}</strong>
          <span className={bookingStyles.activeFolderDescriptionClassName}>{copy.visibleItems(activeFolderDescription, folderDocs.length)}</span>
        </div>
        <span className="text-xs font-black text-(--color-text-muted)">{copy.itemCount(folderDocs.length)}</span>
      </div>

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
            <span className="inline-flex items-center gap-2 font-extrabold text-(--color-text-muted)"><Icon name="eyeOff" /> {copy.lockedSensitiveRecord}</span>
            <span className="text-xs font-bold text-(--color-text-muted)">{formatEnumLabel(doc.type, copy)}</span>
          </div>
        ))}
      </div>
    </WorkspaceSurface>
  );
}
