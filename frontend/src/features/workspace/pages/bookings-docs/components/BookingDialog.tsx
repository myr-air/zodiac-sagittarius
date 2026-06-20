import type { BookingDoc, BookingDocStatus, BookingDocType, BookingDocVisibility, Trip, TripTask } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
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
import { useBookingDialogState } from "./useBookingDialogState";

interface BookingDialogProps {
  booking: BookingDoc | null;
  copy: BookingCopy;
  trip: Trip;
  tasks: TripTask[];
  onCancel: () => void;
  onSubmit: (input: BookingDocInput) => void | Promise<void>;
}

export function BookingDialog({ booking, copy, trip, tasks, onCancel, onSubmit }: BookingDialogProps) {
  const state = useBookingDialogState({ booking, copy, trip, onSubmit });
  const stopNotes = trip.stopNotes ?? [];

  return (
    <div className={bookingStyles.dialogBackdropClassName} role="presentation">
      <section className={bookingStyles.dialogClassName} role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
        <div className={bookingStyles.dialogHeaderClassName}>
          <h2 id="booking-dialog-title">{booking ? copy.editBookingDialog : copy.addBookingDialog}</h2>
          <IconButton type="button" aria-label={copy.closeBookingDialog} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={bookingStyles.dialogFormClassName} onSubmit={state.submit}>
          <div className={bookingStyles.dialogGridClassName}>
            <label className={bookingStyles.fieldClassName}><span>{copy.titleField}</span><input value={state.title} onChange={(event) => state.setTitle(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.typeField}</span><Select value={state.type} onChange={(event) => state.setType(event.target.value as BookingDocType)}>{bookingTypes.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</Select></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.statusField}</span><Select value={state.status} onChange={(event) => state.setStatus(event.target.value as BookingDocStatus)}>{bookingStatuses.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</Select></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.visibilityField}</span><Select value={state.visibility} onChange={(event) => state.setVisibility(event.target.value as BookingDocVisibility)}>{bookingVisibilities.map((item) => <option key={item} value={item}>{formatEnumLabel(item, copy)}</option>)}</Select></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.providerField}</span><input value={state.providerName} onChange={(event) => state.setProviderName(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.confirmationCodeField}</span><input value={state.confirmationCode} onChange={(event) => state.setConfirmationCode(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.startField}</span><DateTimePickerField value={state.startsAt} onChange={state.setStartsAt} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.endField}</span><DateTimePickerField value={state.endsAt} onChange={state.setEndsAt} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.priceField}</span><input inputMode="decimal" type="number" min="0" step="0.01" value={state.priceAmount} onChange={(event) => state.setPriceAmount(event.target.value)} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.currencyField}</span><input value={state.currency} onChange={(event) => state.setCurrency(event.target.value.toUpperCase())} /></label>
            <label className={bookingStyles.fieldClassName}><span>{copy.externalLinkField}</span><input type="url" value={state.externalUrl} onChange={(event) => state.setExternalUrl(event.target.value)} /></label>
            <label className={cn(bookingStyles.fieldClassName, "col-span-full")}><span>{copy.notesField}</span><textarea value={state.notes} onChange={(event) => state.setNotes(event.target.value)} /></label>
          </div>
          <div className="grid gap-3">
            <CheckboxGroup
              label={copy.travelersField}
              options={trip.members.map((member) => ({ id: member.id, label: member.displayName }))}
              selectedIds={state.travelerIds}
              onToggle={state.toggleTraveler}
            />
            <CheckboxGroup
              label={copy.linkedItinerary}
              options={trip.itineraryItems.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }))}
              selectedIds={state.relatedItineraryItemIds}
              onToggle={state.toggleItineraryItem}
            />
            <CheckboxGroup
              label={copy.linkedTodos}
              options={tasks.map((task) => ({ id: task.id, label: task.title }))}
              selectedIds={state.relatedTaskIds}
              onToggle={state.toggleTask}
            />
            <CheckboxGroup
              label={copy.linkedExpenses}
              options={trip.expenses.map((expense) => ({ id: expense.id, label: expense.title }))}
              selectedIds={state.relatedExpenseIds}
              onToggle={state.toggleExpense}
            />
            <CheckboxGroup
              label={copy.linkedNotes}
              options={stopNotes.map((note) => ({ id: note.id, label: note.body }))}
              selectedIds={state.noteIds}
              onToggle={state.toggleNote}
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
