import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary-core";
import { Badge, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { TimelineMotif } from "@/src/shared/components/travel-motifs";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import {
  activityTypeLabel,
  dayRouteLabel,
  formatDuration,
  formatEndTime,
  formatThaiDate,
} from "@/src/features/itinerary/lib/itinerary-display";
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

interface TimelineViewProps {
  contextRailOpen: boolean;
  endDate: string;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  selectedItemId: string;
  startDate: string;
  tripName: string;
  onSelectItem: (itemId: string) => void;
  onToggleContextRail: () => void;
}

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
  const groups = itineraryView?.dayGroups ?? groupItemsByDay(items);
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const primaryRoute = groups.map((group) => dayRouteLabel(group.day, locale)).join(" / ");

  return (
    <section className={timelinePanelClassName} id="timeline" aria-labelledby="timeline-heading" aria-label={t.timeline.pageLabel}>
      <PageHeader
        title={t.timeline.title}
        subtitle={tripName}
        description={primaryRoute}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
            <span><Icon name="route" /> {t.timeline.dayItems({ days: groups.length, stops: items.length })}</span>
            <span><Icon name="warning" /> {t.dates.warningCount({ count: warningCount })}</span>
            <span><Icon name="clock" /> {formatDuration(totalMinutes, locale)} {t.dates.planned}</span>
          </>
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
              <Badge tone="route">{dayRouteLabel(group.day, locale)}</Badge>
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

function timelineStartTime(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.startTime || "—";
}
