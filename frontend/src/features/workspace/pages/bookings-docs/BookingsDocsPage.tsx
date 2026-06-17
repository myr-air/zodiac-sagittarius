import { type FormEvent, useMemo, useState } from "react";
import {
  canViewBookingDoc,
  findBookingDocRelations,
} from "@/src/trip/booking-docs";
import type { BookingDoc, BookingDocStatus, BookingDocType, BookingDocVisibility, Member, Trip, TripTask } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { Button, IconButton, Select, WorkspacePage, WorkspaceSurface } from "@/src/ui";
import { bookingCopy, bookingStatuses, bookingTypes, bookingVisibilities, formatEnumLabel, type BookingCopy } from "./BookingsDocsPage.copy";
import * as bookingStyles from "./BookingsDocsPage.styles";
import { CheckboxGroup } from "./CheckboxGroup";
import {
  bookingDocLinkedContext,
  bookingDocMatchesFolder,
  bookingDocMatchesQuery,
  bookingFolders,
  bookingTypeIcon,
  compareBookingStartWithUndated,
  countBookingFolders,
  formatDateTime,
  fromDateTimeLocalValue,
  statusBadgeClassName,
  toDateTimeLocalValue,
  toggleId,
  type BookingFolderId,
  typeIconClassName,
} from "./bookings-docs-page-support";

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

export interface BookingDocInput {
  tripPlanId?: string | null;
  type: BookingDocType;
  title: string;
  status: BookingDocStatus;
  visibility: BookingDocVisibility;
  ownerMemberId?: string | null;
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  travelerIds: string[];
  externalLinks: BookingDoc["externalLinks"];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
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

function BookingFileRow({ doc, copy, trip, selected, canEdit, onSelect, onEdit, onDelete }: {
  doc: BookingDoc;
  copy: BookingCopy;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
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

function BookingInspector({
  booking,
  canEdit,
  copy,
  mobileOpen,
  onClose,
  onDelete,
  onEdit,
  relations,
}: {
  booking: BookingDoc | null;
  canEdit: boolean;
  copy: BookingCopy;
  mobileOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  relations: ReturnType<typeof findBookingDocRelations> | null;
}) {
  if (!booking || !relations) {
    return (
      <WorkspaceSurface className={cn(bookingStyles.inspectorClassName, bookingStyles.mobileInspectorClosedClassName)} density="compact" aria-label={copy.bookingDetails}>
        <strong className="text-(--color-text)">{copy.noBookingSelected}</strong>
      </WorkspaceSurface>
    );
  }

  return (
    <WorkspaceSurface
      className={cn(bookingStyles.inspectorClassName, mobileOpen ? bookingStyles.mobileInspectorOpenClassName : bookingStyles.mobileInspectorClosedClassName)}
      density="compact"
      aria-label={copy.bookingDetails}
    >
      <div className="hidden max-[767px]:grid max-[767px]:grid-cols-[minmax(0,1fr)_auto] max-[767px]:items-center max-[767px]:gap-2">
        <span className="mx-auto h-1 w-10 rounded-full bg-(--color-border-strong)" aria-hidden="true" />
        <IconButton type="button" aria-label={copy.closeBookingPreview} onClick={onClose}><Icon name="x" /></IconButton>
      </div>
      <div className="grid gap-1">
        <span className={cn(bookingStyles.badgeClassName, statusBadgeClassName(booking.status))}>{formatEnumLabel(booking.status, copy)}</span>
        <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{booking.title}</h2>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{booking.notes ?? copy.noNotes}</p>
        {canEdit ? (
          <div className="mt-1 flex gap-1.5">
            <Button type="button" variant="secondary" onClick={onEdit}><Icon name="edit" /> {copy.editBooking}</Button>
            <IconButton type="button" aria-label={copy.deleteBooking} onClick={onDelete}><Icon name="trash" /></IconButton>
          </div>
        ) : null}
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.quickFacts}</strong>
        <span>{formatEnumLabel(booking.type, copy)}</span>
        <span>{booking.startsAt ? formatDateTime(booking.startsAt) : copy.noDate}</span>
        <span>{booking.providerName ?? copy.noProvider}</span>
        <span>{booking.confirmationCode ? `${copy.confirmation}: ${booking.confirmationCode}` : copy.noConfirmation}</span>
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.externalLinks}</strong>
        {booking.externalLinks.length ? booking.externalLinks.map((link) => (
          <a className="inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)" href={link.url} key={link.id} target="_blank" rel="noreferrer">
            <Icon name="external" /> {copy.openLink(link.label)}
          </a>
        )) : <span className="text-sm text-(--color-text-muted)">{copy.noExternalLinks}</span>}
      </div>

      <div className={bookingStyles.inspectorSectionClassName}>
        <strong>{copy.tripContext}</strong>
        <span>{copy.itineraryLinks(relations.itineraryItems.length)}</span>
        <span>{copy.todos(relations.tasks.length)}</span>
        <span>{copy.expenses(relations.expenses.length)}</span>
        <span>{copy.notes(relations.notes.length)}</span>
        <span>{relations.travelers.map((member) => member.displayName).join(", ") || copy.noTravelers}</span>
      </div>
    </WorkspaceSurface>
  );
}

function BookingDialog({ booking, copy, trip, tasks, onCancel, onSubmit }: {
  booking: BookingDoc | null;
  copy: BookingCopy;
  trip: Trip;
  tasks: TripTask[];
  onCancel: () => void;
  onSubmit: (input: BookingDocInput) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(booking?.title ?? "");
  const [type, setType] = useState<BookingDocType>(booking?.type ?? "flight");
  const [status, setStatus] = useState<BookingDocStatus>(booking?.status ?? "draft");
  const [visibility, setVisibility] = useState<BookingDocVisibility>(booking?.visibility ?? "shared");
  const [providerName, setProviderName] = useState(booking?.providerName ?? "");
  const [confirmationCode, setConfirmationCode] = useState(booking?.confirmationCode ?? "");
  const [startsAt, setStartsAt] = useState(toDateTimeLocalValue(booking?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateTimeLocalValue(booking?.endsAt));
  const [priceAmount, setPriceAmount] = useState(booking?.priceAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(booking?.currency ?? "HKD");
  const [externalUrl, setExternalUrl] = useState(booking?.externalLinks[0]?.url ?? "");
  const [notes, setNotes] = useState(booking?.notes ?? "");
  const [travelerIds, setTravelerIds] = useState(() => booking?.travelerIds ?? trip.members.slice(0, 1).map((member) => member.id));
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(() => booking?.relatedItineraryItemIds ?? []);
  const [relatedTaskIds, setRelatedTaskIds] = useState(() => booking?.relatedTaskIds ?? []);
  const [relatedExpenseIds, setRelatedExpenseIds] = useState(() => booking?.relatedExpenseIds ?? []);
  const [noteIds, setNoteIds] = useState(() => booking?.noteIds ?? []);
  const stopNotes = trip.stopNotes ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const linkUrl = externalUrl.trim();

    onSubmit({
      type,
      title: trimmedTitle,
      status,
      visibility,
      ownerMemberId: visibility === "private" ? travelerIds[0] || null : booking?.ownerMemberId ?? null,
      providerName: providerName.trim() || null,
      confirmationCode: confirmationCode.trim() || null,
      startsAt: fromDateTimeLocalValue(startsAt),
      endsAt: fromDateTimeLocalValue(endsAt),
      timezone: booking?.timezone ?? "Asia/Hong_Kong",
      priceAmount: priceAmount ? Number(priceAmount) : null,
      currency: currency.trim() || null,
      travelerIds,
      externalLinks: linkUrl ? [{ id: booking?.externalLinks[0]?.id ?? "link-local-1", label: copy.externalLinkLabel, url: linkUrl, provider: providerName.trim() || null, accessNote: null }] : [],
      relatedItineraryItemIds,
      relatedTaskIds,
      relatedExpenseIds,
      noteIds,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className={bookingStyles.dialogBackdropClassName} role="presentation">
      <section className={bookingStyles.dialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
        <div className={bookingStyles.dialogHeaderClassName}>
          <h2 id="booking-dialog-title">{booking ? copy.editBookingDialog : copy.addBookingDialog}</h2>
          <IconButton type="button" aria-label={copy.closeBookingDialog} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={bookingStyles.dialogFormClassName} onSubmit={submit}>
          <div className={bookingStyles.dialogGridClassName}>
            <label className={bookingStyles.fieldClassName}><span>{copy.titleField}</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.typeField}</span><Select value={type} onChange={(event) => setType(event.target.value as BookingDocType)}>{bookingTypes.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</Select></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.statusField}</span><Select value={status} onChange={(event) => setStatus(event.target.value as BookingDocStatus)}>{bookingStatuses.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</Select></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.visibilityField}</span><Select value={visibility} onChange={(event) => setVisibility(event.target.value as BookingDocVisibility)}>{bookingVisibilities.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</Select></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.providerField}</span><input value={providerName} onChange={(event) => setProviderName(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.confirmationCodeField}</span><input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.startField}</span><DateTimePickerField value={startsAt} onChange={setStartsAt} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.endField}</span><DateTimePickerField value={endsAt} onChange={setEndsAt} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.priceField}</span><input inputMode="decimal" type="number" min="0" step="0.01" value={priceAmount} onChange={(event) => setPriceAmount(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.currencyField}</span><input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.externalLinkField}</span><input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /></label>
            <label className={cn(bookingStyles.fieldClassName, "col-span-full")}><span>{copy.notesField}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          </div>
          <div className="grid gap-3">
            <CheckboxGroup
              label={copy.travelersField}
              options={trip.members.map((member) => ({ id: member.id, label: member.displayName }))}
              selectedIds={travelerIds}
              onToggle={(memberId) => setTravelerIds((current) => toggleId(current, memberId))}
            />
            <CheckboxGroup
              label={copy.linkedItinerary}
              options={trip.itineraryItems.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }))}
              selectedIds={relatedItineraryItemIds}
              onToggle={(itemId) => setRelatedItineraryItemIds((current) => toggleId(current, itemId))}
            />
            <CheckboxGroup
              label={copy.linkedTodos}
              options={tasks.map((task) => ({ id: task.id, label: task.title }))}
              selectedIds={relatedTaskIds}
              onToggle={(taskId) => setRelatedTaskIds((current) => toggleId(current, taskId))}
            />
            <CheckboxGroup
              label={copy.linkedExpenses}
              options={trip.expenses.map((expense) => ({ id: expense.id, label: expense.title }))}
              selectedIds={relatedExpenseIds}
              onToggle={(expenseId) => setRelatedExpenseIds((current) => toggleId(current, expenseId))}
            />
            <CheckboxGroup
              label={copy.linkedNotes}
              options={stopNotes.map((note) => ({ id: note.id, label: note.body }))}
              selectedIds={noteIds}
              onToggle={(noteId) => setNoteIds((current) => toggleId(current, noteId))}
            />
          </div>
          <div className={bookingStyles.dialogActionsClassName}>
            <Button type="button" variant="secondary" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveBooking}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
