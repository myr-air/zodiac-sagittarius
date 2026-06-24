import {
  bookingDocStatusValues,
  bookingDocTypeValues,
  bookingDocVisibilityValues,
  type BookingDocStatus,
  type BookingDocType,
  type BookingDocVisibility,
} from "@/src/trip/booking-docs";
import {
  buildAllFilterSelectOptions,
  buildSelectOptions,
  type SelectOption,
  withAllFilterValue,
} from "@/src/shared/select-options";

import type { BookingCopy } from "../content/BookingsDocsPage.copy";

export const bookingStatusFilterValues = withAllFilterValue(bookingDocStatusValues);

export type BookingStatusFilter = (typeof bookingStatusFilterValues)[number];
export type BookingCopyEnumKey = keyof BookingCopy["enumLabels"];
export type BookingSelectOption<Value extends BookingCopyEnumKey = BookingCopyEnumKey> = SelectOption<Value>;

export function formatEnumLabel(value: BookingCopyEnumKey, copy: BookingCopy): string {
  return copy.enumLabels[value];
}

function buildBookingSelectOptions<Value extends BookingCopyEnumKey>(
  values: readonly Value[],
  copy: BookingCopy,
): BookingSelectOption<Value>[] {
  return buildSelectOptions(values, (value) => formatEnumLabel(value, copy));
}

export function bookingTypeSelectOptions(copy: BookingCopy): BookingSelectOption<BookingDocType>[] {
  return buildBookingSelectOptions(bookingDocTypeValues, copy);
}

export function bookingStatusSelectOptions(copy: BookingCopy): BookingSelectOption<BookingDocStatus>[] {
  return buildBookingSelectOptions(bookingDocStatusValues, copy);
}

export function bookingStatusFilterSelectOptions(
  copy: BookingCopy,
): SelectOption<BookingStatusFilter>[] {
  return buildAllFilterSelectOptions(
    bookingStatusFilterValues,
    copy.allStatuses,
    (value) => formatEnumLabel(value, copy),
  );
}

export function bookingVisibilitySelectOptions(copy: BookingCopy): BookingSelectOption<BookingDocVisibility>[] {
  return buildBookingSelectOptions(bookingDocVisibilityValues, copy);
}
