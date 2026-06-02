import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
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

const timelinePanelClassName = "timeline-panel grid min-h-full min-w-0 gap-3 bg-[var(--color-page)] px-6 py-[22px] pb-7";
const timelineGridClassName = "timeline-grid grid w-full grid-cols-3 gap-3 p-0 mb-[30px]";
const timelineDayClassName = "timeline-day overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]";
const timelineDayHeaderClassName = "timeline-day-header flex min-h-[50px] items-center justify-between gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5";
const timelineDayHeaderCopyClassName = "grid min-w-0 gap-px";
const timelineStopListClassName = "timeline-stop-list grid m-0 list-none gap-1.5 p-0";
const timelineStopClassName = "timeline-stop relative";
const timelineStopButtonClassName = "timeline-stop-button relative z-[1] grid min-h-[86px] w-full grid-cols-[56px_34px_minmax(0,1fr)] items-start gap-2.5 border-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-left text-[var(--color-text)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-primary-soft)] focus-visible:bg-[var(--color-primary-soft)] focus-visible:outline-none";
const timelineTimeClassName = "timeline-time col-start-1 row-span-3 grid min-w-0 gap-0.5";
const timelineNodeClassName = "timeline-node col-start-2 row-start-1 grid size-8 place-items-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-route-soft)] text-[var(--color-route)] shadow-[0_0_0_1px_var(--color-route-border)]";
const timelineCopyClassName = "timeline-copy col-start-3 row-start-1 grid min-w-0 gap-0.5";
const timelineMetaClassName = "timeline-meta col-start-3 row-start-2 flex min-w-0 flex-wrap content-start gap-x-2 gap-y-1";
const timelineWarningClassName = "timeline-warning col-start-3 row-start-3 inline-flex min-h-6 w-fit items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-warning-border)] px-2 py-0.5";

export function TimelineView({ contextRailOpen, endDate, items, selectedItemId, startDate, tripName, onSelectItem, onToggleContextRail }: TimelineViewProps) {
  const { locale, t } = useI18n();
  const groups = groupItemsByDay(items);
  const warningCount = items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
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
                      className={timelineStopButtonClassName}
                      aria-label={t.timeline.selectStop({ activity: item.activity })}
                      aria-pressed={selected}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <span className={timelineTimeClassName}>
                        <strong>{timelineStartTime(item)}</strong>
                        <span>{formatEndTime(item.startTime, item.durationMinutes)}</span>
                      </span>
                      <span className={timelineNodeClassName} aria-hidden="true">
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
