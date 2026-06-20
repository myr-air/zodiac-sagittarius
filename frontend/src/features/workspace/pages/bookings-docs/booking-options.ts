import type { BookingDocStatus, BookingDocType, BookingDocVisibility } from "@/src/trip/types";

import type { BookingCopy } from "./BookingsDocsPage.copy";

export const bookingTypes = ["flight", "train", "public_transport", "hotel", "insurance", "passport", "visa", "activity_ticket", "other"] satisfies BookingDocType[];
export const bookingStatuses = ["draft", "needs_action", "booked", "confirmed", "paid", "cancelled", "expired"] satisfies BookingDocStatus[];
export const bookingVisibilities = ["shared", "sensitive", "private"] satisfies BookingDocVisibility[];

export type BookingCopyEnumKey = keyof BookingCopy["enumLabels"];

export function formatEnumLabel(value: BookingCopyEnumKey, copy: BookingCopy): string {
  return copy.enumLabels[value];
}
