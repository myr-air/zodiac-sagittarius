import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";

type ActivityActionItem = Pick<ItineraryItem, "activity" | "place">;

export function activityActionMenuLabel(
  item: Pick<ItineraryItem, "activity">,
  locale: Locale,
): string {
  return locale === "th"
    ? `จัดการกิจกรรม ${item.activity}`
    : `Activity actions for ${item.activity}`;
}

export function activityNoteActionLabel(
  item: Pick<ItineraryItem, "activity">,
  locale: Locale,
): string {
  return locale === "th"
    ? `เพิ่มโน้ต ${item.activity}`
    : `Add note for ${item.activity}`;
}

export function activityMapActionLabel(
  item: ActivityActionItem,
  mapFallback: string,
): string {
  return `${mapFallback}: ${item.place || item.activity}`;
}
