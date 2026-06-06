import { type FormEvent, useMemo, useState } from "react";
import {
  buildBookingDocsSummary,
  canViewBookingDoc,
  filterBookingDocs,
  findBookingDocRelations,
  type BookingDocFilters,
} from "@/src/trip/booking-docs";
import { formatDayLabel, getTripDates } from "@/src/trip/itinerary";
import type { BookingDoc, BookingDocStatus, BookingDocType, BookingDocVisibility, Member, Trip, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "./icons";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { Button, IconButton } from "./ui";

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

const bookingTypes = ["flight", "train", "public_transport", "hotel", "insurance", "passport", "visa", "activity_ticket", "other"] satisfies BookingDocType[];
const bookingStatuses = ["draft", "needs_action", "booked", "confirmed", "paid", "cancelled", "expired"] satisfies BookingDocStatus[];
const bookingVisibilities = ["shared", "sensitive", "private"] satisfies BookingDocVisibility[];

const pageClassName = "bookings-docs-page grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-[linear-gradient(180deg,#f7fbfa_0%,var(--color-page)_46%)] px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4";
const summaryClassName = "bookings-summary grid grid-cols-4 gap-3 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
const statClassName = "booking-stat grid min-h-[96px] gap-1 rounded-(--radius-lg) border border-[rgb(15_118_110_/_0.14)] bg-[linear-gradient(145deg,#ffffff_0%,#f4fffc_100%)] p-3.5 shadow-[0_10px_24px_rgb(15_23_42_/_0.05)] [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-xl [&>strong]:font-black [&>strong]:tabular-nums [&>strong]:text-(--color-text)";
const contentClassName = "bookings-content grid min-h-0 grid-cols-[minmax(0,1fr)_330px] gap-3 max-[1199px]:grid-cols-1";
const panelClassName = "bookings-panel grid min-h-0 gap-3 rounded-(--radius-lg) border border-[rgb(15_23_42_/_0.08)] bg-[rgb(255_255_255_/_0.95)] p-3.5 shadow-[0_14px_28px_rgb(15_23_42_/_0.05)]";
const filtersClassName = "bookings-filters grid grid-cols-[minmax(180px,1fr)_150px_150px_150px_150px_auto] items-end gap-2 max-[1199px]:grid-cols-3 max-[767px]:grid-cols-1";
const fieldClassName = "grid min-w-0 gap-1.5 [&>span]:text-[11px] [&>span]:font-extrabold [&>span]:text-(--color-text-muted) [&_input]:min-h-10 [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-sm [&_select]:min-h-10 [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-sm [&_textarea]:min-h-[74px] [&_textarea]:resize-y [&_textarea]:rounded-(--radius-md) [&_textarea]:border [&_textarea]:border-(--color-border) [&_textarea]:bg-(--color-surface) [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm";
const ledgerClassName = "bookings-ledger grid gap-2";
const rowClassName = "booking-row grid min-h-[74px] grid-cols-[112px_minmax(0,1fr)_132px_110px_92px_100px_auto] items-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-left text-sm shadow-[0_8px_18px_rgb(15_23_42_/_0.035)] transition-colors hover:bg-[#fbfefd] max-[1199px]:grid-cols-[92px_minmax(0,1fr)_auto] max-[1199px]:items-start max-[1199px]:[&_.booking-cell-optional]:hidden";
const selectedRowClassName = "border-(--color-primary-border) bg-(--color-primary-soft)";
const lockedRowClassName = "booking-row-locked flex min-h-[58px] items-center justify-between gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-sm";
const badgeClassName = "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-extrabold capitalize";
const inspectorClassName = "booking-inspector sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto rounded-(--radius-lg) border border-[rgb(15_23_42_/_0.08)] bg-[rgb(255_255_255_/_0.96)] p-3.5 shadow-[0_14px_28px_rgb(15_23_42_/_0.05)] max-[1199px]:static max-[1199px]:max-h-none";
const inspectorSectionClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 text-sm";
const dialogBackdropClassName = "fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-4";
const dialogClassName = "booking-dialog grid max-h-[min(760px,calc(100vh_-_32px))] w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_24px_70px_rgb(15_23_42_/_0.28)]";
const dialogHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-(--color-border) px-4 py-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-extrabold";
const dialogFormClassName = "grid min-h-0 gap-3 overflow-y-auto p-4";
const dialogGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const dialogActionsClassName = "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-3";
const deleteDialogClassName = "grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.22)]";

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
  const [filters, setFilters] = useState<BookingDocFilters>({});
  const [selectedBookingId, setSelectedBookingId] = useState(bookingDocs[0]?.id ?? "");
  const [dialogBooking, setDialogBooking] = useState<BookingDoc | "new" | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<BookingDoc | null>(null);
  const summary = useMemo(() => buildBookingDocsSummary(bookingDocs, trip.members, `${trip.startDate}T00:00:00.000Z`), [bookingDocs, trip.members, trip.startDate]);
  const filteredDocs = useMemo(() => filterBookingDocs(bookingDocs, filters, trip, currentMember), [bookingDocs, currentMember, filters, trip]);
  const lockedDocs = bookingDocs.filter((doc) => !canViewBookingDoc(doc, currentMember));
  const selectedBooking = filteredDocs.find((doc) => doc.id === selectedBookingId) ?? filteredDocs[0] ?? null;
  const selectedRelations = selectedBooking ? findBookingDocRelations(selectedBooking, trip, tasks) : null;
  const tripDays = getTripDates(trip.startDate, trip.endDate);

  function clearFilters() {
    setFilters({});
  }

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

  return (
    <section className={pageClassName} aria-label="Bookings & Docs" role="region">
      <PageHeader
        title="Bookings & Docs"
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="ticket" /> {bookingDocs.length} records</span>
          </>
        )}
        aside={<PageUserCard color={currentMember.color} name={currentMember.displayName} label={canEditBookings ? "Can edit bookings" : "Read-only"} />}
      />

      <div className={summaryClassName} aria-label="Bookings summary">
        <SummaryStat icon="wallet" label="Trip booking cost" value={formatCurrencyTotals(summary.totalCostByCurrency)} />
        <SummaryStat icon="warning" label="Needs action" value={`${summary.needsActionCount} need action`} />
        <SummaryStat icon="document" label="Sensitive docs" value={`${summary.sensitiveDocsReady}/${summary.sensitiveDocsTotal} ready`} />
        <SummaryStat icon="clock" label="Upcoming" value={summary.upcoming ? summary.upcoming.title : "No upcoming"} />
      </div>

      <div className={contentClassName}>
        <div className={panelClassName}>
          <div className={filtersClassName}>
            <label className={fieldClassName}>
              <span>Search bookings</span>
              <input value={filters.query ?? ""} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} />
            </label>
            <label className={fieldClassName}>
              <span>Type</span>
              <select value={filters.type ?? "all"} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as BookingDocFilters["type"] }))}>
                <option value="all">All types</option>
                {bookingTypes.map((type) => <option key={type} value={type}>{formatEnumLabel(type)}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Status</span>
              <select value={filters.status ?? "all"} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as BookingDocFilters["status"] }))}>
                <option value="all">All statuses</option>
                {bookingStatuses.map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Traveler</span>
              <select value={filters.travelerId ?? "all"} onChange={(event) => setFilters((current) => ({ ...current, travelerId: event.target.value }))}>
                <option value="all">All travelers</option>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>Day</span>
              <select value={filters.day ?? "all"} onChange={(event) => setFilters((current) => ({ ...current, day: event.target.value }))}>
                <option value="all">All days</option>
                {tripDays.map((day) => <option key={day} value={day}>{formatDayLabel(day, locale)}</option>)}
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-[15px] font-extrabold text-(--color-text)">Ledger</strong>
            {canEditBookings ? <Button type="button" onClick={() => setDialogBooking("new")}><Icon name="plus" /> Add booking</Button> : null}
          </div>

          <div className={ledgerClassName}>
            {filteredDocs.map((doc) => (
              <BookingRow
                key={doc.id}
                doc={doc}
                trip={trip}
                selected={selectedBooking?.id === doc.id}
                canEdit={canEditBookings}
                onSelect={() => setSelectedBookingId(doc.id)}
                onEdit={() => setDialogBooking(doc)}
                onDelete={() => setDeleteBooking(doc)}
              />
            ))}
            {lockedDocs.map((doc) => (
              <div className={lockedRowClassName} key={doc.id}>
                <span className="inline-flex items-center gap-2 font-extrabold text-(--color-text-muted)"><Icon name="eyeOff" /> Locked sensitive record</span>
                <span className="text-xs font-bold text-(--color-text-muted)">{formatEnumLabel(doc.type)}</span>
              </div>
            ))}
          </div>
        </div>

        <BookingInspector booking={selectedBooking} relations={selectedRelations} />
      </div>

      {dialogBooking ? (
        <BookingDialog
          booking={dialogBooking === "new" ? null : dialogBooking}
          trip={trip}
          tasks={tasks}
          onCancel={() => setDialogBooking(null)}
          onSubmit={submitBooking}
        />
      ) : null}

      {deleteBooking ? (
        <div className={dialogBackdropClassName} role="presentation">
          <section className={deleteDialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-delete-title">
            <h2 id="booking-delete-title" className="m-0 text-base font-extrabold text-[#991b1b]">Delete booking</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">Delete {deleteBooking.title}? Related itinerary, todo, and expense records will stay in place.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteBooking(null)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>Delete booking</Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function SummaryStat({ icon, label, value }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: string }) {
  return (
    <div className={statClassName}>
      <Icon name={icon} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BookingRow({ doc, trip, selected, canEdit, onSelect, onEdit, onDelete }: {
  doc: BookingDoc;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linkedContext = doc.relatedItineraryItemIds
    .map((itemId) => trip.itineraryItems.find((item) => item.id === itemId)?.activity)
    .filter(Boolean)
    .join(", ");

  return (
    <div className={cn(rowClassName, selected && selectedRowClassName)}>
      <button type="button" className="text-left" onClick={onSelect} aria-label={`Select ${doc.title}`}>
        <span className={cn(badgeClassName, statusBadgeClassName(doc.status))}>{formatEnumLabel(doc.type)}</span>
      </button>
      <div className="grid gap-1">
        <strong className="text-(--color-text)">{doc.title}</strong>
        <span className="text-xs font-bold text-(--color-text-muted)">{doc.providerName ?? "No provider"} {doc.confirmationCode ? `· ${doc.confirmationCode}` : ""}</span>
      </div>
      <span className="booking-cell-optional text-xs font-bold text-(--color-text-muted)">{formatDateTime(doc.startsAt)}</span>
      <span className="booking-cell-optional text-xs font-bold text-(--color-text-muted)">{doc.travelerIds.length} travelers</span>
      <span className="booking-cell-optional text-xs font-bold text-(--color-text-muted)">{doc.priceAmount && doc.currency ? `${doc.currency} ${doc.priceAmount.toLocaleString("en-US")}` : "-"}</span>
      <span className={cn("booking-cell-optional", badgeClassName, statusBadgeClassName(doc.status))}>{formatEnumLabel(doc.status)}</span>
      <div className="inline-flex justify-end gap-1.5">
        <span className="sr-only">{linkedContext}</span>
        {canEdit ? (
          <>
            <IconButton type="button" aria-label="Edit booking" onClick={onEdit}><Icon name="edit" /></IconButton>
            <IconButton type="button" aria-label="Delete booking" onClick={onDelete}><Icon name="trash" /></IconButton>
          </>
        ) : null}
      </div>
    </div>
  );
}

function BookingInspector({ booking, relations }: { booking: BookingDoc | null; relations: ReturnType<typeof findBookingDocRelations> | null }) {
  if (!booking || !relations) {
    return (
      <aside className={inspectorClassName} aria-label="Booking details">
        <strong className="text-(--color-text)">No booking selected</strong>
      </aside>
    );
  }

  return (
    <aside className={inspectorClassName} aria-label="Booking details">
      <div className="grid gap-1">
        <span className={cn(badgeClassName, statusBadgeClassName(booking.status))}>{formatEnumLabel(booking.status)}</span>
        <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{booking.title}</h2>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{booking.notes ?? "No notes yet."}</p>
      </div>

      <div className={inspectorSectionClassName}>
        <strong>External links</strong>
        {booking.externalLinks.length ? booking.externalLinks.map((link) => (
          <a className="inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-extrabold text-(--color-primary-strong)" href={link.url} key={link.id} target="_blank" rel="noreferrer">
            <Icon name="external" /> Open {link.label}
          </a>
        )) : <span className="text-sm text-(--color-text-muted)">No external links yet.</span>}
      </div>

      <div className={inspectorSectionClassName}>
        <strong>Trip context</strong>
        <span>{relations.itineraryItems.length} itinerary links</span>
        <span>{relations.tasks.length} todos</span>
        <span>{relations.expenses.length} expenses</span>
        <span>{relations.notes.length} notes</span>
        <span>{relations.travelers.map((member) => member.displayName).join(", ") || "No travelers"}</span>
      </div>
    </aside>
  );
}

function BookingDialog({ booking, trip, tasks, onCancel, onSubmit }: {
  booking: BookingDoc | null;
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
      externalLinks: linkUrl ? [{ id: booking?.externalLinks[0]?.id ?? "link-local-1", label: "External link", url: linkUrl, provider: providerName.trim() || null, accessNote: null }] : [],
      relatedItineraryItemIds,
      relatedTaskIds,
      relatedExpenseIds,
      noteIds,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className={dialogBackdropClassName} role="presentation">
      <section className={dialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
        <div className={dialogHeaderClassName}>
          <h2 id="booking-dialog-title">{booking ? "Edit booking" : "Add booking"}</h2>
          <IconButton type="button" aria-label="Close booking dialog" onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={dialogFormClassName} onSubmit={submit}>
          <div className={dialogGridClassName}>
            <label className={fieldClassName}><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className={fieldClassName}><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as BookingDocType)}>{bookingTypes.map((item) => <option key={item} value={item}>{formatEnumLabel(item)}</option>)}</select></label>
            <label className={fieldClassName}><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as BookingDocStatus)}>{bookingStatuses.map((item) => <option key={item} value={item}>{formatEnumLabel(item)}</option>)}</select></label>
            <label className={fieldClassName}><span>Visibility</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as BookingDocVisibility)}>{bookingVisibilities.map((item) => <option key={item} value={item}>{formatEnumLabel(item)}</option>)}</select></label>
            <label className={fieldClassName}><span>Provider</span><input value={providerName} onChange={(event) => setProviderName(event.target.value)} /></label>
            <label className={fieldClassName}><span>Confirmation code</span><input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} /></label>
            <label className={fieldClassName}><span>Start</span><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
            <label className={fieldClassName}><span>End</span><input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
            <label className={fieldClassName}><span>Price</span><input inputMode="decimal" type="number" min="0" step="0.01" value={priceAmount} onChange={(event) => setPriceAmount(event.target.value)} /></label>
            <label className={fieldClassName}><span>Currency</span><input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
            <label className={fieldClassName}><span>External link</span><input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /></label>
            <label className={cn(fieldClassName, "col-span-full")}><span>Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          </div>
          <div className="grid gap-3">
            <CheckboxGroup
              label="Travelers"
              options={trip.members.map((member) => ({ id: member.id, label: member.displayName }))}
              selectedIds={travelerIds}
              onToggle={(memberId) => setTravelerIds((current) => toggleId(current, memberId))}
            />
            <CheckboxGroup
              label="Linked itinerary"
              options={trip.itineraryItems.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }))}
              selectedIds={relatedItineraryItemIds}
              onToggle={(itemId) => setRelatedItineraryItemIds((current) => toggleId(current, itemId))}
            />
            <CheckboxGroup
              label="Linked todos"
              options={tasks.map((task) => ({ id: task.id, label: task.title }))}
              selectedIds={relatedTaskIds}
              onToggle={(taskId) => setRelatedTaskIds((current) => toggleId(current, taskId))}
            />
            <CheckboxGroup
              label="Linked expenses"
              options={trip.expenses.map((expense) => ({ id: expense.id, label: expense.title }))}
              selectedIds={relatedExpenseIds}
              onToggle={(expenseId) => setRelatedExpenseIds((current) => toggleId(current, expenseId))}
            />
            <CheckboxGroup
              label="Linked notes"
              options={stopNotes.map((note) => ({ id: note.id, label: note.body }))}
              selectedIds={noteIds}
              onToggle={(noteId) => setNoteIds((current) => toggleId(current, noteId))}
            />
          </div>
          <div className={dialogActionsClassName}>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save booking</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selectedIds,
  onToggle,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3">
      <legend className="px-1 text-[11px] font-extrabold text-(--color-text-muted)">{label}</legend>
      <div className="grid max-h-36 gap-1.5 overflow-auto pr-1">
        {options.map((option) => (
          <label className="grid min-h-8 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 text-xs font-bold text-(--color-text)" key={option.id}>
            <input type="checkbox" checked={selectedIds.includes(option.id)} onChange={() => onToggle(option.id)} />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id];
}

function formatCurrencyTotals(totals: Record<string, number>): string {
  const first = Object.entries(totals)[0];
  if (!first) return "-";
  const [currency, value] = first;
  return `${currency} ${value.toLocaleString("en-US")}`;
}

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 16);
}

function fromDateTimeLocalValue(value: string): string | null {
  return value ? value : null;
}

function statusBadgeClassName(status: BookingDocStatus): string {
  if (status === "needs_action") return "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
  if (status === "paid" || status === "confirmed") return "border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)";
  if (status === "cancelled" || status === "expired") return "border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)";
  return "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
}
