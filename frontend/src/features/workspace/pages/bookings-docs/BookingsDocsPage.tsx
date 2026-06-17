import { useMemo, useState } from "react";
import {
  canViewBookingDoc,
  findBookingDocRelations,
} from "@/src/trip/booking-docs";
import type { BookingDoc, BookingDocStatus, Member, Trip, TripTask } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { Button, WorkspacePage, WorkspaceSurface } from "@/src/ui";
import { BookingDialog } from "./BookingDialog";
import { BookingFileRow } from "./BookingFileRow";
import { BookingInspector } from "./BookingInspector";
import { bookingCopy, bookingStatuses, formatEnumLabel, type BookingCopy } from "./BookingsDocsPage.copy";
import * as bookingStyles from "./BookingsDocsPage.styles";
import type { BookingDocInput } from "./BookingsDocsPage.types";
import {
  bookingDocMatchesFolder,
  bookingDocMatchesQuery,
  bookingFolders,
  compareBookingStartWithUndated,
  countBookingFolders,
  type BookingFolderId,
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
        <WorkspaceSurface as="nav" className={bookingStyles.folderRailClassName} density="compact" aria-label={copy.bookingFolders}>
          {bookingFolders.map((folder) => (
            <button
              type="button"
              className={cn(bookingStyles.folderButtonClassName, activeFolderId === folder.id && bookingStyles.selectedFolderClassName)}
              key={folder.id}
              onClick={() => {
                setActiveFolderId(folder.id);
                setMobilePreviewOpen(false);
                setStatusMenuOpen(false);
              }}
              aria-pressed={activeFolderId === folder.id}
              aria-label={copy.folderCount(copy.folders[folder.id].title, folderCounts[folder.id] ?? 0)}
            >
              <span className="grid size-7 place-items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) text-(--color-primary-strong) max-[1199px]:size-5 max-[1199px]:border-0 max-[1199px]:bg-transparent">
                <Icon name={folder.icon} />
              </span>
              <span className="min-w-0 max-[767px]:hidden">
                <strong className="block truncate text-sm font-extrabold max-[1199px]:text-[11px] max-[1199px]:leading-4">{copy.folders[folder.id].title}</strong>
                <span className="block truncate text-[11px] font-semibold text-(--color-text-muted) max-[1199px]:hidden">{copy.folders[folder.id].description}</span>
              </span>
              <strong className="tabular-nums text-xs text-(--color-text-muted) max-[1199px]:text-[11px]">{folderCounts[folder.id] ?? 0}</strong>
            </button>
          ))}
        </WorkspaceSurface>

        <WorkspaceSurface className={bookingStyles.filePanelClassName} aria-label={copy.fileList}>
          <div className={bookingStyles.fileToolbarClassName}>
            <div className={bookingStyles.toolbarControlsClassName}>
              <label className="min-w-0">
                <span className="sr-only">{copy.searchPlaceholder}</span>
                <input
                  className={bookingStyles.searchInputClassName}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setMobilePreviewOpen(false);
                    setStatusMenuOpen(false);
                  }}
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
                  onClick={() => setStatusMenuOpen((current) => !current)}
                  type="button"
                >
                  <span className="truncate">{statusFilter === "all" ? copy.allStatuses : formatEnumLabel(statusFilter, copy)}</span>
                  <Icon name="chevronRight" className={cn("size-3.5 transition-transform", statusMenuOpen && "rotate-90")} />
                </button>
                {statusMenuOpen ? (
                  <div className={bookingStyles.statusFilterMenuClassName} id="booking-status-filter-menu" role="listbox" aria-label={copy.statusFilter}>
                    {(["all", ...bookingStatuses] as Array<BookingDocStatus | "all">).map((status) => {
                      const selected = statusFilter === status;
                      return (
                        <button
                          aria-selected={selected}
                          className={cn(bookingStyles.statusFilterOptionClassName, selected && bookingStyles.statusFilterOptionActiveClassName)}
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setStatusMenuOpen(false);
                            setMobilePreviewOpen(false);
                          }}
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
              <strong className="text-[15px] font-extrabold text-(--color-text)">{activeFolderCopy.title}</strong>
              <span className={bookingStyles.activeFolderDescriptionClassName}>{copy.visibleItems(activeFolderCopy.description, folderDocs.length)}</span>
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
                selected={selectedBooking?.id === doc.id}
                canEdit={canEditBookings}
                onSelect={() => selectBooking(doc.id)}
                onEdit={() => setDialogBooking(doc)}
                onDelete={() => setDeleteBooking(doc)}
                copy={copy}
              />
            ))}
            {!folderDocs.length ? (
              <div className="grid min-h-[180px] min-w-[720px] place-items-center p-5 text-center max-[1199px]:min-w-0 max-[1199px]:w-full max-[767px]:min-h-[220px] max-[767px]:px-4">
                <div className="grid max-w-[360px] gap-1">
                  <strong className="text-(--color-text)">{copy.emptyTitle}</strong>
                  <span className="text-sm font-medium leading-6 text-(--color-text-muted)">{copy.emptyDetail}</span>
                </div>
              </div>
            ) : null}
            {lockedDocs.map((doc) => (
              <div className={bookingStyles.lockedRowClassName} key={doc.id}>
                <span className="inline-flex items-center gap-2 font-extrabold text-(--color-text-muted)"><Icon name="eyeOff" /> {copy.lockedSensitiveRecord}</span>
                <span className="text-xs font-bold text-(--color-text-muted)">{formatEnumLabel(doc.type, copy)}</span>
              </div>
            ))}
          </div>
        </WorkspaceSurface>

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
        <div className={bookingStyles.dialogBackdropClassName} role="presentation">
          <section className={bookingStyles.deleteDialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-delete-title">
            <h2 id="booking-delete-title" className="m-0 text-base font-extrabold text-(--color-danger)">{copy.deleteBooking}</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{copy.deletePrompt(deleteBooking.title)}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteBooking(null)}>{copy.cancel}</Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>{copy.deleteBooking}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </WorkspacePage>
  );
}

function BookingsDocsHeader({
  canEditBookings,
  copy,
  locale,
  onAddBooking,
  recordCount,
  trip,
}: {
  canEditBookings: boolean;
  copy: BookingCopy;
  locale: Locale;
  onAddBooking: () => void;
  recordCount: number;
  trip: Trip;
}) {
  return (
    <PageHeader
      title={copy.title}
      subtitle={trip.name}
      meta={(
        <>
          <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
          <span><Icon name="ticket" /> {copy.records(recordCount)}</span>
        </>
      )}
      aside={canEditBookings ? (
        <div className={bookingStyles.headerAsideClassName}>
          <div className={bookingStyles.headerActionRowClassName}>
            <Button type="button" onClick={onAddBooking} aria-label={copy.addBooking}>
              <Icon name="plus" /> <span>{copy.addBooking}</span>
            </Button>
          </div>
        </div>
      ) : null}
    />
  );
}
