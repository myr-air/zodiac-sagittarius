import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import { overviewNextStopClassName } from "./overview.styles";
import { cn } from "@/src/lib/cn";
import { OverviewPanelTitle } from "./OverviewPanelTitle";
import { OverviewFocusList } from "./OverviewSections";
import { overviewPanelClassName, overviewPanelWideClassName } from "./overview-page.styles";
import { formatOverviewStopScheduleWithPlace } from "@/src/features/itinerary/domain/overview-stop-labels";
import { TripCompletedPostcard } from "./TripCompletedPostcard";

interface OverviewFocusSectionProps {
  ariaLabel: string;
  heading: string;
  trip: Trip;
  items: ItineraryItem[];
  nextStop: ItineraryItem | undefined;
  nextDayItems: ItineraryItem[];
  startDate: string;
  locale: Locale;
  groupSpendLabel: string;
  isCompleted: boolean;
  focusListLabel: string;
  detailFallback: string;
  emptyText: string;
}

export function OverviewFocusSection({
  ariaLabel,
  heading,
  trip,
  items,
  nextStop,
  nextDayItems,
  startDate,
  locale,
  groupSpendLabel,
  isCompleted,
  focusListLabel,
  detailFallback,
  emptyText,
}: OverviewFocusSectionProps) {
  return (
    <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={ariaLabel}>
      <OverviewPanelTitle icon="route" title={heading} />

      {isCompleted ? (
        <TripCompletedPostcard trip={trip} items={items} groupSpendLabel={groupSpendLabel} locale={locale} />
      ) : (
        <>
          {nextStop ? (
            <div className={overviewNextStopClassName}>
              <strong>{nextStop.activity}</strong>
              <span>{formatOverviewStopScheduleWithPlace(nextStop, startDate, locale)}</span>
              <p>{detailFallback}</p>
            </div>
          ) : (
            <p className="overview-muted text-xs font-bold text-(--color-text-muted)">{emptyText}</p>
          )}
          <OverviewFocusList items={nextDayItems} startDate={startDate} locale={locale} label={focusListLabel} />
        </>
      )}
    </section>
  );
}
