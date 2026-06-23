import type { BookingDocStatus, BookingDocType, BookingDocVisibility } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { DateTimePickerField } from "@/src/shared/components/date-time-pickers";
import { Select } from "@/src/ui";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import {
  bookingStatusSelectOptions,
  bookingTypeSelectOptions,
  bookingVisibilitySelectOptions,
} from "../model/booking-options";
import * as bookingStyles from "../BookingsDocsPage.styles";
import type { BookingDialogState } from "../hooks/useBookingDialogState";

interface BookingDialogFieldsProps {
  copy: BookingCopy;
  state: BookingDialogState;
}

export function BookingDialogFields({ copy, state }: BookingDialogFieldsProps) {
  return (
    <div className={bookingStyles.dialogGridClassName}>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.titleField}</span>
        <input value={state.title} onChange={(event) => state.setTitle(event.target.value)} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.typeField}</span>
        <Select value={state.type} onChange={(event) => state.setType(event.target.value as BookingDocType)}>
          {bookingTypeSelectOptions(copy).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.statusField}</span>
        <Select value={state.status} onChange={(event) => state.setStatus(event.target.value as BookingDocStatus)}>
          {bookingStatusSelectOptions(copy).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.visibilityField}</span>
        <Select value={state.visibility} onChange={(event) => state.setVisibility(event.target.value as BookingDocVisibility)}>
          {bookingVisibilitySelectOptions(copy).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.providerField}</span>
        <input value={state.providerName} onChange={(event) => state.setProviderName(event.target.value)} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.confirmationCodeField}</span>
        <input value={state.confirmationCode} onChange={(event) => state.setConfirmationCode(event.target.value)} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.startField}</span>
        <DateTimePickerField value={state.startsAt} onChange={state.setStartsAt} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.endField}</span>
        <DateTimePickerField value={state.endsAt} onChange={state.setEndsAt} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.priceField}</span>
        <input inputMode="decimal" type="number" min="0" step="0.01" value={state.priceAmount} onChange={(event) => state.setPriceAmount(event.target.value)} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.currencyField}</span>
        <input value={state.currency} onChange={(event) => state.setCurrency(event.target.value.toUpperCase())} />
      </label>
      <label className={bookingStyles.fieldClassName}>
        <span>{copy.externalLinkField}</span>
        <input type="url" value={state.externalUrl} onChange={(event) => state.setExternalUrl(event.target.value)} />
      </label>
      <label className={cn(bookingStyles.fieldClassName, "col-span-full")}>
        <span>{copy.notesField}</span>
        <textarea value={state.notes} onChange={(event) => state.setNotes(event.target.value)} />
      </label>
    </div>
  );
}
