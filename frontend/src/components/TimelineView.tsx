import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary";
import { Badge, IconButton } from "./ui";
import { Icon } from "./icons";
import { TimelineMotif } from "./motifs";
import { formatTripRange, PageHeader } from "./PageHeader";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatEndTime, formatThaiDate } from "./itineraryDisplay";

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

const timelinePanelClassName = "timeline-panel grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-[var(--color-page)] px-6 py-[22px] pb-7";
const timelineGridClassName = "timeline-grid mb-[30px] grid w-full grid-cols-3 gap-3 p-0 max-[1199px]:w-[calc(100%-24px)] max-[767px]:grid-cols-1 max-[767px]:px-0";
const timelineDayClassName = "timeline-day overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]";
const timelineDayHeaderClassName = "timeline-day-header flex min-h-[50px] items-center justify-between gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-[#0f172a] [&_span:not(.badge)]:text-[11px] [&_span:not(.badge)]:font-bold [&_span:not(.badge)]:leading-[15px] [&_span:not(.badge)]:text-[var(--color-text-muted)]";
const timelineDayHeaderCopyClassName = "grid min-w-0 gap-px";
const timelineStopListClassName = "timeline-stop-list m-0 grid list-none gap-1.5 p-0 [&_.timeline-stop:last-child_.timeline-stop-button]:border-b-0";
const timelineStopClassName = "timeline-stop relative";
const timelineStopButtonClassName = "timeline-stop-button relative z-[1] grid min-h-[86px] w-full grid-cols-[56px_34px_minmax(0,1fr)] items-start gap-2.5 border-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-left text-[var(--color-text)] transition-[background,box-shadow] duration-150 hover:bg-[var(--color-primary-soft)] focus-visible:bg-[var(--color-primary-soft)] focus-visible:outline-none max-[767px]:min-h-[82px] max-[767px]:grid-cols-[62px_32px_minmax(0,1fr)] max-[767px]:gap-2";
const selectedTimelineStopButtonClassName = "bg-[var(--color-primary-soft)] shadow-[inset_3px_0_0_var(--color-primary)]";
const timelineTimeClassName = "timeline-time col-start-1 row-span-3 grid min-w-0 gap-0.5 [&_span]:text-[11px] [&_span]:font-bold [&_span]:leading-[15px] [&_span]:tabular-nums [&_span]:text-[var(--color-text-muted)] [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:tabular-nums [&_strong]:text-[#0f172a]";
const timelineNodeClassName = "timeline-node col-start-2 row-start-1 grid size-8 place-items-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-route-soft)] text-[var(--color-route)] shadow-[0_0_0_1px_var(--color-route-border)]";
const selectedTimelineNodeClassName = "bg-[var(--color-primary)] text-white shadow-[0_0_0_1px_var(--color-primary)]";
const timelineCopyClassName = "timeline-copy col-start-3 row-start-1 grid min-w-0 gap-0.5 [&_span]:[overflow-wrap:anywhere] [&_span]:text-xs [&_span]:font-semibold [&_span]:leading-4 [&_span]:text-[var(--color-text-muted)] [&_strong]:overflow-hidden [&_strong]:whitespace-normal [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-[#0f172a] [&_strong]:text-ellipsis";
const timelineMetaClassName = "timeline-meta col-start-3 row-start-2 flex min-w-0 flex-wrap content-start gap-x-2 gap-y-1 [&_span]:text-xs [&_span]:font-semibold [&_span]:leading-4 [&_span]:text-[var(--color-text-muted)]";
const timelineWarningClassName = "timeline-warning col-start-3 row-start-3 inline-flex min-h-6 w-fit items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-extrabold leading-[15px] text-[var(--color-warning-strong)]";
const detailsToggleButtonClassName = "details-toggle-button aria-[expanded=false]:border-[var(--color-primary-border)] aria-[expanded=false]:bg-[var(--color-primary-soft)] aria-[expanded=false]:text-[var(--color-primary-strong)]";
const pageHeaderActionsClassName = "page-header-actions relative z-[1] flex max-w-[420px] min-w-0 flex-wrap items-center justify-end gap-2";

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
