import type { BookingDoc, Member, Trip, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { Button, WorkspacePage } from "@/src/ui";
import { BookingDeleteDialog } from "./components/BookingDeleteDialog";
import { BookingDialog } from "./components/BookingDialog";
import { BookingFilePanel } from "./components/BookingFilePanel";
import { BookingFolderRail } from "./components/BookingFolderRail";
import { BookingsDocsHeader } from "./components/BookingsDocsHeader";
import { BookingInspector } from "./components/BookingInspector";
import { bookingCopy } from "./BookingsDocsPage.copy";
import * as bookingStyles from "./BookingsDocsPage.styles";
import type { BookingDocInput } from "./BookingsDocsPage.types";
import { useBookingsDocsPageState } from "./use-bookings-docs-page-state";

export type { BookingDocInput } from "./BookingsDocsPage.types";

interface BookingsDocsPageProps {
  trip: Trip;
  tasks: TripTask[];
  currentMember: Member;
  bookingDocs: BookingDoc[];
  canEditBookings: boolean;
  onCreateBookingDoc: (input: BookingDocInput) => void | Promise<void>;
  onUpdateBookingDoc: (bookingDocId: string, input: BookingDocInput) => void | Promise<void>;
  onDeleteBookingDoc: (bookingDocId: string) => void | Promise<void>;
}

export function BookingsDocsPage({
  trip,
  tasks,
  currentMember,
  bookingDocs,
  canEditBookings,
  onCreateBookingDoc,
  onUpdateBookingDoc,
  onDeleteBookingDoc,
}: BookingsDocsPageProps) {
  const { locale } = useI18n();
  const copy = bookingCopy[locale];
  const {
    activeFolder,
    activeFolderId,
    changeQuery,
    changeStatusFilter,
    confirmDelete,
    deleteBooking,
    dialogBooking,
    folderCounts,
    folderDocs,
    lockedDocs,
    mobilePreviewOpen,
    query,
    selectedBooking,
    selectedRelations,
    selectBooking,
    selectFolder,
    setDeleteBooking,
    setDialogBooking,
    setMobilePreviewOpen,
    setStatusMenuOpen,
    statusFilter,
    statusMenuOpen,
    submitBooking,
  } = useBookingsDocsPageState({
    bookingDocs,
    currentMember,
    onCreateBookingDoc,
    onDeleteBookingDoc,
    onUpdateBookingDoc,
    tasks,
    trip,
  });
  const activeFolderCopy = copy.folders[activeFolder.id];

  return (
    <WorkspacePage className={bookingStyles.pageClassName} kind="workspace" aria-label={copy.pageLabel} role="region">
      <BookingsDocsHeader
        canEditBookings={canEditBookings}
        copy={copy}
        locale={locale}
        onAddBooking={() => setDialogBooking("new")}
        recordCount={bookingDocs.length}
        trip={trip}
      />
      {canEditBookings ? (
        <Button className={bookingStyles.mobileAddButtonClassName} type="button" onClick={() => setDialogBooking("new")} aria-label={copy.addBooking} title={copy.addBooking}>
          <Icon name="plus" />
        </Button>
      ) : null}

      <div className={bookingStyles.contentClassName}>
        <BookingFolderRail
          activeFolderId={activeFolderId}
          copy={copy}
          folderCounts={folderCounts}
          onSelectFolder={selectFolder}
        />

        <BookingFilePanel
          activeFolderDescription={activeFolderCopy.description}
          activeFolderTitle={activeFolderCopy.title}
          canEditBookings={canEditBookings}
          copy={copy}
          folderDocs={folderDocs}
          lockedDocs={lockedDocs}
          query={query}
          selectedBookingId={selectedBooking?.id}
          statusFilter={statusFilter}
          statusMenuOpen={statusMenuOpen}
          trip={trip}
          onDeleteBooking={setDeleteBooking}
          onEditBooking={setDialogBooking}
          onQueryChange={changeQuery}
          onSelectBooking={selectBooking}
          onStatusFilterChange={changeStatusFilter}
          onToggleStatusMenu={() => setStatusMenuOpen((current) => !current)}
        />

        <BookingInspector
          booking={selectedBooking}
          canEdit={canEditBookings}
          copy={copy}
          mobileOpen={mobilePreviewOpen && Boolean(selectedBooking)}
          onClose={() => setMobilePreviewOpen(false)}
          onDelete={() => selectedBooking && setDeleteBooking(selectedBooking)}
          onEdit={() => selectedBooking && setDialogBooking(selectedBooking)}
          relations={selectedRelations}
        />
      </div>

      {dialogBooking ? (
        <BookingDialog
          booking={dialogBooking === "new" ? null : dialogBooking}
          trip={trip}
          tasks={tasks}
          onCancel={() => setDialogBooking(null)}
          onSubmit={submitBooking}
          copy={copy}
        />
      ) : null}

      {deleteBooking ? (
        <BookingDeleteDialog
          bookingTitle={deleteBooking.title}
          copy={copy}
          onCancel={() => setDeleteBooking(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </WorkspacePage>
  );
}
