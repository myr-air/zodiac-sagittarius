import { useMemo, useState } from "react";
import {
  canViewBookingDoc,
  findBookingDocRelations,
} from "@/src/trip/booking-docs";
import type { BookingDoc, BookingDocStatus, Member, Trip, TripTask } from "@/src/trip/types";
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
import {
  bookingDocMatchesFolder,
  bookingFolders,
  countBookingFolders,
  type BookingFolderId,
} from "./booking-folders";
import {
  bookingDocMatchesQuery,
  compareBookingStartWithUndated,
} from "./bookings-docs-page-support";

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
  const [activeFolderId, setActiveFolderId] = useState<BookingFolderId>("all");
  const [selectedBookingId, setSelectedBookingId] = useState(bookingDocs[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingDocStatus | "all">("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [dialogBooking, setDialogBooking] = useState<BookingDoc | "new" | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<BookingDoc | null>(null);
  const visibleDocs = useMemo(() => bookingDocs.filter((doc) => canViewBookingDoc(doc, currentMember)), [bookingDocs, currentMember]);
  const folderDocs = useMemo(() => visibleDocs
    .filter((doc) => bookingDocMatchesFolder(doc, activeFolderId))
    .filter((doc) => statusFilter === "all" || doc.status === statusFilter)
    .filter((doc) => bookingDocMatchesQuery(doc, trip, query))
    .sort(compareBookingStartWithUndated), [activeFolderId, query, statusFilter, trip, visibleDocs]);
  const folderCounts = useMemo(() => countBookingFolders(visibleDocs), [visibleDocs]);
  const lockedDocs = bookingDocs.filter((doc) => !canViewBookingDoc(doc, currentMember));
  const selectedBooking = folderDocs.find((doc) => doc.id === selectedBookingId) ?? folderDocs[0] ?? null;
  const selectedRelations = selectedBooking ? findBookingDocRelations(selectedBooking, trip, tasks) : null;
  const activeFolder = bookingFolders.find((folder) => folder.id === activeFolderId) ?? bookingFolders[0];
  const activeFolderCopy = copy.folders[activeFolder.id];

  async function submitBooking(input: BookingDocInput) {
    if (dialogBooking === "new") {
      await onCreateBookingDoc(input);
    } else if (dialogBooking) {
      await onUpdateBookingDoc(dialogBooking.id, input);
    }
    setDialogBooking(null);
  }

  async function confirmDelete() {
    if (!deleteBooking) return;
    await onDeleteBookingDoc(deleteBooking.id);
    setDeleteBooking(null);
  }

  function selectBooking(bookingDocId: string) {
    setSelectedBookingId(bookingDocId);
    setMobilePreviewOpen(true);
  }

  function selectFolder(folderId: BookingFolderId) {
    setActiveFolderId(folderId);
    setMobilePreviewOpen(false);
    setStatusMenuOpen(false);
  }

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
    setMobilePreviewOpen(false);
    setStatusMenuOpen(false);
  }

  function changeStatusFilter(nextStatus: BookingDocStatus | "all") {
    setStatusFilter(nextStatus);
    setStatusMenuOpen(false);
    setMobilePreviewOpen(false);
  }

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
