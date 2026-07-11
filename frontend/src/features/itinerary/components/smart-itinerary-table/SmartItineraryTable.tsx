import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "@/src/trip/itinerary-paths";
import { SmartItineraryTablePageHeader } from "./SmartItineraryTablePageHeader";
import { SmartItineraryTableViewport } from "./SmartItineraryTableViewport";
import { useSmartItineraryTablePageState } from "./hooks/useSmartItineraryTablePageState";
import type { SmartItineraryTableProps } from "./SmartItineraryTable.types";

import { tablePanelClassName } from "./smart-itinerary-table.styles";

export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  graphItems,
  hideTablePlanControls = false,
  itineraryView,
  items,
  dailyBriefings = [],
  tripPlans,
  selectedTripPlanId,
  mainTripPlanId,
  tripPlanError,
  isTripPlanBusy,
  pathOptions = [{ id: mainItineraryPathId, name: mainItineraryPathName, scope: "trip" }],
  role,
  startDate,
  selectedItemId,
  dayPathOverrides = {},
  showAllPaths = false,
  tripName,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs = [],
  onDeleteItem,
  onEditItem,
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
  const { locale, t, tableState } = useSmartItineraryTablePageState({
    canRestructure,
    dailyBriefings,
    endDate,
    graphItems,
    itineraryView,
    items,
    pathOptions,
    role,
    startDate,
  });
  const {
    canEdit,
    canManageTripPlans,
    canRestructureItems,
    collapsedDays,
    groups,
    graphItemsByDay,
    dailyBriefingsByDate,
    filterOptions,
    selectedPathIds,
    graphColumnWidth,
    warningCount,
    totalMinutes,
    toggleDay,
    togglePlanFilter,
    selectedFilterLabel,
    smartTableStyle,
  } = tableState;

  return (
    <section
      className={tablePanelClassName}
      aria-label={t.itinerary.pageLabel}
      id="itinerary"
    >
      <SmartItineraryTablePageHeader
        canEdit={canEdit}
        canManageTripPlans={canManageTripPlans}
        endDate={endDate}
        filterOptions={filterOptions}
        groupsCount={groups.length}
        hideTablePlanControls={hideTablePlanControls}
        isTripPlanBusy={isTripPlanBusy}
        itemsCount={items.length}
        mainTripPlanId={mainTripPlanId}
        onChangeShowAllPaths={onToggleShowAllPaths}
        onChangeTripPlan={onChangeTripPlan}
        onChangeTripPlanStatus={onChangeTripPlanStatus}
        onCreateTripPlan={onCreateTripPlan}
        onRenameTripPlan={onRenameTripPlan}
        onSetMainTripPlan={onSetMainTripPlan}
        onTogglePathFilter={togglePlanFilter}
        selectedFilterLabel={selectedFilterLabel}
        selectedPathIds={selectedPathIds}
        selectedTripPlanId={selectedTripPlanId}
        showAllPaths={showAllPaths}
        startDate={startDate}
        totalMinutes={totalMinutes}
        tripName={tripName}
        tripPlanError={tripPlanError}
        tripPlans={tripPlans}
        warningCount={warningCount}
      />
      <SmartItineraryTableViewport
        canRestructureItems={canRestructureItems}
        collapsedDays={collapsedDays}
        groups={groups}
        graphItemsByDay={graphItemsByDay}
        dailyBriefingsByDate={dailyBriefingsByDate}
        pathOptions={pathOptions}
        dayPathOverrides={dayPathOverrides}
        showAllPaths={showAllPaths}
        smartTableStyle={smartTableStyle}
        graphColumnWidth={graphColumnWidth}
        itineraryLabels={t.itinerary}
        locale={locale}
        startDate={startDate}
        selectedItemId={selectedItemId}
        bookingDocs={bookingDocs}
        bookingLinkItems={items}
        onAddStop={onAddStop}
        onAddSubActivity={onAddSubActivity}
        onAddNoteForItem={onAddNoteForItem}
        onAddBookingForItem={onAddBookingForItem}
        onSaveBookingForItem={onSaveBookingForItem}
        onUnlinkBookingForItem={onUnlinkBookingForItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onMoveItemToPath={onMoveItemToPath}
        onOpenItemDetails={onOpenItemDetails}
        onSelectItem={onSelectItem}
        onSaveDayTitle={onSaveDayTitle}
        onUpdateItemInline={onUpdateItemInline}
        onToggleDay={toggleDay}
        onChangeDayPath={onChangeDayPath}
        onClearDayPath={onClearDayPath}
        scrollLabel={t.itinerary.scrollLabel}
        tHeaders={t.itinerary.headers}
      />
    </section>
  );
}
