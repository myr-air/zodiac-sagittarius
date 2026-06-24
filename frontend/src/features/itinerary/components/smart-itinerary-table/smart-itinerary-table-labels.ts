import type { Locale } from "@/src/i18n/types";
import {
  completeItineraryPathOptions,
  type ItineraryPathOption,
} from "@/src/trip/itinerary-paths";
import type { ItineraryItem } from "@/src/trip/types";

export function itemStatusLabel(
  status: NonNullable<ItineraryItem["status"]>,
  locale: Locale,
): string {
  const labels: Record<Locale, Record<NonNullable<ItineraryItem["status"]>, string>> = {
    en: {
      idea: "Idea",
      planned: "Planned",
      booked: "Booked",
      confirmed: "Confirmed",
      done: "Done",
      skipped: "Skipped",
    },
    th: {
      idea: "ไอเดีย",
      planned: "วางแผนแล้ว",
      booked: "จองแล้ว",
      confirmed: "ยืนยันแล้ว",
      done: "เสร็จแล้ว",
      skipped: "ข้าม",
    },
  };

  return labels[locale][status];
}

export function dedupePathOptions(
  pathOptions: ItineraryPathOption[],
  items: ItineraryItem[],
): { id: string; name: string }[] {
  return completeItineraryPathOptions(pathOptions, items).map(({ id, name }) => ({
    id,
    name,
  }));
}

export function formatSelectedPlanLabel(
  filterOptions: { id: string; name: string }[],
  selectedPathIds: string[],
  countLabel: ({ count }: { count: number }) => string,
  namesLabel: ({ names }: { names: string }) => string,
): string {
  const selectedNames = filterOptions
    .filter((option) => selectedPathIds.includes(option.id))
    .map((option) => option.name);
  if (selectedNames.length === 0) return countLabel({ count: 0 });
  if (selectedNames.length <= 2)
    return namesLabel({ names: selectedNames.join(", ") });
  return namesLabel({
    names: `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2}`,
  });
}
