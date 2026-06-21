import {
  bookingDocStatusValues,
  bookingDocTypeValues,
  bookingDocVisibilityValues,
} from "@/src/trip/booking-docs";

import type { BookingCopy } from "../content/BookingsDocsPage.copy";

export const bookingTypes = bookingDocTypeValues;
export const bookingStatuses = bookingDocStatusValues;
export const bookingStatusFilterValues = ["all", ...bookingStatuses] as const;
export const bookingVisibilities = bookingDocVisibilityValues;

export type BookingStatusFilter = (typeof bookingStatusFilterValues)[number];
export type BookingCopyEnumKey = keyof BookingCopy["enumLabels"];

export function formatEnumLabel(value: BookingCopyEnumKey, copy: BookingCopy): string {
  return copy.enumLabels[value];
}
