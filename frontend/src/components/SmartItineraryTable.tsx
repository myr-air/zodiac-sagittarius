import { useState, type DragEvent } from "react";
import type { ItineraryAdvisory, ItineraryItem, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import { Button, IconButton } from "./ui";
import { Icon } from "./icons";
import { formatTripRange, PageHeader } from "./PageHeader";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatThaiDate } from "./itineraryDisplay";

interface SmartItineraryTableProps {
  canRedo: boolean;
  canRestructure?: boolean;
  canUndo: boolean;
  contextRailOpen: boolean;
  endDate: string;
  items: ItineraryItem[];
  role: TripRole;
  startDate: string;
  selectedItemId: string;
  tripName: string;
  onAddStop: () => void;
  onSelectItem: (itemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
  onUndo: () => void;
}

const tablePanelClassName = "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_auto] overflow-visible bg-[var(--color-page)] px-6 py-[22px] pb-7";
const pageHeaderActionsClassName = "page-header-actions relative z-[1] flex max-w-[420px] min-w-0 flex-wrap items-center justify-end gap-2";
const pageHeaderNoteClassName = "page-header-note m-0 basis-full text-right text-xs font-bold text-[var(--color-warning-strong)]";
const detailsToggleButtonClassName = "details-toggle-button aria-[expanded=false]:border-[var(--color-primary-border)] aria-[expanded=false]:bg-[var(--color-primary-soft)] aria-[expanded=false]:text-[var(--color-primary-strong)]";
const tableScrollClassName = "table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto overflow-y-clip rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]";
const smartTableClassName =
  "smart-table w-full min-w-[960px] table-fixed border-collapse text-xs leading-4 text-[#1f2937] [&_a]:text-[#2563eb] [&_a]:underline [&_a]:underline-offset-2 [&_td:first-child]:w-[34px] [&_td:first-child]:px-0 [&_td:first-child]:text-center [&_td:nth-child(2)]:w-[78px] [&_td:nth-child(4)]:w-[94px] [&_td:nth-child(5)]:w-[124px] [&_td:nth-child(6)]:w-[94px] [&_td:nth-child(7)]:w-[108px] [&_td:nth-child(8)]:w-[118px] [&_td:nth-child(8)]:border-r-0 [&_td]:h-9 [&_td]:border-b [&_td]:border-r [&_td]:border-[var(--color-border)] [&_td]:px-2.5 [&_td]:py-1 [&_td]:text-left [&_td]:align-middle [&_th:first-child]:w-[34px] [&_th:first-child]:px-0 [&_th:first-child]:text-center [&_th:nth-child(2)]:w-[78px] [&_th:nth-child(4)]:w-[94px] [&_th:nth-child(5)]:w-[124px] [&_th:nth-child(6)]:w-[94px] [&_th:nth-child(7)]:w-[108px] [&_th:nth-child(8)]:w-[118px] [&_th:nth-child(8)]:border-r-0 [&_th]:h-9 [&_th]:border-b [&_th]:border-r [&_th]:border-[var(--color-border)] [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:align-middle [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:h-12 [&_thead_th]:bg-[var(--color-surface)] [&_thead_th]:text-xs [&_thead_th]:font-[750] [&_thead_th]:text-[var(--color-text-muted)]";
const dayGroupClassName = "day-group";
const dayRowClassName = "day-row [&_th]:h-[39px] [&_th]:bg-[var(--color-surface)] [&_th]:px-2.5 [&_th]:py-0";
const dayToggleClassName = "day-row-content day-toggle flex h-[39px] w-full min-w-0 items-center gap-[9px] border-0 bg-transparent p-0 text-left text-[#334155] aria-[expanded=true]:[&_.icon]:rotate-90 [&_.icon]:transition-transform [&_.icon]:duration-[140ms] [&_strong]:text-[#0f172a]";
const dayRouteClassName = "day-route ml-[18px] font-semibold text-[var(--color-text-muted)]";
const dataRowClassName =
  "data-row cursor-pointer transition-[background,box-shadow,transform] duration-[160ms] hover:[&_td]:bg-[var(--color-surface-subtle)] focus-visible:[&_td]:bg-[var(--color-primary-soft)] focus-visible:[&_td]:shadow-[inset_0_0_0_2px_var(--color-primary-border)] [&_td]:transition-[background,border-color,box-shadow,color,font-size,height,opacity,padding] [&_td]:duration-[180ms]";
const dataRowSelectedClassName =
  "data-row--selected [&_td:first-child]:shadow-[inset_2px_0_0_var(--color-primary),inset_0_1px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary)] [&_td:last-child]:shadow-[inset_-1px_0_0_var(--color-primary),inset_0_1px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary)] [&_td]:bg-[#ecfeff] [&_td]:shadow-[inset_0_1px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary)]";
const dataRowDraggingClassName = "data-row--dragging cursor-grabbing [&_td]:bg-[var(--color-surface-muted)] [&_td]:opacity-[0.54]";
const dataRowDropTargetClassName =
  "data-row--drop-target translate-y-px [&_td:first-child]:shadow-[inset_3px_0_0_var(--color-primary),inset_0_2px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary-border)] [&_td]:bg-[var(--color-primary-soft)] [&_td]:shadow-[inset_0_2px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary-border)]";
const dragCellClassName = "drag-cell text-[var(--color-text-subtle)]";
const reorderControlsClassName = "reorder-controls inline-grid grid-cols-[repeat(3,26px)] items-center gap-1";
const dragHandleClassName =
  "drag-handle inline-grid size-[26px] cursor-grab place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-[var(--color-text-subtle)] transition-[color,background] duration-150 hover:not-disabled:bg-[var(--color-primary-soft)] hover:not-disabled:text-[var(--color-primary-strong)] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-[0.42]";
const reorderButtonClassName =
  "reorder-button inline-grid size-[26px] cursor-pointer place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-[var(--color-text-subtle)] transition-[color,background] duration-150 hover:not-disabled:bg-[var(--color-primary-soft)] hover:not-disabled:text-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-[0.34] [&_.icon]:size-[15px] [&_.icon]:rotate-90";
const timeCellClassName = "time-cell font-[650] tabular-nums text-[#334155]";
const activityCellClassName = "activity-cell min-w-0";
const rowSelectClassName =
  "row-select grid min-h-[22px] w-full min-w-0 gap-0.5 border-0 bg-transparent p-0 text-left text-inherit [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-[11px] [&_span]:leading-4 [&_span]:text-[var(--color-text-muted)] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-xs [&_strong]:font-semibold";
const mapLinkClassName = "map-link text-[#2563eb] underline underline-offset-2";
const emptyWarningClassName = "empty-warning text-[var(--color-text-subtle)]";
const warningSummaryClassName = "warning-summary inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--color-warning-strong)] [&_.icon]:size-[15px]";

export function SmartItineraryTable({
  canRedo,
  canRestructure = true,
  canUndo,
  contextRailOpen,
  endDate,
  items,
  role,
  startDate,
  selectedItemId,
  tripName,
  onAddStop,
  onSelectItem,
  onMoveItem,
  onRedo,
  onToggleContextRail,
  onUndo,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const groups = groupItemsByDay(items);
  const canEdit = role === "owner" || role === "organizer";
  const canRestructureItems = canEdit && canRestructure;
  const warningCount = items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ draggedItemId: string | null; overItemId: string | null }>({ draggedItemId: null, overItemId: null });

  function toggleDay(day: string) {
    setCollapsedDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDragState({ draggedItemId: itemId, overItemId: null });
  }

  function previewDrop(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    const draggedItemId = dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId || draggedItemId === targetItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) => (current.overItemId === targetItemId ? current : { draggedItemId, overItemId: targetItemId }));
  }

  function dropItem(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData("text/plain");
    if (draggedItemId && draggedItemId !== targetItemId) onMoveItem(draggedItemId, targetItemId);
    clearDragPreview();
  }

  function clearDragPreview() {
    setDragState({ draggedItemId: null, overItemId: null });
  }

  return (
    <section className={tablePanelClassName} aria-label={t.itinerary.pageLabel} id="itinerary">
      <PageHeader
        title={t.itinerary.title}
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
            <span><Icon name="route" /> {t.itinerary.dayItems({ days: groups.length, stops: items.length })}</span>
            <span><Icon name="warning" /> {t.dates.warningCount({ count: warningCount })}</span>
            <span><Icon name="clock" /> {formatDuration(totalMinutes, locale)} {t.dates.planned}</span>
          </>
        )}
        aside={(
          <div className={pageHeaderActionsClassName} role="group" aria-label={t.itinerary.actionsLabel}>
            <Button type="button" onClick={onAddStop} disabled={!canRestructureItems} className="add-stop-button min-w-[154px] max-[767px]:w-full">
              <Icon name="plus" />
              {t.itinerary.addStop}
            </Button>
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
            <IconButton type="button" aria-label={t.itinerary.undo} disabled={!canUndo} onClick={onUndo}>
              <Icon name="undo" />
            </IconButton>
            <IconButton type="button" aria-label={t.itinerary.redo} disabled={!canRedo} onClick={onRedo}>
              <Icon name="redo" />
            </IconButton>
            {!canEdit ? <p className={pageHeaderNoteClassName}>{t.itinerary.editRequiresOrganizer}</p> : null}
          </div>
        )}
      />
      <div className={tableScrollClassName} tabIndex={0} aria-label={t.itinerary.scrollLabel}>
        <table className={smartTableClassName}>
          <caption className="sr-only">{t.itinerary.caption}</caption>
          <thead>
            <tr>
              <th>
                <span className="sr-only">{t.itinerary.headers.reorder}</span>
              </th>
              <th>{t.itinerary.headers.time}</th>
              <th>{t.itinerary.headers.activity}</th>
              <th>{t.itinerary.headers.type}</th>
              <th>{t.itinerary.headers.map}</th>
              <th>{t.itinerary.headers.duration}</th>
              <th>{t.itinerary.headers.transport}</th>
              <th>{t.itinerary.headers.warnings}</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
              dragState={dragState}
              group={group}
              itineraryLabels={t.itinerary}
              locale={locale}
              key={group.day}
              selectedItemId={selectedItemId}
              startDate={startDate}
              onClearDragPreview={clearDragPreview}
              onDropItem={dropItem}
              onMoveItem={onMoveItem}
              onPreviewDrop={previewDrop}
              onSelectItem={onSelectItem}
              onStartDrag={startDrag}
              onToggleDay={toggleDay}
            />
          ))}
        </table>
      </div>
    </section>
  );
}

function DayGroup({
  group,
  itineraryLabels,
  locale,
  startDate,
  selectedItemId,
  canEdit,
  collapsed,
  dragState,
  onClearDragPreview,
  onDropItem,
  onMoveItem,
  onPreviewDrop,
  onSelectItem,
  onStartDrag,
  onToggleDay,
}: {
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  startDate: string;
  selectedItemId: string;
  canEdit: boolean;
  collapsed: boolean;
  dragState: { draggedItemId: string | null; overItemId: string | null };
  onClearDragPreview: () => void;
  onDropItem: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onPreviewDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStartDrag: (event: DragEvent<HTMLButtonElement>, itemId: string) => void;
  onToggleDay: (day: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);

  return (
    <tbody className={dayGroupClassName} data-state={collapsed ? "closed" : "open"}>
      <tr className={dayRowClassName}>
        <th colSpan={8}>
          <button
            type="button"
            className={dayToggleClassName}
            aria-expanded={!collapsed}
            aria-label={collapsed ? itineraryLabels.dayToggle.expand({ day: dayLabel }) : itineraryLabels.dayToggle.collapse({ day: dayLabel })}
            onClick={() => onToggleDay(group.day)}
          >
            <Icon name="chevronRight" />
            <strong>{dayLabel}</strong>
            <span>·</span>
            <span>{formatThaiDate(group.day, locale)}</span>
            <span className={dayRouteClassName}>{dayRouteLabel(group.day, locale)}</span>
          </button>
        </th>
      </tr>
      {group.items.map((item, itemIndex) => (
        <tr
          aria-hidden={collapsed}
          aria-label={itineraryLabels.row.openDetails({ activity: item.activity })}
          className={getRowClassName(item, selectedItemId, dragState)}
          key={item.id}
          onDragOver={(event) => onPreviewDrop(event, item.id)}
          onDrop={(event) => onDropItem(event, item.id)}
        >
          <td className={dragCellClassName}>
            <div className={reorderControlsClassName}>
              <button
                type="button"
                className={dragHandleClassName}
                draggable={canEdit && !collapsed}
                disabled={!canEdit}
                tabIndex={collapsed ? -1 : undefined}
                aria-label={itineraryLabels.row.drag({ activity: item.activity })}
                onDragEnd={onClearDragPreview}
                onDragStart={(event) => onStartDrag(event, item.id)}
              >
                <Icon name="drag" />
              </button>
              <button
                type="button"
                className={reorderButtonClassName}
                disabled={!canEdit || itemIndex === 0}
                tabIndex={collapsed ? -1 : undefined}
                aria-label={itineraryLabels.row.moveUp({ activity: item.activity })}
                onClick={() => {
                  const previousItem = group.items[itemIndex - 1];
                  if (previousItem) onMoveItem(item.id, previousItem.id);
                }}
              >
                <Icon name="chevronLeft" />
              </button>
              <button
                type="button"
                className={reorderButtonClassName}
                disabled={!canEdit || itemIndex >= group.items.length - 1}
                tabIndex={collapsed ? -1 : undefined}
                aria-label={itineraryLabels.row.moveDown({ activity: item.activity })}
                onClick={() => {
                  const nextItem = group.items[itemIndex + 1];
                  if (nextItem) onMoveItem(nextItem.id, item.id);
                }}
              >
                <Icon name="chevronRight" />
              </button>
            </div>
          </td>
          <td className={timeCellClassName}>{tableStartTime(item)}</td>
          <td className={activityCellClassName}>
            <button
              type="button"
              className={rowSelectClassName}
              aria-pressed={selectedItemId === item.id}
              aria-label={itineraryLabels.row.select({ activity: item.activity })}
              tabIndex={collapsed ? -1 : undefined}
              onClick={() => onSelectItem(item.id)}
              onDragOver={(event) => onPreviewDrop(event, item.id)}
              onDrop={(event) => onDropItem(event, item.id)}
            >
              <strong>{item.activity}</strong>
              <span>{item.place}</span>
            </button>
          </td>
          <td>{activityTypeLabel(item.activityType, locale)}</td>
          <td><a className={mapLinkClassName} href={mapHref(item)} tabIndex={collapsed ? -1 : undefined}>{mapLinkLabel(item, itineraryLabels.row.mapFallback)}</a></td>
          <td>{formatDuration(item.durationMinutes, locale)}</td>
          <td>{item.transportation || "—"}</td>
          <td><AdvisorySummary advisories={item.advisories ?? []} /></td>
        </tr>
      ))}
    </tbody>
  );
}

function getRowClassName(
  item: ItineraryItem,
  selectedItemId: string,
  dragState: { draggedItemId: string | null; overItemId: string | null },
): string {
  return cn(
    dataRowClassName,
    selectedItemId === item.id && dataRowSelectedClassName,
    dragState.draggedItemId === item.id && dataRowDraggingClassName,
    dragState.overItemId === item.id && dataRowDropTargetClassName,
  );
}

function AdvisorySummary({ advisories }: { advisories: ItineraryAdvisory[] }) {
  if (advisories.length === 0) return <span className={emptyWarningClassName}>—</span>;
  return (
    <span className={warningSummaryClassName}>
      <Icon name="warning" />
      <span>{advisories[0]?.label}</span>
    </span>
  );
}

function tableStartTime(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.startTime || "—";
}

function mapHref(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.mapLink || "#";
}

function mapLinkLabel(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.linkLabel || fallback;
}
