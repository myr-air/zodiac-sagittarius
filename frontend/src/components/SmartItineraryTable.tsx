import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type DragEvent, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import type { ActivityType, ItineraryItem, TripDailyBriefing, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, getTripDates, groupItemsByDay, mainItineraryPathId, parseTime, type ItineraryDayGroup, type ItineraryPathOption, type ItineraryView } from "@/src/trip/itinerary";
import { formatWeatherTemp, weatherGraphicLabel, weatherIconForCondition } from "@/src/trip/weather-briefings";
import { Button } from "./ui";
import { Icon } from "./icons";
import { formatTripRange, PageHeader } from "./PageHeader";
import { activityTypeLabel, dayRouteLabel, formatDuration, formatThaiDate } from "./itineraryDisplay";
import { ActivityPathGraphDay } from "./ActivityPathGraphDay";

interface SmartItineraryTableProps {
  canRedo: boolean;
  canRestructure?: boolean;
  canUndo: boolean;
  contextRailOpen: boolean;
  endDate: string;
  graphItems?: ItineraryItem[];
  items: ItineraryItem[];
  dailyBriefings?: TripDailyBriefing[];
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
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (itemId: string, patch: InlineItineraryItemPatch) => void | Promise<void>;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
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

export type InlineItineraryItemPatch = Partial<Pick<ItineraryItem, "startTime" | "durationMinutes" | "activity" | "place" | "activityType" | "transportation">>;

const tablePanelClassName = "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-[var(--color-page)] px-6 py-[22px] pb-7";
const pageHeaderActionsClassName = "page-header-actions relative z-[1] flex max-w-[260px] min-w-0 flex-wrap items-center justify-end gap-2";
const pageHeaderNoteClassName = "page-header-note m-0 basis-full text-right text-xs font-bold text-[var(--color-warning-strong)]";
const itineraryFilterShellClassName = "itinerary-filter-shell -mt-1 mb-[14px] grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5";
const itineraryFilterBarClassName = "itinerary-filter-bar flex min-w-0 flex-wrap items-center gap-2";
const pathFilterButtonClassName = "inline-flex min-h-8 min-w-[148px] items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2.5 text-xs font-extrabold text-[var(--color-text)] transition-[background,border-color,color] duration-150 hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-strong)] aria-[expanded=true]:border-[var(--color-primary-border)] aria-[expanded=true]:bg-[var(--color-primary-soft)] aria-[expanded=true]:text-[var(--color-primary-strong)] [&_.icon]:size-4 [&_.icon]:transition-transform [&_.icon]:duration-[150ms] aria-[expanded=true]:[&_.icon]:rotate-90";
const pathFilterSummaryClassName = "min-w-0 flex-1 truncate text-xs font-semibold text-[var(--color-text-muted)]";
const pathFilterPanelClassName = "itinerary-filter-panel flex min-w-0 flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-2";
const pathFilterOptionClassName = "inline-flex min-h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2.5 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)]";
const importInputClassName = "sr-only";
const tableScrollClassName = "table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] [contain:paint]";
const smartTableClassName =
  "smart-table w-full min-w-[1010px] table-fixed border-collapse text-xs leading-4 text-[#1f2937] [&_a]:text-[#2563eb] [&_a]:underline [&_a]:underline-offset-2 [&_td:first-child]:px-0 [&_td:first-child]:text-center [&_td:nth-child(2)]:w-[34px] [&_td:nth-child(2)]:px-0 [&_td:nth-child(2)]:text-center [&_td:nth-child(3)]:w-[82px] [&_td:nth-child(5)]:w-[94px] [&_td:nth-child(6)]:w-[124px] [&_td:nth-child(7)]:w-[108px] [&_td:nth-child(8)]:w-[118px] [&_td:nth-child(8)]:border-r-0 [&_td]:h-9 [&_td]:border-b [&_td]:border-r [&_td]:border-[var(--color-border)] [&_td]:px-2.5 [&_td]:py-1 [&_td]:text-left [&_td]:align-middle [&_th:first-child]:px-0 [&_th:first-child]:text-center [&_th:nth-child(2)]:w-[34px] [&_th:nth-child(2)]:px-0 [&_th:nth-child(2)]:text-center [&_th:nth-child(3)]:w-[82px] [&_th:nth-child(5)]:w-[94px] [&_th:nth-child(6)]:w-[124px] [&_th:nth-child(7)]:w-[108px] [&_th:nth-child(8)]:w-[118px] [&_th:nth-child(8)]:border-r-0 [&_th]:h-9 [&_th]:border-b [&_th]:border-r [&_th]:border-[var(--color-border)] [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:align-middle [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:h-12 [&_thead_th]:bg-[var(--color-surface)] [&_thead_th]:text-xs [&_thead_th]:font-[750] [&_thead_th]:text-[var(--color-text-muted)]";
const graphColumnMinWidth = 30;
const graphColumnSidePadding = 9;
const graphColumnLaneGap = 18;
const dayGroupClassName = "day-group";
const daySpacerRowClassName = "day-spacer-row [&_td]:!h-3 [&_td]:!border-0 [&_td]:!bg-[var(--color-page)] [&_td]:!p-0";
const dayRowClassName = "day-row [&_th]:h-[39px] [&_th]:bg-[var(--color-surface)] [&_th]:px-2.5 [&_th]:py-0";
const dayRowContentClassName = "day-row-content flex h-[39px] w-full min-w-0 items-center gap-[9px]";
const dayToggleClassName = "day-toggle flex min-w-0 items-center gap-[9px] border-0 bg-transparent p-0 text-left text-[#334155] aria-[expanded=true]:[&_.icon]:rotate-90 [&_.icon]:transition-transform [&_.icon]:duration-[140ms] [&_strong]:text-[#0f172a]";
const dayRouteClassName = "day-route ml-[18px] font-semibold text-[var(--color-text-muted)] max-[767px]:hidden";
const dayWeatherChipClassName = "day-weather-chip inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-sky-100 bg-sky-50/80 px-2 text-[11px] font-extrabold text-sky-800 [&_strong]:text-sky-950";
const dayPathControlsClassName = "ml-auto inline-flex min-w-0 items-center gap-2 max-[767px]:ml-2 max-[767px]:shrink-0";
const dayPathPickerClassName = "min-h-7 max-w-[172px] px-2 text-[11px] max-[767px]:max-w-[112px]";
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
const reorderControlsClassName = "reorder-controls inline-grid grid-cols-[26px] items-center justify-center";
const dragHandleClassName =
  "drag-handle inline-grid size-[26px] touch-none cursor-grab place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-[var(--color-text-subtle)] transition-[color,background] duration-150 hover:not-disabled:bg-[var(--color-primary-soft)] hover:not-disabled:text-[var(--color-primary-strong)] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-[0.42]";
const rowActionCellClassName = "row-actions-cell";
const rowActionsClassName = "row-actions flex items-center justify-center gap-1";
const rowActionButtonClassName = "row-action-button inline-grid size-[26px] place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-[var(--color-text-subtle)] transition-[color,background] duration-150 hover:not-disabled:bg-[var(--color-primary-soft)] hover:not-disabled:text-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-[0.42]";
const timeHeaderClassName = "time-header max-[767px]:sticky max-[767px]:left-0 max-[767px]:z-[5] max-[767px]:shadow-[6px_0_12px_rgb(15_23_42_/_0.08)]";
const timeCellClassName = "time-cell !text-center font-[650] tabular-nums text-[#334155] max-[767px]:sticky max-[767px]:left-0 max-[767px]:z-[4] max-[767px]:!bg-[var(--color-surface)] max-[767px]:shadow-[6px_0_12px_rgb(15_23_42_/_0.08)]";
const timeStackClassName = "grid min-h-[30px] content-center justify-items-center gap-0.5 leading-none [&_span]:whitespace-nowrap";
const durationPillClassName = "duration-pill inline-flex min-h-[17px] max-w-full items-center justify-center rounded-full border border-transparent bg-transparent px-1 text-[10px] font-[750] leading-3 text-[var(--color-text-muted)] transition-[background,border-color,color] duration-150 hover:not-disabled:border-[var(--color-primary-border)] hover:not-disabled:bg-[var(--color-primary-soft)] hover:not-disabled:text-[var(--color-primary-strong)] focus-visible:border-[var(--color-primary-border)] focus-visible:bg-[var(--color-primary-soft)] focus-visible:text-[var(--color-primary-strong)] focus-visible:outline-none disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]";
const activityCellClassName = "activity-cell min-w-0";
const rowSelectClassName =
  "row-select grid min-h-[22px] w-full min-w-0 gap-0.5 border-0 bg-transparent p-0 text-left text-inherit";
const inlineActivityStackClassName = "grid min-w-0 gap-0.5";
const inlineFieldClassName =
  "inline-row-field min-h-[24px] w-full min-w-0 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-1.5 py-0 text-xs leading-4 text-[var(--color-text)] outline-none transition-[background,border-color,box-shadow] duration-150 placeholder:text-[var(--color-text-muted)] hover:not-read-only:border-[var(--color-border)] hover:not-read-only:bg-[var(--color-surface)] focus:border-[var(--color-primary-border)] focus:bg-[var(--color-surface)] focus:shadow-[0_0_0_2px_rgb(153_246_228_/_0.45)] read-only:cursor-pointer read-only:truncate read-only:px-0 read-only:font-semibold disabled:cursor-not-allowed disabled:text-[var(--color-text-muted)]";
const inlineActivityFieldClassName = cn(inlineFieldClassName, "font-semibold");
const inlineSubtleFieldClassName = cn(inlineFieldClassName, "text-[11px] text-[var(--color-text-muted)]");
const inlineTimeInputClassName = cn(inlineFieldClassName, "text-center font-[650] tabular-nums");
const inlineOptionPickerButtonClassName = cn(inlineFieldClassName, "inline-option-picker-button inline-flex items-center justify-between gap-2 text-left font-semibold");
const inlineOptionPickerCaretClassName = "shrink-0 text-[var(--color-text-subtle)]";
const floatingOptionMenuClassName = "inline-option-picker-menu fixed z-[15] grid max-h-[min(260px,calc(100vh_-_24px))] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[0_18px_44px_rgb(15_23_42_/_0.18)]";
const floatingOptionButtonClassName = "grid min-h-8 w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_16px] items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-xs font-bold text-[var(--color-text)] transition-colors hover:bg-[var(--color-primary-soft)] focus-visible:bg-[var(--color-primary-soft)] focus-visible:outline-none aria-selected:bg-[var(--color-primary-soft)] aria-selected:text-[var(--color-primary-strong)] data-[active=true]:bg-[var(--color-primary-soft)]";
const mapLinkClassName = "map-link text-[#2563eb] underline underline-offset-2";
const addStopRowClassName = "add-stop-row [&_td]:border-b [&_td]:border-r [&_td]:border-dashed [&_td]:border-[var(--color-border)] [&_td]:bg-[var(--color-surface-subtle)] [&_td]:px-2.5 [&_td]:py-1";
const addStopRowDropTargetClassName = "add-stop-row--drop-target [&_td]:!bg-[var(--color-primary-soft)] [&_td]:shadow-[inset_0_0_0_2px_var(--color-primary-border)]";
const addStopInlineButtonClassName = "inline-flex min-h-7 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-primary-border)] bg-[rgb(240_253_250_/_0.72)] px-3 text-[12px] font-extrabold text-[var(--color-primary-strong)] transition-[background,border-color,color] duration-150 hover:enabled:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-transparent disabled:text-[var(--color-text-subtle)]";
const graphCellClassName = "activity-path-graph-cell !h-auto !bg-[var(--color-surface-subtle)] !p-0 !align-top !shadow-none";
const deleteModalBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const deleteDialogClassName = "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-surface)] p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.22)]";
const deleteDialogTitleClassName = "m-0 text-base font-extrabold leading-[22px] text-[#991b1b]";
const deleteDialogBodyClassName = "m-0 text-sm font-medium leading-6 text-[var(--color-text-muted)]";
const deleteDialogActionsClassName = "mt-1 flex justify-end gap-2";
const durationDialogClassName = "duration-dialog grid w-[min(360px,100%)] gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.2)]";
const durationDialogTitleClassName = "m-0 text-sm font-extrabold leading-5 text-[var(--color-text)]";
const durationPresetGridClassName = "grid grid-cols-3 gap-2";
const durationPresetButtonClassName = "min-h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2 text-xs font-extrabold text-[var(--color-text)] transition-[background,border-color,color] duration-150 hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-strong)]";
const durationCustomGridClassName = "grid grid-cols-2 gap-2";
const durationInputLabelClassName = "grid gap-1 text-[11px] font-extrabold text-[var(--color-text-muted)]";
const durationInputClassName = "min-h-9 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm font-bold tabular-nums text-[var(--color-text)] outline-none focus:border-[var(--color-primary-border)] focus:shadow-[0_0_0_2px_rgb(153_246_228_/_0.45)]";
const activityTypeOptions: ActivityType[] = ["food", "attraction", "experience", "travel", "shopping", "stay"];
const durationPresetMinutes = [15, 30, 45, 60, 90, 120];

export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  graphItems,
  itineraryView,
  items,
  dailyBriefings = [],
  pathOptions = [{ id: mainItineraryPathId, name: "Main", scope: "trip" }],
  role,
  startDate,
  selectedItemId,
  dayPathOverrides = {},
  showAllPaths = false,
  tripName,
  onAddStop,
  onSelectItem,
  onMoveItem,
  onMoveItemToDay,
  onMoveItemToPath,
  onUpdateItemInline,
  onEditItem,
  onDeleteItem,
  onExportItinerary,
  onImportItinerary,
  onChangeDayPath,
  onClearDayPath,
  onAutoResolveDayOverlaps,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const importInputRef = useRef<HTMLInputElement>(null);
  const allDisplayItems = graphItems ?? items;
  const filterOptions = dedupePathOptions(pathOptions, allDisplayItems);
  const canEdit = role === "owner" || role === "organizer";
  const canRestructureItems = canEdit && canRestructure;
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() => filterOptions.map((option) => option.id));
  const [planFiltersExpanded, setPlanFiltersExpanded] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ draggedItemId: string | null; overItemId: string | null; overDay: string | null }>({ draggedItemId: null, overItemId: null, overDay: null });
  const [pendingDeleteItem, setPendingDeleteItem] = useState<ItineraryItem | null>(null);
  const [durationEditor, setDurationEditor] = useState<{ item: ItineraryItem; hours: string; minutes: string } | null>(null);
  const knownFilterIdsRef = useRef<string[]>(filterOptions.map((option) => option.id));
  const touchDragRef = useRef<{ itemId: string; pointerId?: number; touchId?: number } | null>(null);
  const selectedPathIdSet = new Set(selectedPathIds);
  const displayItems = allDisplayItems.filter((item) => selectedPathIdSet.has(itineraryItemPathId(item)));
  const selectedFilterLabel = formatSelectedPlanLabel(filterOptions, selectedPathIds, t.itinerary.filters.selectedCount, t.itinerary.filters.selectedNames);
  const groups = mergeTripDayGroups(groupItemsByDay(displayItems), startDate, endDate);
  const dailyBriefingsByDate = useMemo(() => new Map(dailyBriefings.map((briefing) => [briefing.date, briefing])), [dailyBriefings]);
  const graphItemsByDay = groupGraphItemsByDay(displayItems);
  const warningCount = itineraryView?.warningCount ?? displayItems.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const totalMinutes = displayItems.reduce((total, item) => total + (item.durationMinutes ?? 0), 0);
  const graphColumnWidth = buildGraphColumnWidth(displayItems, pathOptions);
  const smartTableStyle = { "--graph-column-width": `${graphColumnWidth}px` } as CSSProperties;

  useEffect(() => {
    setSelectedPathIds((current) => {
      const optionIds = filterOptions.map((option) => option.id);
      const previousOptionIds = knownFilterIdsRef.current;
      const nextIds = optionIds.filter((id) => current.includes(id) || !previousOptionIds.includes(id));
      knownFilterIdsRef.current = optionIds;
      return nextIds.length === current.length && nextIds.every((id, index) => id === current[index]) ? current : nextIds;
    });
  }, [filterOptions]);

  function toggleDay(day: string) {
    setCollapsedDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function openDurationEditor(item: ItineraryItem) {
    const durationMinutes = item.durationMinutes ?? 45;
    setDurationEditor({
      item,
      hours: String(Math.floor(durationMinutes / 60)),
      minutes: String(durationMinutes % 60),
    });
  }

  function commitDuration(itemId: string, minutes: number) {
    if (!canEdit) return;
    onUpdateItemInline?.(itemId, { durationMinutes: Math.max(1, Math.round(minutes)) });
    setDurationEditor(null);
  }

  function commitCustomDuration() {
    if (!durationEditor) return;
    const hours = Number(durationEditor.hours) || 0;
    const minutes = Number(durationEditor.minutes) || 0;
    commitDuration(durationEditor.item.id, hours * 60 + minutes);
  }

  function togglePlanFilter(pathId: string) {
    setSelectedPathIds((current) => (
      current.includes(pathId) ? current.filter((item) => item !== pathId) : [...current, pathId]
    ));
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDragState({ draggedItemId: itemId, overItemId: null, overDay: null });
  }

  function startTouchDrag(event: ReactPointerEvent<HTMLButtonElement>, itemId: string) {
    if (!canRestructureItems || event.pointerType !== "pen") return;
    touchDragRef.current = { itemId, pointerId: event.pointerId };
    setDragState({ draggedItemId: itemId, overItemId: null, overDay: null });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function startTouchGesture(event: ReactTouchEvent<HTMLButtonElement>, itemId: string) {
    if (!canRestructureItems) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchDragRef.current = { itemId, touchId: touch.identifier };
    setDragState({ draggedItemId: itemId, overItemId: null, overDay: null });
    event.preventDefault();
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
    touchDragRef.current = null;
  }

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const current = touchDragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      if (itemRow) {
        const targetItemId = itemRow.dataset.itemId;
        if (targetItemId && targetItemId !== current.itemId) {
          setDragState({ draggedItemId: current.itemId, overItemId: targetItemId, overDay: null });
          event.preventDefault();
        }
        return;
      }
      if (dayRow) {
        const targetDay = dayRow.dataset.dayDrop;
        if (targetDay) {
          setDragState({ draggedItemId: current.itemId, overItemId: null, overDay: targetDay });
          event.preventDefault();
        }
      }
    }

    function handlePointerUp(event: PointerEvent) {
      const current = touchDragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      const targetItemId = itemRow?.dataset.itemId;
      const targetDay = dayRow?.dataset.dayDrop;
      if (targetItemId && targetItemId !== current.itemId) onMoveItem(current.itemId, targetItemId);
      else if (targetDay) onMoveItemToDay(current.itemId, targetDay);
      clearDragPreview();
    }

    function cancelPointer(event: PointerEvent) {
      const current = touchDragRef.current;
      if (current && current.pointerId === event.pointerId) clearDragPreview();
    }

    function handleTouchMove(event: TouchEvent) {
      const current = touchDragRef.current;
      if (!current || current.touchId === undefined) return;
      const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === current.touchId);
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      if (itemRow) {
        const targetItemId = itemRow.dataset.itemId;
        if (targetItemId && targetItemId !== current.itemId) {
          setDragState({ draggedItemId: current.itemId, overItemId: targetItemId, overDay: null });
          event.preventDefault();
        }
        return;
      }
      if (dayRow) {
        const targetDay = dayRow.dataset.dayDrop;
        if (targetDay) {
          setDragState({ draggedItemId: current.itemId, overItemId: null, overDay: targetDay });
          event.preventDefault();
        }
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      const current = touchDragRef.current;
      if (!current || current.touchId === undefined) return;
      const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === current.touchId);
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      const targetItemId = itemRow?.dataset.itemId;
      const targetDay = dayRow?.dataset.dayDrop;
      if (targetItemId && targetItemId !== current.itemId) onMoveItem(current.itemId, targetItemId);
      else if (targetDay) onMoveItemToDay(current.itemId, targetDay);
      clearDragPreview();
    }

    function cancelTouch(event: TouchEvent) {
      const current = touchDragRef.current;
      if (!current || current.touchId === undefined) return;
      const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === current.touchId);
      if (touch) clearDragPreview();
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", cancelPointer);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", cancelTouch);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", cancelPointer);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", cancelTouch);
    };
  }, [canRestructureItems, onMoveItem, onMoveItemToDay]);

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
      <div className={itineraryFilterShellClassName}>
        <div className={itineraryFilterBarClassName}>
          <button
            type="button"
            className={pathFilterButtonClassName}
            aria-controls="itinerary-plan-filters"
            aria-expanded={planFiltersExpanded}
            title={selectedFilterLabel}
            onClick={() => setPlanFiltersExpanded((current) => !current)}
          >
            <Icon name="chevronRight" />
            <span>{planFiltersExpanded ? t.itinerary.filters.hidePlans : t.itinerary.filters.showPlans}</span>
          </button>
          <span className={pathFilterSummaryClassName}>{selectedFilterLabel}</span>
        </div>
        {planFiltersExpanded ? (
          <div className={pathFilterPanelClassName} id="itinerary-plan-filters" role="region" aria-label={t.itinerary.filters.panelLabel}>
            {filterOptions.map((option) => (
              <label className={pathFilterOptionClassName} key={option.id}>
                <input
                  type="checkbox"
                  checked={selectedPathIdSet.has(option.id)}
                  onChange={() => togglePlanFilter(option.id)}
                />
                <span>{option.name}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
      <div className={tableScrollClassName} tabIndex={0} aria-label={t.itinerary.scrollLabel}>
        <table className={smartTableClassName} style={smartTableStyle}>
          <caption className="sr-only">{t.itinerary.caption}</caption>
          <colgroup>
            <col style={{ width: graphColumnWidth }} />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>
                <span className="sr-only">Path graph</span>
              </th>
              <th>
                <span className="sr-only">{t.itinerary.headers.reorder}</span>
              </th>
              <th className={timeHeaderClassName}>{t.itinerary.headers.time}</th>
              <th>{t.itinerary.headers.activity}</th>
              <th>{t.itinerary.headers.type}</th>
              <th>{t.itinerary.headers.map}</th>
              <th>{t.itinerary.headers.transport}</th>
              <th>{t.itinerary.headers.actions}</th>
            </tr>
          </thead>
          {groups.map((group, groupIndex) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
              dragState={dragState}
              graphColumnWidth={graphColumnWidth}
              graphItems={graphItemsByDay.get(group.day) ?? []}
              group={group}
              hasTopSpacer={groupIndex > 0}
              itineraryLabels={t.itinerary}
              locale={locale}
              key={group.day}
              dailyBriefing={dailyBriefingsByDate.get(group.day) ?? null}
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
              onMoveItemToDay={onMoveItemToDay}
              onMoveItemToPath={onMoveItemToPath}
              onUpdateItemInline={onUpdateItemInline}
              onPreviewDayDrop={previewDayDrop}
              onPreviewDrop={previewDrop}
              onSelectItem={onSelectItem}
              onStartDrag={startDrag}
              onStartTouchDrag={startTouchDrag}
              onStartTouchGesture={startTouchGesture}
              onEditItem={onEditItem}
              onDeleteItem={setPendingDeleteItem}
              onEditDuration={openDurationEditor}
              onToggleDay={toggleDay}
            />
          ))}
        </table>
      </div>
      {pendingDeleteItem ? (
        <div className={deleteModalBackdropClassName} role="presentation">
          <section className={deleteDialogClassName} role="dialog" aria-modal="true" aria-labelledby="itinerary-delete-title">
            <h2 className={deleteDialogTitleClassName} id="itinerary-delete-title">{t.itinerary.row.confirmDeleteTitle({ activity: pendingDeleteItem.activity })}</h2>
            <p className={deleteDialogBodyClassName}>{t.itinerary.row.confirmDeleteBody({ activity: pendingDeleteItem.activity })}</p>
            <div className={deleteDialogActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => setPendingDeleteItem(null)}>{t.itinerary.row.confirmDeleteNo}</Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  onDeleteItem?.(pendingDeleteItem.id);
                  setPendingDeleteItem(null);
                }}
              >
                {t.itinerary.row.confirmDeleteYes}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
      {durationEditor ? (
        <div className={deleteModalBackdropClassName} role="presentation">
          <section className={durationDialogClassName} role="dialog" aria-modal="true" aria-labelledby="itinerary-duration-title">
            <h2 className={durationDialogTitleClassName} id="itinerary-duration-title">{t.itinerary.row.durationDialogTitle({ activity: durationEditor.item.activity })}</h2>
            <div className={durationPresetGridClassName}>
              {durationPresetMinutes.map((minutes) => (
                <button
                  type="button"
                  className={durationPresetButtonClassName}
                  key={minutes}
                  onClick={() => commitDuration(durationEditor.item.id, minutes)}
                >
                  {formatDuration(minutes, locale)}
                </button>
              ))}
            </div>
            <div className={durationCustomGridClassName}>
              <label className={durationInputLabelClassName}>
                {t.itinerary.row.durationHours}
                <input
                  className={durationInputClassName}
                  inputMode="numeric"
                  min={0}
                  type="number"
                  value={durationEditor.hours}
                  onChange={(event) => setDurationEditor((current) => current ? { ...current, hours: event.target.value } : current)}
                />
              </label>
              <label className={durationInputLabelClassName}>
                {t.itinerary.row.durationMinutes}
                <input
                  className={durationInputClassName}
                  inputMode="numeric"
                  max={59}
                  min={0}
                  type="number"
                  value={durationEditor.minutes}
                  onChange={(event) => setDurationEditor((current) => current ? { ...current, minutes: event.target.value } : current)}
                />
              </label>
            </div>
            <div className={deleteDialogActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => setDurationEditor(null)}>{t.itinerary.row.durationCancel}</Button>
              <Button type="button" onClick={commitCustomDuration}>{t.itinerary.row.durationSave}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function DayGroup({
  graphColumnWidth,
  graphItems,
  group,
  dailyBriefing,
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
  onMoveItemToDay,
  onMoveItemToPath,
  onUpdateItemInline,
  onPreviewDayDrop,
  onPreviewDrop,
  onSelectItem,
  onStartDrag,
  onStartTouchDrag,
  onStartTouchGesture,
  onEditItem,
  onDeleteItem,
  onEditDuration,
  onToggleDay,
}: {
  graphColumnWidth: number;
  graphItems: ItineraryItem[];
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  dailyBriefing: TripDailyBriefing | null;
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
  onMoveItemToDay: (draggedItemId: string, targetDay: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (itemId: string, patch: InlineItineraryItemPatch) => void | Promise<void>;
  onPreviewDayDrop: (event: DragEvent<HTMLElement>, targetDay: string) => void;
  onPreviewDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStartDrag: (event: DragEvent<HTMLButtonElement>, itemId: string) => void;
  onStartTouchDrag: (event: ReactPointerEvent<HTMLButtonElement>, itemId: string) => void;
  onStartTouchGesture: (event: ReactTouchEvent<HTMLButtonElement>, itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (item: ItineraryItem) => void;
  onEditDuration: (item: ItineraryItem) => void;
  onToggleDay: (day: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const dayPathOptions = pathOptions.filter((option) => option.id === mainItineraryPathId || option.scope === "trip" || option.day === group.day);
  const hasAlternativePathOptions = dayPathOptions.some((option) => option.id !== mainItineraryPathId);
  const samePathOverlapItemIds = findSamePathOverlapItemIds(group.items);
  const showGraph = !collapsed && (graphItems.length > 0 || group.items.length > 0);

  return (
    <tbody className={dayGroupClassName} data-state={collapsed ? "closed" : "open"}>
      {hasTopSpacer ? (
        <tr className={daySpacerRowClassName} aria-hidden="true">
          <td colSpan={8} />
        </tr>
      ) : null}
      <tr className={dayRowClassName}>
        {showGraph ? (
          <td className={graphCellClassName} rowSpan={Math.max(2, group.items.length + 2)}>
            <ActivityPathGraphDay
              canEdit={canEdit}
              day={group.day}
              dayLabel={dayA11yLabel}
              graphItems={graphItems}
              graphWidth={graphColumnWidth}
              pathOptions={pathOptions}
              rowItems={group.items}
              selectedItemId={selectedItemId}
              onMoveItemToPath={onMoveItemToPath}
              onSelectItem={onSelectItem}
            />
          </td>
        ) : null}
        <th colSpan={showGraph ? 7 : 8}>
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
            <DayWeatherChip briefing={dailyBriefing} dayLabel={dayA11yLabel} />
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
                    <InlineOptionPicker
                      buttonClassName={dayPathPickerClassName}
                      ariaLabel={`Path for ${dayA11yLabel}`}
                      value={dayPathOverride || mainItineraryPathId}
                      disabled={!canEdit || showAllPaths}
                      options={dayPathOptions.map((option) => ({ value: option.id, label: option.name }))}
                      onCommit={(pathId) => onChangeDayPath?.(group.day, pathId)}
                    />
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
      {!collapsed ? group.items.map((item, index) => {
        const moveUpTargetId = group.items[index - 1]?.id;
        const nextItem = group.items[index + 1];
        const moveDownTargetId = group.items[index + 2]?.id;

        return (
        <tr
          aria-label={itineraryLabels.row.openDetails({ activity: item.activity })}
          className={getRowClassName(item, selectedItemId, dragState, samePathOverlapItemIds)}
          data-item-id={item.id}
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
                onPointerDown={(event) => onStartTouchDrag(event, item.id)}
                onTouchStart={(event) => onStartTouchGesture(event, item.id)}
              >
                <Icon name="drag" />
              </button>
            </div>
          </td>
          <td className={timeCellClassName}>
            <span className={timeStackClassName}>
              <InlineTextField
                ariaLabel={itineraryLabels.row.inlineTime({ activity: item.activity })}
                canEdit={canEdit}
                className={inlineTimeInputClassName}
                itemValue={item.startTime}
                key={`${item.id}:time:${item.startTime}`}
                type="time"
                onCommit={(value) => onUpdateItemInline?.(item.id, { startTime: value })}
              />
              <button
                type="button"
                className={durationPillClassName}
                disabled={!canEdit}
                aria-label={(canEdit ? itineraryLabels.row.inlineDuration : itineraryLabels.row.duration)({ activity: item.activity })}
                onClick={() => onEditDuration(item)}
              >
                {formatDuration(item.durationMinutes, locale)}
              </button>
            </span>
          </td>
          <td className={activityCellClassName}>
            <div
              className={inlineActivityStackClassName}
              aria-label={itineraryLabels.row.select({ activity: item.activity })}
              onDragOver={(event) => onPreviewDrop(event, item.id)}
              onDrop={(event) => onDropItem(event, item.id)}
            >
              <button
                type="button"
                className={cn("sr-only", rowSelectClassName)}
                aria-pressed={selectedItemId === item.id}
                aria-label={itineraryLabels.row.select({ activity: item.activity })}
                tabIndex={collapsed ? -1 : undefined}
                onClick={() => onSelectItem(item.id)}
              />
              <InlineTextField
                ariaLabel={itineraryLabels.row.inlineActivity({ activity: item.activity })}
                canEdit={canEdit}
                className={inlineActivityFieldClassName}
                itemValue={item.activity}
                key={`${item.id}:activity:${item.activity}`}
                required
                onClick={() => onSelectItem(item.id)}
                onCommit={(value) => onUpdateItemInline?.(item.id, { activity: value })}
              />
              <InlineTextField
                ariaLabel={itineraryLabels.row.inlinePlace({ activity: item.activity })}
                canEdit={canEdit}
                className={inlineSubtleFieldClassName}
                itemValue={item.place}
                key={`${item.id}:place:${item.place}`}
                required
                onClick={() => onSelectItem(item.id)}
                onCommit={(value) => onUpdateItemInline?.(item.id, { place: value })}
              />
            </div>
          </td>
          <td>
            <InlineActivityTypeSelect
              activity={item.activity}
              ariaLabel={itineraryLabels.row.inlineType({ activity: item.activity })}
              canEdit={canEdit}
              key={`${item.id}:type:${item.activityType}`}
              locale={locale}
              value={item.activityType}
              onCommit={(activityType) => onUpdateItemInline?.(item.id, { activityType })}
            />
          </td>
          <td><a className={mapLinkClassName} href={mapHref(item)} tabIndex={collapsed ? -1 : undefined}>{mapLinkLabel(item, itineraryLabels.row.mapFallback)}</a></td>
          <td>
            <InlineTextField
              ariaLabel={itineraryLabels.row.inlineTransportation({ activity: item.activity })}
              canEdit={canEdit}
              className={inlineSubtleFieldClassName}
              itemValue={item.transportation}
              key={`${item.id}:transportation:${item.transportation}`}
              placeholder="—"
              onCommit={(value) => onUpdateItemInline?.(item.id, { transportation: value })}
            />
          </td>
          <td className={rowActionCellClassName}>
            <div className={rowActionsClassName}>
              <button
                type="button"
                className={rowActionButtonClassName}
                aria-label={itineraryLabels.row.moveUp({ activity: item.activity })}
                disabled={!canEdit || !moveUpTargetId}
                onClick={() => moveUpTargetId && onMoveItem(item.id, moveUpTargetId)}
              >
                <Icon name="chevronRight" className="-rotate-90" />
              </button>
              <button
                type="button"
                className={rowActionButtonClassName}
                aria-label={itineraryLabels.row.moveDown({ activity: item.activity })}
                disabled={!canEdit || !nextItem}
                onClick={() => {
                  if (!nextItem) return;
                  if (moveDownTargetId) {
                    onMoveItem(item.id, moveDownTargetId);
                    return;
                  }
                  onMoveItemToDay(item.id, item.day);
                }}
              >
                <Icon name="chevronRight" className="rotate-90" />
              </button>
              <button
                type="button"
                className={rowActionButtonClassName}
                aria-label={itineraryLabels.row.edit({ activity: item.activity })}
                disabled={!canEdit}
                onClick={() => onEditItem?.(item.id)}
              >
                <Icon name="edit" />
              </button>
              <button
                type="button"
                className={rowActionButtonClassName}
                aria-label={itineraryLabels.row.delete({ activity: item.activity })}
                disabled={!canEdit}
                onClick={() => onDeleteItem?.(item)}
              >
                <Icon name="trash" />
              </button>
            </div>
          </td>
        </tr>
        );
      }) : null}
      {!collapsed ? (
        <tr
          className={cn(addStopRowClassName, dragState.overDay === group.day && addStopRowDropTargetClassName)}
          data-day-drop={group.day}
          onDragOver={(event) => onPreviewDayDrop(event, group.day)}
          onDrop={(event) => onDropOnDay(event, group.day)}
        >
          <td colSpan={showGraph ? 7 : 8}>
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

function groupGraphItemsByDay(items: ItineraryItem[]): Map<string, ItineraryItem[]> {
  const itemsByDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    itemsByDay.set(item.day, [...(itemsByDay.get(item.day) ?? []), item]);
  }
  return itemsByDay;
}

function buildGraphColumnWidth(items: ItineraryItem[], pathOptions: ItineraryPathOption[]): number {
  const pathCountsByDay = new Map<string, Set<string>>();
  const planAPathId = findPlanAPathId(pathOptions);
  const itemsByDay = groupGraphItemsByDay(items);
  for (const [day, dayItems] of itemsByDay) {
    const dayPaths = pathCountsByDay.get(day) ?? new Set<string>([mainItineraryPathId]);
    dayItems.forEach((item, itemIndex) => {
      const pathId = item.pathRole === "alternative" ? item.pathId ?? item.id : mainItineraryPathId;
      dayPaths.add(shouldUseVisualPlanA(item, pathId, dayItems.slice(0, itemIndex)) ? planAPathId : pathId);
    });
    pathCountsByDay.set(day, dayPaths);
  }
  const laneCount = Math.max(1, ...Array.from(pathCountsByDay.values(), (paths) => paths.size));
  return Math.max(graphColumnMinWidth, graphColumnSidePadding * 2 + (laneCount - 1) * graphColumnLaneGap + 12);
}

function findPlanAPathId(pathOptions: ItineraryPathOption[]): string {
  return pathOptions.find((option) => option.id !== mainItineraryPathId && option.name.toLowerCase() === "plan a")?.id ?? "visual-plan-a";
}

function shouldUseVisualPlanA(item: ItineraryItem, pathId: string, earlierItems: ItineraryItem[]): boolean {
  return pathId === mainItineraryPathId && !item.pathGroupId && overlapsEarlierItem(item, earlierItems);
}

function overlapsEarlierItem(item: ItineraryItem, earlierItems: ItineraryItem[]): boolean {
  const interval = itemInterval(item);
  if (!interval) return false;
  return earlierItems.some((earlierItem) => {
    const earlierInterval = itemInterval(earlierItem);
    return Boolean(earlierInterval && interval.start < earlierInterval.end && earlierInterval.start < interval.end);
  });
}

function itemInterval(item: ItineraryItem): { start: number; end: number } | null {
  const start = parseTime(item.startTime);
  if (start === null) return null;
  return { start, end: start + (item.durationMinutes ?? 45) };
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

function DayWeatherChip({ briefing, dayLabel }: { briefing: TripDailyBriefing | null; dayLabel: string }) {
  if (!briefing) return null;
  const weather = briefing.weather;
  const condition = weatherGraphicLabel(weather?.conditionCode);
  return (
    <span
      className={dayWeatherChipClassName}
      aria-label={`Weather for ${dayLabel}: ${condition} ${formatWeatherTemp(weather?.temperatureMaxCelsius)} ${formatWeatherTemp(weather?.temperatureMinCelsius)}`}
      title={`${condition} ${formatWeatherTemp(weather?.temperatureMaxCelsius)} ${formatWeatherTemp(weather?.temperatureMinCelsius)}`}
    >
      <span aria-hidden="true">{weatherIconForCondition(weather?.conditionCode)}</span>
      {" "}
      <strong>{formatWeatherTemp(weather?.temperatureMaxCelsius)}</strong>
      {" "}
      <span>{formatWeatherTemp(weather?.temperatureMinCelsius)}</span>
    </span>
  );
}

function InlineTextField({
  ariaLabel,
  canEdit,
  className,
  itemValue,
  onClick,
  onCommit,
  placeholder,
  required = false,
  type = "text",
}: {
  ariaLabel: string;
  canEdit: boolean;
  className: string;
  itemValue: string;
  onClick?: () => void;
  onCommit: (value: string) => void | Promise<void>;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "time";
}) {
  const [value, setValue] = useState(itemValue);

  function commitValue() {
    if (!canEdit) return;
    const nextValue = type === "time" ? value : value.trim();
    if (required && nextValue.length === 0) {
      setValue(itemValue);
      return;
    }
    if (nextValue === itemValue) return;
    void onCommit(nextValue);
  }

  function cancelValue() {
    setValue(itemValue);
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={!canEdit && type === "time"}
      placeholder={placeholder}
      readOnly={!canEdit && type !== "time"}
      type={type}
      value={value}
      onBlur={commitValue}
      onChange={(event) => setValue(event.target.value)}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commitValue();
          event.currentTarget.blur();
          return;
        }
        if (event.key === "Escape") {
          cancelValue();
          event.preventDefault();
        }
      }}
    />
  );
}

interface InlineOptionPickerOption {
  label: string;
  value: string;
}

function InlineOptionPicker({
  ariaLabel,
  buttonClassName,
  disabled,
  onCommit,
  optionKeyPrefix = "option",
  options,
  value,
}: {
  ariaLabel: string;
  buttonClassName?: string;
  disabled?: boolean;
  onCommit: (value: string) => void | Promise<void>;
  optionKeyPrefix?: string;
  options: InlineOptionPickerOption[];
  value: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [position, setPosition] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 180 });
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = Math.min(260, options.length * 34 + 8);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const top = spaceBelow >= menuHeight ? rect.bottom + 6 : Math.max(8, rect.top - menuHeight - 6);
      setPosition({
        left: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - Math.max(rect.width, 180) - 8)),
        top,
        width: Math.max(rect.width, 180),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => menuRef.current?.focus());
  }, [open]);

  function openMenu() {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function commitOption(option: InlineOptionPickerOption) {
    if (option.value !== value) void onCommit(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(inlineOptionPickerButtonClassName, buttonClassName)}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu();
          }
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? "—"}</span>
        <span className={inlineOptionPickerCaretClassName} aria-hidden="true">⌄</span>
      </button>
      {open ? createPortal(
        <div
          ref={menuRef}
          className={floatingOptionMenuClassName}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${optionKeyPrefix}-${options[activeIndex]?.value ?? value}`}
          style={{ left: position.left, top: position.top, width: position.width }}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              buttonRef.current?.focus();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(options.length - 1, current + 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(0, current - 1));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const option = options[activeIndex];
              if (option) commitOption(option);
            }
          }}
        >
          {options.map((option, index) => (
            <div
              className={floatingOptionButtonClassName}
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex ? "true" : undefined}
              id={`${optionKeyPrefix}-${option.value}`}
              tabIndex={-1}
              key={`${optionKeyPrefix}-${option.value}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commitOption(option)}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              <span aria-hidden="true">{option.value === value ? "✓" : ""}</span>
            </div>
          ))}
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function InlineActivityTypeSelect({
  activity,
  ariaLabel,
  canEdit,
  locale,
  onCommit,
  value,
}: {
  activity: string;
  ariaLabel: string;
  canEdit: boolean;
  locale: Locale;
  onCommit: (value: ActivityType) => void | Promise<void>;
  value: ActivityType;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={ariaLabel}
      buttonClassName=""
      disabled={!canEdit}
      value={value}
      options={activityTypeOptions.map((option) => ({ value: option, label: activityTypeLabel(option, locale) }))}
      optionKeyPrefix={activity}
      onCommit={(nextValue) => {
        if (nextValue !== value) void onCommit(nextValue as ActivityType);
      }}
    />
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

function mapHref(item: ItineraryItem): string {
  /* v8 ignore next */
  return item.mapLink || "#";
}

function mapLinkLabel(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.linkLabel || fallback;
}

function dedupePathOptions(pathOptions: ItineraryPathOption[], items: ItineraryItem[]): { id: string; name: string }[] {
  const optionsById = new Map<string, { id: string; name: string }>();
  pathOptions.forEach((option) => {
    optionsById.set(option.id, { id: option.id, name: option.name });
  });
  items.forEach((item) => {
    const pathId = itineraryItemPathId(item);
    if (!optionsById.has(pathId)) {
      optionsById.set(pathId, { id: pathId, name: item.pathName ?? (pathId === mainItineraryPathId ? "Main" : pathId) });
    }
  });
  if (!optionsById.has(mainItineraryPathId)) {
    optionsById.set(mainItineraryPathId, { id: mainItineraryPathId, name: "Main" });
  }
  return Array.from(optionsById.values());
}

function formatSelectedPlanLabel(
  filterOptions: { id: string; name: string }[],
  selectedPathIds: string[],
  countLabel: ({ count }: { count: number }) => string,
  namesLabel: ({ names }: { names: string }) => string,
): string {
  const selectedNames = filterOptions
    .filter((option) => selectedPathIds.includes(option.id))
    .map((option) => option.name);
  if (selectedNames.length === 0) return countLabel({ count: 0 });
  if (selectedNames.length <= 2) return namesLabel({ names: selectedNames.join(", ") });
  return namesLabel({ names: `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2}` });
}
