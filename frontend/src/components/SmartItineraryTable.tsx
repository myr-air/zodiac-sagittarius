import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type Dispatch,
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import type {
  ActivityType,
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryItemStatus,
  ItineraryTimeMode,
  ItineraryItem,
  PlanVariant,
  TripDailyBriefing,
  TripRole,
} from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import {
  formatDayLabel,
  getTimeWindowInterval,
  getTripDates,
  groupItemsByDay,
  mainItineraryPathId,
  parseTime,
  type ItineraryDayGroup,
  type ItineraryPathOption,
  type ItineraryView,
} from "@/src/trip/itinerary";
import { safeExternalHref } from "@/src/trip/safe-links";
import {
  formatWeatherTemp,
  weatherGraphicLabel,
  weatherIconForCondition,
} from "@/src/trip/weather-briefings";
import { Button } from "./ui";
import { Icon } from "./icons";
import { formatTripRange, PageHeader } from "./PageHeader";
import {
  activityTypeLabel,
  dayRouteLabel,
  formatDuration,
  formatTimeWindow,
  formatThaiDate,
} from "./itineraryDisplay";
import { ActivityPathGraphDay } from "./ActivityPathGraphDay";
import { TimePickerField } from "./DateTimePickers";

interface SmartItineraryTableProps {
  canRedo: boolean;
  canRestructure?: boolean;
  canUndo: boolean;
  contextRailOpen: boolean;
  endDate: string;
  graphItems?: ItineraryItem[];
  items: ItineraryItem[];
  dailyBriefings?: TripDailyBriefing[];
  tripSheets: PlanVariant[];
  selectedTripSheetId: string;
  tripSheetError: string | null;
  isTripSheetBusy: boolean;
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
  onMoveItemIntoPlanBlock: (draggedItemId: string, planBlockItemId: string) => void;
  onMoveItemToDay: (draggedItemId: string, targetDay: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onExportItinerary: () => void;
  onImportItinerary: (file: File) => void;
  onChangeTripSheet: (sheetId: string) => boolean | void | Promise<boolean | void>;
  onCreateTripSheet: (name: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPath?: (pathId: string) => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onClearAllDayPaths?: () => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
  onUndo: () => void;
}

export type InlineItineraryItemPatch = Partial<
  Pick<
    ItineraryItem,
    | "parentItemId"
    | "startTime"
    | "endTime"
    | "endOffsetDays"
    | "durationMinutes"
    | "activity"
    | "place"
    | "activityType"
    | "itemKind"
    | "timeMode"
    | "status"
    | "priority"
    | "transportation"
  >
>;

const tablePanelClassName =
  "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:pb-3";
const pageHeaderActionsClassName =
  "page-header-actions relative z-[1] flex max-w-[260px] min-w-0 flex-wrap items-center justify-end gap-2";
const pageHeaderNoteClassName =
  "page-header-note m-0 basis-full text-right text-xs font-bold text-(--color-warning-strong)";
const tripSheetShellClassName =
  "trip-sheet-shell mb-3 flex min-w-0 flex-wrap items-end gap-2 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-primary-soft)_100%)] px-3 py-2.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
const tripSheetFieldClassName =
  "grid min-w-[220px] flex-1 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripSheetSelectClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 text-sm font-bold text-(--color-text) outline-none focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripSheetCreateFormClassName =
  "trip-sheet-create-form flex min-w-[260px] flex-wrap items-end gap-2";
const tripSheetNameFieldClassName =
  "grid min-w-[180px] flex-1 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripSheetNameInputClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripSheetButtonClassName =
  "min-h-9 rounded-(--radius-sm) px-3 text-xs font-extrabold";
const tripSheetSecondaryButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold text-(--color-text-muted) transition-colors hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
const tripSheetMessageClassName =
  "m-0 basis-full text-xs font-bold text-(--color-warning-strong)";
const itineraryFilterShellClassName =
  "itinerary-filter-shell -mt-1 mb-[14px] grid gap-2 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] px-3 py-2.5 text-(--color-route) shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
const itineraryFilterBarClassName =
  "itinerary-filter-bar flex min-w-0 flex-wrap items-center gap-2";
const pathFilterButtonClassName =
  "inline-flex min-h-8 min-w-[148px] items-center justify-center gap-2 rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) px-2.5 text-xs font-extrabold text-(--color-primary-strong) transition-[background,border-color,color] duration-150 hover:border-(--color-primary) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) aria-[expanded=true]:border-(--color-primary-border) aria-[expanded=true]:bg-(--color-primary-soft) aria-[expanded=true]:text-(--color-primary-strong) [&_.icon]:size-4 [&_.icon]:transition-transform [&_.icon]:duration-[150ms] aria-[expanded=true]:[&_.icon]:rotate-90";
const pathFilterSummaryClassName =
  "min-w-0 flex-1 truncate text-xs font-semibold text-(--color-text-muted)";
const showAllPathsToggleClassName =
  "show-all-paths-toggle inline-flex min-h-8 items-center gap-2 rounded-(--radius-sm) border border-(--color-route-border) bg-[rgb(255_255_255_/_0.72)] px-2.5 text-xs font-extrabold text-(--color-route) transition-[background,border-color,color] duration-150 hover:bg-(--color-route-soft) has-[:checked]:border-(--color-primary-border) has-[:checked]:bg-(--color-primary-soft) has-[:checked]:text-(--color-primary-strong) [&_input]:size-4 [&_input]:accent-[var(--color-primary)]";
const pathFilterPanelClassName =
  "itinerary-filter-panel flex min-w-0 flex-wrap gap-1.5 border-t border-(--color-route-border) pt-2";
const pathFilterOptionClassName =
  "inline-flex min-h-8 items-center gap-2 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-2.5 text-xs font-semibold text-(--color-route) hover:border-(--color-route-border) hover:bg-(--color-route-soft)";
const importInputClassName = "sr-only";
const tableScrollClassName =
  "table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [contain:paint]";
const smartTableClassName =
  "smart-table w-full min-w-[1080px] table-fixed border-collapse text-xs leading-4 text-(--color-text) [&_a]:text-(--color-route) [&_a]:underline [&_a]:underline-offset-2 [&_td:first-child]:px-0 [&_td:first-child]:text-center [&_td:nth-child(2)]:w-[38px] [&_td:nth-child(2)]:px-0 [&_td:nth-child(2)]:text-center [&_td:nth-child(3)]:w-[88px] [&_td:nth-child(5)]:w-[94px] [&_td:nth-child(6)]:w-[124px] [&_td:nth-child(7)]:w-[108px] [&_td:nth-child(8)]:w-[148px] [&_td:nth-child(8)]:border-r-0 [&_td]:h-10 [&_td]:border-b [&_td]:border-r [&_td]:border-(--color-border) [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:text-left [&_td]:align-middle [&_th:first-child]:px-0 [&_th:first-child]:text-center [&_th:nth-child(2)]:w-[38px] [&_th:nth-child(2)]:px-0 [&_th:nth-child(2)]:text-center [&_th:nth-child(3)]:w-[88px] [&_th:nth-child(5)]:w-[94px] [&_th:nth-child(6)]:w-[124px] [&_th:nth-child(7)]:w-[108px] [&_th:nth-child(8)]:w-[148px] [&_th:nth-child(8)]:border-r-0 [&_th]:h-9 [&_th]:border-b [&_th]:border-r [&_th]:border-(--color-border-strong) [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:align-middle [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:h-12 [&_thead_th]:bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98)_0%,rgb(239_246_255_/_0.94)_100%)] [&_thead_th]:text-xs [&_thead_th]:font-[800] [&_thead_th]:text-(--color-text) [&_thead_th]:shadow-[inset_0_-1px_0_var(--color-route-border)]";
const graphColumnMinWidth = 30;
const graphColumnSidePadding = 9;
const graphColumnLaneGap = 18;
const dayGroupClassName = "day-group";
const daySpacerRowClassName =
  "day-spacer-row [&_td]:!h-3 [&_td]:!border-0 [&_td]:!bg-(--color-page) [&_td]:!p-0";
const dayRowClassName =
  "day-row [&_th]:h-[39px] [&_th]:bg-(--color-surface-subtle) [&_th]:px-2.5 [&_th]:py-0 [&_th]:shadow-[inset_0_-1px_0_var(--color-border-strong)]";
const dayRowContentClassName =
  "day-row-content flex h-[39px] w-full min-w-0 items-center gap-[9px]";
const dayToggleClassName =
  "day-toggle flex min-h-8 min-w-0 items-center gap-[9px] border-0 bg-transparent p-0 text-left text-(--color-text-muted) aria-[expanded=true]:[&_.icon]:rotate-90 [&_.icon]:transition-transform [&_.icon]:duration-[140ms] [&_strong]:text-(--color-text)";
const dayRouteClassName =
  "day-route ml-[18px] font-semibold text-(--color-text-muted) max-[767px]:hidden";
const dayWeatherChipClassName =
  "day-weather-chip inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route-soft) px-2 text-[11px] font-extrabold text-(--color-route) [&_strong]:text-(--color-text)";
const dayPathControlsClassName =
  "ml-auto inline-flex min-w-0 items-center gap-2 max-[767px]:ml-2 max-[767px]:shrink-0";
const dayPathPickerClassName =
  "min-h-8 max-w-[172px] px-2 text-[11px] max-[767px]:max-w-[112px]";
const dayClearPathButtonClassName =
  "inline-flex min-h-8 items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-text-muted) disabled:opacity-40 max-[767px]:px-1.5";
const dataRowClassName =
  "data-row cursor-pointer transition-[background,box-shadow,transform] duration-[160ms] hover:[&_td]:bg-(--color-surface-subtle) focus-visible:[&_td]:bg-(--color-route-soft) focus-visible:[&_td]:shadow-[inset_0_0_0_2px_var(--color-route-border)] [&_td]:transition-[background,border-color,box-shadow,color,font-size,height,opacity,padding] [&_td]:duration-[180ms]";
const dataRowSelectedClassName =
  "data-row--selected [&_td:first-child]:shadow-[inset_3px_0_0_var(--color-primary),inset_0_1px_0_var(--color-primary-border),inset_0_-1px_0_var(--color-primary-border)] [&_td:last-child]:shadow-[inset_-1px_0_0_var(--color-primary-border),inset_0_1px_0_var(--color-primary-border),inset_0_-1px_0_var(--color-primary-border)] [&_td]:bg-(--color-primary-soft) [&_td]:shadow-[inset_0_1px_0_var(--color-primary-border),inset_0_-1px_0_var(--color-primary-border)]";
const dataRowPathOverlapClassName =
  "data-row--path-overlap [&_td]:!bg-(--color-danger-soft) hover:[&_td]:!bg-(--color-danger-soft) [&_td:first-child]:shadow-[inset_2px_0_0_var(--color-danger-border)] [&_td:last-child]:shadow-[inset_-1px_0_0_var(--color-danger-border)] [&_td]:shadow-[inset_0_1px_0_var(--color-danger-border),inset_0_-1px_0_var(--color-danger-border)]";
const dataRowDraggingClassName =
  "data-row--dragging cursor-grabbing [&_td]:bg-(--color-surface-muted) [&_td]:opacity-[0.54]";
const dataRowDropTargetClassName =
  "data-row--drop-target translate-y-px [&_td:first-child]:shadow-[inset_3px_0_0_var(--color-route),inset_0_2px_0_var(--color-route),inset_0_-1px_0_var(--color-route-border)] [&_td]:bg-(--color-route-soft) [&_td]:shadow-[inset_0_2px_0_var(--color-route),inset_0_-1px_0_var(--color-route-border)]";
const dragCellClassName = "drag-cell text-(--color-text-subtle)";
const reorderControlsClassName =
  "reorder-controls inline-grid grid-cols-[32px] items-center justify-center";
const dragHandleClassName =
  "drag-handle inline-grid size-8 shrink-0 touch-none cursor-grab place-items-center rounded-(--radius-sm) border-0 bg-transparent text-(--color-text-subtle) transition-[color,background] duration-150 hover:not-disabled:bg-(--color-route-soft) hover:not-disabled:text-(--color-route) active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-[0.42]";
const rowActionCellClassName = "row-actions-cell";
const rowActionsClassName =
  "row-actions flex items-center justify-center gap-1";
const rowActionButtonClassName =
  "row-action-button inline-grid size-8 shrink-0 place-items-center rounded-(--radius-sm) border-0 bg-transparent text-(--color-text-subtle) transition-[color,background] duration-150 hover:not-disabled:bg-(--color-route-soft) hover:not-disabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-[0.42]";
const timeHeaderClassName =
  "time-header max-[767px]:sticky max-[767px]:left-0 max-[767px]:z-[5] max-[767px]:shadow-[6px_0_12px_rgb(15_23_42_/_0.08)]";
const timeCellClassName =
  "time-cell !text-center font-[650] tabular-nums text-(--color-text-muted) max-[767px]:sticky max-[767px]:left-0 max-[767px]:z-[4] max-[767px]:!bg-(--color-surface) max-[767px]:shadow-[6px_0_12px_rgb(15_23_42_/_0.08)]";
const timeStackClassName =
  "grid min-h-[30px] content-center justify-items-center gap-0.5 leading-none [&_span]:whitespace-nowrap";
const durationPillClassName =
  "duration-pill inline-flex min-h-8 min-w-8 max-w-full items-center justify-center rounded-full border border-transparent bg-transparent px-1.5 text-[10px] font-[750] leading-3 text-(--color-text-muted) transition-[background,border-color,color] duration-150 hover:not-disabled:border-(--color-route-border) hover:not-disabled:bg-(--color-route-soft) hover:not-disabled:text-(--color-route) focus-visible:border-(--color-route-border) focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-route) focus-visible:outline-none disabled:cursor-not-allowed disabled:text-(--color-text-muted)";
const activityCellClassName = "activity-cell min-w-0";
const rowSelectClassName =
  "row-select inline-flex min-h-8 w-fit min-w-0 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2 py-0.5 text-[11px] font-extrabold leading-4 text-(--color-route) transition-[background,border-color,color] duration-150 hover:bg-(--color-route-soft) hover:border-(--color-route-border) focus-visible:bg-(--color-route-soft) focus-visible:border-(--color-route-border) focus-visible:outline-none";
const inlineActivityStackClassName = "grid min-w-0 gap-0.5";
const childActivityStackClassName = "border-l-2 border-(--color-route-border) pl-3";
const hierarchyMetaClassName =
  "inline-flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-extrabold leading-4 text-(--color-text-muted)";
const hierarchyChipClassName =
  "inline-flex min-h-5 items-center gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 text-[10px] font-extrabold text-(--color-text-muted) [&_.icon]:size-3";
const blockHierarchyChipClassName =
  "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
const commitmentChipClassName =
  "border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-border))] bg-(--color-primary-soft) text-(--color-primary-strong)";
const blockToggleButtonClassName =
  "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route-soft) px-2 text-[11px] font-extrabold text-(--color-route) aria-expanded:[&_.icon]:rotate-90 [&_.icon]:size-3.5 [&_.icon]:transition-transform";
const blockDropButtonClassName =
  "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-(--radius-sm) border border-dashed border-(--color-route-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-route) transition-[background,border-color,box-shadow] data-[active=true]:bg-(--color-route-soft) data-[active=true]:shadow-[0_0_0_2px_rgb(186_230_253_/_0.72)] disabled:cursor-not-allowed disabled:opacity-50";
const inlineFieldClassName =
  "inline-row-field min-h-[24px] w-full min-w-0 rounded-(--radius-sm) border border-transparent bg-transparent px-1.5 py-0 text-xs leading-4 text-(--color-text) outline-none transition-[background,border-color,box-shadow] duration-150 placeholder:text-(--color-text-muted) hover:not-read-only:border-(--color-border) hover:not-read-only:bg-(--color-surface) focus:border-(--color-primary-border) focus:bg-(--color-surface) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] read-only:cursor-pointer read-only:truncate read-only:px-0 read-only:font-semibold disabled:cursor-not-allowed disabled:text-(--color-text-muted)";
const inlineActivityFieldClassName = cn(inlineFieldClassName, "font-semibold");
const inlineSubtleFieldClassName = cn(
  inlineFieldClassName,
  "text-[11px] text-(--color-text-muted)",
);
const inlineTimeInputClassName = cn(
  inlineFieldClassName,
  "text-center font-[650] tabular-nums",
);
const timeWindowInlineClassName =
  "inline-flex w-full min-w-0 items-center justify-center gap-0.5";
const timeWindowSeparatorClassName =
  "shrink-0 text-[10px] font-black leading-none text-(--color-text-subtle)";
const endOffsetToggleClassName =
  "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent px-1 text-[10px] font-black leading-none text-(--color-text-muted) transition-[background,border-color,color] duration-150 hover:not-disabled:border-(--color-route-border) hover:not-disabled:bg-(--color-route-soft) hover:not-disabled:text-(--color-route) focus-visible:border-(--color-route-border) focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-route) focus-visible:outline-none aria-pressed:border-(--color-route-border) aria-pressed:bg-(--color-route-soft) aria-pressed:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-40";
const inlineOptionPickerButtonClassName = cn(
  inlineFieldClassName,
  "inline-option-picker-button inline-flex !min-h-8 items-center justify-between gap-2 text-left font-semibold",
);
const inlineOptionPickerCaretClassName = "shrink-0 text-(--color-text-subtle)";
const floatingOptionMenuClassName =
  "inline-option-picker-menu fixed z-[15] grid max-h-[min(260px,calc(100vh_-_24px))] overflow-auto rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-1 shadow-[0_10px_22px_rgb(15_23_42_/_0.12)]";
const floatingOptionButtonClassName =
  "grid min-h-8 w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_16px] items-center gap-2 rounded-(--radius-sm) px-2.5 py-1.5 text-left text-xs font-bold text-(--color-text) transition-colors hover:bg-(--color-route-soft) focus-visible:bg-(--color-route-soft) focus-visible:outline-none aria-selected:bg-(--color-route-soft) aria-selected:text-(--color-route) data-[active=true]:bg-(--color-route-soft)";
const mapLinkClassName = "map-link text-(--color-route) underline underline-offset-2";
const addStopRowClassName =
  "add-stop-row [&_td]:border-b [&_td]:border-r [&_td]:border-dashed [&_td]:border-(--color-border) [&_td]:bg-(--color-surface-subtle) [&_td]:px-2.5 [&_td]:py-1";
const addStopRowDropTargetClassName =
  "add-stop-row--drop-target [&_td]:!bg-(--color-route-soft) [&_td]:shadow-[inset_0_0_0_2px_var(--color-route-border)]";
const addStopInlineButtonClassName =
  "inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-(--radius-sm) border border-dashed border-(--color-route-border) bg-[rgb(239_246_255_/_0.72)] px-3 text-[12px] font-extrabold text-(--color-route) transition-[background,border-color,color] duration-150 hover:enabled:bg-(--color-route-soft) disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-transparent disabled:text-(--color-text-subtle)";
const mobileInspectorClassName =
  "mobile-itinerary-inspector mt-3 hidden gap-4 rounded-t-(--radius-lg) rounded-b-(--radius-md) border border-(--color-border-strong) bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] p-4 shadow-[0_-4px_8px_rgb(15_23_42_/_0.08)] max-[767px]:sticky max-[767px]:bottom-0 max-[767px]:z-10 max-[767px]:grid";
const mobileInspectorHandleClassName =
  "mx-auto h-1.5 w-12 rounded-full bg-(--color-border-strong)";
const mobileInspectorHeaderClassName =
  "grid gap-1 border-b border-(--color-border) pb-3";
const mobileInspectorTitleClassName =
  "m-0 truncate border-l-[4px] border-(--color-route) pl-3 text-lg font-black leading-7 text-(--color-text)";
const mobileInspectorMetaClassName =
  "m-0 inline-flex flex-wrap items-center gap-2 pl-4 text-xs font-extrabold text-(--color-route)";
const mobileInspectorGridClassName = "grid grid-cols-2 gap-3";
const mobileInspectorWideClassName = "col-span-2";
const mobileInspectorLabelClassName =
  "grid gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const mobileInspectorFieldClassName = cn(
  inlineFieldClassName,
  "min-h-12 border-(--color-border) bg-(--color-surface-subtle) px-3 text-sm font-bold",
);
const mobileInspectorSubtleFieldClassName = cn(
  mobileInspectorFieldClassName,
  "text-(--color-text)",
);
const mobileInspectorTimeFieldClassName = cn(
  mobileInspectorFieldClassName,
  "text-left tabular-nums",
);
const mobileInspectorTimeWindowClassName = "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-1";
const mobileInspectorEndOffsetToggleClassName = cn(
  endOffsetToggleClassName,
  "h-12 min-w-12 border-(--color-border) bg-(--color-surface-subtle) text-xs",
);
const mobileInspectorTypeButtonClassName =
  "min-h-12 border-(--color-border) bg-(--color-surface-subtle) px-3 text-sm font-bold";
const mobileInspectorDurationClassName = "grid grid-cols-3 gap-2.5";
const mobileInspectorDurationButtonClassName =
  "min-h-12 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2 text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
const mobileInspectorActionsClassName = "flex flex-wrap gap-2";
const mobileInspectorActionButtonClassName =
  "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
const graphCellClassName =
  "activity-path-graph-cell !h-auto !bg-(--color-surface-subtle) !p-0 !align-top !shadow-none";
const deleteModalBackdropClassName =
  "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const deleteDialogClassName =
  "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]";
const deleteDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-(--color-danger)";
const deleteDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const deleteDialogActionsClassName = "mt-1 flex justify-end gap-2";
const durationDialogClassName =
  "duration-dialog fixed z-[30] grid w-[min(300px,calc(100vw-24px))] gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 shadow-[0_12px_28px_rgb(15_23_42_/_0.12)]";
const durationDialogTitleClassName =
  "m-0 text-sm font-extrabold leading-5 text-(--color-text)";
const durationPresetGridClassName = "grid grid-cols-3 gap-2";
const durationPresetButtonClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2 text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route)";
const durationCustomGridClassName = "grid grid-cols-2 gap-2";
const durationInputLabelClassName =
  "grid gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const durationInputClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-sm font-bold tabular-nums text-(--color-text) outline-none focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)]";
const activityTypeOptions: ActivityType[] = [
  "food",
  "attraction",
  "experience",
  "travel",
  "shopping",
  "stay",
];
const itineraryItemKindOptions: ItineraryItemKind[] = [
  "travel",
  "activity",
  "lodging",
  "meal",
  "note",
  "preparation",
  "foodRecommendation",
];
const itineraryTimeModeOptions: ItineraryTimeMode[] = ["scheduled", "flexible"];
const itineraryStatusOptions: ItineraryItemStatus[] = [
  "idea",
  "planned",
  "booked",
  "confirmed",
  "done",
  "skipped",
];
const itineraryPriorityOptions: ItineraryItemPriority[] = ["low", "normal", "high", "must"];
const durationPresetMinutes = [15, 30, 45, 60, 90, 120];

export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  graphItems,
  itineraryView,
  items,
  dailyBriefings = [],
  tripSheets,
  selectedTripSheetId,
  tripSheetError,
  isTripSheetBusy,
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
  onMoveItemIntoPlanBlock,
  onMoveItemToDay,
  onMoveItemToPath,
  onUpdateItemInline,
  onEditItem,
  onDeleteItem,
  onExportItinerary,
  onImportItinerary,
  onChangeTripSheet,
  onCreateTripSheet,
  onChangeDayPath,
  onClearDayPath,
  onToggleShowAllPaths,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const importInputRef = useRef<HTMLInputElement>(null);
  const allDisplayItems = graphItems ?? items;
  const filterOptions = dedupePathOptions(pathOptions, allDisplayItems);
  const canEdit = role === "owner" || role === "organizer" || role === "traveler";
  const canManageTripSheets = role === "owner" || role === "organizer";
  const canRestructureItems = canEdit && canRestructure;
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() =>
    filterOptions.map((option) => option.id),
  );
  const [planFiltersExpanded, setPlanFiltersExpanded] = useState(false);
  const [isCreatingTripSheet, setIsCreatingTripSheet] = useState(false);
  const [newTripSheetName, setNewTripSheetName] = useState("");
  const [newTripSheetError, setNewTripSheetError] = useState<string | null>(
    null,
  );
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [collapsedPlanBlockIds, setCollapsedPlanBlockIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{
    draggedItemId: string | null;
    overItemId: string | null;
    overDay: string | null;
    overBlockId: string | null;
  }>({ draggedItemId: null, overItemId: null, overDay: null, overBlockId: null });
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<ItineraryItem | null>(null);
  const [durationEditor, setDurationEditor] = useState<{
    item: ItineraryItem;
    hours: string;
    minutes: string;
  } | null>(null);
  const knownFilterIdsRef = useRef<string[]>(
    filterOptions.map((option) => option.id),
  );
  const touchDragRef = useRef<{
    itemId: string;
    pointerId?: number;
    touchId?: number;
  } | null>(null);
  const selectedPathIdSet = new Set(selectedPathIds);
  const displayItems = allDisplayItems.filter((item) =>
    selectedPathIdSet.has(itineraryItemPathId(item)),
  );
  const selectedItem =
    displayItems.find((item) => item.id === selectedItemId) ??
    allDisplayItems.find((item) => item.id === selectedItemId) ??
    null;
  const selectedFilterLabel = formatSelectedPlanLabel(
    filterOptions,
    selectedPathIds,
    t.itinerary.filters.selectedCount,
    t.itinerary.filters.selectedNames,
  );
  const groups = mergeTripDayGroups(
    groupItemsByDay(displayItems),
    startDate,
    endDate,
  );
  const dailyBriefingsByDate = useMemo(
    () => new Map(dailyBriefings.map((briefing) => [briefing.date, briefing])),
    [dailyBriefings],
  );
  const graphItemsByDay = groupGraphItemsByDay(displayItems);
  const warningCount =
    itineraryView?.warningCount ??
    displayItems.reduce(
      (total, item) => total + (item.advisories?.length ?? 0),
      0,
    );
  const totalMinutes = displayItems.reduce(
    (total, item) => total + (item.durationMinutes ?? 0),
    0,
  );
  const graphColumnWidth = buildGraphColumnWidth(displayItems, pathOptions);
  const smartTableStyle = {
    "--graph-column-width": `${graphColumnWidth}px`,
  } as CSSProperties;
  const selectedSheetId = tripSheets.some(
    (sheet) => sheet.id === selectedTripSheetId,
  )
    ? selectedTripSheetId
    : (tripSheets[0]?.id ?? "");
  const sheetControlsDisabled = !canManageTripSheets || isTripSheetBusy || tripSheets.length === 0;
  const tripSheetMessage = newTripSheetError ?? tripSheetError;

  useEffect(() => {
    setSelectedPathIds((current) => {
      const optionIds = filterOptions.map((option) => option.id);
      const previousOptionIds = knownFilterIdsRef.current;
      const nextIds = optionIds.filter(
        (id) => current.includes(id) || !previousOptionIds.includes(id),
      );
      knownFilterIdsRef.current = optionIds;
      return nextIds.length === current.length &&
        nextIds.every((id, index) => id === current[index])
        ? current
        : nextIds;
    });
  }, [filterOptions]);

  function toggleDay(day: string) {
    setCollapsedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function togglePlanBlock(itemId: string) {
    setCollapsedPlanBlockIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
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
    onUpdateItemInline?.(itemId, {
      durationMinutes: Math.max(1, Math.round(minutes)),
    });
    setDurationEditor(null);
  }

  function commitCustomDuration() {
    if (!durationEditor) return;
    const hours = Number(durationEditor.hours) || 0;
    const minutes = Number(durationEditor.minutes) || 0;
    commitDuration(durationEditor.item.id, hours * 60 + minutes);
  }

  function togglePlanFilter(pathId: string) {
    setSelectedPathIds((current) =>
      current.includes(pathId)
        ? current.filter((item) => item !== pathId)
        : [...current, pathId],
    );
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDragState({
      draggedItemId: itemId,
      overItemId: null,
      overDay: null,
      overBlockId: null,
    });
  }

  function startTouchDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    itemId: string,
  ) {
    if (!canRestructureItems || event.pointerType !== "pen") return;
    touchDragRef.current = { itemId, pointerId: event.pointerId };
    setDragState({
      draggedItemId: itemId,
      overItemId: null,
      overDay: null,
      overBlockId: null,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function startTouchGesture(
    event: ReactTouchEvent<HTMLButtonElement>,
    itemId: string,
  ) {
    if (!canRestructureItems) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchDragRef.current = { itemId, touchId: touch.identifier };
    setDragState({
      draggedItemId: itemId,
      overItemId: null,
      overDay: null,
      overBlockId: null,
    });
    event.preventDefault();
  }

  function previewDrop(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    const draggedItemId =
      dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId || draggedItemId === targetItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) =>
      current.overItemId === targetItemId && current.overDay === null
        ? current
        : {
            draggedItemId,
            overItemId: targetItemId,
            overDay: null,
            overBlockId: null,
          },
    );
  }

  function previewBlockDrop(
    event: DragEvent<HTMLElement>,
    planBlockItemId: string,
  ) {
    if (!canRestructureItems) return;
    const draggedItemId =
      dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId || draggedItemId === planBlockItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) =>
      current.overBlockId === planBlockItemId &&
      current.overItemId === null &&
      current.overDay === null
        ? current
        : {
            draggedItemId,
            overItemId: null,
            overDay: null,
            overBlockId: planBlockItemId,
          },
    );
  }

  function previewDayDrop(event: DragEvent<HTMLElement>, targetDay: string) {
    if (!canRestructureItems) return;
    const draggedItemId =
      dragState.draggedItemId ?? event.dataTransfer.getData("text/plain");
    if (!draggedItemId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragState((current) =>
      current.overDay === targetDay && current.overItemId === null
        ? current
        : {
            draggedItemId,
            overItemId: null,
            overDay: targetDay,
            overBlockId: null,
          },
    );
  }

  function dropItem(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (!canRestructureItems) return;
    event.preventDefault();
    const draggedItemId = event.dataTransfer.getData("text/plain");
    if (draggedItemId && draggedItemId !== targetItemId)
      onMoveItem(draggedItemId, targetItemId);
    clearDragPreview();
  }

  function dropIntoBlock(
    event: DragEvent<HTMLElement>,
    planBlockItemId: string,
  ) {
    if (!canRestructureItems) return;
    event.preventDefault();
    event.stopPropagation();
    const draggedItemId =
      event.dataTransfer.getData("text/plain") || dragState.draggedItemId;
    if (draggedItemId && draggedItemId !== planBlockItemId)
      onMoveItemIntoPlanBlock(draggedItemId, planBlockItemId);
    clearDragPreview();
  }

  function dropOnDay(event: DragEvent<HTMLElement>, targetDay: string) {
    if (!canRestructureItems) return;
    event.preventDefault();
    const draggedItemId =
      event.dataTransfer.getData("text/plain") || dragState.draggedItemId;
    if (draggedItemId) onMoveItemToDay(draggedItemId, targetDay);
    clearDragPreview();
  }

  function clearDragPreview() {
    setDragState({
      draggedItemId: null,
      overItemId: null,
      overDay: null,
      overBlockId: null,
    });
    touchDragRef.current = null;
  }

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const current = touchDragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const blockDrop = target?.closest<HTMLElement>("[data-plan-block-drop]");
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      if (blockDrop) {
        const targetBlockId = blockDrop.dataset.planBlockDrop;
        if (targetBlockId && targetBlockId !== current.itemId) {
          setDragState({
            draggedItemId: current.itemId,
            overItemId: null,
            overDay: null,
            overBlockId: targetBlockId,
          });
          event.preventDefault();
        }
        return;
      }
      if (itemRow) {
        const targetItemId = itemRow.dataset.itemId;
        if (targetItemId && targetItemId !== current.itemId) {
          setDragState({
            draggedItemId: current.itemId,
            overItemId: targetItemId,
            overDay: null,
            overBlockId: null,
          });
          event.preventDefault();
        }
        return;
      }
      if (dayRow) {
        const targetDay = dayRow.dataset.dayDrop;
        if (targetDay) {
          setDragState({
            draggedItemId: current.itemId,
            overItemId: null,
            overDay: targetDay,
            overBlockId: null,
          });
          event.preventDefault();
        }
      }
    }

    function handlePointerUp(event: PointerEvent) {
      const current = touchDragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const blockDrop = target?.closest<HTMLElement>("[data-plan-block-drop]");
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      const targetBlockId = blockDrop?.dataset.planBlockDrop;
      const targetItemId = itemRow?.dataset.itemId;
      const targetDay = dayRow?.dataset.dayDrop;
      if (targetBlockId && targetBlockId !== current.itemId)
        onMoveItemIntoPlanBlock(current.itemId, targetBlockId);
      else if (targetItemId && targetItemId !== current.itemId)
        onMoveItem(current.itemId, targetItemId);
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
      const touch = Array.from(event.changedTouches).find(
        (entry) => entry.identifier === current.touchId,
      );
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const blockDrop = target?.closest<HTMLElement>("[data-plan-block-drop]");
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      if (blockDrop) {
        const targetBlockId = blockDrop.dataset.planBlockDrop;
        if (targetBlockId && targetBlockId !== current.itemId) {
          setDragState({
            draggedItemId: current.itemId,
            overItemId: null,
            overDay: null,
            overBlockId: targetBlockId,
          });
          event.preventDefault();
        }
        return;
      }
      if (itemRow) {
        const targetItemId = itemRow.dataset.itemId;
        if (targetItemId && targetItemId !== current.itemId) {
          setDragState({
            draggedItemId: current.itemId,
            overItemId: targetItemId,
            overDay: null,
            overBlockId: null,
          });
          event.preventDefault();
        }
        return;
      }
      if (dayRow) {
        const targetDay = dayRow.dataset.dayDrop;
        if (targetDay) {
          setDragState({
            draggedItemId: current.itemId,
            overItemId: null,
            overDay: targetDay,
            overBlockId: null,
          });
          event.preventDefault();
        }
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      const current = touchDragRef.current;
      if (!current || current.touchId === undefined) return;
      const touch = Array.from(event.changedTouches).find(
        (entry) => entry.identifier === current.touchId,
      );
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const blockDrop = target?.closest<HTMLElement>("[data-plan-block-drop]");
      const itemRow = target?.closest<HTMLElement>("[data-item-id]");
      const dayRow = target?.closest<HTMLElement>("[data-day-drop]");
      const targetBlockId = blockDrop?.dataset.planBlockDrop;
      const targetItemId = itemRow?.dataset.itemId;
      const targetDay = dayRow?.dataset.dayDrop;
      if (targetBlockId && targetBlockId !== current.itemId)
        onMoveItemIntoPlanBlock(current.itemId, targetBlockId);
      else if (targetItemId && targetItemId !== current.itemId)
        onMoveItem(current.itemId, targetItemId);
      else if (targetDay) onMoveItemToDay(current.itemId, targetDay);
      clearDragPreview();
    }

    function cancelTouch(event: TouchEvent) {
      const current = touchDragRef.current;
      if (!current || current.touchId === undefined) return;
      const touch = Array.from(event.changedTouches).find(
        (entry) => entry.identifier === current.touchId,
      );
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
  }, [
    canRestructureItems,
    onMoveItem,
    onMoveItemIntoPlanBlock,
    onMoveItemToDay,
  ]);

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onImportItinerary(file);
    event.target.value = "";
  }

  async function submitNewTripSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripSheetBusy || !canManageTripSheets) return;
    const name = newTripSheetName.trim();
    if (!name) {
      setNewTripSheetError(t.itinerary.tripSheets.emptyName);
      return;
    }
    setNewTripSheetError(null);
    const created = await onCreateTripSheet(name);
    if (created === false) return;
    setNewTripSheetName("");
    setIsCreatingTripSheet(false);
  }

  return (
    <section
      className={tablePanelClassName}
      aria-label={t.itinerary.pageLabel}
      id="itinerary"
    >
      <PageHeader
        title={t.itinerary.title}
        subtitle={tripName}
        meta={
          <>
            <span>
              <Icon name="calendar" />{" "}
              {formatTripRange(startDate, endDate, locale)}
            </span>
            <span>
              <Icon name="route" />{" "}
              {t.itinerary.dayItems({
                days: groups.length,
                stops: items.length,
              })}
            </span>
            <span>
              <Icon name="warning" />{" "}
              {t.dates.warningCount({ count: warningCount })}
            </span>
            <span>
              <Icon name="clock" /> {formatDuration(totalMinutes, locale)}{" "}
              {t.dates.planned}
            </span>
          </>
        }
        aside={
          <div
            className={pageHeaderActionsClassName}
            role="group"
            aria-label={t.itinerary.actionsLabel}
          >
            <input
              ref={importInputRef}
              className={importInputClassName}
              type="file"
              accept="application/json,.json"
              aria-label={t.itinerary.importJsonInput}
              onChange={importFile}
            />
            <Button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={!canRestructureItems}
              className="import-itinerary-button min-w-[104px] !bg-(--color-primary) !shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] hover:enabled:!bg-(--color-primary-strong) max-[767px]:flex-1"
            >
              <Icon name="import" />
              {t.itinerary.import}
            </Button>
            <Button
              type="button"
              onClick={onExportItinerary}
              className="export-itinerary-button min-w-[104px] !bg-(--color-primary) !shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] hover:enabled:!bg-(--color-primary-strong) max-[767px]:flex-1"
            >
              <Icon name="export" />
              {t.itinerary.export}
            </Button>
            {!canEdit ? (
              <p className={pageHeaderNoteClassName}>
                {t.itinerary.editRequiresOrganizer}
              </p>
            ) : null}
          </div>
        }
      />
      <div className={tripSheetShellClassName}>
        <label className={tripSheetFieldClassName}>
          <span>{t.itinerary.tripSheets.selectorLabel}</span>
          <select
            className={tripSheetSelectClassName}
            value={selectedSheetId}
            disabled={sheetControlsDisabled}
            onChange={(event) => onChangeTripSheet(event.target.value)}
          >
            {tripSheets.map((sheet) => (
              <option value={sheet.id} key={sheet.id}>
                {sheet.name}
              </option>
            ))}
          </select>
        </label>
        {canManageTripSheets ? (
          isCreatingTripSheet ? (
            <form
              className={tripSheetCreateFormClassName}
              onSubmit={submitNewTripSheet}
            >
              <label className={tripSheetNameFieldClassName}>
                <span>{t.itinerary.tripSheets.nameLabel}</span>
                <input
                  className={tripSheetNameInputClassName}
                  value={newTripSheetName}
                  disabled={isTripSheetBusy}
                  placeholder={t.itinerary.tripSheets.namePlaceholder}
                  onChange={(event) => {
                    setNewTripSheetName(event.target.value);
                    setNewTripSheetError(null);
                  }}
                />
              </label>
              <Button
                type="submit"
                disabled={isTripSheetBusy}
                className={tripSheetButtonClassName}
              >
                {t.itinerary.tripSheets.createConfirm}
              </Button>
              <button
                type="button"
                className={tripSheetSecondaryButtonClassName}
                disabled={isTripSheetBusy}
                onClick={() => {
                  setIsCreatingTripSheet(false);
                  setNewTripSheetName("");
                  setNewTripSheetError(null);
                }}
              >
                {t.itinerary.tripSheets.createCancel}
              </button>
            </form>
          ) : (
            <Button
              type="button"
              disabled={isTripSheetBusy}
              className={tripSheetButtonClassName}
              onClick={() => setIsCreatingTripSheet(true)}
            >
              {t.itinerary.tripSheets.create}
            </Button>
          )
        ) : null}
        {isTripSheetBusy ? (
          <p className={tripSheetMessageClassName}>
            {t.itinerary.tripSheets.busy}
          </p>
        ) : tripSheetMessage ? (
          <p className={tripSheetMessageClassName}>{tripSheetMessage}</p>
        ) : null}
      </div>
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
            <span>
              {planFiltersExpanded
                ? t.itinerary.filters.hidePlans
                : t.itinerary.filters.showPlans}
            </span>
          </button>
          <span className={pathFilterSummaryClassName}>
            {selectedFilterLabel}
          </span>
          <label className={showAllPathsToggleClassName}>
            <input
              type="checkbox"
              checked={showAllPaths}
              disabled={!onToggleShowAllPaths}
              onChange={(event) => onToggleShowAllPaths?.(event.target.checked)}
            />
            <span>{t.itinerary.filters.showAllPaths}</span>
          </label>
        </div>
        {planFiltersExpanded ? (
          <div
            className={pathFilterPanelClassName}
            id="itinerary-plan-filters"
            role="region"
            aria-label={t.itinerary.filters.panelLabel}
          >
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
      <div
        className={tableScrollClassName}
        tabIndex={0}
        aria-label={t.itinerary.scrollLabel}
      >
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
              <th className={timeHeaderClassName}>
                {t.itinerary.headers.time}
              </th>
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
              collapsedPlanBlockIds={collapsedPlanBlockIds}
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
              onDropItem={dropItem}
              onDropIntoPlanBlock={dropIntoBlock}
              onDropOnDay={dropOnDay}
              onAddStop={onAddStop}
              onMoveItem={onMoveItem}
              onMoveItemIntoPlanBlock={onMoveItemIntoPlanBlock}
              onMoveItemToDay={onMoveItemToDay}
              onMoveItemToPath={onMoveItemToPath}
              onUpdateItemInline={onUpdateItemInline}
              onPreviewDayDrop={previewDayDrop}
              onPreviewBlockDrop={previewBlockDrop}
              onPreviewDrop={previewDrop}
              onSelectItem={onSelectItem}
              onStartDrag={startDrag}
              onStartTouchDrag={startTouchDrag}
              onStartTouchGesture={startTouchGesture}
              onEditItem={onEditItem}
              onDeleteItem={setPendingDeleteItem}
              durationEditor={durationEditor}
              onEditDuration={openDurationEditor}
              onSetDurationEditor={setDurationEditor}
              onCommitDuration={commitDuration}
              onCommitCustomDuration={commitCustomDuration}
              onToggleDay={toggleDay}
              onTogglePlanBlock={togglePlanBlock}
            />
          ))}
        </table>
      </div>
      {selectedItem ? (
        <MobileSelectedStopInspector
          canEdit={canEdit}
          item={selectedItem}
          itineraryLabels={t.itinerary}
          locale={locale}
          onDeleteItem={setPendingDeleteItem}
          onEditItem={onEditItem}
          onUpdateItemInline={onUpdateItemInline}
        />
      ) : null}
      {pendingDeleteItem ? (
        <div className={deleteModalBackdropClassName} role="presentation">
          <section
            className={deleteDialogClassName}
            role="dialog"
            aria-modal="true"
            aria-labelledby="itinerary-delete-title"
          >
            <h2
              className={deleteDialogTitleClassName}
              id="itinerary-delete-title"
            >
              {t.itinerary.row.confirmDeleteTitle({
                activity: pendingDeleteItem.activity,
              })}
            </h2>
            <p className={deleteDialogBodyClassName}>
              {t.itinerary.row.confirmDeleteBody({
                activity: pendingDeleteItem.activity,
              })}
            </p>
            <div className={deleteDialogActionsClassName}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingDeleteItem(null)}
              >
                {t.itinerary.row.confirmDeleteNo}
              </Button>
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
    </section>
  );
}

function MobileSelectedStopInspector({
  canEdit,
  item,
  itineraryLabels,
  locale,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onDeleteItem?: (item: ItineraryItem) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  return (
    <section
      className={mobileInspectorClassName}
      aria-label={itineraryLabels.mobileInspectorLabel}
    >
      <div className={mobileInspectorHandleClassName} aria-hidden="true" />
      <div className={mobileInspectorHeaderClassName}>
        <h2 className={mobileInspectorTitleClassName}>{item.activity}</h2>
        <p className={mobileInspectorMetaClassName}>
          <span>{formatTimeWindow(item)}</span>
          <span>·</span>
          <span>{formatDuration(item.durationMinutes, locale)}</span>
          <span>·</span>
          <span>{item.pathName ?? "Main"}</span>
        </p>
      </div>
      <div className={mobileInspectorGridClassName}>
        <label
          className={cn(
            mobileInspectorLabelClassName,
            mobileInspectorWideClassName,
          )}
        >
          {itineraryLabels.headers.activity}
          <InlineTextField
            ariaLabel={itineraryLabels.row.inlineActivity({
              activity: item.activity,
            })}
            canEdit={canEdit}
            className={mobileInspectorFieldClassName}
            itemValue={item.activity}
            key={`${item.id}:mobile-activity:${item.activity}`}
            required
            onCommit={(activity) => onUpdateItemInline?.(item.id, { activity })}
          />
        </label>
        <label
          className={cn(
            mobileInspectorLabelClassName,
            mobileInspectorWideClassName,
          )}
        >
          {itineraryLabels.headers.map}
          <InlineTextField
            ariaLabel={itineraryLabels.row.inlinePlace({
              activity: item.activity,
            })}
            canEdit={canEdit}
            className={mobileInspectorSubtleFieldClassName}
            itemValue={item.place}
            key={`${item.id}:mobile-place:${item.place}`}
            required
            onCommit={(place) => onUpdateItemInline?.(item.id, { place })}
          />
        </label>
        <span className={mobileInspectorLabelClassName}>
          {itineraryLabels.headers.time}
          <TimeWindowInlineEditor
            canEdit={canEdit}
            endInputClassName={mobileInspectorTimeFieldClassName}
            endOffsetToggleClassName={mobileInspectorEndOffsetToggleClassName}
            item={item}
            labels={itineraryLabels}
            startInputClassName={mobileInspectorTimeFieldClassName}
            wrapperClassName={mobileInspectorTimeWindowClassName}
            onUpdateItemInline={onUpdateItemInline}
          />
        </span>
        <span className={mobileInspectorLabelClassName}>
          {itineraryLabels.headers.type}
          <InlineActivityTypeSelect
            activity={`${item.id}-mobile`}
            ariaLabel={itineraryLabels.row.inlineType({
              activity: item.activity,
            })}
            buttonClassName={mobileInspectorTypeButtonClassName}
            canEdit={canEdit}
            locale={locale}
            value={item.activityType}
            onCommit={(activityType) =>
              onUpdateItemInline?.(item.id, { activityType })
            }
          />
        </span>
        <label
          className={cn(
            mobileInspectorLabelClassName,
            mobileInspectorWideClassName,
          )}
        >
          {itineraryLabels.headers.transport}
          <InlineTextField
            ariaLabel={itineraryLabels.row.inlineTransportation({
              activity: item.activity,
            })}
            canEdit={canEdit}
            className={mobileInspectorSubtleFieldClassName}
            itemValue={displayTransportation(item)}
            key={`${item.id}:mobile-transportation:${displayTransportation(item)}`}
            placeholder="—"
            onCommit={(transportation) => onUpdateItemInline?.(item.id, { transportation })}
          />
        </label>
      </div>
      <div className={mobileInspectorDurationClassName}>
        {durationPresetMinutes.map((minutes) => (
          <button
            type="button"
            className={mobileInspectorDurationButtonClassName}
            disabled={!canEdit}
            key={minutes}
            onClick={() =>
              onUpdateItemInline?.(item.id, { durationMinutes: minutes })
            }
          >
            {formatDuration(minutes, locale)}
          </button>
        ))}
      </div>
      <div className={mobileInspectorActionsClassName}>
        <button
          type="button"
          className={mobileInspectorActionButtonClassName}
          disabled={!canEdit}
          aria-label={itineraryLabels.row.edit({ activity: item.activity })}
          onClick={() => onEditItem?.(item.id)}
        >
          <Icon name="edit" />
          {itineraryLabels.headers.actions}
        </button>
        <button
          type="button"
          className={mobileInspectorActionButtonClassName}
          disabled={!canEdit}
          aria-label={itineraryLabels.row.delete({ activity: item.activity })}
          onClick={() => onDeleteItem?.(item)}
        >
          <Icon name="trash" />
          {itineraryLabels.row.confirmDeleteYes}
        </button>
      </div>
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
  collapsedPlanBlockIds,
  dragState,
  onClearDragPreview,
  onChangeDayPath,
  onClearDayPath,
  onDropItem,
  onDropIntoPlanBlock,
  onDropOnDay,
  onAddStop,
  onMoveItem,
  onMoveItemIntoPlanBlock,
  onMoveItemToDay,
  onMoveItemToPath,
  onUpdateItemInline,
  onPreviewDayDrop,
  onPreviewBlockDrop,
  onPreviewDrop,
  onSelectItem,
  onStartDrag,
  onStartTouchDrag,
  onStartTouchGesture,
  onEditItem,
  onDeleteItem,
  durationEditor,
  onEditDuration,
  onSetDurationEditor,
  onCommitDuration,
  onCommitCustomDuration,
  onToggleDay,
  onTogglePlanBlock,
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
  collapsedPlanBlockIds: string[];
  dragState: {
    draggedItemId: string | null;
    overItemId: string | null;
    overDay: string | null;
    overBlockId: string | null;
  };
  onClearDragPreview: () => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onDropItem: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onDropIntoPlanBlock: (
    event: DragEvent<HTMLElement>,
    planBlockItemId: string,
  ) => void;
  onDropOnDay: (event: DragEvent<HTMLElement>, targetDay: string) => void;
  onAddStop: (day?: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onMoveItemIntoPlanBlock: (
    draggedItemId: string,
    planBlockItemId: string,
  ) => void;
  onMoveItemToDay: (draggedItemId: string, targetDay: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onPreviewDayDrop: (event: DragEvent<HTMLElement>, targetDay: string) => void;
  onPreviewBlockDrop: (
    event: DragEvent<HTMLElement>,
    planBlockItemId: string,
  ) => void;
  onPreviewDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onStartDrag: (event: DragEvent<HTMLButtonElement>, itemId: string) => void;
  onStartTouchDrag: (
    event: ReactPointerEvent<HTMLButtonElement>,
    itemId: string,
  ) => void;
  onStartTouchGesture: (
    event: ReactTouchEvent<HTMLButtonElement>,
    itemId: string,
  ) => void;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (item: ItineraryItem) => void;
  durationEditor: {
    item: ItineraryItem;
    hours: string;
    minutes: string;
  } | null;
  onEditDuration: (item: ItineraryItem) => void;
  onSetDurationEditor: Dispatch<
    SetStateAction<{
      item: ItineraryItem;
      hours: string;
      minutes: string;
    } | null>
  >;
  onCommitDuration: (itemId: string, minutes: number) => void;
  onCommitCustomDuration: () => void;
  onToggleDay: (day: string) => void;
  onTogglePlanBlock: (itemId: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const dayPathOptions = pathOptions.filter(
    (option) =>
      option.id === mainItineraryPathId ||
      option.scope === "trip" ||
      option.day === group.day,
  );
  const hasAlternativePathOptions = dayPathOptions.some(
    (option) => option.id !== mainItineraryPathId,
  );
  const samePathOverlapItemIds = findSamePathOverlapItemIds(group.items);
  const visibleItems = visiblePlanBlockItems(group.items, collapsedPlanBlockIds);
  const showGraph =
    !collapsed && (graphItems.length > 0 || group.items.length > 0);

  return (
    <tbody
      className={dayGroupClassName}
      data-state={collapsed ? "closed" : "open"}
    >
      {hasTopSpacer ? (
        <tr className={daySpacerRowClassName} aria-hidden="true">
          <td colSpan={8} />
        </tr>
      ) : null}
      <tr className={dayRowClassName}>
        {showGraph ? (
          <td
            className={graphCellClassName}
            rowSpan={Math.max(2, visibleItems.length + 2)}
          >
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
              aria-label={
                collapsed
                  ? itineraryLabels.dayToggle.expand({ day: dayLabel })
                  : itineraryLabels.dayToggle.collapse({ day: dayLabel })
              }
              onClick={() => onToggleDay(group.day)}
            >
              <Icon name="chevronRight" />
              <strong>{dayLabel}</strong>
              <span>·</span>
              <span>{formatThaiDate(group.day, locale)}</span>
              <span className={dayRouteClassName}>
                {dayRouteLabel(group.day, locale)}
              </span>
            </button>
            <DayWeatherChip briefing={dailyBriefing} dayLabel={dayA11yLabel} />
            {hasAlternativePathOptions ? (
              <span className={dayPathControlsClassName}>
                <InlineOptionPicker
                  buttonClassName={dayPathPickerClassName}
                  ariaLabel={`Path for ${dayA11yLabel}`}
                  value={dayPathOverride || mainItineraryPathId}
                  disabled={!canEdit || showAllPaths}
                  options={dayPathOptions.map((option) => ({
                    value: option.id,
                    label: option.name,
                  }))}
                  onCommit={(pathId) =>
                    onChangeDayPath?.(group.day, pathId)
                  }
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
              </span>
            ) : null}
          </div>
        </th>
      </tr>
      {!collapsed
        ? visibleItems.map((item, index) => {
            const moveUpTargetId = visibleItems[index - 1]?.id;
            const nextItem = visibleItems[index + 1];
            const moveDownTargetId = visibleItems[index + 2]?.id;
            const isChild = Boolean(item.parentItemId);
            const childCount = item.isPlanBlock
              ? group.items.filter((candidate) => candidate.parentItemId === item.id).length
              : 0;
            const blockCollapsed = item.isPlanBlock && collapsedPlanBlockIds.includes(item.id);

            return (
              <tr
                aria-label={itineraryLabels.row.openDetails({
                  activity: item.activity,
                })}
                className={getRowClassName(
                  item,
                  selectedItemId,
                  dragState,
                  samePathOverlapItemIds,
                )}
                data-item-id={item.id}
                data-hierarchy-level={isChild ? 2 : 1}
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
                      aria-label={itineraryLabels.row.drag({
                        activity: item.activity,
                      })}
                      onDragEnd={onClearDragPreview}
                      onDragStart={(event) => onStartDrag(event, item.id)}
                      onPointerDown={(event) =>
                        onStartTouchDrag(event, item.id)
                      }
                      onTouchStart={(event) =>
                        onStartTouchGesture(event, item.id)
                      }
                    >
                      <Icon name="drag" />
                    </button>
                  </div>
                </td>
                <td className={timeCellClassName}>
                  <div className={timeStackClassName}>
                    <TimeWindowInlineEditor
                      canEdit={canEdit}
                      endInputClassName={inlineTimeInputClassName}
                      endOffsetToggleClassName={endOffsetToggleClassName}
                      item={item}
                      labels={itineraryLabels}
                      startInputClassName={inlineTimeInputClassName}
                      wrapperClassName={timeWindowInlineClassName}
                      onUpdateItemInline={onUpdateItemInline}
                    />
                    {item.endTime ? (
                      <span className="text-[11px] leading-none text-(--color-text-muted)">
                        {formatTimeWindow(item)}
                      </span>
                    ) : null}
                    <DurationEditorPopover
                      canEdit={canEdit}
                      editor={
                        durationEditor?.item.id === item.id
                          ? durationEditor
                          : null
                      }
                      item={item}
                      labels={itineraryLabels}
                      locale={locale}
                      onClose={() => onSetDurationEditor(() => null)}
                      onCommitCustomDuration={onCommitCustomDuration}
                      onCommitDuration={onCommitDuration}
                      onEditDuration={onEditDuration}
                      onSetDurationEditor={onSetDurationEditor}
                    />
                  </div>
                </td>
                <td className={activityCellClassName}>
                  <div
                    className={cn(inlineActivityStackClassName, isChild && childActivityStackClassName)}
                    aria-label={itineraryLabels.row.select({
                      activity: item.activity,
                    })}
                    onDragOver={(event) => onPreviewDrop(event, item.id)}
                    onDrop={(event) => onDropItem(event, item.id)}
                  >
                    <button
                      type="button"
                      className={rowSelectClassName}
                      aria-pressed={selectedItemId === item.id}
                      aria-label={itineraryLabels.row.select({
                        activity: item.activity,
                      })}
                      tabIndex={collapsed ? -1 : undefined}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <Icon name="panel" className="size-3.5" />
                      <span>{itineraryLabels.openDetails}</span>
                    </button>
                    {item.isPlanBlock ? (
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          className={blockToggleButtonClassName}
                          aria-expanded={!blockCollapsed}
                          onClick={(event) => {
                            event.stopPropagation();
                            onTogglePlanBlock(item.id);
                          }}
                        >
                          <Icon name="chevronRight" />
                          <span>
                            {blockCollapsed ? "Expand block" : "Collapse block"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={blockDropButtonClassName}
                          data-plan-block-drop={item.id}
                          data-active={
                            dragState.overBlockId === item.id
                              ? "true"
                              : undefined
                          }
                          disabled={!canEdit}
                          onDragOver={(event) =>
                            onPreviewBlockDrop(event, item.id)
                          }
                          onDrop={(event) =>
                            onDropIntoPlanBlock(event, item.id)
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            if (
                              dragState.draggedItemId &&
                              dragState.draggedItemId !== item.id
                            ) {
                              onMoveItemIntoPlanBlock(
                                dragState.draggedItemId,
                                item.id,
                              );
                              onClearDragPreview();
                            }
                          }}
                        >
                          <Icon name="plus" />
                          <span>Into block</span>
                        </button>
                      </div>
                    ) : null}
                    <InlineTextField
                      ariaLabel={itineraryLabels.row.inlineActivity({
                        activity: item.activity,
                      })}
                      canEdit={canEdit}
                      className={inlineActivityFieldClassName}
                      itemValue={item.activity}
                      key={`${item.id}:activity:${item.activity}`}
                      required
                      onClick={() => onSelectItem(item.id)}
                      onCommit={(value) =>
                        onUpdateItemInline?.(item.id, { activity: value })
                      }
                    />
                    <InlineTextField
                      ariaLabel={itineraryLabels.row.inlinePlace({
                        activity: item.activity,
                      })}
                      canEdit={canEdit}
                      className={inlineSubtleFieldClassName}
                      itemValue={item.place}
                      key={`${item.id}:place:${item.place}`}
                      required
                      onClick={() => onSelectItem(item.id)}
                      onCommit={(value) =>
                        onUpdateItemInline?.(item.id, { place: value })
                      }
                    />
                    <RowHierarchyMeta item={item} childCount={childCount} />
                  </div>
                </td>
                <td>
                  <div className={inlineActivityStackClassName}>
                    <InlineItemKindSelect
                      activity={item.activity}
                      canEdit={canEdit}
                      value={item.itemKind ?? "activity"}
                      onCommit={(itemKind) => onUpdateItemInline?.(item.id, { itemKind })}
                    />
                    <InlineActivityTypeSelect
                      activity={item.activity}
                      ariaLabel={itineraryLabels.row.inlineType({
                        activity: item.activity,
                      })}
                      canEdit={canEdit}
                      key={`${item.id}:type:${item.activityType}`}
                      locale={locale}
                      value={item.activityType}
                      onCommit={(activityType) =>
                        onUpdateItemInline?.(item.id, { activityType })
                      }
                    />
                    <InlineTimeModeSelect
                      activity={item.activity}
                      canEdit={canEdit}
                      value={item.timeMode ?? "scheduled"}
                      onCommit={(timeMode) =>
                        onUpdateItemInline?.(item.id, {
                          timeMode,
                          ...(timeMode === "flexible" ? { startTime: "", durationMinutes: null } : {}),
                        })
                      }
                    />
                  </div>
                </td>
                <td>
                  <a
                    className={mapLinkClassName}
                    href={mapHref(item)}
                    tabIndex={collapsed ? -1 : undefined}
                  >
                    {mapLinkLabel(item, itineraryLabels.row.mapFallback)}
                  </a>
                </td>
                <td>
                  <div className={inlineActivityStackClassName}>
                    <InlineTextField
                      ariaLabel={itineraryLabels.row.inlineTransportation({
                        activity: item.activity,
                      })}
                      canEdit={canEdit}
                      className={inlineSubtleFieldClassName}
                      itemValue={displayTransportation(item)}
                      key={`${item.id}:transportation:${displayTransportation(item)}`}
                      placeholder="—"
                      onCommit={(value) =>
                        onUpdateItemInline?.(item.id, { transportation: value })
                      }
                    />
                    <InlineStatusSelect
                      activity={item.activity}
                      canEdit={canEdit}
                      value={item.status ?? "idea"}
                      onCommit={(status) => onUpdateItemInline?.(item.id, { status })}
                    />
                    <InlinePrioritySelect
                      activity={item.activity}
                      canEdit={canEdit}
                      value={item.priority ?? "normal"}
                      onCommit={(priority) => onUpdateItemInline?.(item.id, { priority })}
                    />
                  </div>
                </td>
                <td className={rowActionCellClassName}>
                  <div className={rowActionsClassName}>
                    <button
                      type="button"
                      className={rowActionButtonClassName}
                      aria-label={itineraryLabels.row.moveUp({
                        activity: item.activity,
                      })}
                      disabled={!canEdit || !moveUpTargetId}
                      onClick={() =>
                        moveUpTargetId && onMoveItem(item.id, moveUpTargetId)
                      }
                    >
                      <Icon name="chevronRight" className="-rotate-90" />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClassName}
                      aria-label={itineraryLabels.row.moveDown({
                        activity: item.activity,
                      })}
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
                      aria-label={itineraryLabels.row.edit({
                        activity: item.activity,
                      })}
                      disabled={!canEdit}
                      onClick={() => onEditItem?.(item.id)}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClassName}
                      aria-label={itineraryLabels.row.delete({
                        activity: item.activity,
                      })}
                      disabled={!canEdit}
                      onClick={() => onDeleteItem?.(item)}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        : null}
      {!collapsed ? (
        <tr
          className={cn(
            addStopRowClassName,
            dragState.overDay === group.day && addStopRowDropTargetClassName,
          )}
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

function mergeTripDayGroups(
  groups: ItineraryDayGroup[],
  startDate: string,
  endDate: string,
): ItineraryDayGroup[] {
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

function visiblePlanBlockItems(items: ItineraryItem[], collapsedPlanBlockIds: string[]): ItineraryItem[] {
  const collapsed = new Set(collapsedPlanBlockIds);
  return items.filter((item) => !item.parentItemId || !collapsed.has(item.parentItemId));
}

function groupGraphItemsByDay(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const itemsByDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    itemsByDay.set(item.day, [...(itemsByDay.get(item.day) ?? []), item]);
  }
  return itemsByDay;
}

function buildGraphColumnWidth(
  items: ItineraryItem[],
  pathOptions: ItineraryPathOption[],
): number {
  const pathCountsByDay = new Map<string, Set<string>>();
  const planAPathId = findPlanAPathId(pathOptions);
  const itemsByDay = groupGraphItemsByDay(items);
  for (const [day, dayItems] of itemsByDay) {
    const dayPaths =
      pathCountsByDay.get(day) ?? new Set<string>([mainItineraryPathId]);
    dayItems.forEach((item, itemIndex) => {
      const pathId =
        item.pathRole === "alternative"
          ? (item.pathId ?? item.id)
          : mainItineraryPathId;
      dayPaths.add(
        shouldUseVisualPlanA(item, pathId, dayItems.slice(0, itemIndex))
          ? planAPathId
          : pathId,
      );
    });
    pathCountsByDay.set(day, dayPaths);
  }
  const laneCount = Math.max(
    1,
    ...Array.from(pathCountsByDay.values(), (paths) => paths.size),
  );
  return Math.max(
    graphColumnMinWidth,
    graphColumnSidePadding * 2 + (laneCount - 1) * graphColumnLaneGap + 12,
  );
}

function findPlanAPathId(pathOptions: ItineraryPathOption[]): string {
  return (
    pathOptions.find(
      (option) =>
        option.id !== mainItineraryPathId &&
        option.name.toLowerCase() === "plan a",
    )?.id ?? "visual-plan-a"
  );
}

function shouldUseVisualPlanA(
  item: ItineraryItem,
  pathId: string,
  earlierItems: ItineraryItem[],
): boolean {
  return (
    pathId === mainItineraryPathId &&
    !item.pathGroupId &&
    overlapsEarlierItem(item, earlierItems)
  );
}

function overlapsEarlierItem(
  item: ItineraryItem,
  earlierItems: ItineraryItem[],
): boolean {
  const interval = itemInterval(item);
  if (!interval) return false;
  return earlierItems.some((earlierItem) => {
    const earlierInterval = itemInterval(earlierItem);
    return Boolean(
      earlierInterval &&
      interval.start < earlierInterval.end &&
      earlierInterval.start < interval.end,
    );
  });
}

function itemInterval(
  item: ItineraryItem,
): { start: number; end: number } | null {
  const interval = getTimeWindowInterval(item);
  return interval ? { start: interval.start, end: interval.end } : null;
}

function getRowClassName(
  item: ItineraryItem,
  selectedItemId: string,
  dragState: {
    draggedItemId: string | null;
    overItemId: string | null;
    overDay: string | null;
    overBlockId: string | null;
  },
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

function DayWeatherChip({
  briefing,
  dayLabel,
}: {
  briefing: TripDailyBriefing | null;
  dayLabel: string;
}) {
  if (!briefing) return null;
  const weather = briefing.weather;
  const condition = weatherGraphicLabel(weather?.conditionCode);
  const high = weather?.temperatureMaxCelsius;
  const low = weather?.temperatureMinCelsius;
  const hasForecastTemps = typeof high === "number" && typeof low === "number";
  const weatherLabel = hasForecastTemps ? `${condition} ${formatWeatherTemp(high)} ${formatWeatherTemp(low)}` : condition;
  return (
    <span
      className={dayWeatherChipClassName}
      aria-label={`Weather for ${dayLabel}: ${weatherLabel}`}
      title={weatherLabel}
    >
      <span aria-hidden="true">
        <Icon name={weatherIconForCondition(weather?.conditionCode)} />
      </span>{" "}
      {hasForecastTemps ? (
        <>
          <strong>{formatWeatherTemp(high)}</strong>{" "}
          <span>{formatWeatherTemp(low)}</span>
        </>
      ) : <span>{condition}</span>}
    </span>
  );
}

function TimeWindowInlineEditor({
  canEdit,
  endInputClassName,
  endOffsetToggleClassName,
  item,
  labels,
  startInputClassName,
  wrapperClassName,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  endInputClassName: string;
  endOffsetToggleClassName: string;
  item: ItineraryItem;
  labels: Messages["itinerary"];
  startInputClassName: string;
  wrapperClassName: string;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const endOffsetDays = item.endOffsetDays ?? 0;
  const hasEndTime = Boolean(item.endTime);

  return (
    <span className={wrapperClassName}>
      <InlineTextField
        ariaLabel={labels.row.inlineTime({
          activity: item.activity,
        })}
        canEdit={canEdit}
        className={startInputClassName}
        itemValue={item.startTime}
        key={`${item.id}:time:${item.startTime}`}
        type="time"
        onCommit={(startTime) =>
          onUpdateItemInline?.(item.id, { startTime })
        }
      />
      <span className={timeWindowSeparatorClassName} aria-hidden="true">
        -
      </span>
      <InlineTextField
        ariaLabel={labels.row.inlineEndTime({
          activity: item.activity,
        })}
        canEdit={canEdit}
        className={endInputClassName}
        itemValue={item.endTime ?? ""}
        key={`${item.id}:end-time:${item.endTime ?? ""}`}
        type="time"
        onCommit={(endTime) =>
          onUpdateItemInline?.(
            item.id,
            endTime
              ? { endTime, endOffsetDays }
              : { endTime: null, endOffsetDays: 0 },
          )
        }
      />
      <button
        type="button"
        aria-label={labels.row.toggleNextDayEnd({
          activity: item.activity,
        })}
        aria-pressed={endOffsetDays > 0}
        className={endOffsetToggleClassName}
        disabled={!canEdit || !hasEndTime}
        onClick={() =>
          onUpdateItemInline?.(item.id, {
            endOffsetDays: endOffsetDays > 0 ? 0 : 1,
          })
        }
      >
        ⁺¹
      </button>
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
    type === "time" ? (
      <TimePickerField
        ariaLabel={ariaLabel}
        className={className}
        disabled={!canEdit}
        required={required}
        value={value}
        onBlur={commitValue}
        onChange={setValue}
        onSelect={(nextValue) => {
          if (nextValue !== itemValue) void onCommit(nextValue);
        }}
      />
    ) : (
      <input
        aria-label={ariaLabel}
        className={className}
        placeholder={placeholder}
        readOnly={!canEdit}
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
    )
  );
}

function DurationEditorPopover({
  canEdit,
  editor,
  item,
  labels,
  locale,
  onClose,
  onCommitCustomDuration,
  onCommitDuration,
  onEditDuration,
  onSetDurationEditor,
}: {
  canEdit: boolean;
  editor: {
    item: ItineraryItem;
    hours: string;
    minutes: string;
  } | null;
  item: ItineraryItem;
  labels: Messages["itinerary"];
  locale: Locale;
  onClose: () => void;
  onCommitCustomDuration: () => void;
  onCommitDuration: (itemId: string, minutes: number) => void;
  onEditDuration: (item: ItineraryItem) => void;
  onSetDurationEditor: Dispatch<
    SetStateAction<{
      item: ItineraryItem;
      hours: string;
      minutes: string;
    } | null>
  >;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({
    left: 8,
    top: 8,
    width: 300,
  });
  const durationLabel = (canEdit
    ? labels.row.inlineDuration
    : labels.row.duration)({
    activity: item.activity,
  });
  const title = labels.row.durationDialogTitle({ activity: item.activity });

  useEffect(() => {
    if (!editor) return;

    function updatePosition() {
      const triggerRect = buttonRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(300, viewportWidth - 16);
      const panelHeight = Math.min(
        panelRef.current?.getBoundingClientRect().height ?? 276,
        viewportHeight - 16,
      );
      const preferredLeft =
        triggerRect.left + triggerRect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(8, preferredLeft),
        Math.max(8, viewportWidth - width - 8),
      );
      const belowTop = triggerRect.bottom + 6;
      const aboveTop = triggerRect.top - panelHeight - 6;
      const hasSpaceBelow = belowTop + panelHeight <= viewportHeight - 8;
      const top = hasSpaceBelow
        ? belowTop
        : Math.min(
            Math.max(8, aboveTop),
            Math.max(8, viewportHeight - panelHeight - 8),
          );
      setPosition({ left, top, width });
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return;
      onClose();
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [editor, onClose]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={durationPillClassName}
        disabled={!canEdit}
        aria-expanded={editor ? "true" : "false"}
        aria-label={durationLabel}
        onClick={() => (editor ? onClose() : onEditDuration(item))}
      >
        {formatDuration(item.durationMinutes, locale)}
      </button>
      {editor
        ? createPortal(
            <section
              ref={panelRef}
              className={durationDialogClassName}
              role="region"
              aria-label={title}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onClose();
                  buttonRef.current?.focus();
                }
              }}
            >
              <h3 className={durationDialogTitleClassName}>{title}</h3>
              <div className={durationPresetGridClassName}>
                {durationPresetMinutes.map((minutes) => (
                  <button
                    type="button"
                    className={durationPresetButtonClassName}
                    key={minutes}
                    onClick={() => onCommitDuration(item.id, minutes)}
                  >
                    {formatDuration(minutes, locale)}
                  </button>
                ))}
              </div>
              <div className={durationCustomGridClassName}>
                <label className={durationInputLabelClassName}>
                  {labels.row.durationHours}
                  <input
                    className={durationInputClassName}
                    inputMode="numeric"
                    min={0}
                    type="number"
                    value={editor.hours}
                    onChange={(event) =>
                      onSetDurationEditor((current) =>
                        current
                          ? { ...current, hours: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>
                <label className={durationInputLabelClassName}>
                  {labels.row.durationMinutes}
                  <input
                    className={durationInputClassName}
                    inputMode="numeric"
                    max={59}
                    min={0}
                    type="number"
                    value={editor.minutes}
                    onChange={(event) =>
                      onSetDurationEditor((current) =>
                        current
                          ? { ...current, minutes: event.target.value }
                          : current,
                      )
                    }
                  />
                </label>
              </div>
              <div className={deleteDialogActionsClassName}>
                <Button type="button" variant="ghost" onClick={onClose}>
                  {labels.row.durationCancel}
                </Button>
                <Button type="button" onClick={onCommitCustomDuration}>
                  {labels.row.durationSave}
                </Button>
              </div>
            </section>,
            document.body,
          )
        : null}
    </>
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
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
  }>({ left: 0, top: 0, width: 180 });
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuHeight = Math.min(260, options.length * 34 + 8);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const top =
        spaceBelow >= menuHeight
          ? rect.bottom + 6
          : Math.max(8, rect.top - menuHeight - 6);
      setPosition({
        left: Math.min(
          Math.max(8, rect.left),
          Math.max(8, window.innerWidth - Math.max(rect.width, 180) - 8),
        ),
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
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
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
        <span className={inlineOptionPickerCaretClassName} aria-hidden="true">
          ⌄
        </span>
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className={floatingOptionMenuClassName}
              role="listbox"
              aria-label={ariaLabel}
              aria-activedescendant={`${optionKeyPrefix}-${options[activeIndex]?.value ?? value}`}
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
              }}
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  buttonRef.current?.focus();
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    Math.min(options.length - 1, current + 1),
                  );
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
                  <span aria-hidden="true">
                    {option.value === value ? "✓" : ""}
                  </span>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function InlineActivityTypeSelect({
  activity,
  ariaLabel,
  buttonClassName = "",
  canEdit,
  locale,
  onCommit,
  value,
}: {
  activity: string;
  ariaLabel: string;
  buttonClassName?: string;
  canEdit: boolean;
  locale: Locale;
  onCommit: (value: ActivityType) => void | Promise<void>;
  value: ActivityType;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={ariaLabel}
      buttonClassName={buttonClassName}
      disabled={!canEdit}
      value={value}
      options={activityTypeOptions.map((option) => ({
        value: option,
        label: activityTypeLabel(option, locale),
      }))}
      optionKeyPrefix={activity}
      onCommit={(nextValue) => {
        if (nextValue !== value) void onCommit(nextValue as ActivityType);
      }}
    />
  );
}

function RowHierarchyMeta({
  childCount,
  item,
}: {
  childCount: number;
  item: ItineraryItem;
}) {
  const status = item.status ?? "idea";
  const priority = item.priority ?? "normal";
  const showCommitment = status !== "idea" || priority === "must" || priority === "high";
  if (!item.isPlanBlock && !item.parentItemId && !showCommitment) return null;

  return (
    <div className={hierarchyMetaClassName} aria-label={`Structure for ${item.activity}`}>
      {item.isPlanBlock ? (
        <span className={cn(hierarchyChipClassName, blockHierarchyChipClassName)}>
          <Icon name="list" />
          Activity block · {childCount} sub-item{childCount === 1 ? "" : "s"}
        </span>
      ) : null}
      {item.parentItemId ? (
        <span className={hierarchyChipClassName}>
          <Icon name="chevronRight" />
          Sub-activity
        </span>
      ) : null}
      {showCommitment ? (
        <span className={cn(hierarchyChipClassName, commitmentChipClassName)}>
          <Icon name="check" />
          {status}
          {priority === "must" || priority === "high" ? ` · ${priority}` : ""}
        </span>
      ) : null}
    </div>
  );
}

function InlineItemKindSelect({
  activity,
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  canEdit: boolean;
  onCommit: (value: ItineraryItemKind) => void | Promise<void>;
  value: ItineraryItemKind;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Item kind for ${activity}`}
      disabled={!canEdit}
      value={value}
      options={itineraryItemKindOptions.map((option) => ({
        value: option,
        label: option === "foodRecommendation" ? "food rec" : option,
      }))}
      optionKeyPrefix={`${activity}-kind`}
      onCommit={(nextValue) => {
        if (nextValue !== value) void onCommit(nextValue as ItineraryItemKind);
      }}
    />
  );
}

function InlineTimeModeSelect({
  activity,
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  canEdit: boolean;
  onCommit: (value: ItineraryTimeMode) => void | Promise<void>;
  value: ItineraryTimeMode;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Time mode for ${activity}`}
      disabled={!canEdit}
      value={value}
      options={itineraryTimeModeOptions.map((option) => ({
        value: option,
        label: option,
      }))}
      optionKeyPrefix={`${activity}-time-mode`}
      onCommit={(nextValue) => {
        if (nextValue !== value) void onCommit(nextValue as ItineraryTimeMode);
      }}
    />
  );
}

function InlineStatusSelect({
  activity,
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  canEdit: boolean;
  onCommit: (value: ItineraryItemStatus) => void | Promise<void>;
  value: ItineraryItemStatus;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Status for ${activity}`}
      disabled={!canEdit}
      value={value}
      options={itineraryStatusOptions.map((option) => ({
        value: option,
        label: option,
      }))}
      optionKeyPrefix={`${activity}-status`}
      onCommit={(nextValue) => {
        if (nextValue !== value) void onCommit(nextValue as ItineraryItemStatus);
      }}
    />
  );
}

function InlinePrioritySelect({
  activity,
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  canEdit: boolean;
  onCommit: (value: ItineraryItemPriority) => void | Promise<void>;
  value: ItineraryItemPriority;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Priority for ${activity}`}
      disabled={!canEdit}
      value={value}
      options={itineraryPriorityOptions.map((option) => ({
        value: option,
        label: option,
      }))}
      optionKeyPrefix={`${activity}-priority`}
      onCommit={(nextValue) => {
        if (nextValue !== value) void onCommit(nextValue as ItineraryItemPriority);
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
      .map((item) => getTimeWindowInterval(item))
      .filter(
        (entry): entry is { item: ItineraryItem; start: number; end: number } =>
          entry !== null,
      )
      .sort(
        (left, right) =>
          left.start - right.start ||
          left.end - right.end ||
          left.item.sortOrder - right.item.sortOrder,
      );

    for (let leftIndex = 0; leftIndex < intervals.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < intervals.length;
        rightIndex += 1
      ) {
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
  return item.pathRole === "alternative"
    ? (item.pathId ?? item.id)
    : mainItineraryPathId;
}

function mapHref(item: ItineraryItem): string {
  /* v8 ignore next */
  return safeExternalHref(item.mapLink) || "#";
}

function mapLinkLabel(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.linkLabel || fallback;
}

function displayTransportation(item: ItineraryItem): string {
  if (item.transportation.trim()) return item.transportation;
  const details = item.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) return "";
  const mode = details.mode;
  if (typeof mode === "string" && mode.trim()) return mode;
  return "";
}

function dedupePathOptions(
  pathOptions: ItineraryPathOption[],
  items: ItineraryItem[],
): { id: string; name: string }[] {
  const optionsById = new Map<string, { id: string; name: string }>();
  pathOptions.forEach((option) => {
    optionsById.set(option.id, { id: option.id, name: option.name });
  });
  items.forEach((item) => {
    const pathId = itineraryItemPathId(item);
    if (!optionsById.has(pathId)) {
      optionsById.set(pathId, {
        id: pathId,
        name:
          item.pathName ?? (pathId === mainItineraryPathId ? "Main" : pathId),
      });
    }
  });
  if (!optionsById.has(mainItineraryPathId)) {
    optionsById.set(mainItineraryPathId, {
      id: mainItineraryPathId,
      name: "Main",
    });
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
  if (selectedNames.length <= 2)
    return namesLabel({ names: selectedNames.join(", ") });
  return namesLabel({
    names: `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2}`,
  });
}
