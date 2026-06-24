import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { Button, WorkspacePage } from "@/src/ui";
import { BookingDialogLayer } from "./components/BookingDialogLayer";
import { BookingFilePanel } from "./components/BookingFilePanel";
import { BookingFolderRail } from "./components/BookingFolderRail";
import { BookingsDocsHeader } from "./components/BookingsDocsHeader";
import { BookingInspector } from "./components/BookingInspector";
import { bookingCopy } from "./content/BookingsDocsPage.copy";
import * as bookingStyles from "./BookingsDocsPage.styles";
import type { BookingsDocsPageProps } from "./BookingsDocsPage.types";
import { useBookingsDocsPageState } from "./hooks/use-bookings-docs-page-state";

export type {
  BookingDocInput,
  BookingsDocsPageProps,
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "./BookingsDocsPage.types";

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
    statusFilter,
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
          trip={trip}
          onDeleteBooking={setDeleteBooking}
          onEditBooking={setDialogBooking}
          onQueryChange={changeQuery}
          onSelectBooking={selectBooking}
          onStatusFilterChange={changeStatusFilter}
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

      <BookingDialogLayer
        copy={copy}
        deleteBooking={deleteBooking}
        dialogBooking={dialogBooking}
        tasks={tasks}
        trip={trip}
        onCancelDelete={() => setDeleteBooking(null)}
        onCancelDialog={() => setDialogBooking(null)}
        onConfirmDelete={confirmDelete}
        onSubmitBooking={submitBooking}
      />
    </WorkspacePage>
  );
}
