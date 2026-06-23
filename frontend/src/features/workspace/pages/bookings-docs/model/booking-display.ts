import type { IconName } from "@/src/ui/icons";
import type { BookingDocStatus, BookingDocType } from "@/src/trip/types";
import { formatOptionalDisplayDateTime } from "@/src/shared/date-time-display";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";

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

export function bookingTypeIcon(type: BookingDocType): IconName {
  if (type === "flight" || type === "train" || type === "public_transport") return "route";
  if (type === "hotel") return "home";
  if (type === "activity_ticket") return "ticket";
  if (type === "passport" || type === "visa" || type === "insurance") return "document";
  return "ticket";
}

export function typeIconClassName(type: BookingDocType): string {
  if (type === "flight" || type === "train" || type === "public_transport") return "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
  if (type === "hotel") return "border-(--color-success-border) bg-(--color-success-soft) text-(--color-success-strong)";
  if (type === "activity_ticket") return "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
  if (type === "passport" || type === "visa" || type === "insurance") return "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)";
  return "border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted)";
}

export function statusBadgeClassName(status: BookingDocStatus): string {
  if (status === "needs_action") return "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
  if (status === "paid" || status === "confirmed") return "border-(--color-success-border) bg-(--color-success-soft) text-(--color-success-strong)";
  if (status === "cancelled" || status === "expired") return "border-(--color-danger-border) bg-(--color-danger-soft) text-[#b91c1c]";
  return "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
}
