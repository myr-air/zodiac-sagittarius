import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import { PageHeaderTripDateMetaItem } from "@/src/shared/components/page-header";
import { Icon } from "@/src/ui/icons";
import { formatDuration } from "@/src/features/itinerary/lib/itinerary-display";

export interface ItineraryHeaderMetaProps {
  daysCount: number;
  endDate: string;
  itemsCount: number;
  locale: Locale;
  startDate: string;
  tDates: Messages["dates"];
  tItinerary: Pick<
    Messages["itinerary"],
    "dayItems" | "subActivitiesCount" | "flexibleItemsCount"
  >;
  totalMinutes: number;
  warningCount: number;
  subActivitiesCount?: number;
  flexibleItemsCount?: number;
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
  subActivitiesCount,
  flexibleItemsCount,
}: ItineraryHeaderMetaProps) {
  return (
    <>
      <PageHeaderTripDateMetaItem startDate={startDate} endDate={endDate} locale={locale} />
      <span>
        <Icon name="route" />{" "}
        {tItinerary.dayItems({ days: daysCount, stops: itemsCount })}
      </span>
      {subActivitiesCount ? (
        <span>{tItinerary.subActivitiesCount({ count: subActivitiesCount })}</span>
      ) : null}
      {flexibleItemsCount ? (
        <span>{tItinerary.flexibleItemsCount({ count: flexibleItemsCount })}</span>
      ) : null}
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
