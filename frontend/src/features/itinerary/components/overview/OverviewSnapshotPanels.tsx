import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import { OverviewPanelTitle } from "./OverviewPanelTitle";
import { OverviewStopList, ViewerNextStopPanel } from "./OverviewSections";
import {
  overviewPanelClassName,
  overviewPanelWideClassName,
} from "./overview-page.styles";

interface OverviewHighlightsPanelProps {
  ariaLabel: string;
  emptyMessage: string;
  items: ItineraryItem[];
  locale: Locale;
  startDate: string;
  title: string;
}

export function OverviewHighlightsPanel({
  ariaLabel,
  emptyMessage,
  items,
  locale,
  startDate,
  title,
}: OverviewHighlightsPanelProps) {
  return (
    <section className={`${overviewPanelClassName} ${overviewPanelWideClassName}`} aria-label={ariaLabel}>
      <OverviewPanelTitle icon="location" title={title} />
      <OverviewStopList items={items} startDate={startDate} locale={locale} emptyMessage={emptyMessage} />
    </section>
  );
}

interface ViewerNextStopSectionProps {
  ariaLabel: string;
  detailFallback: string;
  emptyMessage: string;
  item: ItineraryItem | undefined;
  locale: Locale;
  startDate: string;
  title: string;
}

export function ViewerNextStopSection({
  ariaLabel,
  detailFallback,
  emptyMessage,
  item,
  locale,
  startDate,
  title,
}: ViewerNextStopSectionProps) {
  return (
    <section className={overviewPanelClassName} aria-label={ariaLabel}>
      <OverviewPanelTitle icon="route" title={title} />
      <ViewerNextStopPanel
        item={item}
        startDate={startDate}
        locale={locale}
        emptyMessage={emptyMessage}
        detailFallback={detailFallback}
      />
    </section>
  );
}
