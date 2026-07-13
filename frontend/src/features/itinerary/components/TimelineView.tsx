import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel } from "@/src/trip/itinerary-core";
import { Badge, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { TimelineMotif } from "@/src/shared/components/travel-motifs";
import { PageHeader } from "@/src/shared/components/page-header";
import {
  activityTypeLabel,
  dayRouteLabel,
  formatDuration,
  formatEndTime,
  formatThaiDate,
} from "@/src/features/itinerary/lib/itinerary-display";
import { ItineraryHeaderMeta } from "./ItineraryHeaderMeta";
import {
  buildTimelineViewModel,
  timelineStartTime,
} from "./TimelineView.model";
import {
  detailsToggleButtonClassName,
  pageHeaderActionsClassName,
  selectedTimelineNodeClassName,
  selectedTimelineStopButtonClassName,
  timelineCopyClassName,
  timelineDayClassName,
  timelineDayHeaderClassName,
  timelineDayHeaderCopyClassName,
  timelineGridClassName,
  timelineMetaClassName,
  timelineNodeClassName,
  timelinePanelClassName,
  timelineStopButtonClassName,
  timelineStopClassName,
  timelineStopListClassName,
  timelineTimeClassName,
  timelineWarningClassName,
} from "./TimelineView.styles";
import type { TimelineViewProps } from "./TimelineView.types";

export type { TimelineViewProps } from "./TimelineView.types";

export function TimelineView({
  contextRailOpen,
  endDate,
  items,
  itineraryView,
  selectedItemId,
  startDate,
  tripName,
  onSelectItem,
  onToggleContextRail,
}: TimelineViewProps) {
  const { locale, t } = useI18n();
  const { groups, primaryRoute, totalMinutes, warningCount } =
    buildTimelineViewModel({
      items,
      itineraryView,
      locale,
    });

  return (
    <section className={timelinePanelClassName} id="timeline" aria-labelledby="timeline-heading" aria-label={t.timeline.pageLabel}>
      <PageHeader
        title={t.timeline.title}
        subtitle={tripName}
        description={primaryRoute}
        meta={(
          <ItineraryHeaderMeta
            daysCount={groups.length}
            endDate={endDate}
            itemsCount={items.length}
            locale={locale}
            startDate={startDate}
            tDates={t.dates}
            tItinerary={t.itinerary}
            totalMinutes={totalMinutes}
            warningCount={warningCount}
          />
        )}
        motif={<TimelineMotif />}
        aside={(
          <div className={pageHeaderActionsClassName} role="group" aria-label={t.timeline.actionsLabel}>
            <IconButton
              className={detailsToggleButtonClassName}
              type="button"
              aria-expanded={contextRailOpen}
              aria-label={contextRailOpen ? t.itinerary.hideDetails : t.itinerary.openDetails}
              onClick={onToggleContextRail}
              title={contextRailOpen ? t.itinerary.hideDetails : t.itinerary.openDetails}
            >
              <Icon name="panel" />
            </IconButton>
          </div>
        )}
      />

      <div className={timelineGridClassName}>
        {groups.map((group) => (
          <article className={timelineDayClassName} key={group.day}>
            <header className={timelineDayHeaderClassName}>
              <div className={timelineDayHeaderCopyClassName}>
                <strong>{formatDayLabel(group.day, startDate, locale)}</strong>
                <span>{formatThaiDate(group.day, locale)}</span>
              </div>
              <Badge tone="route">{dayRouteLabel(group.day, locale, group.items)}</Badge>
            </header>

            <ol className={timelineStopListClassName}>
              {group.items.map((item) => {
                const selected = item.id === selectedItemId;
                return (
                  <li className={cn(timelineStopClassName, selected && "timeline-stop--selected")} key={item.id}>
                    <button
                      type="button"
                      className={cn(timelineStopButtonClassName, selected && selectedTimelineStopButtonClassName)}
                      aria-label={t.timeline.selectStop({ activity: item.activity })}
                      aria-pressed={selected}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <span className={timelineTimeClassName}>
                        <strong>{timelineStartTime(item)}</strong>
                        <span>{formatEndTime(item.startTime, item.durationMinutes)}</span>
                      </span>
                      <span className={cn(timelineNodeClassName, selected && selectedTimelineNodeClassName)} aria-hidden="true">
                        <Icon name={item.activityType === "travel" ? "route" : "location"} />
                      </span>
                      <span className={timelineCopyClassName}>
                        <strong>{item.activity}</strong>
                        <span>{item.place}</span>
                      </span>
                      <span className={timelineMetaClassName}>
                        <span>{activityTypeLabel(item.activityType, locale)}</span>
                        <span>{formatDuration(item.durationMinutes, locale)}</span>
                        {item.transportation ? <span>{item.transportation}</span> : null}
                      </span>
                      {item.advisories?.length ? (
                        <span className={timelineWarningClassName}>
                          <Icon name="warning" />
                          {item.advisories[0]?.label}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
