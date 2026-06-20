const tablePanelClassName =
  "table-panel grid h-auto min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-visible bg-transparent px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:h-[calc(100dvh-48px)] max-[767px]:overflow-hidden max-[520px]:px-0 max-[520px]:py-0 max-[520px]:pb-0";
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
  headerControlsButtonClassName,
  headerControlsContentClassName,
  headerControlsGridClassName,
  headerControlsPanelClassName,
  headerControlsSectionClassName,
  headerControlsSectionHeaderClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
  pathFilterOptionClassName,
  pathFilterPanelClassName,
  pathFilterSummaryClassName,
  showAllPathsToggleClassName,
  tripPlanActionsClassName,
  tripPlanButtonClassName,
  tripPlanCreateFormClassName,
  tripPlanFieldClassName,
  tripPlanNameFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSecondaryButtonClassName,
  tripPlanSelectClassName,
} from "./smart-itinerary-table-header.styles";

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
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
  smartTableClassName,
  tablePanelClassName,
  tableScrollClassName,
};
