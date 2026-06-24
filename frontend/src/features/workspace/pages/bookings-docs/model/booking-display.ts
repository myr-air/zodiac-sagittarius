import { formatOptionalDisplayDateTime } from "@/src/shared/date-time-display";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";

export {
  bookingTypeIcon,
  statusBadgeClassName,
  typeIconClassName,
} from "./booking-display-visuals";

export function formatDateTime(value: string | null | undefined): string {
  return formatOptionalDisplayDateTime({
    emptyValue: "-",
    invalidValue: (input) => input.slice(0, 10),
    locale: "en-US",
    options: { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
    value,
  });
}

export function bookingDateDisplay(
  value: string | null | undefined,
  copy: Pick<BookingCopy, "noDate">,
): string {
  return value ? formatDateTime(value) : copy.noDate;
}

export function bookingProviderDisplay(
  providerName: string | null | undefined,
  copy: Pick<BookingCopy, "noProvider">,
): string {
  return providerName ?? copy.noProvider;
}

export function bookingConfirmationDisplay(
  confirmationCode: string | null | undefined,
  copy: Pick<BookingCopy, "confirmation" | "noConfirmation">,
): string {
  return confirmationCode ? `${copy.confirmation}: ${confirmationCode}` : copy.noConfirmation;
}

export function bookingLinkedContextDisplay(
  linkedContext: string,
  copy: Pick<BookingCopy, "noLinkedStop">,
): string {
  return linkedContext || copy.noLinkedStop;
}

export function bookingNotesDisplay(
  notes: string | null | undefined,
  copy: Pick<BookingCopy, "noNotes">,
): string {
  return notes ?? copy.noNotes;
}

export function bookingTravelerNamesDisplay(
  travelers: readonly { displayName: string }[],
  copy: Pick<BookingCopy, "noTravelers">,
): string {
  return travelers.map((member) => member.displayName).join(", ") || copy.noTravelers;
}
