import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import { Icon } from "@/src/ui/icons";
import { formatTripRange } from "@/src/shared/components/page-header";
import { formatDuration } from "@/src/features/itinerary/lib";

interface SmartItineraryTableMetaProps {
  groupsCount: number;
  locale: Locale;
  itemsCount: number;
  startDate: string;
  endDate: string;
  tItinerary: Messages["itinerary"];
  tDates: Messages["dates"];
  totalMinutes: number;
  warningCount: number;
}

export function SmartItineraryTableMeta({
  groupsCount,
  itemsCount,
  locale,
  startDate,
  endDate,
  tItinerary,
  tDates,
  totalMinutes,
  warningCount,
}: SmartItineraryTableMetaProps) {
  return (
    <>
      <span>
        <Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}
      </span>
      <span>
        <Icon name="route" /> {tItinerary.dayItems({ days: groupsCount, stops: itemsCount })}
      </span>
      <span>
        <Icon name="warning" /> {tDates.warningCount({ count: warningCount })}
      </span>
      <span>
        <Icon name="clock" /> {formatDuration(totalMinutes, locale)} {tDates.planned}
      </span>
    </>
  );
}
