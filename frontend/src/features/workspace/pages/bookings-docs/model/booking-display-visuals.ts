import type { BookingDocStatus, BookingDocType } from "@/src/trip/types";
import type { IconName } from "@/src/ui/icons";

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
