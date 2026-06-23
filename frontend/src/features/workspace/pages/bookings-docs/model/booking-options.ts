import {
  bookingDocStatusValues,
  bookingDocTypeValues,
  bookingDocVisibilityValues,
  type BookingDocStatus,
  type BookingDocType,
  type BookingDocVisibility,
} from "@/src/trip/booking-docs";

import type { BookingCopy } from "../content/BookingsDocsPage.copy";

export const bookingTypes = bookingDocTypeValues;
export const bookingStatuses = bookingDocStatusValues;
export const bookingStatusFilterValues = ["all", ...bookingStatuses] as const;
export const bookingVisibilities = bookingDocVisibilityValues;

export type BookingStatusFilter = (typeof bookingStatusFilterValues)[number];
export type BookingCopyEnumKey = keyof BookingCopy["enumLabels"];

export interface BookingSelectOption<Value extends BookingCopyEnumKey = BookingCopyEnumKey> {
  value: Value;
  label: string;
}

export function formatEnumLabel(value: BookingCopyEnumKey, copy: BookingCopy): string {
  return copy.enumLabels[value];
}

function buildBookingSelectOptions<Value extends BookingCopyEnumKey>(
  values: readonly Value[],
  copy: BookingCopy,
): BookingSelectOption<Value>[] {
  return values.map((value) => ({ value, label: formatEnumLabel(value, copy) }));
}

export function bookingTypeSelectOptions(copy: BookingCopy): BookingSelectOption<BookingDocType>[] {
  return buildBookingSelectOptions(bookingTypes, copy);
}

export function bookingStatusSelectOptions(copy: BookingCopy): BookingSelectOption<BookingDocStatus>[] {
  return buildBookingSelectOptions(bookingStatuses, copy);
}

export function bookingVisibilitySelectOptions(copy: BookingCopy): BookingSelectOption<BookingDocVisibility>[] {
  return buildBookingSelectOptions(bookingVisibilities, copy);
}
