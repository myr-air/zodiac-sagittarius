import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import type {
  ItineraryItem,
  PlanStatus,
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
  getTripDates,
  groupItemsByDay,
  mainItineraryPathId,
  type ItineraryDayGroup,
  type ItineraryPathOption,
  type ItineraryView,
} from "@/src/trip/itinerary";
import { canTripRole } from "@/src/trip/auth";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
  weatherIconForCondition,
} from "@/src/trip/weather-briefings";
import { Button } from "./ui";
import { Icon, type IconName } from "./icons";
import { formatTripRange, PageHeader } from "./PageHeader";
import {
  activityTypeLabel,
  dayRouteLabel,
  formatDuration,
  formatThaiDate,
} from "./itineraryDisplay";
import { ActivityPathGraphDay } from "./ActivityPathGraphDay";

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
  onOpenItemDetails: (itemId: string) => void;
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
  onRenameTripPlan: (tripPlanId: string, name: string) => boolean | void | Promise<boolean | void>;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
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
  "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:pb-3 max-[520px]:px-0 max-[520px]:py-0 max-[520px]:pb-0";
const pageHeaderActionsClassName =
  "page-header-actions relative z-[20] grid w-[min(560px,100%)] min-w-0 justify-items-end gap-2 overflow-visible max-[1199px]:w-full max-[1199px]:justify-items-stretch";
const pageHeaderNoteClassName =
  "page-header-note m-0 text-right text-xs font-bold text-(--color-warning-strong) max-[1199px]:text-left";
const headerControlsButtonClassName =
  "itinerary-header-controls-button inline-flex min-h-9 max-w-full items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) aria-[expanded=true]:border-(--color-primary-border) aria-[expanded=true]:bg-(--color-primary-soft) aria-[expanded=true]:text-(--color-primary-strong) [&_.icon]:size-4";
const headerControlsPanelClassName =
  "itinerary-header-controls absolute right-0 top-[calc(100%_+_8px)] z-[30] grid max-h-[min(72vh,620px)] w-[min(640px,calc(100vw_-_32px))] min-w-0 origin-top-right overflow-y-auto overscroll-contain rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-(--color-surface) p-0 text-left shadow-[0_8px_8px_rgb(55_47_38_/_0.10)] [transition:opacity_160ms_var(--motion-ease-out),transform_160ms_var(--motion-ease-out),box-shadow_160ms_var(--motion-ease-out)] will-change-[opacity,transform] data-[state=closed]:pointer-events-none data-[state=closed]:-translate-y-1.5 data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 motion-reduce:transform-none motion-reduce:transition-none max-[767px]:fixed max-[767px]:inset-x-3 max-[767px]:top-20 max-[767px]:max-h-[calc(100vh_-_96px)] max-[767px]:w-auto max-[767px]:origin-top";
const headerControlsTitleBarClassName =
  "grid min-w-0 gap-1 border-b border-(--color-border) bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-subtle)_100%)] px-4 py-3";
const headerControlsTitleClassName =
  "flex min-w-0 items-center justify-between gap-3 text-sm font-extrabold text-(--color-text)";
const headerControlsContentClassName = "grid min-w-0 gap-0";
const headerControlsSectionClassName =
  "grid min-w-0 gap-3 border-b border-(--color-border) px-4 py-3 last:border-b-0";
const headerControlsSectionHeaderClassName =
  "flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs font-bold text-(--color-text-muted) [&_strong]:text-(--color-text)";
const headerControlsGridClassName =
  "grid min-w-0 grid-cols-[minmax(220px,1fr)_minmax(150px,180px)] items-end gap-2 rounded-(--radius-sm) bg-(--color-surface-subtle) p-2 max-[640px]:grid-cols-1";
const tripPlanFieldClassName =
  "grid min-w-0 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripPlanSelectClassName =
  "min-h-10 w-full min-w-0 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none transition-[border-color,box-shadow] duration-150 focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripPlanActionsClassName =
  "grid min-w-0 grid-cols-2 gap-2 max-[640px]:grid-cols-1";
const tripPlanCreateFormClassName =
  "trip-plan-create-form col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 max-[640px]:grid-cols-1";
const tripPlanNameFieldClassName =
  "grid min-w-0 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripPlanNameInputClassName =
  "min-h-10 w-full min-w-0 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary-border) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripPlanButtonClassName =
  "min-h-10 rounded-(--radius-sm) px-3 text-xs font-extrabold";
const tripPlanSecondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold text-(--color-text-muted) transition-colors hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
const pathFilterSummaryClassName =
  "min-w-0 truncate text-xs font-semibold text-(--color-text-muted)";
const showAllPathsToggleClassName =
  "show-all-paths-toggle inline-grid min-h-9 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-2.5 text-xs font-extrabold text-(--color-route) transition-[background,border-color,color] duration-150 hover:bg-(--color-route-soft) has-[:checked]:border-(--color-primary-border) has-[:checked]:bg-(--color-primary-soft) has-[:checked]:text-(--color-primary-strong) [&_input]:size-4 [&_input]:accent-[var(--color-primary)]";
const pathFilterPanelClassName =
  "itinerary-filter-panel grid min-w-0 grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-1.5";
const pathFilterOptionClassName =
  "inline-grid min-h-9 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-2.5 text-xs font-semibold text-(--color-route) transition-[background,border-color,color] duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) [&_span]:truncate";
const tableScrollClassName =
  "table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [contain:paint] max-[520px]:overflow-x-hidden max-[520px]:rounded-none max-[520px]:border-x-0 max-[520px]:shadow-none";
const smartTableClassName =
  "smart-table w-full min-w-[520px] table-fixed border-collapse text-xs leading-4 text-(--color-text) max-[520px]:min-w-full max-[520px]:w-full [&_td:first-child]:px-0 [&_td:first-child]:text-center [&_td:nth-child(2)]:border-r-0 [&_td]:h-10 [&_td]:border-b [&_td]:border-r [&_td]:border-(--color-border) [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:text-left [&_td]:align-middle [&_th:first-child]:px-0 [&_th:first-child]:text-center [&_th:nth-child(2)]:border-r-0 [&_th]:h-9 [&_th]:border-b [&_th]:border-r [&_th]:border-(--color-border-strong) [&_th]:px-2.5 [&_th]:py-1 [&_th]:text-left [&_th]:align-middle [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:h-12 [&_thead_th]:bg-[linear-gradient(180deg,rgb(255_255_255_/_0.98)_0%,rgb(239_246_255_/_0.94)_100%)] [&_thead_th]:text-xs [&_thead_th]:font-[800] [&_thead_th]:text-(--color-text) [&_thead_th]:shadow-[inset_0_-1px_0_var(--color-route-border)]";
const activityHeaderGridClassName =
  "grid min-w-0 grid-cols-[64px_112px_minmax(0,1fr)] items-center gap-1.5 px-2 text-[11px] font-semibold uppercase text-(--color-text-muted) max-[520px]:hidden";
const activityHeaderActivityClassName =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1";
const graphColumnMinWidth = 30;
const graphColumnSidePadding = 9;
const graphColumnLaneGap = 18;
const dayTitleMaxLength = 48;
const dayGroupClassName = "day-group";
const daySpacerRowClassName =
  "day-spacer-row [&_td]:!h-3 [&_td]:!border-0 [&_td]:!bg-(--color-page) [&_td]:!p-0";
const dayRowClassName =
  "day-row [&_th]:min-h-[39px] [&_th]:bg-(--color-surface-subtle) [&_th]:px-2.5 [&_th]:py-0 [&_th]:shadow-[inset_0_-1px_0_var(--color-border-strong)] max-[520px]:[&_th]:py-1.5";
const dayRowContentClassName =
  "day-row-content flex min-h-[39px] w-full min-w-0 flex-wrap items-center gap-x-[9px] gap-y-1";
const dayToggleClassName =
  "day-toggle flex min-h-8 shrink-0 items-center gap-[7px] border-0 bg-transparent p-0 text-left text-(--color-text-muted) aria-[expanded=true]:[&_.icon]:rotate-90 [&_.icon]:transition-transform [&_.icon]:duration-[140ms]";
const dayOrdinalClassName =
  "day-ordinal shrink-0 text-sm font-extrabold text-(--color-text)";
const dayTitleInputClassName =
  "day-title-input min-h-8 min-w-0 max-w-[260px] appearance-none rounded-none border-0 border-b border-solid border-transparent border-x-0 border-t-0 bg-transparent px-0.5 text-[13px] font-extrabold leading-5 text-(--color-text) outline-none shadow-none transition-[border-color,color,max-width] duration-150 placeholder:text-(--color-text-muted) hover:border-(--color-text-muted) hover:text-(--color-text) focus:max-w-[340px] focus:border-(--color-primary) focus:border-x-0 focus:border-t-0 focus:text-(--color-text) focus:outline-none focus:shadow-none focus-visible:border-x-0 focus-visible:border-t-0 focus-visible:outline-none focus-visible:shadow-none focus-visible:[box-shadow:none] disabled:pointer-events-none max-[767px]:max-w-[150px] max-[767px]:focus:max-w-[190px] max-[520px]:w-full max-[520px]:max-w-full max-[520px]:focus:max-w-full";
const dayDateClassName =
  "day-date inline-flex shrink-0 items-center gap-[7px] text-(--color-text-muted)";
const dayRouteClassName =
  "day-route ml-[10px] min-w-0 max-[767px]:ml-0 max-[520px]:order-4 max-[520px]:ml-6 max-[520px]:basis-[calc(100%_-_1.5rem)]";
const dayWeatherChipClassName =
  "day-weather-chip inline-flex min-h-6 shrink-0 items-center gap-1 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route-soft) px-1.5 text-[11px] font-bold text-(--color-route) max-[520px]:order-3 [&_strong]:text-(--color-text)";
const dayWeatherSolarClassName =
  "inline-flex items-center gap-0.5 font-semibold text-(--color-text-muted) max-[520px]:hidden [&_.icon]:size-3.5";
const dayPathControlsClassName =
  "ml-auto inline-flex min-w-0 items-center gap-2 max-[767px]:ml-2 max-[767px]:shrink-0";
const dayPathPickerClassName =
  "min-h-8 max-w-[172px] px-2 text-[11px] max-[767px]:max-w-[112px]";
const dayClearPathButtonClassName =
  "inline-flex min-h-8 items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-text-muted) disabled:opacity-40 max-[767px]:px-1.5";
const itemPlaceholderRowClassName =
  "item-placeholder-row activity-row group/activity [&_td]:bg-(--color-surface)";
const itemPlaceholderCellClassName =
  "item-placeholder-cell min-w-0 bg-(--color-surface) px-0 py-0 align-top";
const activityCellClassName =
  "activity-cell grid min-h-[60px] min-w-0 grid-cols-[64px_112px_minmax(0,1fr)] items-stretch gap-1.5 px-2 py-1 transition-[background,box-shadow] duration-150 group-hover/activity:bg-(--color-surface-subtle) data-[selected=true]:bg-(--color-route-soft) data-[selected=true]:shadow-[inset_0_0_0_1px_var(--color-route-border)] max-[520px]:w-full max-[520px]:grid-cols-[58px_minmax(0,1fr)] max-[520px]:items-start max-[520px]:gap-x-1.5 max-[520px]:gap-y-0 max-[520px]:px-2 max-[520px]:py-1.5";
const activityTimeRailClassName =
  "flex min-w-0 items-start text-[11px] font-medium leading-4 text-(--color-text-muted) max-[520px]:grid max-[520px]:justify-items-center max-[520px]:pt-0 max-[360px]:items-center";
const activityTimeButtonClassName =
  "activity-time-button grid min-h-[52px] w-full content-start justify-items-center rounded-(--radius-sm) border border-transparent bg-transparent px-1 pt-1 text-center font-mono text-[11px] font-medium leading-4 text-(--color-text) outline-none transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) focus:border-(--color-route-border) focus:bg-(--color-route-soft) focus:text-(--color-route) focus:ring-2 focus:ring-(--color-focus) disabled:cursor-default disabled:text-(--color-text-muted)";
const activityTimeStartClassName = "block leading-4 font-medium";
const activityTimeEndClassName =
  "block leading-4 font-normal text-(--color-text-muted) group-hover/activity:text-(--color-text-muted)";
const activityTypeRailClassName =
  "flex min-w-0 items-start justify-start max-[520px]:hidden";
const activityBodyClassName = "min-w-0 space-y-1 max-[520px]:col-start-2 max-[520px]:w-full max-[520px]:max-w-full";
const activityMainLineClassName =
  "grid min-w-0 grid-cols-1 items-start";
const activitySentenceClassName =
  "flex min-w-0 items-baseline gap-1 overflow-hidden whitespace-nowrap text-sm font-normal leading-5 text-(--color-text) max-[520px]:block max-[520px]:whitespace-normal";
const activityTitleInputClassName =
  "min-h-5 w-auto min-w-[8ch] max-w-[min(44ch,58%)] shrink-0 border-0 border-b border-transparent bg-transparent px-0 py-0 text-sm font-normal leading-5 text-(--color-text) outline-none transition-colors duration-150 [field-sizing:content] placeholder:text-(--color-text-muted) hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:cursor-default disabled:border-transparent max-[520px]:w-full max-[520px]:max-w-full";
const activityPlaceInputClassName =
  "inline-block min-h-5 min-w-[8ch] max-w-full flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs font-normal leading-5 text-(--color-text-muted) outline-none transition-colors duration-150 [field-sizing:content] placeholder:text-(--color-text-muted) hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:cursor-default disabled:border-transparent";
const activityMobilePlaceInputClassName =
  "min-h-5 w-full min-w-0 truncate border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs font-semibold leading-5 text-(--color-text-muted) outline-none transition-colors duration-150 placeholder:text-(--color-text-muted) hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:cursor-default disabled:border-transparent";
const activityActionsClassName =
  "flex shrink-0 flex-nowrap items-center justify-end gap-0.5 whitespace-nowrap max-[1023px]:hidden";
const activityIconButtonClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-border) hover:bg-(--color-surface) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) [&_.icon]:size-3.5";
const activityMetaClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 text-[11px] font-bold leading-4 text-(--color-text-muted) max-[520px]:hidden";
const activityMetaStatusClassName =
  "flex min-w-0 flex-wrap items-center justify-start gap-1";
const activityTabletActionsClassName =
  "hidden size-7 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-border) hover:bg-(--color-surface) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) max-[1023px]:inline-flex [&_.icon]:size-4";
const activityTabletActionLayerClassName =
  "mt-1 hidden min-w-0 flex-wrap items-center justify-end gap-0.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-1 py-1 max-[1023px]:flex";
const activityPillClassName =
  "inline-flex min-h-5 max-w-[148px] items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-1.5 text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
const activityTypePickerClassName =
  "activity-type-picker !min-h-[52px] h-full w-full max-w-full shrink-0 items-start justify-start rounded-(--radius-sm) border-(--color-border) bg-(--color-surface-subtle) px-2 pt-1 text-left text-[11px] font-medium text-(--color-text-muted) hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) max-[520px]:!min-h-7 max-[520px]:h-7 max-[520px]:px-1.5 max-[520px]:pt-0.5 [&_.icon]:size-3.5 [&_.inline-option-picker-caret]:hidden";
const activityMobileLineClassName =
  "mobile-activity-line hidden min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 max-[520px]:grid";
const activityMobileTypePickerClassName =
  "activity-type-picker-mobile !hidden !min-h-7 !w-7 shrink-0 justify-center rounded-(--radius-sm) border-transparent bg-transparent !px-0 !py-0 text-(--color-text-muted) hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) max-[520px]:-mt-1.5 max-[520px]:!inline-flex [&_.icon]:size-3.5 [&_.inline-option-picker-label]:hidden [&_.inline-option-picker-caret]:hidden";
const activityMobileStatusClassName =
  "shrink-0 max-w-[82px] truncate rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-1.5 text-[10px] font-extrabold leading-5 text-(--color-text-muted)";
const subActivityListClassName =
  "sub-activity-list relative col-start-2 col-span-2 mt-1 grid min-w-0 gap-0.5 border-t border-dashed border-(--color-border) py-1.5 pl-5 before:pointer-events-none before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-[linear-gradient(180deg,var(--color-route-border),color-mix(in_srgb,var(--color-route-border)_46%,transparent))] max-[640px]:hidden max-[520px]:col-start-1 max-[520px]:col-span-2 max-[360px]:col-span-1";
const subActivityModalListClassName =
  "sub-activity-list grid min-w-0 gap-1";
const subActivityLineClassName =
  "sub-activity-line relative grid min-w-0 grid-cols-[86px_minmax(0,1fr)_auto] items-center gap-1.5 rounded-(--radius-sm) px-1.5 py-1 text-xs leading-4 transition-colors duration-150 before:pointer-events-none before:absolute before:left-[-12px] before:top-[18px] before:h-px before:w-3 before:bg-(--color-route-border) hover:bg-(--color-surface-subtle) max-[760px]:grid-cols-[minmax(0,1fr)_auto]";
const subActivityTextClassName =
  "sub-activity-text grid min-w-0 gap-0.5 text-xs font-normal leading-4 text-(--color-text)";
const subActivityPlaceLineClassName =
  "grid min-h-5 min-w-0 grid-cols-[10px_minmax(0,1fr)] items-baseline gap-1 text-(--color-text-muted)";
const subActivityTitleInputClassName =
  "min-h-5 w-auto min-w-[8ch] max-w-full border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs font-normal leading-4 text-(--color-text) outline-none transition-colors duration-150 [field-sizing:content] hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:border-transparent";
const subActivityActionsClassName =
  "flex min-w-0 shrink-0 items-center justify-end gap-1";
const addSubActivityButtonClassName =
  "mt-0.5 inline-flex min-h-6 w-fit items-center justify-center gap-1 rounded-(--radius-sm) border border-transparent bg-transparent px-1.5 text-[11px] font-extrabold text-(--color-route) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
const subActivityToggleButtonClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) [&_.icon]:size-3.5";
const subActivityModalBackdropClassName =
  "fixed inset-0 z-[70] grid place-items-end bg-[rgb(15_23_42_/_0.32)] p-3";
const subActivityModalClassName =
  "grid max-h-[min(520px,calc(100dvh_-_24px))] w-full max-w-[420px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const subActivityModalHeaderClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) px-3 py-2.5";
const subActivityModalTitleClassName =
  "min-w-0 text-sm font-extrabold leading-5 text-(--color-text) [&_span]:block [&_span]:truncate [&_small]:block [&_small]:text-[11px] [&_small]:font-bold [&_small]:text-(--color-text-muted)";
const subActivityModalCloseClassName =
  "inline-flex size-8 items-center justify-center rounded-(--radius-sm) border border-transparent text-(--color-text-muted) hover:border-(--color-border) hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)";
const subActivityModalBodyClassName = "min-h-0 overflow-auto p-3";
const timeEditModalBackdropClassName =
  "fixed inset-0 z-[72] grid place-items-end bg-[rgb(15_23_42_/_0.32)] p-3 sm:place-items-center";
const timeEditModalClassName =
  "grid w-full max-w-[380px] grid-rows-[auto_auto_auto] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const timeEditModalHeaderClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) px-3 py-2.5";
const timeEditModalTitleClassName =
  "min-w-0 text-sm font-extrabold leading-5 text-(--color-text) [&_span]:block [&_span]:truncate [&_small]:block [&_small]:text-[11px] [&_small]:font-bold [&_small]:text-(--color-text-muted)";
const timeEditModalBodyClassName = "grid gap-3 px-3 py-3";
const timeEditFieldsClassName =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2";
const timeEditFieldClassName =
  "grid gap-1 text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
const timeEditInputClassName =
  "h-9 w-full rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 font-mono text-sm font-extrabold text-(--color-text) outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--color-text-subtle) focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:bg-(--color-surface-muted)";
const timeEditHelperClassName =
  "text-[11px] font-bold leading-4 text-(--color-text-muted)";
const timeEditPreviewClassName =
  "grid gap-1 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route-soft) px-2.5 py-2 text-xs text-(--color-route)";
const timeEditPreviewValueClassName =
  "font-mono text-sm font-extrabold leading-5 text-(--color-text)";
const timeEditNextDayClassName =
  "inline-flex min-h-7 w-fit items-center gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[pressed=true]:border-(--color-route-border) aria-[pressed=true]:bg-(--color-route-soft) aria-[pressed=true]:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
const timeEditModalFooterClassName =
  "flex items-center justify-end gap-2 border-t border-(--color-border) px-3 py-2.5";
const inlineFieldClassName =
  "inline-row-field min-h-[24px] w-full min-w-0 rounded-(--radius-sm) border border-transparent bg-transparent px-1.5 py-0 text-xs leading-4 text-(--color-text) outline-none transition-[background,border-color,box-shadow] duration-150 placeholder:text-(--color-text-muted) hover:not-read-only:border-(--color-border) hover:not-read-only:bg-(--color-surface) focus:border-(--color-primary-border) focus:bg-(--color-surface) focus:shadow-[0_0_0_2px_rgb(255_196_168_/_0.55)] read-only:cursor-pointer read-only:truncate read-only:px-0 read-only:font-semibold disabled:cursor-not-allowed disabled:text-(--color-text-muted)";
const inlineOptionPickerButtonClassName = cn(
  inlineFieldClassName,
  "inline-option-picker-button inline-flex !min-h-8 items-center justify-between gap-2 text-left font-semibold",
);
const inlineOptionPickerCaretClassName = "shrink-0 text-(--color-text-subtle)";
const floatingOptionMenuClassName =
  "inline-option-picker-menu fixed z-[15] grid max-h-[min(260px,calc(100vh_-_24px))] overflow-auto rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-1 shadow-[0_10px_22px_rgb(15_23_42_/_0.12)]";
const floatingOptionButtonClassName =
  "grid min-h-8 w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_16px] items-center gap-2 rounded-(--radius-sm) px-2.5 py-1.5 text-left text-xs font-bold text-(--color-text) transition-colors hover:bg-(--color-route-soft) focus-visible:bg-(--color-route-soft) focus-visible:outline-none aria-selected:bg-(--color-route-soft) aria-selected:text-(--color-route) data-[active=true]:bg-(--color-route-soft)";
const addStopRowClassName =
  "add-stop-row [&_td]:border-b [&_td]:border-r [&_td]:border-dashed [&_td]:border-(--color-border) [&_td]:bg-(--color-surface-subtle) [&_td]:px-2.5 [&_td]:py-1";
const graphCellClassName =
  "activity-path-graph-cell !h-auto !bg-(--color-surface-subtle) !p-0 !align-top !shadow-none";
export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  graphItems,
  itineraryView,
  items,
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
  onAddSubActivity,
  onDeleteItem,
  onEditItem,
  onMoveItem,
  onOpenItemDetails,
  onSelectItem,
  onUpdateItemInline,
  onMoveItemToPath,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onSetMainTripPlan,
  onCreateTripPlan,
  onRenameTripPlan,
  onSaveDayTitle,
  onChangeDayPath,
  onClearDayPath,
  onToggleShowAllPaths,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const allDisplayItems = graphItems ?? items;
  const filterOptions = dedupePathOptions(pathOptions, allDisplayItems);
  const canEdit = role === "owner" || role === "organizer" || role === "traveler";
  const canManageTripPlans = canTripRole(role, "manageTripPlans");
  const canRestructureItems = canEdit && canRestructure;
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() =>
    filterOptions.map((option) => option.id),
  );
  const [headerControlsExpanded, setHeaderControlsExpanded] = useState(false);
  const [renderHeaderControls, setRenderHeaderControls] = useState(false);
  const [isCreatingTripPlan, setIsCreatingTripPlan] = useState(false);
  const [newTripPlanName, setNewTripPlanName] = useState("");
  const [editedTripPlanNameDraft, setEditedTripPlanNameDraft] = useState<{
    name: string;
    planId: string;
  } | null>(null);
  const [newTripPlanError, setNewTripPlanError] = useState<string | null>(
    null,
  );
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const headerControlsButtonRef = useRef<HTMLButtonElement>(null);
  const knownFilterIdsRef = useRef<string[]>(
    filterOptions.map((option) => option.id),
  );
  const selectedPathIdSet = new Set(selectedPathIds);
  const displayItems = allDisplayItems.filter((item) =>
    selectedPathIdSet.has(itineraryItemPathId(item)),
  );
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
  const editedTripPlanName =
    editedTripPlanNameDraft &&
    selectedTripPlan &&
    editedTripPlanNameDraft.planId === selectedTripPlan.id
      ? editedTripPlanNameDraft.name
      : (selectedTripPlan?.name ?? "");
  const selectedTripPlanIsMain =
    Boolean(selectedTripPlanIdForControl) && selectedTripPlanIdForControl === mainTripPlanId;
  const tripPlanSelectorDisabled = isTripPlanBusy || tripPlans.length === 0;
  const tripPlanControlsDisabled = !canManageTripPlans || tripPlanSelectorDisabled;
  const tripPlanStatusDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const setMainTripPlanDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const renameTripPlanDisabled =
    tripPlanControlsDisabled ||
    !selectedTripPlan ||
    !editedTripPlanName.trim() ||
    editedTripPlanName.trim() === selectedTripPlan.name;
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

  useEffect(() => {
    if (headerControlsExpanded || !renderHeaderControls) return;

    const timeoutId = window.setTimeout(() => {
      setRenderHeaderControls(false);
    }, 170);
    return () => window.clearTimeout(timeoutId);
  }, [headerControlsExpanded, renderHeaderControls]);

  useEffect(() => {
    if (!headerControlsExpanded) return;

    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (headerControlsRef.current?.contains(target)) return;
      setHeaderControlsExpanded(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setHeaderControlsExpanded(false);
      headerControlsButtonRef.current?.focus();
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [headerControlsExpanded]);

  function toggleDay(day: string) {
    setCollapsedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function togglePlanFilter(pathId: string) {
    setSelectedPathIds((current) =>
      current.includes(pathId)
        ? current.filter((item) => item !== pathId)
        : [...current, pathId],
    );
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

  async function submitRenameTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans || !selectedTripPlan) return;
    const name = editedTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(t.itinerary.tripPlans.emptyName);
      return;
    }
    if (name === selectedTripPlan.name) return;
    setNewTripPlanError(null);
    const renamed = await onRenameTripPlan(selectedTripPlan.id, name);
    if (renamed === false) return;
    setEditedTripPlanNameDraft({ name, planId: selectedTripPlan.id });
  }

  return (
    <section
      className={tablePanelClassName}
      aria-label={t.itinerary.pageLabel}
      id="itinerary"
    >
      <PageHeader
        allowOverflow
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
            ref={headerControlsRef}
            className={pageHeaderActionsClassName}
            role="group"
            aria-label={t.itinerary.actionsLabel}
          >
            <button
              ref={headerControlsButtonRef}
              type="button"
              className={headerControlsButtonClassName}
              aria-label={`${t.itinerary.tripPlans.selectorLabel} controls`}
              aria-controls="itinerary-header-controls"
              aria-expanded={headerControlsExpanded}
              onClick={() => {
                if (!headerControlsExpanded) setRenderHeaderControls(true);
                setHeaderControlsExpanded((current) => !current);
              }}
            >
              <Icon name="settings" />
              <span className="min-w-0 truncate">
                {selectedTripPlan?.name ?? t.itinerary.tripPlans.selectorLabel}
              </span>
              <Icon
                name="chevronRight"
                className={cn(
                  "transition-transform duration-150",
                  headerControlsExpanded && "rotate-90",
                )}
              />
            </button>
            {!canEdit ? (
              <p className={pageHeaderNoteClassName}>
                {t.itinerary.editRequiresOrganizer}
              </p>
            ) : null}
            {renderHeaderControls ? (
              <div
                className={headerControlsPanelClassName}
                data-state={headerControlsExpanded ? "open" : "closed"}
                id="itinerary-header-controls"
                aria-hidden={!headerControlsExpanded}
              >
                <div className={headerControlsTitleBarClassName}>
                  <div className={headerControlsTitleClassName}>
                    <strong>{t.itinerary.tripPlans.selectorLabel}</strong>
                    {isTripPlanBusy ? (
                      <span className={pathFilterSummaryClassName}>
                        {t.itinerary.tripPlans.busy}
                      </span>
                    ) : tripPlanMessage ? (
                      <span className={pathFilterSummaryClassName}>
                        {tripPlanMessage}
                      </span>
                    ) : null}
                  </div>
                  <span className={pathFilterSummaryClassName}>
                    {selectedTripPlan?.name ?? t.itinerary.tripPlans.selectorLabel}
                  </span>
                </div>
                <div className={headerControlsContentClassName}>
                  <div className={headerControlsSectionClassName}>
                    <form
                      className={headerControlsGridClassName}
                      onSubmit={submitRenameTripPlan}
                    >
                      <label className={tripPlanFieldClassName}>
                        <span>{t.itinerary.tripPlans.selectorLabel}</span>
                        <select
                          className={tripPlanSelectClassName}
                          value={selectedTripPlanIdForControl}
                          disabled={tripPlanSelectorDisabled}
                          onChange={(event) => {
                            setNewTripPlanError(null);
                            setEditedTripPlanNameDraft(null);
                            onChangeTripPlan(event.target.value);
                          }}
                        >
                          {tripPlans.map((plan) => (
                            <option value={plan.id} key={plan.id}>
                              {formatTripPlanOptionLabel(
                                plan,
                                t.itinerary.tripPlans.status,
                              )}
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
                          <option value="draft">
                            {t.itinerary.tripPlans.status.draft}
                          </option>
                          <option value="backup">
                            {t.itinerary.tripPlans.status.backup}
                          </option>
                          <option value="proposal">
                            {t.itinerary.tripPlans.status.proposal}
                          </option>
                        </select>
                      </label>
                      <label className={tripPlanFieldClassName}>
                        <span>{t.itinerary.tripPlans.nameLabel}</span>
                        <input
                          className={tripPlanNameInputClassName}
                          value={editedTripPlanName}
                          disabled={tripPlanControlsDisabled || !selectedTripPlan}
                          onChange={(event) => {
                            if (!selectedTripPlan) return;
                            setEditedTripPlanNameDraft({
                              name: event.target.value,
                              planId: selectedTripPlan.id,
                            });
                            setNewTripPlanError(null);
                          }}
                        />
                      </label>
                      <Button
                        type="submit"
                        disabled={renameTripPlanDisabled}
                        className={tripPlanButtonClassName}
                      >
                        {t.itinerary.tripPlans.saveName}
                      </Button>
                    </form>
                    {canManageTripPlans ? (
                      <div className={tripPlanActionsClassName}>
                        <Button
                          type="button"
                          disabled={setMainTripPlanDisabled}
                          className={tripPlanButtonClassName}
                          onClick={() =>
                            onSetMainTripPlan(selectedTripPlanIdForControl)
                          }
                        >
                          {t.itinerary.tripPlans.setMain}
                        </Button>
                        {isCreatingTripPlan ? (
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
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className={headerControlsSectionClassName}>
                    <div className={headerControlsSectionHeaderClassName}>
                      <strong>{t.itinerary.filters.panelLabel}</strong>
                      <span className={pathFilterSummaryClassName}>
                        {selectedFilterLabel}
                      </span>
                    </div>
                    <label className={showAllPathsToggleClassName}>
                      <input
                        type="checkbox"
                        checked={showAllPaths}
                        disabled={!onToggleShowAllPaths}
                        onChange={(event) =>
                          onToggleShowAllPaths?.(event.target.checked)
                        }
                      />
                      <span>{t.itinerary.filters.showAllPaths}</span>
                    </label>
                    <div
                      className={pathFilterPanelClassName}
                      id="itinerary-plan-filters"
                      role="region"
                      aria-label={t.itinerary.filters.panelLabel}
                    >
                      {filterOptions.map((option) => (
                        <label
                          className={pathFilterOptionClassName}
                          key={option.id}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPathIdSet.has(option.id)}
                            onChange={() => togglePlanFilter(option.id)}
                          />
                          <span>{option.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        }
      />
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
          </colgroup>
          <thead>
            <tr>
              <th>
                <span className="sr-only">Path graph</span>
              </th>
              <th>
                <span className="sr-only">Activity</span>
                <div className={activityHeaderGridClassName} aria-hidden="true">
                  <span>{t.itinerary.headers.time}</span>
                  <span>{t.itinerary.headers.type}</span>
                  <span className={activityHeaderActivityClassName}>
                    <span>{t.itinerary.headers.activity}</span>
                    <span>{t.itinerary.headers.actions}</span>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          {groups.map((group, groupIndex) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
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
              onChangeDayPath={onChangeDayPath}
              onClearDayPath={onClearDayPath}
              onAddSubActivity={onAddSubActivity}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              onMoveItem={onMoveItem}
              onMoveItemToPath={onMoveItemToPath}
              onOpenItemDetails={onOpenItemDetails}
              onSelectItem={onSelectItem}
              onSaveDayTitle={onSaveDayTitle}
              onUpdateItemInline={onUpdateItemInline}
              onToggleDay={toggleDay}
            />
          ))}
        </table>
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
  onAddSubActivity,
  onChangeDayPath,
  onClearDayPath,
  onDeleteItem,
  onEditItem,
  onMoveItem,
  onMoveItemToPath,
  onOpenItemDetails,
  onSelectItem,
  onSaveDayTitle,
  onUpdateItemInline,
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
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onToggleDay: (day: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const defaultDayTitle = dayRouteLabel(group.day, locale);
  const dayTitle = dailyBriefing?.manualOverrides.dayTitle?.trim() || defaultDayTitle;
  const dayPathOptions = pathOptions.filter(
    (option) =>
      option.id === mainItineraryPathId ||
      option.scope === "trip" ||
      option.day === group.day,
  );
  const hasAlternativePathOptions = dayPathOptions.some(
    (option) => option.id !== mainItineraryPathId,
  );
  const visibleItems = groupTopLevelItems(group.items);
  const visibleGraphItems = groupTopLevelItems(graphItems);
  const childItemsByParentId = groupChildItemsByParent(group.items);
  const showGraph =
    !collapsed && (visibleGraphItems.length > 0 || visibleItems.length > 0);

  return (
    <tbody
      className={dayGroupClassName}
      data-state={collapsed ? "closed" : "open"}
    >
      {hasTopSpacer ? (
        <tr className={daySpacerRowClassName} aria-hidden="true">
          <td colSpan={2} />
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
              graphItems={visibleGraphItems}
              graphWidth={graphColumnWidth}
              pathOptions={pathOptions}
              rowItems={visibleItems}
              selectedItemId={selectedItemId}
              onMoveItemToPath={onMoveItemToPath}
              onSelectItem={onSelectItem}
            />
          </td>
        ) : null}
        <th colSpan={showGraph ? 1 : 2}>
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
              <strong className={dayOrdinalClassName}>{dayLabel}</strong>
            </button>
            <span className={dayDateClassName}>
              <span>·</span>
              <span>{formatThaiDate(group.day, locale)}</span>
            </span>
            <span className={dayRouteClassName}>
              <DayTitleEditor
                canEdit={canEdit && Boolean(dailyBriefing && onSaveDayTitle)}
                date={group.day}
                defaultTitle={defaultDayTitle}
                dayLabel={dayA11yLabel}
                key={`${group.day}:${dailyBriefing?.version ?? 1}:${dayTitle}`}
                title={dayTitle}
                version={dailyBriefing?.version ?? 1}
                onSaveDayTitle={onSaveDayTitle}
              />
            </span>
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
        ? visibleItems.map((item) => (
            <tr
              aria-label={itineraryLabels.row.openDetails({
                activity: item.activity,
              })}
              className={itemPlaceholderRowClassName}
              data-item-id={item.id}
              data-hierarchy-level={1}
              key={item.id}
            >
              <td className={itemPlaceholderCellClassName}>
                <ActivityCell
                  canEdit={canEdit}
                  item={item}
                  itineraryLabels={itineraryLabels}
                  locale={locale}
                  selected={selectedItemId === item.id}
                  subItems={childItemsByParentId.get(item.id) ?? []}
                  onAddSubActivity={onAddSubActivity}
                  onDeleteItem={onDeleteItem}
                  onEditItem={onEditItem}
                  onOpenItemDetails={onOpenItemDetails}
                  onSelectItem={onSelectItem}
                  onUpdateItemInline={onUpdateItemInline}
                />
              </td>
            </tr>
          ))
        : null}
      {!collapsed ? (
        <tr className={addStopRowClassName} data-day-drop={group.day}>
          <td colSpan={showGraph ? 1 : 2} aria-hidden="true" />
        </tr>
      ) : null}
    </tbody>
  );
}

function DayTitleEditor({
  canEdit,
  date,
  dayLabel,
  defaultTitle,
  onSaveDayTitle,
  title,
  version,
}: {
  canEdit: boolean;
  date: string;
  dayLabel: string;
  defaultTitle: string;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  title: string;
  version: number;
}) {
  const [draft, setDraft] = useState(title.slice(0, dayTitleMaxLength));
  const [sourceTitle, setSourceTitle] = useState(title.slice(0, dayTitleMaxLength));
  const [saving, setSaving] = useState(false);

  async function commit(nextValue: string) {
    if (!canEdit || !onSaveDayTitle || saving) return;
    const trimmed = nextValue.trim();
    const normalizedTitle = trimmed || defaultTitle;
    if (normalizedTitle === sourceTitle) {
      setDraft(sourceTitle);
      return;
    }
    setSaving(true);
    try {
      await onSaveDayTitle(date, version, trimmed ? normalizedTitle : null);
      setSourceTitle(normalizedTitle);
      setDraft(normalizedTitle);
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      aria-label={`Trip day title for ${dayLabel}`}
      data-day-label={dayLabel}
      className={dayTitleInputClassName}
      disabled={!canEdit || saving}
      maxLength={dayTitleMaxLength}
      title={`${draft.length}/${dayTitleMaxLength}`}
      value={draft}
      onBlur={() => void commit(draft)}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(sourceTitle);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function ActivityCell({
  canEdit,
  item,
  itineraryLabels,
  locale,
  selected,
  subItems,
  onAddSubActivity,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onSelectItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  selected: boolean;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const typeOptions = activityTypeOptions(locale);
  const status = item.status ? itemStatusLabel(item.status, locale) : null;
  const [subActivityModalOpen, setSubActivityModalOpen] = useState(false);
  const [subActivitiesExpanded, setSubActivitiesExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const showSubActivityToggle =
    Boolean(onAddSubActivity) || subItems.length > 0;
  const actionMenuLabel =
    locale === "th"
      ? `จัดการกิจกรรม ${item.activity}`
      : `Activity actions for ${item.activity}`;
  const renderActivityActions = (compact = false) => (
    <>
      {item.mapLink ? (
        <a
          className={activityIconButtonClassName}
          href={item.mapLink}
          target="_blank"
          rel="noreferrer"
          aria-label={`${itineraryLabels.row.mapFallback}: ${item.place || item.activity}`}
          title={`${itineraryLabels.row.mapFallback}: ${item.place || item.activity}`}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
          }}
        >
          <Icon name="map" />
        </a>
      ) : null}
      {showSubActivityToggle ? (
        <button
          type="button"
          className={subActivityToggleButtonClassName}
          aria-label={`Sub-activities for ${item.activity}`}
          aria-expanded={subActivitiesExpanded}
          title={`Sub-activities for ${item.activity}`}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            if (
              typeof window !== "undefined" &&
              typeof window.matchMedia === "function" &&
              window.matchMedia("(max-width: 640px)").matches
            ) {
              setSubActivityModalOpen(true);
              return;
            }
            setSubActivitiesExpanded((current) => !current);
          }}
        >
          <Icon name="list" />
        </button>
      ) : null}
      <button
        type="button"
        className={activityIconButtonClassName}
        aria-label={itineraryLabels.row.openDetails({
          activity: item.activity,
        })}
        title={itineraryLabels.row.openDetails({
          activity: item.activity,
        })}
        onClick={(event) => {
          event.stopPropagation();
          if (compact) {
            setActionsExpanded(false);
          }
          onOpenItemDetails(item.id);
        }}
      >
        <Icon name="panel" />
      </button>
      {onEditItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          title={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            onEditItem(item.id);
          }}
        >
          <Icon name="edit" />
        </button>
      ) : null}
      {onDeleteItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          title={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            onDeleteItem(item.id);
          }}
        >
          <Icon name="trash" />
        </button>
      ) : null}
    </>
  );

  return (
    <div
      className={activityCellClassName}
      data-selected={selected ? "true" : undefined}
      onClick={() => onSelectItem(item.id)}
    >
      <div className={activityTimeRailClassName}>
        <ActivityTimeButton
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onSave={(patch) => onUpdateItemInline?.(item.id, patch)}
        />
        <InlineOptionPicker
          ariaLabel={itineraryLabels.row.inlineType({
            activity: item.activity,
          })}
          buttonClassName={activityMobileTypePickerClassName}
          disabled={!editable}
          options={typeOptions}
          optionKeyPrefix={`activity-type-mobile-${item.id}`}
          value={item.activityType}
          onCommit={(activityType) =>
            onUpdateItemInline?.(item.id, {
              activityType: activityType as ItineraryItem["activityType"],
            })
          }
        />
      </div>
      <div className={activityTypeRailClassName}>
        <InlineOptionPicker
          ariaLabel={itineraryLabels.row.inlineType({
            activity: item.activity,
          })}
          buttonClassName={activityTypePickerClassName}
          disabled={!editable}
          options={typeOptions}
          optionKeyPrefix={`activity-type-${item.id}`}
          value={item.activityType}
          onCommit={(activityType) =>
            onUpdateItemInline?.(item.id, {
              activityType: activityType as ItineraryItem["activityType"],
            })
          }
        />
      </div>
      <div className={activityBodyClassName}>
        <div className={activityMainLineClassName}>
          <div className={activitySentenceClassName}>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlineActivity({
                activity: item.activity,
              })}
              autoSize
              className={activityTitleInputClassName}
              disabled={!editable}
              key={`${item.id}:activity:${item.activity}`}
              maxLength={90}
              placeholder="Activity"
              value={item.activity}
              onCommit={(activity) =>
                onUpdateItemInline?.(item.id, { activity: activity || item.activity })
              }
            />
            <span
              className="inline-flex w-[10px] shrink-0 justify-center text-xs font-bold text-(--color-text-muted) max-[520px]:hidden"
              aria-hidden="true"
            >
              {item.place?.trim() ? "@" : ""}
            </span>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlinePlace({
                activity: item.activity,
              })}
              autoSize
              className={cn(activityPlaceInputClassName, "max-[520px]:hidden")}
              disabled={!editable}
              key={`${item.id}:place:${item.place}`}
              maxLength={90}
              placeholder=""
              value={item.place}
              onCommit={(place) => onUpdateItemInline?.(item.id, { place })}
            />
          </div>
        </div>
        <InlineActivityField
          ariaLabel={itineraryLabels.row.inlinePlace({
            activity: item.activity,
          })}
          className={activityMobilePlaceInputClassName}
          disabled={!editable}
          key={`${item.id}:mobile-place:${item.place}`}
          maxLength={90}
          placeholder=""
          value={item.place}
          onCommit={(place) => onUpdateItemInline?.(item.id, { place })}
        />
        <div className={activityMobileLineClassName}>
          {status ? <span className={activityMobileStatusClassName}>{status}</span> : null}
          <button
            type="button"
            className={activityTabletActionsClassName}
            aria-label={actionMenuLabel}
            aria-expanded={actionsExpanded}
            title={actionMenuLabel}
            onClick={(event) => {
              event.stopPropagation();
              setActionsExpanded((current) => !current);
            }}
          >
            <Icon name="dots" />
          </button>
        </div>
        <div className={activityMetaClassName}>
          <div className={activityMetaStatusClassName}>
            {status ? <span className={activityPillClassName}>{status}</span> : null}
            {item.durationMinutes ? (
              <span className={activityPillClassName}>
                <Icon name="clock" className="size-3.5" />
                {formatDuration(item.durationMinutes, locale)}
              </span>
            ) : null}
            {item.transportation ? (
              <span className="min-w-0 truncate">
                {item.transportation}
              </span>
            ) : null}
          </div>
          <div className={activityActionsClassName}>
            {renderActivityActions()}
          </div>
          <button
            type="button"
            className={activityTabletActionsClassName}
            aria-label={actionMenuLabel}
            aria-expanded={actionsExpanded}
            title={actionMenuLabel}
            onClick={(event) => {
              event.stopPropagation();
              setActionsExpanded((current) => !current);
            }}
          >
            <Icon name="dots" />
          </button>
        </div>
        {actionsExpanded ? (
          <div
            className={activityTabletActionLayerClassName}
            aria-label={actionMenuLabel}
            onClick={(event) => event.stopPropagation()}
          >
            {renderActivityActions(true)}
          </div>
        ) : null}
        {subActivityModalOpen ? (
          <SubActivityModal
            canEdit={canEdit}
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            subItems={subItems}
            onAddSubActivity={onAddSubActivity}
            onClose={() => setSubActivityModalOpen(false)}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onUpdateItemInline={onUpdateItemInline}
          />
        ) : null}
      </div>
      <SubActivityList
        canEdit={canEdit}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        selected={selected}
        subItems={subItems}
        onAddSubActivity={onAddSubActivity}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onUpdateItemInline={onUpdateItemInline}
        visible={subActivitiesExpanded}
      />
    </div>
  );
}

function ActivityTimeButton({
  editable,
  item,
  itineraryLabels,
  locale,
  onSave,
}: {
  editable: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onSave: (patch: InlineItineraryItemPatch) => void | Promise<void>;
}) {
  const [timeEditOpen, setTimeEditOpen] = useState(false);
  const timeTooltip = formatTimeTooltip(item, locale);
  const startLabel = item.startTime?.trim() || "--:--";
  const endLabel = item.endTime?.trim()
    ? `${item.endTime.trim()}${item.endOffsetDays ? ` +${item.endOffsetDays}` : ""}`
    : "--:--";

  return (
    <>
      <button
        type="button"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        className={activityTimeButtonClassName}
        disabled={!editable}
        title={timeTooltip}
        onClick={(event) => {
          event.stopPropagation();
          setTimeEditOpen(true);
        }}
      >
        <span className={activityTimeStartClassName}>{startLabel}</span>
        <span className={activityTimeEndClassName}>{endLabel}</span>
      </button>
      {timeEditOpen ? (
        <TimeEditModal
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onClose={() => setTimeEditOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

function TimeEditModal({
  item,
  itineraryLabels,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onClose: () => void;
  onSave: (patch: InlineItineraryItemPatch) => void | Promise<void>;
}) {
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [endTime, setEndTime] = useState(item.endTime ?? "");
  const [endOffsetDays, setEndOffsetDays] = useState(
    item.endTime ? item.endOffsetDays ?? 0 : 0,
  );
  const [saving, setSaving] = useState(false);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = endTime ? parseTimeToMinutes(endTime) : null;
  const hasValidStart = !startTime || startMinutes !== null;
  const hasValidEnd = !endTime || endMinutes !== null;
  const needsStartForEnd = Boolean(endTime && !startTime.trim());
  const derivedDuration =
    startMinutes !== null && endMinutes !== null
      ? Math.max(1, endMinutes + endOffsetDays * 24 * 60 - startMinutes)
      : null;
  const timeFormatHint =
    locale === "th"
      ? "ใช้รูปแบบ 24 ชั่วโมง เช่น 08:30"
      : "Use 24-hour time, for example 08:30.";
  const optionalEndHint =
    locale === "th"
      ? "เวลาจบไม่บังคับ ถ้าเว้นว่างจะไม่แสดง duration"
      : "End time is optional. Leave it blank to hide duration.";
  const errorMessage =
    !hasValidStart || !hasValidEnd
      ? locale === "th"
        ? "เวลาใช้รูปแบบ HH:MM เช่น 09:30"
        : "Use HH:MM time, for example 09:30."
      : needsStartForEnd
        ? locale === "th"
          ? "ใส่เวลาเริ่มก่อนใส่เวลาจบ"
          : "Add a start time before adding an end time."
      : null;
  const previewWindow =
    startTime && endTime && derivedDuration
      ? formatTimeRangeLabel(startTime, endTime, endOffsetDays)
      : startTime || "--:--";

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function updateStartTime(nextStartTime: string) {
    setStartTime(nextStartTime);
    if (!endTime) return;
    const nextOffset = endOffsetDaysBetweenTimes(nextStartTime, endTime);
    setEndOffsetDays(nextOffset);
  }

  function updateEndTime(nextEndTime: string) {
    setEndTime(nextEndTime);
    setEndOffsetDays(nextEndTime ? endOffsetDaysBetweenTimes(startTime, nextEndTime) : 0);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || errorMessage) return;
    setSaving(true);
    try {
      await onSave({
        startTime: startTime.trim(),
        endTime: endTime.trim() || null,
        endOffsetDays: endTime.trim() ? endOffsetDays : 0,
        durationMinutes: endTime.trim() ? derivedDuration : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={timeEditModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={timeEditModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void save(event)}
      >
        <header className={timeEditModalHeaderClassName}>
          <strong className={timeEditModalTitleClassName}>
            <span>{item.activity}</span>
            <small>{itineraryLabels.row.inlineTime({ activity: item.activity })}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label="Close time editor"
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={timeEditModalBodyClassName}>
          <div className={timeEditFieldsClassName}>
            <label className={timeEditFieldClassName}>
              <span>{locale === "th" ? "เวลาเริ่ม" : "Start time"}</span>
              <input
                className={timeEditInputClassName}
                inputMode="numeric"
                maxLength={5}
                placeholder="08:30"
                title={timeFormatHint}
                value={startTime}
                onChange={(event) => updateStartTime(event.target.value)}
              />
            </label>
            <label className={timeEditFieldClassName}>
              <span>{locale === "th" ? "เวลาจบ" : "End time"}</span>
              <input
                className={timeEditInputClassName}
                inputMode="numeric"
                maxLength={5}
                placeholder="10:00"
                title={`${timeFormatHint} ${optionalEndHint}`}
                value={endTime}
                onChange={(event) => updateEndTime(event.target.value)}
              />
            </label>
          </div>
          <p className={timeEditHelperClassName}>
            {timeFormatHint} {optionalEndHint}
          </p>
          <button
            type="button"
            className={timeEditNextDayClassName}
            aria-pressed={endOffsetDays > 0}
            disabled={!endTime}
            onClick={() => setEndOffsetDays((current) => (current > 0 ? 0 : 1))}
          >
            +1 {locale === "th" ? "จบวันถัดไป" : "next day end"}
          </button>
          <div className={timeEditPreviewClassName}>
            <span>{locale === "th" ? "ตัวอย่างที่จะแสดง" : "Display preview"}</span>
            <strong className={timeEditPreviewValueClassName}>
              {previewWindow}
            </strong>
            {derivedDuration ? (
              <span>
                {locale === "th" ? "ระยะเวลา" : "Duration"}:{" "}
                {formatDuration(derivedDuration, locale)}
              </span>
            ) : (
              <span>{locale === "th" ? "ไม่แสดง duration" : "Duration hidden"}</span>
            )}
          </div>
          {errorMessage ? (
            <p className="text-xs font-bold text-(--color-danger)" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <footer className={timeEditModalFooterClassName}>
          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
            onClick={onClose}
          >
            {itineraryLabels.row.durationCancel}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || Boolean(errorMessage)}
          >
            {itineraryLabels.row.durationSave}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function SubActivityModal({
  canEdit,
  item,
  itineraryLabels,
  locale,
  onAddSubActivity,
  onClose,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
  subItems,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onClose: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={subActivityModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={subActivityModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={`Sub-activities for ${item.activity}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={subActivityModalHeaderClassName}>
          <strong className={subActivityModalTitleClassName}>
            <span>{item.activity}</span>
            <small>{itineraryLabels.row.subItemQuick}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label="Close sub-activities"
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={subActivityModalBodyClassName}>
          <SubActivityList
            canEdit={canEdit}
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            presentation="modal"
            selected
            subItems={subItems}
            onAddSubActivity={onAddSubActivity}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onUpdateItemInline={onUpdateItemInline}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
}

function SubActivityList({
  canEdit,
  item,
  itineraryLabels,
  locale,
  presentation = "inline",
  selected,
  subItems,
  visible = true,
  onAddSubActivity,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  presentation?: "inline" | "modal";
  selected: boolean;
  subItems: ItineraryItem[];
  visible?: boolean;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const showAddSubActivity = Boolean(onAddSubActivity) && (selected || subItems.length > 0);

  if (presentation === "inline" && !visible) return null;
  if (subItems.length === 0 && !showAddSubActivity) return null;

  return (
    <div
      className={
        presentation === "modal"
          ? subActivityModalListClassName
          : subActivityListClassName
      }
    >
      {subItems.map((subItem) => (
        <div
          className={subActivityLineClassName}
          data-sub-item-id={subItem.id}
          key={subItem.id}
        >
          <span className="max-[760px]:hidden">
            <ActivityTimeButton
              editable={editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onSave={(patch) => onUpdateItemInline?.(subItem.id, patch)}
            />
          </span>
          <div className={subActivityTextClassName}>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlineActivity({
                activity: subItem.activity,
              })}
              autoSize
              className={subActivityTitleInputClassName}
              disabled={!editable}
              key={`${subItem.id}:activity:${subItem.activity}`}
              maxLength={80}
              placeholder="Sub-activity"
              value={subItem.activity}
              onCommit={(activity) =>
                onUpdateItemInline?.(subItem.id, {
                  activity: activity || subItem.activity,
                })
              }
            />
            <span className={subActivityPlaceLineClassName}>
              <span className="shrink-0 text-(--color-text-muted)" aria-hidden="true">
                {subItem.place?.trim() ? "@" : ""}
              </span>
              <InlineActivityField
                ariaLabel={itineraryLabels.row.inlinePlace({
                  activity: subItem.activity,
                })}
                autoSize
                className={cn(activityPlaceInputClassName, "!text-xs")}
                disabled={!editable}
                key={`${subItem.id}:place:${subItem.place}`}
                maxLength={80}
                placeholder=""
                value={subItem.place}
                onCommit={(place) =>
                  onUpdateItemInline?.(subItem.id, { place })
                }
              />
            </span>
          </div>
          <div className={subActivityActionsClassName}>
            {subItem.mapLink ? (
              <a
                className={activityIconButtonClassName}
                href={subItem.mapLink}
                target="_blank"
                rel="noreferrer"
                aria-label={`${itineraryLabels.row.mapFallback}: ${subItem.place || subItem.activity}`}
                onClick={(event) => event.stopPropagation()}
              >
                <Icon name="map" className="size-4" />
              </a>
            ) : null}
            <span className={cn(activityPillClassName, "max-[760px]:hidden")}>
              {activityTypeLabel(subItem.activityType, locale)}
            </span>
            {onEditItem ? (
              <button
                type="button"
                className={activityIconButtonClassName}
                aria-label={itineraryLabels.row.edit({
                  activity: subItem.activity,
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  onEditItem(subItem.id);
                }}
              >
                <Icon name="edit" className="size-4" />
              </button>
            ) : null}
            {onDeleteItem ? (
              <button
                type="button"
                className={activityIconButtonClassName}
                aria-label={itineraryLabels.row.delete({
                  activity: subItem.activity,
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteItem(subItem.id);
                }}
              >
                <Icon name="trash" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {showAddSubActivity ? (
        <button
          type="button"
          className={addSubActivityButtonClassName}
          disabled={!canEdit}
          onClick={(event) => {
            event.stopPropagation();
            void onAddSubActivity?.(item.id);
          }}
        >
          <Icon name="plus" className="size-4" />
          {itineraryLabels.row.subItemQuick}
        </button>
      ) : null}
    </div>
  );
}

function InlineActivityField({
  ariaLabel,
  autoSize = false,
  className,
  disabled,
  inputMode,
  maxLength,
  onCommit,
  placeholder,
  value,
}: {
  ariaLabel: string;
  autoSize?: boolean;
  className: string;
  disabled: boolean;
  inputMode?: "numeric" | "text";
  maxLength: number;
  onCommit: (value: string) => void | Promise<void>;
  placeholder: string;
  value: string;
}) {
  const [draft, setDraft] = useState(value);
  const [source, setSource] = useState(value);

  function reset() {
    setDraft(source);
  }

  async function commit(nextValue: string) {
    const trimmed = nextValue.trim();
    if (disabled || trimmed === source) {
      setDraft(source);
      return;
    }
    await onCommit(trimmed);
    setSource(trimmed);
    setDraft(trimmed);
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      placeholder={placeholder}
      size={
        autoSize
          ? Math.max(1, Math.min(maxLength, draft.length || placeholder.length || 1))
          : undefined
      }
      value={draft}
      onBlur={() => void commit(draft)}
      onChange={(event) => setDraft(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          reset();
          event.currentTarget.blur();
        }
      }}
    />
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

function groupTopLevelItems(items: ItineraryItem[]): ItineraryItem[] {
  const itemIds = new Set(items.map((item) => item.id));
  return items.filter(
    (item) => !item.parentItemId || !itemIds.has(item.parentItemId),
  );
}

function groupChildItemsByParent(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const childrenByParent = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    if (!item.parentItemId) continue;
    childrenByParent.set(item.parentItemId, [
      ...(childrenByParent.get(item.parentItemId) ?? []),
      item,
    ]);
  }
  for (const [parentId, children] of childrenByParent) {
    childrenByParent.set(parentId, [...children].sort(compareItineraryItems));
  }
  return childrenByParent;
}

function compareItineraryItems(a: ItineraryItem, b: ItineraryItem): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
  return a.activity.localeCompare(b.activity);
}

function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function endOffsetDaysBetweenTimes(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return 0;
  return end <= start ? 1 : 0;
}

function formatTimeTooltip(
  item: Pick<ItineraryItem, "startTime" | "endTime" | "endOffsetDays" | "durationMinutes">,
  locale: Locale,
): string {
  const startTime = item.startTime?.trim() || "--:--";
  const endTime = item.endTime?.trim();
  const lines = [
    endTime
      ? formatTimeRangeLabel(startTime, endTime, item.endOffsetDays ?? 0)
      : startTime,
  ];
  if (endTime && item.durationMinutes) {
    lines.push(formatDuration(item.durationMinutes, locale));
  }
  return lines.join("\n");
}

function formatTimeRangeLabel(
  startTime: string,
  endTime: string,
  endOffsetDays = 0,
): string {
  const endOffset = endOffsetDays > 0 ? ` +${endOffsetDays}` : "";
  return `${startTime || "--:--"} - ${endTime}${endOffset}`;
}

function activityTypeOptions(locale: Locale): InlineOptionPickerOption[] {
  const types: ItineraryItem["activityType"][] = [
    "travel",
    "food",
    "shopping",
    "attraction",
    "experience",
    "stay",
  ];
  const icons: Record<ItineraryItem["activityType"], IconName> = {
    attraction: "location",
    experience: "ticket",
    food: "utensils",
    shopping: "wallet",
    stay: "home",
    travel: "route",
  };
  return types.map((type) => ({
    icon: icons[type],
    value: type,
    label: activityTypeLabel(type, locale),
  }));
}

function itemStatusLabel(
  status: NonNullable<ItineraryItem["status"]>,
  locale: Locale,
): string {
  const labels: Record<Locale, Record<NonNullable<ItineraryItem["status"]>, string>> = {
    en: {
      idea: "Idea",
      planned: "Planned",
      booked: "Booked",
      confirmed: "Confirmed",
      done: "Done",
      skipped: "Skipped",
    },
    th: {
      idea: "ไอเดีย",
      planned: "วางแผนแล้ว",
      booked: "จองแล้ว",
      confirmed: "ยืนยันแล้ว",
      done: "เสร็จแล้ว",
      skipped: "ข้าม",
    },
  };
  return labels[locale][status];
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
  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const hasForecastTemps = typeof high === "number" && typeof low === "number";
  const hasSolarTimes = Boolean(sunrise && sunset);
  if (!hasForecastTemps && !hasSolarTimes) return null;
  const hasCondition = Boolean(weather?.conditionCode && weather.conditionCode !== "unavailable");
  const solarLabel = sunrise && sunset ? `sunrise ${sunrise} sunset ${sunset}` : "";
  const weatherLabel = [
    hasForecastTemps
      ? `${condition} ${formatWeatherTemp(high)} ${formatWeatherTemp(low)}`
      : hasCondition
        ? condition
        : "",
    solarLabel,
  ].filter(Boolean).join(" ");
  const tooltipLabel = buildWeatherTooltip(weather, weatherLabel, sunrise, sunset);
  return (
    <span
      className={dayWeatherChipClassName}
      aria-label={`Weather for ${dayLabel}: ${tooltipLabel.replace(/\n/g, ", ")}`}
      title={tooltipLabel}
    >
      <span aria-hidden="true">
        <Icon name={weatherIconForCondition(weather?.conditionCode)} />
      </span>{" "}
      {hasForecastTemps ? (
        <>
          <strong>{formatWeatherTemp(high)}</strong>{" "}
          <span>{formatWeatherTemp(low)}</span>
        </>
      ) : hasCondition ? <span>{condition}</span> : null}
      {hasSolarTimes ? (
        <>
          <span className={dayWeatherSolarClassName}>
            <Icon name="sunrise" />
            {sunrise}
          </span>
          <span className={dayWeatherSolarClassName}>
            <Icon name="sunset" />
            {sunset}
          </span>
        </>
      ) : null}
    </span>
  );
}

function buildWeatherTooltip(
  weather: TripDailyBriefing["weather"],
  summary: string,
  sunrise: string | null,
  sunset: string | null,
): string {
  if (!weather) return summary;
  const details = [
    formatFeelsLike(weather.apparentTemperatureMaxCelsius, weather.apparentTemperatureMinCelsius),
    formatRainDetail(weather.rainChancePercent, weather.precipitationSumMm, weather.precipitationHours),
    formatUvIndex(weather.uvIndexMax),
    formatWindDetail(weather.windSpeedKph, weather.windGustsKph),
    formatVisibilityDetail(weather.visibilityMinMeters),
    formatPercentDetail("Humidity", weather.humidityPercent),
    sunrise && sunset ? `Sun ${sunrise}/${sunset}` : null,
  ].filter(Boolean);
  return [summary, ...details].filter(Boolean).join("\n");
}

function formatFeelsLike(high: number | null | undefined, low: number | null | undefined): string | null {
  if (typeof high !== "number" && typeof low !== "number") return null;
  const temps = [
    typeof high === "number" ? formatWeatherTemp(high) : null,
    typeof low === "number" ? formatWeatherTemp(low) : null,
  ].filter(Boolean);
  return `Feels ${temps.join(" ")}`;
}

function formatRainDetail(
  chance: number | null | undefined,
  amount: number | null | undefined,
  hours: number | null | undefined,
): string | null {
  const parts = [
    typeof chance === "number" ? `${chance}%` : null,
    typeof amount === "number" ? `${formatDecimal(amount)} mm` : null,
    typeof hours === "number" ? `${formatDecimal(hours)}h` : null,
  ].filter(Boolean);
  return parts.length ? `Rain ${parts.join(" · ")}` : null;
}

function formatUvIndex(value: number | null | undefined): string | null {
  return typeof value === "number" ? `UV ${formatDecimal(value)}` : null;
}

function formatWindDetail(speed: number | null | undefined, gusts: number | null | undefined): string | null {
  if (typeof speed !== "number" && typeof gusts !== "number") return null;
  const parts = [
    typeof speed === "number" ? `${Math.round(speed)} km/h` : null,
    typeof gusts === "number" ? `gust ${Math.round(gusts)} km/h` : null,
  ].filter(Boolean);
  return `Wind ${parts.join(" · ")}`;
}

function formatVisibilityDetail(value: number | null | undefined): string | null {
  return typeof value === "number" ? `Visibility min ${formatDecimal(value / 1000)} km` : null;
}

function formatPercentDetail(label: string, value: number | null | undefined): string | null {
  return typeof value === "number" ? `${label} ${value}%` : null;
}

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface InlineOptionPickerOption {
  icon?: IconName;
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
        {selectedOption?.icon ? (
          <Icon name={selectedOption.icon} className="size-3.5" />
        ) : null}
        <span className="inline-option-picker-label min-w-0 truncate">
          {selectedOption?.label ?? "—"}
        </span>
        <span
          className={cn(
            inlineOptionPickerCaretClassName,
            "inline-option-picker-caret",
          )}
          aria-hidden="true"
        >
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
                  <span className="flex min-w-0 items-center gap-2">
                    {option.icon ? (
                      <Icon name={option.icon} className="size-3.5" />
                    ) : null}
                    <span className="min-w-0 truncate">{option.label}</span>
                  </span>
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

function itineraryItemPathId(item: ItineraryItem): string {
  return item.pathRole === "alternative"
    ? (item.pathId ?? item.id)
    : mainItineraryPathId;
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
