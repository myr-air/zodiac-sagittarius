import type { BookingDocType } from "./booking-doc-types";

export interface BookingItemClassificationInput {
  activitySubtype?: string | null;
  activityType?: string | null;
  itemKind?: string | null;
}

export function bookingTypeForItemClassification(
  item: BookingItemClassificationInput,
): BookingDocType {
  if (item.activitySubtype === "flight") return "flight";
  if (item.activitySubtype === "train") return "train";
  if (item.activityType === "travel" || item.itemKind === "travel") return "public_transport";
  if (item.activityType === "stay" || item.itemKind === "lodging") return "hotel";
  if (
    item.activityType === "attraction" ||
    item.activityType === "experience" ||
    item.itemKind === "activity"
  ) {
    return "activity_ticket";
  }
  return "other";
}
