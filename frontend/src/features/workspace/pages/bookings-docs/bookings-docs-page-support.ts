import type { IconName } from "@/src/ui/icons";
import type { BookingDoc, BookingDocStatus, BookingDocType, Trip } from "@/src/trip/types";

export type BookingFolderId = "all" | "needs_action" | "transport" | "stays" | "tickets" | "travel_docs" | "external_links";

export const bookingFolders: Array<{
  id: BookingFolderId;
  icon: IconName;
  types?: BookingDocType[];
  status?: BookingDocStatus;
}> = [
  { id: "all", icon: "layout" },
  { id: "needs_action", icon: "warning", status: "needs_action" },
  { id: "transport", icon: "route", types: ["flight", "train", "public_transport"] },
  { id: "stays", icon: "home", types: ["hotel"] },
  { id: "tickets", icon: "ticket", types: ["activity_ticket"] },
  { id: "travel_docs", icon: "document", types: ["passport", "visa", "insurance"] },
  { id: "external_links", icon: "cloud" },
];

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function countBookingFolders(docs: BookingDoc[]): Record<BookingFolderId, number> {
  return bookingFolders.reduce((counts, folder) => {
    counts[folder.id] = docs.filter((doc) => bookingDocMatchesFolder(doc, folder.id)).length;
    return counts;
  }, {} as Record<BookingFolderId, number>);
}

export function bookingDocMatchesFolder(doc: BookingDoc, folderId: BookingFolderId): boolean {
  const folder = bookingFolders.find((candidate) => candidate.id === folderId);
  if (!folder || folder.id === "all") return true;
  if (folder.id === "external_links") return doc.externalLinks.length > 0;
  if (folder.status) return doc.status === folder.status;
  return folder.types?.includes(doc.type) ?? true;
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
