import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { viewerNextStopDetail } from "@/src/features/itinerary/domain/overview";
import {
  overviewFocusListClassName,
  overviewMutedClassName,
  overviewNextStopClassName,
  overviewStopListClassName,
} from "./overview.styles";
import {
  formatOverviewStopSchedule,
  formatOverviewStopScheduleWithPlace,
} from "@/src/features/itinerary/domain/overview-stop-labels";

export function ViewerNextStopPanel({
  item,
  startDate,
  locale,
  emptyMessage,
  detailFallback,
}: {
  item: ItineraryItem | undefined;
  startDate: string;
  locale: Locale;
  emptyMessage: string;
  detailFallback: string;
}) {
  /* v8 ignore next */
  return item ? (
    <div className={overviewNextStopClassName}>
      <strong>{item.activity}</strong>
      <span>{formatOverviewStopScheduleWithPlace(item, startDate, locale)}</span>
      <p>{viewerNextStopDetail(item, detailFallback)}</p>
    </div>
  ) : (
    <p className={overviewMutedClassName}>{emptyMessage}</p>
  );
}

export function OverviewStopList({ items, startDate, locale, emptyMessage }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string }) {
  if (!items.length) return <p className={overviewMutedClassName}>{emptyMessage}</p>;

  return (
    <ul className={overviewStopListClassName}>
      {items.map((item) => (
        <li key={item.id}>
          <span>{formatOverviewStopSchedule(item, startDate, locale)}</span>
          <strong>{item.activity}</strong>
          <small>{item.place}</small>
        </li>
      ))}
    </ul>
  );
}

export function OverviewFocusList({ items, startDate, locale, label }: { items: ItineraryItem[]; startDate: string; locale: Locale; label: string }) {
  if (items.length <= 1) return null;

  return (
    <ul className={overviewFocusListClassName} aria-label={label}>
      {items.slice(1).map((item) => (
        <li key={item.id}>
          <span>{formatOverviewStopSchedule(item, startDate, locale)}</span>
          <strong>{item.activity}</strong>
        </li>
      ))}
    </ul>
  );
}
