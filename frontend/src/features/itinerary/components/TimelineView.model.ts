import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import {
  groupItemsByDay,
  type ItineraryView,
} from "@/src/trip/itinerary-core";
import { dayRouteLabel } from "@/src/features/itinerary/lib/itinerary-display";

export interface TimelineViewModel {
  groups: ReturnType<typeof groupItemsByDay>;
  primaryRoute: string;
  totalMinutes: number;
  warningCount: number;
}

export function buildTimelineViewModel({
  items,
  itineraryView,
  locale,
}: {
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  locale: Locale;
}): TimelineViewModel {
  const groups = itineraryView?.dayGroups ?? groupItemsByDay(items);
  return {
    groups,
    primaryRoute: groups
      .map((group) => dayRouteLabel(group.day, locale, group.items))
      .join(" / "),
    totalMinutes: items.reduce(
      (total, item) => total + (item.durationMinutes ?? 0),
      0,
    ),
    warningCount:
      itineraryView?.warningCount ??
      items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0),
  };
}

export function timelineStartTime(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.startTime || "—";
}
