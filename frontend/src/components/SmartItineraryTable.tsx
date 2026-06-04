import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { ItineraryAdvisory, ItineraryItem, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, getTripDates, groupItemsByDay, mainItineraryPathId, parseTime, type ItineraryDayGroup, type ItineraryPathOption, type ItineraryView } from "@/src/trip/itinerary";
import { Button } from "./ui";
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
  itineraryView?: ItineraryView;
  pathOptions?: ItineraryPathOption[];
  selectedItemId: string;
  selectedTripPathId?: string;
  dayPathOverrides?: Record<string, string | undefined>;
  showAllPaths?: boolean;
  tripName: string;
  onAddStop: (day?: string) => void;
  onSelectItem: (itemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onMoveItemToDay: (draggedItemId: string, targetDay: string) => void;
  onExportItinerary: () => void;
  onImportItinerary: (file: File) => void;
  onChangeTripPath?: (pathId: string) => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onClearAllDayPaths?: () => void;
  onAutoResolveDayOverlaps?: (day: string) => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
  onUndo: () => void;
}

const tablePanelClassName = "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-[var(--color-page)] px-6 py-[22px] pb-7";
const pageHeaderActionsClassName = "page-header-actions relative z-[1] flex max-w-[420px] min-w-0 flex-wrap items-center justify-end gap-2";
const pageHeaderNoteClassName = "page-header-note m-0 basis-full text-right text-xs font-bold text-[var(--color-warning-strong)]";
const pathControlsClassName = "path-controls flex min-w-0 flex-wrap items-center justify-end gap-2";
const pathSelectClassName = "min-h-9 min-w-[132px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-bold text-[var(--color-text)]";
const pathCheckboxLabelClassName = "inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-bold text-[var(--color-text-muted)]";
const clearPathButtonClassName = "inline-flex min-h-9 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-extrabold text-[var(--color-text-muted)] disabled:opacity-40";
const importInputClassName = "sr-only";
const tableScrollClassName = "table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto overflow-y-clip rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]";
const smartTableClassName =
  "smart-table w-full min-w-[960px] table-fixed border-collapse text-xs leading-4 text-[#1f2937] [&_a]:text-[#2563eb] [&_a]:underline [&_a]:underline-offset-2 [&_td:first-child]:w-[34px] [&_td:first-child]:px-0 [&_td:first-child]:text-center [&_td:nth-child(2)]:w-[78px] [&_td:nth-child(4)]:w-[94px] [&_td:nth-child(5)]:w-[124px] [&_td:nth-child(6)]:w-[94px] [&_td:nth-child(7)]:w-[108px] [&_td:nth-child(8)]:w-[118px] [&_td:nth-child(8)]:border-r-0 [&_td]:h-9 [&_td]:border-b [&_td]:border-r [&_td]:border-[var(--color-border)] [&_td]:px-2.5 [&_td]:py-1 [&_td]:text-left [&_td]:align-middle [&_th:first-child]:w-[34px] [&_th:first-child]:px-0 [&_th:first-child]:text-center [&_th:nth-child(2)]:w-[78px] [&_th:nth-child(4)]:w-[94px] [&_th:nth-child(5)]:w-[124px] [&_th:nth-child(6)]:w-[94px] [&_th:nth-child(7)]:w-[108px] [&_th:nth-child(8)]:w-[118px] [&_th:nth-child(8)]:border-r-0 [&_th]:h-9 [&_th]:border-b [&_th]:border-r [&_th]:border-[var(--color-border)] [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:align-middle [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:h-12 [&_thead_th]:bg-[var(--color-surface)] [&_thead_th]:text-xs [&_thead_th]:font-[750] [&_thead_th]:text-[var(--color-text-muted)]";
const dayGroupClassName = "day-group";
const daySpacerRowClassName = "day-spacer-row [&_td]:!h-3 [&_td]:!border-0 [&_td]:!bg-[var(--color-page)] [&_td]:!p-0";
const dayRowClassName = "day-row [&_th]:h-[39px] [&_th]:bg-[var(--color-surface)] [&_th]:px-2.5 [&_th]:py-0";
const dayRowContentClassName = "day-row-content flex h-[39px] w-full min-w-0 items-center gap-[9px]";
const dayToggleClassName = "day-toggle flex min-w-0 items-center gap-[9px] border-0 bg-transparent p-0 text-left text-[#334155] aria-[expanded=true]:[&_.icon]:rotate-90 [&_.icon]:transition-transform [&_.icon]:duration-[140ms] [&_strong]:text-[#0f172a]";
const dayRouteClassName = "day-route ml-[18px] font-semibold text-[var(--color-text-muted)] max-[767px]:hidden";
const dayPathControlsClassName = "ml-auto inline-flex min-w-0 items-center gap-2 max-[767px]:ml-2 max-[767px]:shrink-0";
const dayPathSelectClassName = "min-h-7 max-w-[172px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11px] font-bold text-[var(--color-text)] max-[767px]:max-w-[112px]";
const dayClearPathButtonClassName = "inline-flex min-h-7 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[11px] font-extrabold text-[var(--color-text-muted)] disabled:opacity-40 max-[767px]:px-1.5";
const dayAutoOverlapButtonClassName = "inline-flex min-h-7 items-center rounded-[var(--radius-sm)] border border-[#fca5a5] bg-[#fee2e2] px-2 text-[11px] font-extrabold text-[#991b1b] transition-colors hover:enabled:bg-[#fecaca] disabled:opacity-40 max-[767px]:px-1.5";
const dataRowClassName =
  "data-row cursor-pointer transition-[background,box-shadow,transform] duration-[160ms] hover:[&_td]:bg-[var(--color-surface-subtle)] focus-visible:[&_td]:bg-[var(--color-primary-soft)] focus-visible:[&_td]:shadow-[inset_0_0_0_2px_var(--color-primary-border)] [&_td]:transition-[background,border-color,box-shadow,color,font-size,height,opacity,padding] [&_td]:duration-[180ms]";
const dataRowSelectedClassName =
  "data-row--selected [&_td:first-child]:shadow-[inset_2px_0_0_var(--color-primary),inset_0_1px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary)] [&_td:last-child]:shadow-[inset_-1px_0_0_var(--color-primary),inset_0_1px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary)] [&_td]:bg-[#ecfeff] [&_td]:shadow-[inset_0_1px_0_var(--color-primary),inset_0_-1px_0_var(--color-primary)]";
const dataRowPathOverlapClassName =
  "data-row--path-overlap [&_td]:!bg-[#fee2e2] hover:[&_td]:!bg-[#fecaca] [&_td:first-child]:shadow-[inset_2px_0_0_#fca5a5] [&_td:last-child]:shadow-[inset_-1px_0_0_#fca5a5] [&_td]:shadow-[inset_0_1px_0_#fca5a5,inset_0_-1px_0_#fca5a5]";
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
const addStopRowClassName = "add-stop-row [&_td]:border-b [&_td]:border-r [&_td]:border-dashed [&_td]:border-[var(--color-border)] [&_td]:bg-[var(--color-surface-subtle)] [&_td]:px-2.5 [&_td]:py-1";
const addStopRowDropTargetClassName = "add-stop-row--drop-target [&_td]:!bg-[var(--color-primary-soft)] [&_td]:shadow-[inset_0_0_0_2px_var(--color-primary-border)]";
const addStopInlineButtonClassName = "inline-flex min-h-7 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-primary-border)] bg-[rgb(240_253_250_/_0.72)] px-3 text-[12px] font-extrabold text-[var(--color-primary-strong)] transition-[background,border-color,color] duration-150 hover:enabled:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-transparent disabled:text-[var(--color-text-subtle)]";

export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  itineraryView,
  items,
  pathOptions = [{ id: mainItineraryPathId, name: "Main", scope: "trip" }],
  role,
  startDate,
  selectedItemId,
  selectedTripPathId = mainItineraryPathId,
  dayPathOverrides = {},
  showAllPaths = false,
  tripName,
  onAddStop,
  onSelectItem,
  onMoveItem,
  onMoveItemToDay,
  onExportItinerary,
  onImportItinerary,
  onChangeTripPath,
  onChangeDayPath,
  onClearDayPath,
  onClearAllDayPaths,
  onAutoResolveDayOverlaps,
  onToggleShowAllPaths,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const importInputRef = useRef<HTMLInputElement>(null);
  const groups = mergeTripDayGroups(itineraryView?.dayGroups ?? groupItemsByDay(items), startDate, endDate);
  const canEdit = role === "owner" || role === "organizer";
  const canRestructureItems = canEdit && canRestructure;
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = items.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ draggedItemId: string | null; overItemId: string | null; overDay: string | null }>({ draggedItemId: null, overItemId: null, overDay: null });

  function toggleDay(day: string) {
    setCollapsedDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDragState({ draggedItemId: itemId, overItemId: null, overDay: null });
  }

  function previewDrop(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    const draggedItemId = dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId || draggedItemId === targetItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) => (current.overItemId === targetItemId && current.overDay === null ? current : { draggedItemId, overItemId: targetItemId, overDay: null }));
  }

  function previewDayDrop(event: DragEvent<HTMLElement>, targetDay: string) {
    if (!canRestructureItems) return;
    const draggedItemId = dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) => (current.overDay === targetDay && current.overItemId === null ? current : { draggedItemId, overItemId: null, overDay: targetDay }));
  }

  function dropItem(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData("text/plain");
    if (draggedItemId && draggedItemId !== targetItemId) onMoveItem(draggedItemId, targetItemId);
    clearDragPreview();
  }

  function dropOnDay(event: DragEvent<HTMLElement>, targetDay: string) {
    if (!canRestructureItems) return;
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData("text/plain") || dragState.draggedItemId;
    if (draggedItemId) onMoveItemToDay(draggedItemId, targetDay);
    clearDragPreview();
  }

  function clearDragPreview() {
    setDragState({ draggedItemId: null, overItemId: null, overDay: null });
  }

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImportItinerary(file);
    event.target.value = "";
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
            <div className={pathControlsClassName}>
              <select
                className={pathSelectClassName}
                aria-label="Trip path"
                value={selectedTripPathId}
                disabled={!canRestructureItems || showAllPaths}
                onChange={(event) => onChangeTripPath?.(event.target.value)}
              >
                {pathOptions.filter((option) => option.scope === "trip" || option.id === mainItineraryPathId).map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              <label className={pathCheckboxLabelClassName}>
                <input
                  type="checkbox"
                  aria-label="Show all paths"
                  checked={showAllPaths}
                  disabled={!canRestructureItems}
                  onChange={(event) => onToggleShowAllPaths?.(event.target.checked)}
                />
                Show all
              </label>
              <button
                type="button"
                className={clearPathButtonClassName}
                aria-label="Clear all day path overrides"
                disabled={!canRestructureItems || Object.values(dayPathOverrides).filter(Boolean).length === 0}
                onClick={() => onClearAllDayPaths?.()}
              >
                Clear all
              </button>
            </div>
            <input
              ref={importInputRef}
              className={importInputClassName}
              type="file"
              accept="application/json,.json"
              aria-label={t.itinerary.importJsonInput}
              onChange={importFile}
            />
            <Button type="button" onClick={() => importInputRef.current?.click()} disabled={!canRestructureItems} className="import-itinerary-button min-w-[104px] max-[767px]:flex-1">
              <Icon name="import" />
              {t.itinerary.import}
            </Button>
            <Button type="button" onClick={onExportItinerary} className="export-itinerary-button min-w-[104px] max-[767px]:flex-1">
              <Icon name="export" />
              {t.itinerary.export}
            </Button>
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
          {groups.map((group, groupIndex) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
              dragState={dragState}
              group={group}
              hasTopSpacer={groupIndex > 0}
              itineraryLabels={t.itinerary}
              locale={locale}
              key={group.day}
              selectedItemId={selectedItemId}
              startDate={startDate}
              pathOptions={pathOptions}
              dayPathOverride={dayPathOverrides[group.day]}
              showAllPaths={showAllPaths}
              onClearDragPreview={clearDragPreview}
              onChangeDayPath={onChangeDayPath}
              onClearDayPath={onClearDayPath}
              onAutoResolveDayOverlaps={onAutoResolveDayOverlaps}
              onDropItem={dropItem}
              onDropOnDay={dropOnDay}
              onAddStop={onAddStop}
              onMoveItem={onMoveItem}
              onPreviewDayDrop={previewDayDrop}
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
  hasTopSpacer,
  itineraryLabels,
  locale,
  startDate,
  pathOptions,
  dayPathOverride,
  showAllPaths,
  selectedItemId,
  canEdit,
  collapsed,
  dragState,
  onClearDragPreview,
  onChangeDayPath,
  onClearDayPath,
  onAutoResolveDayOverlaps,
  onDropItem,
  onDropOnDay,
  onAddStop,
  onMoveItem,
  onPreviewDayDrop,
  onPreviewDrop,
  onSelectItem,
  onStartDrag,
  onToggleDay,
}: {
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  hasTopSpacer: boolean;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  startDate: string;
  pathOptions: ItineraryPathOption[];
  dayPathOverride?: string;
  showAllPaths: boolean;
  selectedItemId: string;
  canEdit: boolean;
  collapsed: boolean;
  dragState: { draggedItemId: string | null; overItemId: string | null; overDay: string | null };
  onClearDragPreview: () => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onAutoResolveDayOverlaps?: (day: string) => void;
  onDropItem: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onDropOnDay: (event: DragEvent<HTMLElement>, targetDay: string) => void;
  onAddStop: (day?: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onPreviewDayDrop: (event: DragEvent<HTMLElement>, targetDay: string) => void;
  onPreviewDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStartDrag: (event: DragEvent<HTMLButtonElement>, itemId: string) => void;
  onToggleDay: (day: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const dayPathOptions = pathOptions.filter((option) => option.id === mainItineraryPathId || option.scope === "trip" || option.day === group.day);
  const hasAlternativePathOptions = dayPathOptions.some((option) => option.id !== mainItineraryPathId);
  const samePathOverlapItemIds = findSamePathOverlapItemIds(group.items);

  return (
    <tbody className={dayGroupClassName} data-state={collapsed ? "closed" : "open"}>
      {hasTopSpacer ? (
        <tr className={daySpacerRowClassName} aria-hidden="true">
          <td colSpan={8} />
        </tr>
      ) : null}
      <tr className={dayRowClassName}>
        <th colSpan={8}>
          <div className={dayRowContentClassName}>
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
            {samePathOverlapItemIds.size > 0 || hasAlternativePathOptions ? (
              <span className={dayPathControlsClassName}>
                {samePathOverlapItemIds.size > 0 ? (
                  <button
                    type="button"
                    className={dayAutoOverlapButtonClassName}
                    aria-label={`Auto fix overlaps for ${dayA11yLabel}`}
                    disabled={!canEdit}
                    onClick={() => onAutoResolveDayOverlaps?.(group.day)}
                  >
                    Auto
                  </button>
                ) : null}
                {hasAlternativePathOptions ? (
                  <>
                    <select
                      className={dayPathSelectClassName}
                      aria-label={`Path for ${dayA11yLabel}`}
                      value={dayPathOverride || mainItineraryPathId}
                      disabled={!canEdit || showAllPaths}
                      onChange={(event) => onChangeDayPath?.(group.day, event.target.value)}
                    >
                      {dayPathOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={dayClearPathButtonClassName}
                      aria-label={`Clear path override for ${dayA11yLabel}`}
                      disabled={!canEdit || showAllPaths || !dayPathOverride}
                      onClick={() => onClearDayPath?.(group.day)}
                    >
                      Clear
                    </button>
                  </>
                ) : null}
              </span>
            ) : null}
          </div>
        </th>
      </tr>
      {!collapsed ? group.items.map((item, itemIndex) => (
        <tr
          aria-label={itineraryLabels.row.openDetails({ activity: item.activity })}
          className={getRowClassName(item, selectedItemId, dragState, samePathOverlapItemIds)}
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
      )) : null}
      {!collapsed ? (
        <tr
          className={cn(addStopRowClassName, dragState.overDay === group.day && addStopRowDropTargetClassName)}
          onDragOver={(event) => onPreviewDayDrop(event, group.day)}
          onDrop={(event) => onDropOnDay(event, group.day)}
        >
          <td colSpan={8}>
            <button
              type="button"
              className={addStopInlineButtonClassName}
              disabled={!canEdit}
              onClick={() => onAddStop(group.day)}
              aria-label={`${itineraryLabels.addStop} ${dayLabel}`}
            >
              <Icon name="plus" />
              {itineraryLabels.addStop}
            </button>
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}

function mergeTripDayGroups(groups: ItineraryDayGroup[], startDate: string, endDate: string): ItineraryDayGroup[] {
  const groupsByDay = new Map(groups.map((group) => [group.day, group]));
  const tripDays = getTripDates(startDate, endDate);
  const days = new Set<string>(tripDays);
  for (const group of groups) {
    if (group.items.length) days.add(group.day);
  }

  return Array.from(days)
    .sort()
    .map((day) => groupsByDay.get(day) ?? { day, items: [], warningCount: 0 });
}

function getRowClassName(
  item: ItineraryItem,
  selectedItemId: string,
  dragState: { draggedItemId: string | null; overItemId: string | null; overDay: string | null },
  samePathOverlapItemIds: Set<string> = new Set(),
): string {
  return cn(
    dataRowClassName,
    selectedItemId === item.id && dataRowSelectedClassName,
    samePathOverlapItemIds.has(item.id) && dataRowPathOverlapClassName,
    dragState.draggedItemId === item.id && dataRowDraggingClassName,
    dragState.overItemId === item.id && dataRowDropTargetClassName,
  );
}

function findSamePathOverlapItemIds(items: ItineraryItem[]): Set<string> {
  const ids = new Set<string>();
  const groups = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    const key = `${item.day}:${itineraryItemPathId(item)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  for (const groupItems of groups.values()) {
    const intervals = groupItems
      .map((item) => {
        const start = parseTime(item.startTime);
        if (start === null || item.durationMinutes === null || item.durationMinutes <= 0) return null;
        return { item, start, end: start + item.durationMinutes };
      })
      .filter((entry): entry is { item: ItineraryItem; start: number; end: number } => entry !== null)
      .sort((left, right) => left.start - right.start || left.end - right.end || left.item.sortOrder - right.item.sortOrder);

    for (let leftIndex = 0; leftIndex < intervals.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < intervals.length; rightIndex += 1) {
        const left = intervals[leftIndex];
        const right = intervals[rightIndex];
        if (!left || !right) continue;
        if (right.start >= left.end) break;
        ids.add(left.item.id);
        ids.add(right.item.id);
      }
    }
  }
  return ids;
}

function itineraryItemPathId(item: ItineraryItem): string {
  return item.pathRole === "alternative" ? item.pathId ?? item.id : mainItineraryPathId;
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
