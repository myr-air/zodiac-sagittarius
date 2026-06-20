import { enBookingCopy } from "./BookingsDocsPage.copy.en";
import { thBookingCopy } from "./BookingsDocsPage.copy.th";

export const bookingCopy = {
  en: enBookingCopy,
  th: thBookingCopy,
} as const;

export type BookingCopy = (typeof bookingCopy)[keyof typeof bookingCopy];
