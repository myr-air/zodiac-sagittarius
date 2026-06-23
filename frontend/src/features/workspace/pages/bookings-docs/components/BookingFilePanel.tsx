import type { BookingDoc, Trip } from "@/src/trip/types";
import { WorkspaceSurface } from "@/src/ui";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import type { BookingStatusFilter } from "../model/booking-options";
import * as bookingStyles from "../BookingsDocsPage.styles";
import { BookingFileList } from "./BookingFileList";
import { BookingFileToolbar } from "./BookingFileToolbar";
import { BookingFolderSummaryBar } from "./BookingFolderSummaryBar";

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
      <BookingFileToolbar
        copy={copy}
        query={query}
        statusFilter={statusFilter}
        statusMenuOpen={statusMenuOpen}
        onQueryChange={onQueryChange}
        onStatusFilterChange={onStatusFilterChange}
        onToggleStatusMenu={onToggleStatusMenu}
      />
      <BookingFolderSummaryBar
        activeFolderDescription={activeFolderDescription}
        activeFolderTitle={activeFolderTitle}
        copy={copy}
        visibleCount={folderDocs.length}
      />
      <BookingFileList
        canEditBookings={canEditBookings}
        copy={copy}
        folderDocs={folderDocs}
        lockedDocs={lockedDocs}
        selectedBookingId={selectedBookingId}
        trip={trip}
        onDeleteBooking={onDeleteBooking}
        onEditBooking={onEditBooking}
        onSelectBooking={onSelectBooking}
      />
    </WorkspaceSurface>
  );
}
