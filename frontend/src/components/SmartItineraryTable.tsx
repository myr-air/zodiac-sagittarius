import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
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
  PlanStatus,
  PlanVariant,
  TripDailyBriefing,
  TripRole,
  ValidationWarning,
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
  validateItineraryItem,
  type ItineraryDayGroup,
  type ItineraryPathOption,
  type ItineraryView,
} from "@/src/trip/itinerary";
import { canTripRole } from "@/src/trip/auth";
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
  formatThaiDate,
} from "./itineraryDisplay";
import { ActivityPathGraphDay } from "./ActivityPathGraphDay";
import { TimePickerField } from "./DateTimePickers";

interface SmartItineraryTableProps {
  canRedo: boolean;
  canRestructure?: boolean;
  canUndo: boolean;
  commitmentsByItemId?: Record<string, ItineraryCommitmentSummary>;
  contextRailOpen: boolean;
  endDate: string;
  graphItems?: ItineraryItem[];
  items: ItineraryItem[];
  dailyBriefings?: TripDailyBriefing[];
  tripPlans: PlanVariant[];
  selectedTripPlanId: string;
  mainTripPlanId: string;
  tripPlanError: string | null;
  isTripPlanBusy: boolean;
  role: TripRole;
  startDate: string;
  itineraryView?: ItineraryView;
  pathOptions?: ItineraryPathOption[];
  selectedItemId: string;
  selectedTripPathId?: string;
  dayPathOverrides?: Record<string, string | undefined>;
  showAllPaths?: boolean;
  tripName: string;
  onAddBookingForItem?: (
    itemId: string,
    template?: ItineraryBookingTemplate,
  ) => string | void | Promise<string | void>;
  onAddStop: (day?: string) => void;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string) => void;
  onAddTaskForItem?: (itemId: string) => void;
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
  onImportItineraryText?: (content: string, sourceName: string) => void | Promise<void>;
  onChangeTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => boolean | void | Promise<boolean | void>;
  onSetMainTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onCreateTripPlan: (name: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPath?: (pathId: string) => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onClearAllDayPaths?: () => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
  onUndo: () => void;
}

export type ItineraryBookingTemplate =
  | "recommended"
  | "flight"
  | "train"
  | "hotel"
  | "activity_ticket";

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
    | "isPlanBlock"
    | "itemKind"
    | "timeMode"
    | "status"
    | "priority"
    | "transportation"
  >
>;

export interface ItineraryCommitmentSummary {
  bookingCount?: number;
  expenseCount?: number;
  noteCount?: number;
  openTaskCount?: number;
}

const tablePanelClassName =
  "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:pb-3";
const pageHeaderActionsClassName =
  "page-header-actions relative z-[1] flex max-w-[260px] min-w-0 flex-wrap items-center justify-end gap-2";
const pageHeaderNoteClassName =
  "page-header-note m-0 basis-full text-right text-xs font-bold text-(--color-warning-strong)";
const tripPlanShellClassName =
  "trip-plan-shell mb-3 flex min-w-0 flex-wrap items-end gap-2 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-primary-soft)_100%)] px-3 py-2.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
const tripPlanFieldClassName =
  "grid min-w-[220px] flex-1 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripPlanSelectClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 text-sm font-bold text-(--color-text) outline-none focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripPlanCreateFormClassName =
  "trip-plan-create-form flex min-w-[260px] flex-wrap items-end gap-2";
const tripPlanNameFieldClassName =
  "grid min-w-[180px] flex-1 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripPlanNameInputClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripPlanButtonClassName =
  "min-h-9 rounded-(--radius-sm) px-3 text-xs font-extrabold";
const tripPlanSecondaryButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold text-(--color-text-muted) transition-colors hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
const tripPlanMessageClassName =
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
const dataRowWarningClassName =
  "data-row--has-warning [&_td]:bg-(--color-warning-soft) hover:[&_td]:bg-(--color-warning-soft) [&_td:first-child]:shadow-[inset_2px_0_0_var(--color-warning-border)] [&_td]:shadow-[inset_0_1px_0_var(--color-warning-border),inset_0_-1px_0_var(--color-warning-border)]";
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
const inlineSubItemButtonClassName =
  "inline-flex min-h-7 w-fit items-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route-soft) px-2 text-[11px] font-extrabold leading-4 text-(--color-route) transition-[border-color,background,color] duration-150 hover:border-(--color-route) hover:bg-(--color-surface) disabled:cursor-not-allowed disabled:opacity-50 [&_.icon]:size-3.5";
const rowFixMenuClassName = "row-fix-menu relative";
const rowFixSummaryClassName =
  "row-fix-summary inline-grid size-8 shrink-0 place-items-center rounded-(--radius-sm) border-0 bg-transparent text-(--color-warning-strong) transition-[color,background] duration-150 hover:not-disabled:bg-(--color-warning-soft) disabled:cursor-not-allowed disabled:opacity-[0.42]";
const rowFixPanelClassName =
  "absolute right-0 top-9 z-20 grid min-w-10 gap-1 rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-surface) p-1 shadow-[0_12px_28px_rgb(15_23_42_/_0.14)]";
const rowBookingMenuClassName = "row-booking-menu relative";
const rowBookingPanelClassName =
  "absolute right-0 top-9 z-20 grid min-w-[156px] gap-1 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) p-1 shadow-[0_12px_28px_rgb(15_23_42_/_0.14)]";
const rowBookingMenuButtonClassName =
  "inline-flex min-h-8 w-full items-center gap-2 rounded-(--radius-sm) border-0 bg-transparent px-2.5 text-left text-xs font-bold text-(--color-text) transition-colors hover:bg-(--color-route-soft) focus-visible:bg-(--color-route-soft) focus-visible:outline-none [&_.icon]:size-3.5";
const minutesPerDay = 24 * 60;
const itineraryBookingTemplates = [
  { id: "recommended", icon: "ticket", label: "Recommended" },
  { id: "flight", icon: "route", label: "Flight" },
  { id: "train", icon: "route", label: "Train" },
  { id: "hotel", icon: "home", label: "Hotel" },
  { id: "activity_ticket", icon: "ticket", label: "Activity ticket" },
] satisfies Array<{
  id: ItineraryBookingTemplate;
  icon: "home" | "route" | "ticket";
  label: string;
}>;
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
const childActivityStackClassName =
  "relative pl-4 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-3 before:rounded-bl-(--radius-sm) before:border-b before:border-l before:border-(--color-route-border) before:content-['']";
const hierarchyMetaClassName =
  "inline-flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-extrabold leading-4 text-(--color-text-muted)";
const hierarchyChipClassName =
  "inline-flex min-h-5 items-center gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 text-[10px] font-extrabold text-(--color-text-muted) [&_.icon]:size-3";
const activityHierarchyChipClassName =
  "border-[color-mix(in_srgb,var(--color-border)_72%,var(--color-route-border))] bg-(--color-surface) text-(--color-text-muted)";
const blockHierarchyChipClassName =
  "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)";
const commitmentChipClassName =
  "border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-border))] bg-(--color-primary-soft) text-(--color-primary-strong)";
const recordCommitmentChipClassName =
  "border-[color-mix(in_srgb,var(--color-warning)_24%,var(--color-border))] bg-(--color-warning-soft) text-(--color-warning-strong)";
const warningChipClassName =
  "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)";
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
const endOffsetSupClassName =
  "ml-0.5 align-super text-[0.72em] font-black leading-none";
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
const mobileInspectorDurationClassName =
  "inline-flex min-h-12 items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-sm font-extrabold tabular-nums text-(--color-text-muted)";
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
const importDialogClassName =
  "itinerary-import-dialog grid w-[min(560px,100%)] gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const importDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-(--color-text)";
const importDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const importDialogControlsClassName = "grid gap-3";
const importDialogFileButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-sm font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route)";
const importDialogPasteFieldClassName =
  "grid gap-1 text-sm font-bold text-(--color-text)";
const importDialogTextareaClassName =
  "min-h-36 resize-y rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-sm font-medium leading-6 text-(--color-text) outline-none focus:border-(--color-route-border) focus:ring-2 focus:ring-(--color-route-soft)";
const importDialogErrorClassName =
  "m-0 text-xs font-bold text-(--color-danger)";
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
export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  graphItems,
  itineraryView,
  items,
  commitmentsByItemId = {},
  dailyBriefings = [],
  tripPlans,
  selectedTripPlanId,
  mainTripPlanId,
  tripPlanError,
  isTripPlanBusy,
  pathOptions = [{ id: mainItineraryPathId, name: "Main", scope: "trip" }],
  role,
  startDate,
  selectedItemId,
  dayPathOverrides = {},
  showAllPaths = false,
  tripName,
  onAddBookingForItem,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddTaskForItem,
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
  onImportItineraryText,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onSetMainTripPlan,
  onCreateTripPlan,
  onChangeDayPath,
  onClearDayPath,
  onToggleShowAllPaths,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const importInputRef = useRef<HTMLInputElement>(null);
  const allDisplayItems = graphItems ?? items;
  const filterOptions = dedupePathOptions(pathOptions, allDisplayItems);
  const canEdit = role === "owner" || role === "organizer" || role === "traveler";
  const canManageTripPlans = canTripRole(role, "manageTripPlans");
  const canRestructureItems = canEdit && canRestructure;
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() =>
    filterOptions.map((option) => option.id),
  );
  const [planFiltersExpanded, setPlanFiltersExpanded] = useState(false);
  const [isCreatingTripPlan, setIsCreatingTripPlan] = useState(false);
  const [newTripPlanName, setNewTripPlanName] = useState("");
  const [newTripPlanError, setNewTripPlanError] = useState<string | null>(
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
  const [bookingDraftMessage, setBookingDraftMessage] = useState<string | null>(
    null,
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pastedImportText, setPastedImportText] = useState("");
  const [pastedImportError, setPastedImportError] = useState<string | null>(
    null,
  );
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
  const itemsById = useMemo(
    () => new Map(allDisplayItems.map((item) => [item.id, item])),
    [allDisplayItems],
  );
  const childCountByParentId = useMemo(
    () => countChildrenByParentId(allDisplayItems),
    [allDisplayItems],
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
  const displayDayGroups = groupItemsByDay(displayItems);
  const groups = mergeTripDayGroups(displayDayGroups, startDate, endDate);
  const dailyBriefingsByDate = useMemo(
    () => new Map(dailyBriefings.map((briefing) => [briefing.date, briefing])),
    [dailyBriefings],
  );
  const graphItemsByDay = groupGraphItemsByDay(displayItems);
  const warningCount =
    itineraryView?.warningCount ??
    displayDayGroups.reduce((total, group) => total + group.warningCount, 0);
  const totalMinutes = displayItems.reduce(
    (total, item) => total + (item.durationMinutes ?? 0),
    0,
  );
  const graphColumnWidth = buildGraphColumnWidth(displayItems);
  const smartTableStyle = {
    "--graph-column-width": `${graphColumnWidth}px`,
  } as CSSProperties;
  const selectedTripPlanIdForControl = tripPlans.some(
    (plan) => plan.id === selectedTripPlanId,
  )
    ? selectedTripPlanId
    : (tripPlans[0]?.id ?? "");
  const selectedTripPlan =
    tripPlans.find((plan) => plan.id === selectedTripPlanIdForControl) ?? null;
  const selectedTripPlanStatus = selectedTripPlan ? tripPlanStatus(selectedTripPlan) : "draft";
  const selectedTripPlanIsMain =
    Boolean(selectedTripPlanIdForControl) && selectedTripPlanIdForControl === mainTripPlanId;
  const tripPlanSelectorDisabled = isTripPlanBusy || tripPlans.length === 0;
  const tripPlanControlsDisabled = !canManageTripPlans || tripPlanSelectorDisabled;
  const tripPlanStatusDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const setMainTripPlanDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const tripPlanMessage = newTripPlanError ?? tripPlanError;

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

  async function chooseBookingTemplate(
    item: ItineraryItem,
    template: (typeof itineraryBookingTemplates)[number],
  ) {
    setBookingDraftMessage(null);
    try {
      const createdTitle = await onAddBookingForItem?.(item.id, template.id);
      setBookingDraftMessage(
        t.itinerary.row.bookingDraftCreated({
          activity: item.activity,
          title:
            typeof createdTitle === "string" && createdTitle.trim()
              ? createdTitle
              : template.label,
        }),
      );
    } catch {
      setBookingDraftMessage(
        t.itinerary.row.bookingDraftFailed({ activity: item.activity }),
      );
    }
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
    if (
      !draggedItemId ||
      draggedItemId === targetItemId ||
      !canMoveItemToSiblingTarget(draggedItemId, targetItemId, itemsById)
    )
      return;
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
    if (
      !draggedItemId ||
      draggedItemId === planBlockItemId ||
      !canMoveItemIntoPlanBlockTarget(draggedItemId, itemsById)
    )
      return;
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
    if (
      draggedItemId &&
      draggedItemId !== targetItemId &&
      canMoveItemToSiblingTarget(draggedItemId, targetItemId, itemsById)
    )
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
    if (
      draggedItemId &&
      draggedItemId !== planBlockItemId &&
      canMoveItemIntoPlanBlockTarget(draggedItemId, itemsById)
    )
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
        if (
          targetBlockId &&
          targetBlockId !== current.itemId &&
          canMoveItemIntoPlanBlockTarget(current.itemId, itemsById)
        ) {
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
        if (
          targetItemId &&
          targetItemId !== current.itemId &&
          canMoveItemToSiblingTarget(current.itemId, targetItemId, itemsById)
        ) {
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
      if (
        targetBlockId &&
        targetBlockId !== current.itemId &&
        canMoveItemIntoPlanBlockTarget(current.itemId, itemsById)
      )
        onMoveItemIntoPlanBlock(current.itemId, targetBlockId);
      else if (
        targetItemId &&
        targetItemId !== current.itemId &&
        canMoveItemToSiblingTarget(current.itemId, targetItemId, itemsById)
      )
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
      if (
        targetBlockId &&
        targetBlockId !== current.itemId &&
        canMoveItemIntoPlanBlockTarget(current.itemId, itemsById)
      )
        onMoveItemIntoPlanBlock(current.itemId, targetBlockId);
      else if (
        targetItemId &&
        targetItemId !== current.itemId &&
        canMoveItemToSiblingTarget(current.itemId, targetItemId, itemsById)
      )
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
    itemsById,
    onMoveItem,
    onMoveItemIntoPlanBlock,
    onMoveItemToDay,
  ]);

  function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onImportItinerary(file);
      setImportDialogOpen(false);
      setPastedImportError(null);
    }
    event.target.value = "";
  }

  async function submitPastedImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = pastedImportText.trim();
    if (!content) {
      setPastedImportError(t.itinerary.importPasteEmpty);
      return;
    }
    setPastedImportError(null);
    if (onImportItineraryText) {
      await onImportItineraryText(content, "pasted-itinerary.csv");
    } else {
      onImportItinerary(
        new File([content], "pasted-itinerary.csv", { type: "text/csv" }),
      );
    }
    setPastedImportText("");
    setImportDialogOpen(false);
  }

  async function submitNewTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans) return;
    const name = newTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(t.itinerary.tripPlans.emptyName);
      return;
    }
    setNewTripPlanError(null);
    const created = await onCreateTripPlan(name);
    if (created === false) return;
    setNewTripPlanName("");
    setIsCreatingTripPlan(false);
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
              accept="application/json,.json,text/csv,.csv,text/tab-separated-values,.tsv,text/plain,.txt"
              aria-hidden="true"
              tabIndex={-1}
              onChange={importFile}
            />
            <Button
              type="button"
              onClick={() => setImportDialogOpen(true)}
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
      <div className={tripPlanShellClassName}>
        <label className={tripPlanFieldClassName}>
          <span>{t.itinerary.tripPlans.selectorLabel}</span>
          <select
            className={tripPlanSelectClassName}
            value={selectedTripPlanIdForControl}
            disabled={tripPlanSelectorDisabled}
            onChange={(event) => onChangeTripPlan(event.target.value)}
          >
            {tripPlans.map((plan) => (
              <option value={plan.id} key={plan.id}>
                {formatTripPlanOptionLabel(plan, t.itinerary.tripPlans.status)}
              </option>
            ))}
          </select>
        </label>
        <label className={tripPlanFieldClassName}>
          <span>{t.itinerary.tripPlans.statusLabel}</span>
          <select
            className={tripPlanSelectClassName}
            value={selectedTripPlanStatus}
            disabled={tripPlanStatusDisabled}
            onChange={(event) =>
              onChangeTripPlanStatus(
                selectedTripPlanIdForControl,
                event.target.value as Exclude<PlanStatus, "main">,
              )
            }
          >
            <option value="main" disabled>
              {t.itinerary.tripPlans.status.main}
            </option>
            <option value="draft">{t.itinerary.tripPlans.status.draft}</option>
            <option value="backup">{t.itinerary.tripPlans.status.backup}</option>
            <option value="proposal">{t.itinerary.tripPlans.status.proposal}</option>
          </select>
        </label>
        {canManageTripPlans ? (
          <Button
            type="button"
            disabled={setMainTripPlanDisabled}
            className={tripPlanButtonClassName}
            onClick={() => onSetMainTripPlan(selectedTripPlanIdForControl)}
          >
            {t.itinerary.tripPlans.setMain}
          </Button>
        ) : null}
        {canManageTripPlans ? (
          isCreatingTripPlan ? (
            <form
              className={tripPlanCreateFormClassName}
              onSubmit={submitNewTripPlan}
            >
              <label className={tripPlanNameFieldClassName}>
                <span>{t.itinerary.tripPlans.nameLabel}</span>
                <input
                  className={tripPlanNameInputClassName}
                  value={newTripPlanName}
                  disabled={isTripPlanBusy}
                  placeholder={t.itinerary.tripPlans.namePlaceholder}
                  onChange={(event) => {
                    setNewTripPlanName(event.target.value);
                    setNewTripPlanError(null);
                  }}
                />
              </label>
              <Button
                type="submit"
                disabled={isTripPlanBusy}
                className={tripPlanButtonClassName}
              >
                {t.itinerary.tripPlans.createConfirm}
              </Button>
              <button
                type="button"
                className={tripPlanSecondaryButtonClassName}
                disabled={isTripPlanBusy}
                onClick={() => {
                  setIsCreatingTripPlan(false);
                  setNewTripPlanName("");
                  setNewTripPlanError(null);
                }}
              >
                {t.itinerary.tripPlans.createCancel}
              </button>
            </form>
          ) : (
            <Button
              type="button"
              disabled={isTripPlanBusy}
              className={tripPlanButtonClassName}
              onClick={() => setIsCreatingTripPlan(true)}
            >
              {t.itinerary.tripPlans.create}
            </Button>
          )
        ) : null}
        {isTripPlanBusy ? (
          <p className={tripPlanMessageClassName}>
            {t.itinerary.tripPlans.busy}
          </p>
        ) : tripPlanMessage ? (
          <p className={tripPlanMessageClassName}>{tripPlanMessage}</p>
        ) : null}
        {bookingDraftMessage ? (
          <p
            className={tripPlanMessageClassName}
            role="status"
            aria-live="polite"
          >
            {bookingDraftMessage}
          </p>
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
              commitmentsByItemId={commitmentsByItemId}
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
              onChooseBookingTemplate={chooseBookingTemplate}
              onAddStop={onAddStop}
              onAddSubActivity={onAddSubActivity}
              onAddNoteForItem={onAddNoteForItem}
              onAddTaskForItem={onAddTaskForItem}
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
              onToggleDay={toggleDay}
              onTogglePlanBlock={togglePlanBlock}
            />
          ))}
        </table>
      </div>
      {selectedItem ? (
        <MobileSelectedStopInspector
          canEdit={canEdit}
          canDelete={!childCountByParentId.has(selectedItem.id)}
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
      {importDialogOpen ? (
        <div className={deleteModalBackdropClassName} role="presentation">
          <form
            className={importDialogClassName}
            role="dialog"
            aria-modal="true"
            aria-labelledby="itinerary-import-title"
            onSubmit={submitPastedImport}
          >
            <h2 className={importDialogTitleClassName} id="itinerary-import-title">
              {t.itinerary.importDialogTitle}
            </h2>
            <p className={importDialogBodyClassName}>
              {t.itinerary.importDialogBody}
            </p>
            <div className={importDialogControlsClassName}>
              <button
                type="button"
                className={importDialogFileButtonClassName}
                onClick={() => importInputRef.current?.click()}
              >
                <Icon name="import" />
                {t.itinerary.importFileButton}
              </button>
              <label className={importDialogPasteFieldClassName}>
                <span>{t.itinerary.importPasteLabel}</span>
                <textarea
                  className={importDialogTextareaClassName}
                  value={pastedImportText}
                  placeholder={t.itinerary.importPastePlaceholder}
                  onChange={(event) => {
                    setPastedImportText(event.target.value);
                    setPastedImportError(null);
                  }}
                />
              </label>
              {pastedImportError ? (
                <p className={importDialogErrorClassName} role="alert">
                  {pastedImportError}
                </p>
              ) : null}
            </div>
            <div className={deleteDialogActionsClassName}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setImportDialogOpen(false);
                  setPastedImportError(null);
                }}
              >
                {t.itinerary.importCancel}
              </Button>
              <Button type="submit">{t.itinerary.importPasteSubmit}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function MobileSelectedStopInspector({
  canEdit,
  canDelete,
  item,
  itineraryLabels,
  locale,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  canDelete: boolean;
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
          <span>
            <TimeWindowText item={item} />
          </span>
          <span>·</span>
          <span>{formatDuration(derivedDurationMinutes(item), locale)}</span>
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
        <span className={mobileInspectorLabelClassName}>
          Kind
          <InlineItemKindSelect
            activity={`${item.id}-mobile`}
            buttonClassName={mobileInspectorTypeButtonClassName}
            canEdit={canEdit}
            value={item.itemKind ?? "activity"}
            onCommit={(itemKind) => onUpdateItemInline?.(item.id, { itemKind })}
          />
        </span>
        <span className={mobileInspectorLabelClassName}>
          Time mode
          <InlineTimeModeSelect
            activity={`${item.id}-mobile`}
            buttonClassName={mobileInspectorTypeButtonClassName}
            canEdit={canEdit}
            value={item.timeMode ?? "scheduled"}
            onCommit={(timeMode) =>
              onUpdateItemInline?.(item.id, {
                timeMode,
                ...(timeMode === "flexible"
                  ? {
                      startTime: "",
                      endTime: null,
                      endOffsetDays: 0,
                      durationMinutes: null,
                    }
                  : {}),
              })
            }
          />
        </span>
        <span className={mobileInspectorLabelClassName}>
          Status
          <InlineStatusSelect
            activity={`${item.id}-mobile`}
            buttonClassName={mobileInspectorTypeButtonClassName}
            canEdit={canEdit}
            value={item.status ?? "idea"}
            onCommit={(status) => onUpdateItemInline?.(item.id, { status })}
          />
        </span>
        <span className={mobileInspectorLabelClassName}>
          Priority
          <InlinePrioritySelect
            activity={`${item.id}-mobile`}
            buttonClassName={mobileInspectorTypeButtonClassName}
            canEdit={canEdit}
            value={item.priority ?? "normal"}
            onCommit={(priority) => onUpdateItemInline?.(item.id, { priority })}
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
      <span className={mobileInspectorDurationClassName}>
        {itineraryLabels.headers.duration}: {formatDuration(derivedDurationMinutes(item), locale)}
      </span>
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
          disabled={!canEdit || !canDelete}
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
  commitmentsByItemId,
  dragState,
  onClearDragPreview,
  onChangeDayPath,
  onClearDayPath,
  onDropItem,
  onDropIntoPlanBlock,
  onDropOnDay,
  onChooseBookingTemplate,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddTaskForItem,
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
  commitmentsByItemId: Record<string, ItineraryCommitmentSummary>;
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
  onChooseBookingTemplate: (
    item: ItineraryItem,
    template: (typeof itineraryBookingTemplates)[number],
  ) => void | Promise<void>;
  onAddStop: (day?: string) => void;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string) => void;
  onAddTaskForItem?: (itemId: string) => void;
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
  const [openFixMenuItemId, setOpenFixMenuItemId] = useState<string | null>(null);
  const [openBookingMenuItemId, setOpenBookingMenuItemId] =
    useState<string | null>(null);

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
            const parentItem = item.parentItemId
              ? group.items.find((candidate) => candidate.id === item.parentItemId)
              : undefined;
            const childCount = item.isPlanBlock
              ? group.items.filter((candidate) => candidate.parentItemId === item.id).length
              : 0;
            const addSubActivityLabel = itineraryLabels.row.addSubActivity({
              activity: item.activity,
            });
            const canPromoteParentBlock = Boolean(parentItem && !parentItem.isPlanBlock);
            const canDeleteItem = childCount === 0;
            const blockCollapsed = item.isPlanBlock && collapsedPlanBlockIds.includes(item.id);
            const itemWarnings = validateItineraryItem(item, group.items);
            const fitParentBlockPatch =
              parentItem && itemWarnings.some((warning) => warning.code === "child-outside-plan-block")
                ? buildFitParentBlockPatch(parentItem, item)
                : null;
            const hasHierarchyFixActions = Boolean(
              (canPromoteParentBlock && parentItem) ||
              (fitParentBlockPatch && parentItem) ||
              item.parentItemId,
            );

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
                  itemWarnings.length > 0,
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
                        <TimeWindowText item={item} />
                      </span>
                    ) : null}
                    <DurationDisplay item={item} labels={itineraryLabels} locale={locale} />
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
                            {blockCollapsed
                              ? itineraryLabels.row.expandBlock
                              : itineraryLabels.row.collapseBlock}
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
                          <span>{itineraryLabels.row.intoBlock}</span>
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
                    <RowHierarchyMeta
                      childCount={childCount}
                      commitment={commitmentsByItemId[item.id]}
                      item={item}
                      locale={locale}
                      warnings={itemWarnings}
                    />
                    {canEdit && !isChild ? (
                      <button
                        type="button"
                        className={inlineSubItemButtonClassName}
                        aria-label={addSubActivityLabel}
                        onClick={(event) => {
                          event.stopPropagation();
                          void onAddSubActivity?.(item.id);
                        }}
                      >
                        <Icon name="plus" />
                        <span>{itineraryLabels.row.subItemQuick}</span>
                      </button>
                    ) : null}
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
                          ...(timeMode === "flexible"
                            ? {
                                startTime: "",
                                endTime: null,
                                endOffsetDays: 0,
                                durationMinutes: null,
                              }
                            : {}),
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
                      aria-label={addSubActivityLabel}
                      disabled={!canEdit}
                      title={addSubActivityLabel}
                      onClick={() => {
                        void onAddSubActivity?.(item.id);
                      }}
                    >
                      <Icon name="plus" />
                    </button>
                    {hasHierarchyFixActions ? (
                      <div className={rowFixMenuClassName}>
                        <button
                          type="button"
                          className={rowFixSummaryClassName}
                          aria-label={itineraryLabels.row.fixHierarchy({
                            activity: item.activity,
                          })}
                          aria-expanded={openFixMenuItemId === item.id}
                          title={itineraryLabels.row.fixHierarchy({
                            activity: item.activity,
                          })}
                          onClick={() =>
                            setOpenFixMenuItemId((current) =>
                              current === item.id ? null : item.id,
                            )
                          }
                        >
                          <Icon name="warning" />
                        </button>
                        {openFixMenuItemId === item.id ? (
                          <div className={rowFixPanelClassName}>
                            {canPromoteParentBlock && parentItem ? (
                              <button
                                type="button"
                                className={rowActionButtonClassName}
                                aria-label={itineraryLabels.row.promoteParentBlock({
                                  parent: parentItem.activity,
                                  child: item.activity,
                                })}
                                disabled={!canEdit}
                                title={itineraryLabels.row.promoteParentBlockTitle({
                                  parent: parentItem.activity,
                                })}
                                onClick={() => {
                                  onUpdateItemInline?.(parentItem.id, { isPlanBlock: true });
                                  setOpenFixMenuItemId(null);
                                }}
                              >
                                <Icon name="list" />
                              </button>
                            ) : null}
                            {fitParentBlockPatch && parentItem ? (
                              <button
                                type="button"
                                className={rowActionButtonClassName}
                                aria-label={itineraryLabels.row.expandBlockToFit({
                                  parent: parentItem.activity,
                                  child: item.activity,
                                })}
                                disabled={!canEdit}
                                title={itineraryLabels.row.expandBlockToFitTitle({
                                  parent: parentItem.activity,
                                  child: item.activity,
                                })}
                                onClick={() => {
                                  onUpdateItemInline?.(parentItem.id, fitParentBlockPatch);
                                  setOpenFixMenuItemId(null);
                                }}
                              >
                                <Icon name="clock" />
                              </button>
                            ) : null}
                            {item.parentItemId ? (
                              <button
                                type="button"
                                className={rowActionButtonClassName}
                                aria-label={itineraryLabels.row.detachSubActivity({
                                  activity: item.activity,
                                })}
                                disabled={!canEdit}
                                title={itineraryLabels.row.detachSubActivityTitle({
                                  activity: item.activity,
                                })}
                                onClick={() => {
                                  onUpdateItemInline?.(item.id, { parentItemId: null });
                                  setOpenFixMenuItemId(null);
                                }}
                              >
                                <Icon name="x" />
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className={rowActionButtonClassName}
                      aria-label={`Add task for ${item.activity}`}
                      disabled={!canEdit}
                      onClick={() => onAddTaskForItem?.(item.id)}
                    >
                      <Icon name="check" />
                    </button>
                    <button
                      type="button"
                      className={rowActionButtonClassName}
                      aria-label={`Add note for ${item.activity}`}
                      disabled={!canEdit}
                      onClick={() => onAddNoteForItem?.(item.id)}
                    >
                      <Icon name="note" />
                    </button>
                    <div className={rowBookingMenuClassName}>
                      <button
                        type="button"
                        className={rowActionButtonClassName}
                        aria-label={`Add booking draft for ${item.activity}`}
                        aria-expanded={openBookingMenuItemId === item.id}
                        disabled={!canEdit}
                        onClick={() =>
                          setOpenBookingMenuItemId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                      >
                        <Icon name="ticket" />
                      </button>
                      {openBookingMenuItemId === item.id ? (
                        <div
                          className={rowBookingPanelClassName}
                          role="menu"
                          aria-label={`Booking draft templates for ${item.activity}`}
                        >
                          {itineraryBookingTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              role="menuitem"
                              className={rowBookingMenuButtonClassName}
                              aria-label={itineraryLabels.row.createBookingDraft({
                                activity: item.activity,
                                template: template.label,
                              })}
                              onClick={() => {
                                void onChooseBookingTemplate(item, template);
                                setOpenBookingMenuItemId(null);
                              }}
                            >
                              <Icon name={template.icon} />
                              {template.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
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
                      disabled={!canEdit || !canDeleteItem}
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

function buildFitParentBlockPatch(
  parent: ItineraryItem,
  child: ItineraryItem,
): InlineItineraryItemPatch | null {
  const parentInterval = getTimeWindowInterval(parent);
  const childInterval = getTimeWindowInterval(child);
  if (!parentInterval || !childInterval) return null;

  const start = Math.min(parentInterval.start, childInterval.start);
  const end = Math.max(parentInterval.end, childInterval.end);
  if (end <= start) return null;

  return {
    startTime: formatTimeFromAbsoluteMinutes(start),
    endTime: formatTimeFromAbsoluteMinutes(end),
    endOffsetDays: Math.floor(end / minutesPerDay),
    durationMinutes: end - start,
  };
}

function formatTimeFromAbsoluteMinutes(minutes: number): string {
  const minuteOfDay = ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
  const hours = Math.floor(minuteOfDay / 60);
  const mins = minuteOfDay % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
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

function buildGraphColumnWidth(items: ItineraryItem[]): number {
  const pathCountsByDay = new Map<string, Set<string>>();
  const itemsByDay = groupGraphItemsByDay(items);
  for (const [day, dayItems] of itemsByDay) {
    const dayPaths =
      pathCountsByDay.get(day) ?? new Set<string>([mainItineraryPathId]);
    dayItems.forEach((item) => {
      const pathId =
        item.pathRole === "alternative"
          ? (item.pathId ?? item.id)
          : mainItineraryPathId;
      dayPaths.add(pathId);
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
  hasWarnings = false,
): string {
  return cn(
    dataRowClassName,
    selectedItemId === item.id && dataRowSelectedClassName,
    hasWarnings && dataRowWarningClassName,
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
        {endOffsetDays > 0 ? (
          <EndOffsetSup value={endOffsetDays} />
        ) : (
          <Icon name="clock" className="size-3" />
        )}
      </button>
    </span>
  );
}

function TimeWindowText({
  item,
}: {
  item: Pick<ItineraryItem, "startTime" | "endTime" | "endOffsetDays">;
}) {
  const startTime = item.startTime?.trim();
  const endTime = item.endTime?.trim();
  if (!startTime && !endTime) return <>—</>;
  if (!endTime) return <>{startTime || "—"}</>;

  return (
    <>
      {startTime ? `${startTime}-` : null}
      {endTime}
      {(item.endOffsetDays ?? 0) > 0 ? (
        <EndOffsetSup value={item.endOffsetDays ?? 0} />
      ) : null}
    </>
  );
}

function EndOffsetSup({ value }: { value: number }) {
  return <sup className={endOffsetSupClassName}>+{value}</sup>;
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

function DurationDisplay({
  item,
  labels,
  locale,
}: {
  item: ItineraryItem;
  labels: Messages["itinerary"];
  locale: Locale;
}) {
  const durationLabel = labels.row.duration({
    activity: item.activity,
  });

  return (
    <span className={durationPillClassName} aria-label={durationLabel}>
      {formatDuration(derivedDurationMinutes(item), locale)}
    </span>
  );
}

function derivedDurationMinutes(item: ItineraryItem): number | null {
  const interval = getTimeWindowInterval(item);
  if (interval) return interval.end - interval.start;
  return item.durationMinutes;
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
  commitment,
  item,
  locale,
  warnings,
}: {
  childCount: number;
  commitment?: ItineraryCommitmentSummary;
  item: ItineraryItem;
  locale: Locale;
  warnings: ValidationWarning[];
}) {
  const status = item.status ?? "idea";
  const priority = item.priority ?? "normal";
  const showCommitment = status !== "idea" || priority === "must" || priority === "high";
  const commitmentChips = buildCommitmentChips(commitment);
  const sortedWarnings = sortValidationWarningsForDisplay(warnings);
  const warningChips = sortedWarnings.slice(0, 2);
  const remainingWarningCount = Math.max(0, warnings.length - warningChips.length);

  return (
    <div className={hierarchyMetaClassName} aria-label={`Structure for ${item.activity}`}>
      {item.isPlanBlock ? (
        <span className={cn(hierarchyChipClassName, blockHierarchyChipClassName)}>
          <Icon name="list" />
          Activity block · {childCount} sub-item{childCount === 1 ? "" : "s"}
        </span>
      ) : !item.parentItemId ? (
        <span className={cn(hierarchyChipClassName, activityHierarchyChipClassName)}>
          <Icon name="list" />
          Activity
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
      {commitmentChips.map((chip) => (
        <span
          className={cn(hierarchyChipClassName, recordCommitmentChipClassName)}
          key={chip.label}
        >
          <Icon name={chip.icon} />
          {chip.label}
        </span>
      ))}
      {warningChips.map((warning) => (
        <span
          className={cn(hierarchyChipClassName, warningChipClassName)}
          key={warning.code}
          title={warning.message}
        >
          <Icon name="warning" />
          {formatValidationWarningLabel(warning, locale)}
        </span>
      ))}
      {remainingWarningCount > 0 ? (
        <span className={cn(hierarchyChipClassName, warningChipClassName)}>
          <Icon name="warning" />
          +{remainingWarningCount}
        </span>
      ) : null}
    </div>
  );
}

function sortValidationWarningsForDisplay(
  warnings: ValidationWarning[],
): ValidationWarning[] {
  return [...warnings].sort(
    (left, right) =>
      validationWarningPriority(left) - validationWarningPriority(right),
  );
}

function validationWarningPriority(warning: ValidationWarning): number {
  if (
    warning.code === "missing-parent-item" ||
    warning.code === "invalid-parent-plan-block" ||
    warning.code === "nested-sub-activity" ||
    warning.code === "parent-scope-mismatch" ||
    warning.code === "child-outside-plan-block"
  ) {
    return 0;
  }
  if (warning.code === "overlap" || warning.code === "time-order-conflict") {
    return 1;
  }
  return 2;
}

function formatValidationWarningLabel(
  warning: ValidationWarning,
  locale: Locale,
): string {
  const labels: Record<ValidationWarning["code"], { en: string; th: string }> = {
    "missing-start-time": {
      en: "Start time",
      th: "เวลาเริ่ม",
    },
    "invalid-start-time": {
      en: "Invalid time",
      th: "เวลาไม่ถูกต้อง",
    },
    "missing-duration": {
      en: "End or duration",
      th: "เวลาจบ/ระยะเวลา",
    },
    "missing-map-link": {
      en: "Map link",
      th: "ลิงก์แผนที่",
    },
    "missing-transportation": {
      en: "Transport",
      th: "การเดินทาง",
    },
    "time-order-conflict": {
      en: "Time order",
      th: "ลำดับเวลา",
    },
    overlap: {
      en: "Overlap",
      th: "เวลาซ้อน",
    },
    "missing-parent-item": {
      en: "Missing parent",
      th: "ไม่พบกิจกรรมแม่",
    },
    "invalid-parent-plan-block": {
      en: "Parent block",
      th: "แม่ต้องเป็น block",
    },
    "nested-sub-activity": {
      en: "Nested sub-activity",
      th: "ซ้อน sub-activity",
    },
    "parent-scope-mismatch": {
      en: "Parent scope",
      th: "แผน/วันไม่ตรง",
    },
    "child-outside-plan-block": {
      en: "Outside block",
      th: "นอก block",
    },
    "unresolved-location": {
      en: "Location",
      th: "สถานที่",
    },
    "stale-location": {
      en: "Stale location",
      th: "สถานที่เก่า",
    },
  };
  return labels[warning.code]?.[locale] ?? warning.code;
}

function buildCommitmentChips(
  commitment: ItineraryCommitmentSummary | undefined,
): Array<{ icon: "check" | "note" | "ticket" | "wallet"; label: string }> {
  if (!commitment) return [];
  const chips: Array<{ icon: "check" | "note" | "ticket" | "wallet"; label: string }> = [];
  if (commitment.bookingCount) {
    chips.push({
      icon: "ticket",
      label: `${commitment.bookingCount} booking${commitment.bookingCount === 1 ? "" : "s"}`,
    });
  }
  if (commitment.expenseCount) {
    chips.push({
      icon: "wallet",
      label: `${commitment.expenseCount} expense${commitment.expenseCount === 1 ? "" : "s"}`,
    });
  }
  if (commitment.openTaskCount) {
    chips.push({
      icon: "check",
      label: `${commitment.openTaskCount} task${commitment.openTaskCount === 1 ? "" : "s"}`,
    });
  }
  if (commitment.noteCount) {
    chips.push({
      icon: "note",
      label: `${commitment.noteCount} note${commitment.noteCount === 1 ? "" : "s"}`,
    });
  }
  return chips;
}

function InlineItemKindSelect({
  activity,
  buttonClassName = "",
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  buttonClassName?: string;
  canEdit: boolean;
  onCommit: (value: ItineraryItemKind) => void | Promise<void>;
  value: ItineraryItemKind;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Item kind for ${activity}`}
      buttonClassName={buttonClassName}
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
  buttonClassName = "",
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  buttonClassName?: string;
  canEdit: boolean;
  onCommit: (value: ItineraryTimeMode) => void | Promise<void>;
  value: ItineraryTimeMode;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Time mode for ${activity}`}
      buttonClassName={buttonClassName}
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
  buttonClassName = "",
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  buttonClassName?: string;
  canEdit: boolean;
  onCommit: (value: ItineraryItemStatus) => void | Promise<void>;
  value: ItineraryItemStatus;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Status for ${activity}`}
      buttonClassName={buttonClassName}
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
  buttonClassName = "",
  canEdit,
  onCommit,
  value,
}: {
  activity: string;
  buttonClassName?: string;
  canEdit: boolean;
  onCommit: (value: ItineraryItemPriority) => void | Promise<void>;
  value: ItineraryItemPriority;
}) {
  return (
    <InlineOptionPicker
      ariaLabel={`Priority for ${activity}`}
      buttonClassName={buttonClassName}
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

function canMoveItemToSiblingTarget(
  draggedItemId: string,
  targetItemId: string,
  itemsById: Map<string, ItineraryItem>,
): boolean {
  const draggedItem = itemsById.get(draggedItemId);
  const targetItem = itemsById.get(targetItemId);
  if (!draggedItem || !targetItem) return false;
  return !draggedItem.isPlanBlock || !targetItem.parentItemId;
}

function canMoveItemIntoPlanBlockTarget(
  draggedItemId: string,
  itemsById: Map<string, ItineraryItem>,
): boolean {
  const draggedItem = itemsById.get(draggedItemId);
  return Boolean(draggedItem && !draggedItem.isPlanBlock);
}

function countChildrenByParentId(items: ItineraryItem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.parentItemId) continue;
    counts.set(item.parentItemId, (counts.get(item.parentItemId) ?? 0) + 1);
  }
  return counts;
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

function formatTripPlanOptionLabel(
  plan: PlanVariant,
  statusLabels: Readonly<Record<PlanStatus, string>>,
): string {
  const status = tripPlanStatus(plan);
  return `${plan.name} - ${statusLabels[status]}`;
}

function tripPlanStatus(plan: PlanVariant): PlanStatus {
  return plan.status ?? (plan.kind === "split" ? "proposal" : plan.kind);
}
