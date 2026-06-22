import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import { formatTripRange } from "@/src/shared/components/page-header";
import { Icon } from "@/src/ui/icons";
import { formatDuration } from "@/src/features/itinerary/lib/itinerary-display";

export interface ItineraryHeaderMetaProps {
  daysCount: number;
  endDate: string;
  itemsCount: number;
  locale: Locale;
  startDate: string;
  tDates: Messages["dates"];
  tItinerary: Pick<Messages["itinerary"], "dayItems">;
  totalMinutes: number;
  warningCount: number;
}

export function ItineraryHeaderMeta({
  daysCount,
  endDate,
  itemsCount,
  locale,
  startDate,
  tDates,
  tItinerary,
  totalMinutes,
  warningCount,
}: ItineraryHeaderMetaProps) {
  return (
    <>
      <span>
        <Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}
      </span>
      <span>
        <Icon name="route" />{" "}
        {tItinerary.dayItems({ days: daysCount, stops: itemsCount })}
      </span>
      <span>
        <Icon name="warning" /> {tDates.warningCount({ count: warningCount })}
      </span>
      <span>
        <Icon name="clock" /> {formatDuration(totalMinutes, locale)}{" "}
        {tDates.planned}
      </span>
    </>
  );
}
