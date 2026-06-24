import type { Locale } from "@/src/i18n/types";
import { PageHeaderTripDateMetaItem } from "@/src/shared/components/page-header";
import { Icon } from "@/src/ui/icons";
import {
  activeDayLabel,
  type DayFilter,
  type RouteDayGroup,
} from "@/src/features/itinerary/domain/route-map-model";
import type { Messages } from "@/src/i18n/messages";

export interface RouteMapHeaderMetaProps {
  activeDay: DayFilter;
  copy: Pick<Messages["map"], "allDays" | "chooseDay" | "locationStatus">;
  endDate: string;
  itemsCount: number;
  locale: Locale;
  mappedCount: number;
  routeDayGroups: RouteDayGroup[];
  startDate: string;
  unresolvedCount: number;
  warningCount: number;
  warningCountLabel: Messages["dates"]["warningCount"];
}

export function RouteMapHeaderMeta({
  activeDay,
  copy,
  endDate,
  itemsCount,
  locale,
  mappedCount,
  routeDayGroups,
  startDate,
  unresolvedCount,
  warningCount,
  warningCountLabel,
}: RouteMapHeaderMetaProps) {
  return (
    <>
      <PageHeaderTripDateMetaItem startDate={startDate} endDate={endDate} locale={locale} />
      <span>
        <Icon name="location" />{" "}
        {copy.locationStatus({
          mapped: mappedCount,
          total: itemsCount,
          unresolved: unresolvedCount,
        })}
      </span>
      <span>
        <Icon name="warning" /> {warningCountLabel({ count: warningCount })}
      </span>
      <span>
        <Icon name="route" />{" "}
        {activeDayLabel(activeDay, routeDayGroups, copy.allDays, copy.chooseDay)}
      </span>
    </>
  );
}
