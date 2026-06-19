import { type FormEvent, useState } from "react";
import type { BookingDoc, BookingDocStatus, BookingDocType, BookingDocVisibility, Trip, TripTask } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/src/features/itinerary/lib/itinerary-time";
import { toggleId } from "@/src/features/itinerary/lib/itinerary-item-helpers";
import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { Button, IconButton, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  bookingStatuses,
  bookingTypes,
  bookingVisibilities,
  type BookingCopy,
  formatEnumLabel,
} from "../BookingsDocsPage.copy";
import * as bookingStyles from "../BookingsDocsPage.styles";
import type { BookingDocInput } from "../BookingsDocsPage.types";
import { CheckboxGroup } from "./CheckboxGroup";

interface BookingDialogProps {
  booking: BookingDoc | null;
  copy: BookingCopy;
  trip: Trip;
  tasks: TripTask[];
  onCancel: () => void;
  onSubmit: (input: BookingDocInput) => void | Promise<void>;
}

export function BookingDialog({ booking, copy, trip, tasks, onCancel, onSubmit }: BookingDialogProps) {
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
