import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import { Badge } from "./ui";
import { Icon } from "./icons";
import { TimelineMotif } from "./motifs";
import { formatTripRange, PageHeader } from "./PageHeader";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatEndTime, formatThaiDate } from "./itineraryDisplay";

interface TimelineViewProps {
  contextRailOpen: boolean;
  endDate: string;
  items: ItineraryItem[];
  selectedItemId: string;
  startDate: string;
  tripName: string;
  onSelectItem: (itemId: string) => void;
  onToggleContextRail: () => void;
}

export function TimelineView({ contextRailOpen, endDate, items, selectedItemId, startDate, tripName, onSelectItem, onToggleContextRail }: TimelineViewProps) {
  const { locale, t } = useI18n();
  const groups = groupItemsByDay(items);
  const warningCount = items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const primaryRoute = groups.map((group) => dayRouteLabel(group.day, locale)).join(" / ");

  return (
    <section className="timeline-panel" id="timeline" aria-labelledby="timeline-heading" aria-label={t.timeline.pageLabel}>
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
          <div className="page-header-actions" role="group" aria-label={t.timeline.actionsLabel}>
            <button
              className="icon-button details-toggle-button"
              type="button"
              aria-expanded={contextRailOpen}
              aria-label={contextRailOpen ? t.itinerary.hideDetails : t.itinerary.openDetails}
              onClick={onToggleContextRail}
              title={contextRailOpen ? t.itinerary.hideDetails : t.itinerary.openDetails}
            >
              <Icon name="panel" />
            </button>
          </div>
        )}
      />

      <div className="timeline-grid">
        {groups.map((group) => (
          <article className="timeline-day" key={group.day}>
            <header className="timeline-day-header">
              <div>
                <strong>{formatDayLabel(group.day, startDate)}</strong>
                <span>{formatThaiDate(group.day, locale)}</span>
              </div>
              <Badge tone="route">{dayRouteLabel(group.day, locale)}</Badge>
            </header>

            <ol className="timeline-stop-list">
              {group.items.map((item) => {
                const selected = item.id === selectedItemId;
                return (
                  <li className={selected ? "timeline-stop timeline-stop--selected" : "timeline-stop"} key={item.id}>
                    <button
                      type="button"
                      className="timeline-stop-button"
                      aria-label={t.timeline.selectStop({ activity: item.activity })}
                      aria-pressed={selected}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <span className="timeline-time">
                        <strong>{timelineStartTime(item)}</strong>
                        <span>{formatEndTime(item.startTime, item.durationMinutes)}</span>
                      </span>
                      <span className="timeline-node" aria-hidden="true">
                        <Icon name={item.activityType === "travel" ? "route" : "location"} />
                      </span>
                      <span className="timeline-copy">
                        <strong>{item.activity}</strong>
                        <span>{item.place}</span>
                      </span>
                      <span className="timeline-meta">
                        <span>{activityTypeLabel(item.activityType, locale)}</span>
                        <span>{formatDuration(item.durationMinutes, locale)}</span>
                        {item.transportation ? <span>{item.transportation}</span> : null}
                      </span>
                      {item.advisories?.length ? (
                        <span className="timeline-warning">
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
