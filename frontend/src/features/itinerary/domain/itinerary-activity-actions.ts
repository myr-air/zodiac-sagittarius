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
  note?: string,
): string {
  const hasNote = note && note.trim().length > 0;
  return locale === "th"
    ? hasNote
      ? `ดูโน้ต ${item.activity}`
      : `เพิ่มโน้ต ${item.activity}`
    : hasNote
      ? `View note for ${item.activity}`
      : `Add note for ${item.activity}`;
}

export function activityMapActionLabel(
  item: ActivityActionItem,
  mapFallback: string,
): string {
  return `${mapFallback}: ${item.place || item.activity}`;
}

export function activityBlockToggleLabel(
  item: Pick<ItineraryItem, "activity">,
  locale: Locale,
  isPlanBlock: boolean,
): string {
  return locale === "th"
    ? isPlanBlock
      ? `เลิก activity block ${item.activity}`
      : `เปลี่ยน ${item.activity} เป็น activity block`
    : isPlanBlock
      ? `Undo activity block for ${item.activity}`
      : `Convert ${item.activity} to activity block`;
}
