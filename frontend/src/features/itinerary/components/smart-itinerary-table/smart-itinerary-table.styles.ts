const tablePanelClassName =
  "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-transparent px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:h-[calc(100dvh-48px)] max-[767px]:overflow-hidden max-[520px]:px-0 max-[520px]:py-0 max-[520px]:pb-0";
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
  "min-h-10 w-full min-w-0 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none transition-[border-color,box-shadow] duration-150 focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
const tripPlanActionsClassName =
  "grid min-w-0 grid-cols-2 gap-2 max-[640px]:grid-cols-1";
const tripPlanCreateFormClassName =
  "trip-plan-create-form col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 max-[640px]:grid-cols-1";
const tripPlanNameFieldClassName =
  "grid min-w-0 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
const tripPlanNameInputClassName =
  "min-h-10 w-full min-w-0 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
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
const dayTitleMinWidthCh = 12;
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
  "day-title-input min-h-8 min-w-[12ch] max-w-[260px] appearance-none rounded-none border-0 border-b border-solid border-transparent border-x-0 border-t-0 bg-transparent px-0.5 text-[13px] font-extrabold leading-5 text-(--color-text) outline-none shadow-none transition-[border-color,color,max-width] duration-150 placeholder:text-(--color-text-muted) hover:border-(--color-text-muted) hover:text-(--color-text) focus:max-w-[340px] focus:border-(--color-route) focus:border-x-0 focus:border-t-0 focus:text-(--color-text) focus:outline-none focus:shadow-none focus-visible:border-x-0 focus-visible:border-t-0 focus-visible:outline-none focus-visible:shadow-none focus-visible:[box-shadow:none] disabled:pointer-events-none max-[767px]:max-w-[150px] max-[767px]:focus:max-w-[190px] max-[520px]:w-full max-[520px]:max-w-full max-[520px]:focus:max-w-full";
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
const addStopRowClassName =
  "add-stop-row [&_td]:border-b [&_td]:border-r [&_td]:border-dashed [&_td]:border-(--color-border) [&_td]:bg-(--color-surface-subtle) [&_td]:px-2.5 [&_td]:py-1";
const graphCellClassName =
  "activity-path-graph-cell !h-auto !bg-(--color-surface-subtle) !p-0 !align-top !shadow-none";

export {
  activityCellClassName,
  activityTimeRailClassName,
  activityTimeButtonClassName,
  activityTimeStartClassName,
  activityTimeEndClassName,
  activityTypeRailClassName,
  activityBodyClassName,
  activityMainLineClassName,
  activitySentenceClassName,
  activityTitleInputClassName,
  activityPlaceInputClassName,
  activityRouteLineClassName,
  activityRouteLabelClassName,
  activityPlaceLineClassName,
  activityMobilePlaceInputClassName,
  activityActionsClassName,
  activityActionClusterClassName,
  activityIconButtonClassName,
  activityMetaClassName,
  activityMetaStatusClassName,
  activityTabletActionsClassName,
  activityTabletActionLayerClassName,
  activityPillClassName,
  activityBookingButtonClassName,
  activityBookingButtonEmptyClassName,
  activityBookingButtonLinkedClassName,
  activityTypePickerClassName,
  activityMobileLineClassName,
  activityMobileTypePickerClassName,
  activityMobileStatusClassName,
  subActivityListClassName,
  subActivityModalListClassName,
  subActivityLineClassName,
  subActivityTextClassName,
  subActivityTitleInputClassName,
  subActivityActionsClassName,
  addSubActivityButtonClassName,
  addStopInlineButtonClassName,
  subActivityToggleButtonClassName,
  subActivityModalBackdropClassName,
  subActivityModalClassName,
  subActivityModalHeaderClassName,
  subActivityModalTitleClassName,
  subActivityModalCloseClassName,
  subActivityModalBodyClassName,
  timeEditModalBackdropClassName,
  timeEditModalClassName,
  timeEditModalHeaderClassName,
  timeEditModalTitleClassName,
  timeEditModalBodyClassName,
  timeEditFieldsClassName,
  timeEditFieldClassName,
  timeEditInputClassName,
  timeEditHelperClassName,
  timeEditPreviewClassName,
  timeEditPreviewValueClassName,
  timeEditNextDayClassName,
  timeEditModalFooterClassName,
  ticketModalBackdropClassName,
  ticketModalClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
  ticketModalBodyClassName,
  ticketModeToggleClassName,
  ticketModeButtonClassName,
  ticketExistingGridClassName,
  ticketExistingOptionClassName,
  ticketFieldGridClassName,
  ticketFieldClassName,
  ticketLinkedItemsClassName,
  ticketLinkedOptionClassName,
  ticketModalFooterClassName,
} from "./activity-cell/activity-cell.styles";

export {
  addStopRowClassName,
  activityHeaderActivityClassName,
  activityHeaderGridClassName,
  dayClearPathButtonClassName,
  dayDateClassName,
  dayGroupClassName,
  dayOrdinalClassName,
  dayPathControlsClassName,
  dayPathPickerClassName,
  dayRouteClassName,
  daySpacerRowClassName,
  dayTitleInputClassName,
  dayRowClassName,
  dayRowContentClassName,
  dayTitleMaxLength,
  dayTitleMinWidthCh,
  dayToggleClassName,
  dayWeatherChipClassName,
  dayWeatherSolarClassName,
  graphCellClassName,
  graphColumnLaneGap,
  graphColumnMinWidth,
  graphColumnSidePadding,
  headerControlsButtonClassName,
  headerControlsContentClassName,
  headerControlsGridClassName,
  headerControlsPanelClassName,
  headerControlsSectionClassName,
  headerControlsSectionHeaderClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
  pathFilterOptionClassName,
  pathFilterPanelClassName,
  pathFilterSummaryClassName,
  showAllPathsToggleClassName,
  smartTableClassName,
  tablePanelClassName,
  tableScrollClassName,
  tripPlanActionsClassName,
  tripPlanButtonClassName,
  tripPlanCreateFormClassName,
  tripPlanFieldClassName,
  tripPlanNameFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSecondaryButtonClassName,
  tripPlanSelectClassName,
};
