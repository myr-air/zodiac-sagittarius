import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import { ItineraryHeaderMeta } from "../ItineraryHeaderMeta";

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
  subActivitiesCount: number;
  flexibleItemsCount: number;
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
  subActivitiesCount,
  flexibleItemsCount,
}: SmartItineraryTableMetaProps) {
  return (
    <ItineraryHeaderMeta
      daysCount={groupsCount}
      endDate={endDate}
      itemsCount={itemsCount}
      locale={locale}
      startDate={startDate}
      tDates={tDates}
      tItinerary={tItinerary}
      totalMinutes={totalMinutes}
      warningCount={warningCount}
      subActivitiesCount={subActivitiesCount}
      flexibleItemsCount={flexibleItemsCount}
    />
  );
}
