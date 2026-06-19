import type { IconName } from "@/src/ui/icons";
import type { BookingDoc, BookingDocStatus, BookingDocType, Trip } from "@/src/trip/types";

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function compareBookingStartWithUndated(left: BookingDoc, right: BookingDoc): number {
  const leftTime = Number.isFinite(Date.parse(left.startsAt ?? "")) ? Date.parse(left.startsAt ?? "") : Number.POSITIVE_INFINITY;
  const rightTime = Number.isFinite(Date.parse(right.startsAt ?? "")) ? Date.parse(right.startsAt ?? "") : Number.POSITIVE_INFINITY;
  return leftTime - rightTime || left.title.localeCompare(right.title);
}

export function bookingDocMatchesQuery(doc: BookingDoc, trip: Trip, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return [
    doc.title,
    doc.providerName,
    doc.confirmationCode,
    doc.notes,
    bookingDocLinkedContext(doc, trip),
    ...doc.externalLinks.flatMap((link) => [link.label, link.url, link.provider, link.accessNote]),
    ...trip.members.filter((member) => doc.travelerIds.includes(member.id)).map((member) => member.displayName),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

export function bookingDocLinkedContext(doc: BookingDoc, trip: Trip): string {
  return doc.relatedItineraryItemIds
    .map((itemId) => trip.itineraryItems.find((item) => item.id === itemId)?.activity)
    .filter(Boolean)
    .join(", ");
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
  if (status === "cancelled" || status === "expired") return "border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)";
  return "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
}
